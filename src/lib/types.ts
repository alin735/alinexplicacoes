export interface Profile {
  id: string;
  email?: string;
  username: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  is_admin: boolean;
  newsletter_opt_in?: boolean;
  terms_accepted?: boolean;
  terms_accepted_at?: string | null;
  terms_version?: string | null;
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

export interface NewsletterCampaign {
  id: string;
  created_by: string | null;
  subject: string;
  html_content: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  created_at: string;
  sent_at: string | null;
}

export interface NewsletterSend {
  id: string;
  campaign_id: string;
  profile_id: string | null;
  email: string;
  status: 'sent' | 'failed';
  resend_id: string | null;
  error_message: string | null;
  sent_at: string;
}

export const SUBJECTS = [
  'Matemática',
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const ADMIN_LESSON_SUBJECTS = [
  'Português',
  'Matemática',
  'Físico-Química',
  'Biologia-Geologia',
  'Filosofia',
] as const;

export const SCHOOL_YEARS = ['10º', '11º'] as const;
export type SchoolYear = (typeof SCHOOL_YEARS)[number];

export const MATH_TOPICS_BY_YEAR: Record<SchoolYear, string[]> = {
  '10º': [
    'Modelos matemáticos para a cidadania',
    'Estatística',
    'Geometria sintética',
    'Funções',
    'Geometria analítica',
  ],
  '11º': [
    'Trigonometria',
    'Produto escalar',
    'Sucessões',
  ],
};

export interface StudentSubject {
  id: string;
  student_id: string;
  subject: Subject;
  topic: string;
  current_grade: number;
  created_at: string;
  updated_at: string;
}

export interface StudentGradeUpdate {
  id: string;
  student_subject_id: string;
  student_id: string;
  subject: Subject;
  topic: string;
  grade: number;
  source: 'signup' | 'manual_update';
  recorded_at: string;
}

export interface StudentPlan {
  id: string;
  student_id: string;
  plan_text: string;
  ai_model: string;
  context_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type StudyTimeUnit = 'hour' | 'day' | 'week';

// Base price for individual classes (15€/h = 1500 cents)
export const LESSON_PRICE = 1500;
export const LESSON_PRICE_DISPLAY = '15,00€';
