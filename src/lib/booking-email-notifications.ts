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

type BookingRequestEmailArgs = {
  studentId: string;
  subject: string;
  date: string;
  timeSlot: string;
  paymentMethod: 'online' | 'in_person';
  bookingMode: 'individual' | 'group';
  groupSize: number;
};

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

  await sendEmail(ADMIN_EMAIL, `Nova marcação — ${studentName} · ${subject}`, adminHtml);
}

export async function sendBookingConfirmationEmails(bookingId: string) {
  const supabase = getServiceSupabase();

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, student_id, subject, date, time_slot')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  const { studentName, studentEmail } = await getStudentContact(booking.student_id);

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
  await sendEmail(ADMIN_EMAIL, `Nova marcação — ${studentName} · ${booking.subject}`, adminHtml);
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
