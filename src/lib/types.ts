export interface Profile {
  id: string;
  username: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  student_id: string;
  subject: string;
  date: string;
  time_slot: string;
  observations: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_method: 'online' | 'in_person';
  payment_status: 'pending_payment' | 'paid';
  stripe_session_id: string | null;
  price: number;
  created_at: string;
  profiles?: Profile;
}

export interface Lesson {
  id: string;
  student_id: string;
  title: string;
  subject: string;
  date: string;
  observations: string;
  created_by: string;
  created_at: string;
  profiles?: Profile;
  lesson_attachments?: LessonAttachment[];
}

export interface LessonAttachment {
  id: string;
  lesson_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

export interface AvailableSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export const SUBJECTS = [
  'Matemática',
  'Físico-Química',
  'Biologia-Geologia',
  'Português',
] as const;

export type Subject = (typeof SUBJECTS)[number];

// Price in cents (8€/h = 800 cents)
export const LESSON_PRICE = 800;
export const LESSON_PRICE_DISPLAY = '8,00€';
