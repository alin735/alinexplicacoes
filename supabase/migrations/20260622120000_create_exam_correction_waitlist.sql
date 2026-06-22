-- Lista de espera de explicações gerada a partir da página de correção
-- da prova de Matemática do 9.º ano (2026). Padrão alinhado com
-- group_classes_waitlist (RLS: admin lê, service_role gere tudo).

CREATE TABLE IF NOT EXISTS public.exam_correction_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  course TEXT,
  source TEXT NOT NULL DEFAULT 'correcao-prova-matematica-9-ano-2026',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'contacted')),
  notes TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS exam_correction_waitlist_email_unique_idx
  ON public.exam_correction_waitlist (LOWER(email));

CREATE INDEX IF NOT EXISTS exam_correction_waitlist_status_idx
  ON public.exam_correction_waitlist (status);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = 'set_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS set_exam_correction_waitlist_updated_at ON public.exam_correction_waitlist;
    CREATE TRIGGER set_exam_correction_waitlist_updated_at
      BEFORE UPDATE ON public.exam_correction_waitlist
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

ALTER TABLE public.exam_correction_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view exam correction waitlist" ON public.exam_correction_waitlist;
DROP POLICY IF EXISTS "Service role manages exam correction waitlist" ON public.exam_correction_waitlist;

CREATE POLICY "Admin can view exam correction waitlist" ON public.exam_correction_waitlist
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Service role manages exam correction waitlist" ON public.exam_correction_waitlist
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
