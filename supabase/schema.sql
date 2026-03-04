-- ============================================
-- Explicações com o Alin - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, ''),
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
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

CREATE POLICY "Anyone can view available slots" ON available_slots
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admin can manage slots" ON available_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  observations TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Only service role can access notification_log" ON notification_log
  USING (false);
