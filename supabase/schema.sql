-- ============================================
-- MatemáticaTop - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  username TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  newsletter_opt_in BOOLEAN DEFAULT FALSE,
  terms_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS newsletter_opt_in BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_version TEXT;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx
  ON profiles (LOWER(email))
  WHERE email IS NOT NULL;

-- Backfill profile email if the column was added later
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;

-- Shared helper to maintain updated_at fields
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Student subjects + current grade snapshot
CREATE TABLE IF NOT EXISTS student_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT DEFAULT '',
  current_grade NUMERIC(5,2) NOT NULL CHECK (current_grade >= 0 AND current_grade <= 20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject)
);

ALTER TABLE student_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own subjects" ON student_subjects;
DROP POLICY IF EXISTS "Students can create own subjects" ON student_subjects;
DROP POLICY IF EXISTS "Students can update own subjects" ON student_subjects;
DROP POLICY IF EXISTS "Students can delete own subjects" ON student_subjects;
DROP POLICY IF EXISTS "Admin can view all subjects" ON student_subjects;

CREATE POLICY "Students can view own subjects" ON student_subjects
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create own subjects" ON student_subjects
  FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own subjects" ON student_subjects
  FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Students can delete own subjects" ON student_subjects
  FOR DELETE USING (auth.uid() = student_id);
CREATE POLICY "Admin can view all subjects" ON student_subjects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

DROP TRIGGER IF EXISTS set_student_subjects_updated_at ON student_subjects;
CREATE TRIGGER set_student_subjects_updated_at
  BEFORE UPDATE ON student_subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Time-series grade updates used in the "Desenvolvimento" chart
CREATE TABLE IF NOT EXISTS student_grade_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_subject_id UUID REFERENCES student_subjects(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT DEFAULT '',
  grade NUMERIC(5,2) NOT NULL CHECK (grade >= 0 AND grade <= 20),
  source TEXT NOT NULL DEFAULT 'manual_update' CHECK (source IN ('signup', 'manual_update')),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_grade_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own grade updates" ON student_grade_updates;
DROP POLICY IF EXISTS "Students can create own grade updates" ON student_grade_updates;
DROP POLICY IF EXISTS "Students can delete own grade updates" ON student_grade_updates;
DROP POLICY IF EXISTS "Admin can view all grade updates" ON student_grade_updates;

CREATE POLICY "Students can view own grade updates" ON student_grade_updates
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create own grade updates" ON student_grade_updates
  FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can delete own grade updates" ON student_grade_updates
  FOR DELETE USING (auth.uid() = student_id);
CREATE POLICY "Admin can view all grade updates" ON student_grade_updates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE INDEX IF NOT EXISTS student_grade_updates_student_recorded_idx
  ON student_grade_updates (student_id, recorded_at DESC);

-- User questionnaire before generating AI plan
CREATE TABLE IF NOT EXISTS student_plan_inputs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  main_difficulties TEXT NOT NULL,
  improvement_focus TEXT NOT NULL,
  biggest_difficulties TEXT NOT NULL,
  suggestions TEXT NOT NULL,
  classification_causes TEXT NOT NULL,
  study_time_value INTEGER NOT NULL CHECK (study_time_value > 0),
  study_time_unit TEXT NOT NULL CHECK (study_time_unit IN ('hour', 'day', 'week')),
  use_current_grades BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_plan_inputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own plan inputs" ON student_plan_inputs;
DROP POLICY IF EXISTS "Students can create own plan inputs" ON student_plan_inputs;

CREATE POLICY "Students can view own plan inputs" ON student_plan_inputs
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create own plan inputs" ON student_plan_inputs
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Persisted AI generated plan (1 active plan per student)
CREATE TABLE IF NOT EXISTS student_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan_text TEXT NOT NULL,
  ai_model TEXT NOT NULL DEFAULT 'gpt-4o',
  context_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE student_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own plans" ON student_plans;
DROP POLICY IF EXISTS "Students can create own plans" ON student_plans;
DROP POLICY IF EXISTS "Students can update own plans" ON student_plans;
DROP POLICY IF EXISTS "Admin can view all plans" ON student_plans;
DROP POLICY IF EXISTS "Admin can update all plans" ON student_plans;

CREATE POLICY "Students can view own plans" ON student_plans
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create own plans" ON student_plans
  FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own plans" ON student_plans
  FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Admin can view all plans" ON student_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );
CREATE POLICY "Admin can update all plans" ON student_plans
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

DROP TRIGGER IF EXISTS set_student_plans_updated_at ON student_plans;
CREATE TRIGGER set_student_plans_updated_at
  BEFORE UPDATE ON student_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Password reset guard by username + email
CREATE OR REPLACE FUNCTION public.check_username_email(_username TEXT, _email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE LOWER(COALESCE(username, '')) = LOWER(COALESCE(_username, ''))
      AND LOWER(COALESCE(email, '')) = LOWER(COALESCE(_email, ''))
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_username_email(TEXT, TEXT) TO anon, authenticated;

-- Auto-create profile on signup (+ optional initial subjects/grades from metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  subject_entry JSONB;
  parsed_grade NUMERIC;
  parsed_topic TEXT;
  subject_row_id UUID;
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, ''),
    NULL
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, profiles.username),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone);

  UPDATE public.profiles
  SET
    newsletter_opt_in = COALESCE((NEW.raw_user_meta_data->>'newsletter_opt_in')::BOOLEAN, FALSE),
    terms_accepted = COALESCE((NEW.raw_user_meta_data->>'terms_accepted')::BOOLEAN, FALSE),
    terms_accepted_at = CASE
      WHEN COALESCE((NEW.raw_user_meta_data->>'terms_accepted')::BOOLEAN, FALSE)
        THEN COALESCE((NEW.raw_user_meta_data->>'terms_accepted_at')::TIMESTAMPTZ, NOW())
      ELSE NULL
    END,
    terms_version = CASE
      WHEN COALESCE((NEW.raw_user_meta_data->>'terms_accepted')::BOOLEAN, FALSE)
        THEN COALESCE(NULLIF(NEW.raw_user_meta_data->>'terms_version', ''), 'v1')
      ELSE NULL
    END
  WHERE id = NEW.id;

  IF jsonb_typeof(NEW.raw_user_meta_data->'initial_subjects') = 'array' THEN
    FOR subject_entry IN
      SELECT value
      FROM jsonb_array_elements(NEW.raw_user_meta_data->'initial_subjects') AS value
    LOOP
      IF COALESCE(subject_entry->>'subject', '') = '' THEN
        CONTINUE;
      END IF;

      IF COALESCE(subject_entry->>'grade', '') ~ '^[0-9]+([.,][0-9]+)?$' THEN
        parsed_grade := REPLACE(subject_entry->>'grade', ',', '.')::NUMERIC;
      ELSE
        parsed_grade := NULL;
      END IF;

      parsed_grade := LEAST(GREATEST(COALESCE(parsed_grade, 0), 0), 20);
      parsed_topic := COALESCE(subject_entry->>'topic', '');

      INSERT INTO public.student_subjects (student_id, subject, topic, current_grade)
      VALUES (
        NEW.id,
        subject_entry->>'subject',
        parsed_topic,
        parsed_grade
      )
      ON CONFLICT (student_id, subject) DO UPDATE
      SET
        topic = EXCLUDED.topic,
        current_grade = EXCLUDED.current_grade,
        updated_at = NOW()
      RETURNING id INTO subject_row_id;

      INSERT INTO public.student_grade_updates (
        student_subject_id,
        student_id,
        subject,
        topic,
        grade,
        source
      )
      VALUES (
        subject_row_id,
        NEW.id,
        subject_entry->>'subject',
        parsed_topic,
        parsed_grade,
        'signup'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Available slots table
CREATE TABLE IF NOT EXISTS available_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE available_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view available slots" ON available_slots;
DROP POLICY IF EXISTS "Admin can manage slots" ON available_slots;
DROP POLICY IF EXISTS "Students can book slots" ON available_slots;

CREATE POLICY "Anyone can view available slots" ON available_slots
  FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage slots" ON available_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Allow authenticated users to mark slots as booked when making a booking
CREATE POLICY "Students can book slots" ON available_slots
  FOR UPDATE TO authenticated
  USING (is_booked = false)
  WITH CHECK (is_booked = true);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  observations TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_method TEXT DEFAULT 'online' CHECK (payment_method IN ('online', 'in_person')),
  payment_status TEXT DEFAULT 'pending_payment' CHECK (payment_status IN ('pending_payment', 'paid')),
  stripe_session_id TEXT,
  price INTEGER DEFAULT 1300,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bookings ALTER COLUMN price SET DEFAULT 1300;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Students can create bookings" ON bookings;
DROP POLICY IF EXISTS "Admin can manage all bookings" ON bookings;

CREATE POLICY "Students can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Admin can manage all bookings" ON bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  observations TEXT DEFAULT '',
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own lessons" ON lessons;
DROP POLICY IF EXISTS "Admin can manage all lessons" ON lessons;

CREATE POLICY "Students can view own lessons" ON lessons
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admin can manage all lessons" ON lessons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Lesson attachments table
CREATE TABLE IF NOT EXISTS lesson_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lesson_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own lesson attachments" ON lesson_attachments;
DROP POLICY IF EXISTS "Admin can manage all attachments" ON lesson_attachments;

CREATE POLICY "Students can view own lesson attachments" ON lesson_attachments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM lessons WHERE lessons.id = lesson_id AND lessons.student_id = auth.uid())
  );
CREATE POLICY "Admin can manage all attachments" ON lesson_attachments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Create storage bucket for lesson attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-files', 'lesson-files', false)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Admin can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own lesson files" ON storage.objects;

CREATE POLICY "Admin can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'lesson-files' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Users can view own lesson files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'lesson-files' AND auth.role() = 'authenticated'
  );

-- Notification log (prevents duplicate sends)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('day', 'hour', 'quarter')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, type)
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only service role can access notification_log" ON notification_log;

CREATE POLICY "Only service role can access notification_log" ON notification_log
  USING (false);

-- Newsletter campaigns (admin tool)
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view newsletter campaigns" ON newsletter_campaigns;
DROP POLICY IF EXISTS "Service role manages newsletter campaigns" ON newsletter_campaigns;

CREATE POLICY "Admin can view newsletter campaigns" ON newsletter_campaigns
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Service role manages newsletter campaigns" ON newsletter_campaigns
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Newsletter send log per recipient
CREATE TABLE IF NOT EXISTS newsletter_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES newsletter_campaigns(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  resend_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_sends_campaign_email_idx
  ON newsletter_sends (campaign_id, LOWER(email));

ALTER TABLE newsletter_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view newsletter sends" ON newsletter_sends;
DROP POLICY IF EXISTS "Service role manages newsletter sends" ON newsletter_sends;

CREATE POLICY "Admin can view newsletter sends" ON newsletter_sends
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Service role manages newsletter sends" ON newsletter_sends
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
