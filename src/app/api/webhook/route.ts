import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { ADMIN_EMAIL, sendEmail } from '@/lib/email';
import {
  sendBookingConfirmationEmails,
  sendPaymentReceivedWaitingForBooking,
} from '@/lib/booking-email-notifications';
import { confirmBookingPayment } from '@/lib/server-bookings';
import { getGroupClassPackage, GROUP_CLASS_LESSONS } from '@/lib/group-classes';
import { lessonIdsForPackage, recordGroupClassPurchase } from '@/lib/group-class-purchases';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function groupClassesStudentEmailHtml(
  packageTitle: string,
  studentEmail: string,
) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111111;">
      <h1 style="font-size:24px;margin-bottom:12px;">Inscrição confirmada ✅</h1>
      <p>Olá!</p>
      <p>
        O teu pagamento do <strong>${escapeHtml(packageTitle)}</strong> da Preparação Intensiva para o Exame de Matemática do 9.º ano foi registado com sucesso.
      </p>
      <p>
        Em breve vais receber as próximas indicações para acederes à Skool e começares a acompanhar a preparação.
      </p>
      <p>
        Email registado: <strong>${escapeHtml(studentEmail)}</strong>
      </p>
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">
        MatemáticaTop © 2026 · matematica.top
      </p>
    </div>
  `;
}

function groupClassesAdminEmailHtml(
  packageTitle: string,
  studentEmail: string,
  userId: string,
  selectedLessonIds?: number[],
) {
  const selectedLessonsHtml = selectedLessonIds && selectedLessonIds.length > 0
    ? (() => {
        const lessons = selectedLessonIds
          .map(id => GROUP_CLASS_LESSONS.find(l => l.id === id))
          .filter(Boolean);
        const rows = lessons.map(l =>
          `<tr>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;">${l!.id}</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;">${escapeHtml(l!.date)} ${l!.time}</td>
            <td style="padding:4px 8px;border:1px solid #e5e7eb;">${escapeHtml(l!.topic)}</td>
          </tr>`
        ).join('');
        return `
          <p><strong>Aulas escolhidas:</strong></p>
          <table style="border-collapse:collapse;font-size:13px;width:100%;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:left;">#</th>
                <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:left;">Data</th>
                <th style="padding:4px 8px;border:1px solid #e5e7eb;text-align:left;">Tema</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="color:#6b7280;font-size:12px;">Dar acesso na Skool apenas a estes ${lessons.length} classrooms.</p>
        `;
      })()
    : '';

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111111;">
      <h1 style="font-size:24px;margin-bottom:12px;">Nova compra da preparação intensiva</h1>
      <p><strong>Pacote:</strong> ${escapeHtml(packageTitle)}</p>
      <p><strong>Email:</strong> ${escapeHtml(studentEmail)}</p>
      <p><strong>User ID:</strong> ${escapeHtml(userId)}</p>
      ${selectedLessonsHtml}
      <p style="margin-top:24px;color:#6b7280;font-size:13px;">
        Evento enviado automaticamente pelo webhook Stripe.
      </p>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata?.booking_id;
    const checkoutType = session.metadata?.type;

    if (bookingId && session.payment_status === 'paid') {
      try {
        const { confirmedBookingIds, booking, paymentJustMarkedPaid } = await confirmBookingPayment(
          bookingId,
          session.id,
        );

        if (
          paymentJustMarkedPaid &&
          booking.payment_method === 'online' &&
          confirmedBookingIds.length === 0
        ) {
          await sendPaymentReceivedWaitingForBooking(bookingId);
        }

        for (const confirmedId of confirmedBookingIds) {
          await sendBookingConfirmationEmails(confirmedId);
        }
      } catch (emailErr) {
        console.error('Erro ao processar confirmação no webhook:', emailErr);
      }

      console.log(`Booking ${bookingId} payment confirmed via Stripe`);
    }

    if (checkoutType === 'group_class' && session.payment_status === 'paid') {
      const packageId = session.metadata?.group_package_id;
      const packageObj = getGroupClassPackage(packageId);
      const packageTitle =
        packageObj?.title ||
        session.metadata?.group_package_name ||
        'Pacote de preparação intensiva';
      const studentEmail =
        session.customer_details?.email ||
        session.customer_email ||
        '';
      const userId = session.metadata?.user_id || '';
      const rawSelectedLessons = session.metadata?.selected_lessons;
      const selectedLessonIds: number[] = rawSelectedLessons
        ? JSON.parse(rawSelectedLessons).map(Number).filter((n: number) => Number.isInteger(n))
        : [];

      // Registar a compra na base de dados (idempotente via UNIQUE constraint).
      if (userId && packageObj) {
        try {
          const lessonIds = lessonIdsForPackage(packageObj.id, selectedLessonIds);
          await recordGroupClassPurchase({
            userId,
            packageId: packageObj.id,
            lessonIds,
            stripeSessionId: session.id,
          });
        } catch (recordErr) {
          console.error('Erro ao registar compra de aulas de grupo:', recordErr);
        }
      }

      if (studentEmail) {
        try {
          await Promise.all([
            sendEmail(
              studentEmail,
              `Inscrição confirmada - ${packageTitle}`,
              groupClassesStudentEmailHtml(packageTitle, studentEmail),
            ),
            sendEmail(
              ADMIN_EMAIL,
              `Nova compra - ${packageTitle}`,
              groupClassesAdminEmailHtml(packageTitle, studentEmail, userId, selectedLessonIds),
            ),
          ]);
        } catch (mailError) {
          console.error('Erro ao enviar emails da preparação intensiva:', mailError);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
