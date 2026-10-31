-- Lista de espera da comunidade "Rumo ao 20" (Skool).
--
-- Mesmo padrão das outras listas (RLS: o admin lê, o service_role gere tudo).
-- O campo `school_year` guarda o ano que a pessoa frequenta, para o Alin saber
-- a composição da lista antes de abrir.
--
-- `founding_member` fica para quando a comunidade abrir: os 20 primeiros a
-- entrar mesmo é que são fundadores, não os 20 primeiros desta lista, por isso
-- a coluna nasce a FALSE e só é marcada depois da subscrição.

CREATE TABLE IF NOT EXISTS public.skool_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  email TEXT NOT NULL,
  school_year TEXT CHECK (school_year IN ('10º', '11º', '12º', 'Outro')),
  source TEXT NOT NULL DEFAULT 'skool',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'contacted', 'joined')),
  founding_member BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS skool_waitlist_email_unique_idx
  ON public.skool_waitlist (LOWER(email));

CREATE INDEX IF NOT EXISTS skool_waitlist_status_idx
  ON public.skool_waitlist (status);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = 'set_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS set_skool_waitlist_updated_at ON public.skool_waitlist;
    CREATE TRIGGER set_skool_waitlist_updated_at
      BEFORE UPDATE ON public.skool_waitlist
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

ALTER TABLE public.skool_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view skool waitlist" ON public.skool_waitlist;
DROP POLICY IF EXISTS "Service role manages skool waitlist" ON public.skool_waitlist;

CREATE POLICY "Admin can view skool waitlist" ON public.skool_waitlist
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Service role manages skool waitlist" ON public.skool_waitlist
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
