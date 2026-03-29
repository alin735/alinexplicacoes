import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmationEmails } from '@/lib/booking-email-notifications';
import { requireAdminFromRequest } from '@/lib/server-admin-auth';
import { confirmBookingPayment } from '@/lib/server-bookings';

export async function POST(req: NextRequest) {
  try {
    await requireAdminFromRequest(req);
    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId em falta.' }, { status: 400 });
    }

    const { confirmedBookingIds } = await confirmBookingPayment(bookingId);
    for (const confirmedId of confirmedBookingIds) {
      await sendBookingConfirmationEmails(confirmedId);
    }

    return NextResponse.json({
      success: true,
      confirmedBookingIds,
      fully_confirmed: confirmedBookingIds.length > 0,
    });
  } catch (err: any) {
    const message = err?.message || 'Não foi possível confirmar o pagamento.';
    const status =
      typeof message === 'string' && message.includes('Sem autenticação válida.')
        ? 401
        : typeof message === 'string' &&
            (message.includes('administradores') || message.includes('Sessão inválida'))
          ? 403
          : 500;
    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
