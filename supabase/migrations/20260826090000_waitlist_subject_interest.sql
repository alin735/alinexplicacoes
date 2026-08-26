-- Respostas ao inquérito "que disciplinas queres ter explicações?"
-- enviado à lista de espera das Explicações Top.
-- Uma linha por email: se a pessoa voltar ao link, atualiza a resposta.

CREATE TABLE IF NOT EXISTS public.waitlist_subject_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  course TEXT,
  school_year TEXT,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  other_subject TEXT,
  source TEXT NOT NULL DEFAULT 'exam-waitlist',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT waitlist_subject_interest_email_key UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS waitlist_subject_interest_course_idx
  ON public.waitlist_subject_interest (course);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace AND proname = 'set_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS set_waitlist_subject_interest_updated_at ON public.waitlist_subject_interest;
    CREATE TRIGGER set_waitlist_subject_interest_updated_at
      BEFORE UPDATE ON public.waitlist_subject_interest
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

ALTER TABLE public.waitlist_subject_interest ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view subject interest" ON public.waitlist_subject_interest;
DROP POLICY IF EXISTS "Service role manages subject interest" ON public.waitlist_subject_interest;

CREATE POLICY "Admin can view subject interest" ON public.waitlist_subject_interest
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Service role manages subject interest" ON public.waitlist_subject_interest
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
