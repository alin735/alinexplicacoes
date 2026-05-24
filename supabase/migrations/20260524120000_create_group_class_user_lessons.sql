CREATE TABLE IF NOT EXISTS public.group_class_user_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL CHECK (lesson_id BETWEEN 1 AND 15),
  package_id TEXT NOT NULL CHECK (package_id IN ('completo', 'intermedio', 'avulsa')),
  stripe_session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS group_class_user_lessons_user_idx
  ON public.group_class_user_lessons (user_id);

CREATE INDEX IF NOT EXISTS group_class_user_lessons_session_idx
  ON public.group_class_user_lessons (stripe_session_id);

ALTER TABLE public.group_class_user_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own group class lessons" ON public.group_class_user_lessons;
DROP POLICY IF EXISTS "Admin can view all group class lessons" ON public.group_class_user_lessons;
DROP POLICY IF EXISTS "Service role manages group class lessons" ON public.group_class_user_lessons;

CREATE POLICY "Users can view their own group class lessons" ON public.group_class_user_lessons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all group class lessons" ON public.group_class_user_lessons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Service role manages group class lessons" ON public.group_class_user_lessons
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
