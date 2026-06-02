import {
  ADMIN_EMAIL,
  adminBookingCreatedEmailTemplate,
  bookingRequestReceivedEmailTemplate,
  confirmationEmailTemplate,
  inPersonPendingReviewEmailTemplate,
  paymentReceivedWaitingEmailTemplate,
  sendEmail,
} from '@/lib/email';
import { getServiceSupabase } from '@/lib/server-bookings';
import { getTutorById } from '@/lib/tutors';

type BookingRequestEmailArgs = {
  studentId: string;
  subject: string;
  date: string;
  timeSlot: string;
  paymentMethod: 'online' | 'in_person';
  bookingMode: 'individual' | 'group';
  groupSize: number;
  /** Email do explicador dono da marcação (recebe a notificação). */
  tutorEmail?: string;
  /** Nome do explicador dono da marcação (para o assunto do email). */
  tutorName?: string;
};

/**
 * Lista de destinatários das notificações de marcação: o explicador dono da
 * marcação + o explicador principal (Alin / ADMIN_EMAIL), sem duplicados.
 */
function getNotificationRecipients(tutorEmail?: string): string[] {
  const recipients = new Set<string>();
  recipients.add(ADMIN_EMAIL);
  if (tutorEmail) recipients.add(tutorEmail);
  return Array.from(recipients);
}

async function getStudentContact(studentId: string) {
  const supabase = getServiceSupabase();

  const [{ data: profile }, { data: userData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', studentId)
      .single(),
    supabase.auth.admin.getUserById(studentId),
  ]);

  const studentName = profile?.full_name || profile?.username || 'Aluno';
  const studentEmail = userData?.user?.email || null;

  return { studentName, studentEmail };
}

export async function sendBookingRequestEmails({
  studentId,
  subject,
  date,
  timeSlot,
  paymentMethod,
  bookingMode,
  groupSize,
  tutorEmail,
  tutorName,
}: BookingRequestEmailArgs) {
  const { studentName, studentEmail } = await getStudentContact(studentId);

  if (studentEmail) {
    const studentHtml =
      paymentMethod === 'in_person'
        ? inPersonPendingReviewEmailTemplate(studentName, subject, date, timeSlot)
        : bookingRequestReceivedEmailTemplate(studentName, subject, date, timeSlot, paymentMethod);

    await sendEmail(
      studentEmail,
      paymentMethod === 'in_person'
        ? `Marcação registada para validação — ${subject}`
        : `Pedido de marcação recebido — ${subject}`,
      studentHtml,
    );
  }

  const adminHtml = adminBookingCreatedEmailTemplate(
    studentName,
    subject,
    date,
    timeSlot,
    paymentMethod,
    bookingMode,
    groupSize,
  );

  const subjectSuffix = tutorName ? ` (${tutorName})` : '';
  await Promise.all(
    getNotificationRecipients(tutorEmail).map((recipient) =>
      sendEmail(recipient, `Nova marcação — ${studentName} · ${subject}${subjectSuffix}`, adminHtml),
    ),
  );
}

export async function sendBookingConfirmationEmails(bookingId: string) {
  const supabase = getServiceSupabase();

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, student_id, subject, date, time_slot, tutor_id')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  const { studentName, studentEmail } = await getStudentContact(booking.student_id);
  const tutor = getTutorById(booking.tutor_id);

  if (studentEmail) {
    const studentHtml = confirmationEmailTemplate(
      studentName,
      booking.subject,
      booking.date,
      booking.time_slot,
      false,
    );
    await sendEmail(studentEmail, `Marcação confirmada — ${booking.subject}`, studentHtml);
  }

  const adminHtml = confirmationEmailTemplate(
    studentName,
    booking.subject,
    booking.date,
    booking.time_slot,
    true,
  );
  const subjectSuffix = tutor ? ` (${tutor.name})` : '';
  await Promise.all(
    getNotificationRecipients(tutor?.email).map((recipient) =>
      sendEmail(recipient, `Nova marcação — ${studentName} · ${booking.subject}${subjectSuffix}`, adminHtml),
    ),
  );
}

export async function sendPaymentReceivedWaitingForBooking(bookingId: string) {
  const supabase = getServiceSupabase();

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, student_id, subject, date, time_slot')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  const { studentName, studentEmail } = await getStudentContact(booking.student_id);
  if (!studentEmail) return;

  const studentHtml = paymentReceivedWaitingEmailTemplate(
    studentName,
    booking.subject,
    booking.date,
    booking.time_slot,
  );
  await sendEmail(studentEmail, `Pagamento recebido — ${booking.subject}`, studentHtml);
}
