-- 1) Registo central de cancelamentos de subscrição.
--    Vale para a newsletter e para cada lista de espera, sem as misturar:
--    cada linha guarda o email e a audiência de onde saiu.
--    Audiência 'all' significa "não me envies mais nada".

CREATE TABLE IF NOT EXISTS public.email_optouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN (
    'all',
    'newsletter',
    'exam-waitlist',
    'matematica-a-waitlist',
    'group-classes-waitlist'
  )),
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Restrição real (e não índice sobre expressão) porque o upsert do PostgREST
-- precisa de indicar as colunas do conflito pelo nome. O email é sempre
-- guardado em minúsculas pelo código que escreve aqui.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_optouts_email_audience_key'
  ) THEN
    ALTER TABLE public.email_optouts
      ADD CONSTRAINT email_optouts_email_audience_key UNIQUE (email, audience);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS email_optouts_email_idx
  ON public.email_optouts (email);

ALTER TABLE public.email_optouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view email optouts" ON public.email_optouts;
DROP POLICY IF EXISTS "Service role manages email optouts" ON public.email_optouts;

CREATE POLICY "Admin can view email optouts" ON public.email_optouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

CREATE POLICY "Service role manages email optouts" ON public.email_optouts
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2) Cada campanha passa a saber a que audiência foi enviada.
--    As campanhas antigas ficam como 'newsletter', que era o que existia.

ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'newsletter';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_campaigns_audience_check'
  ) THEN
    ALTER TABLE public.newsletter_campaigns
      ADD CONSTRAINT newsletter_campaigns_audience_check CHECK (audience IN (
        'newsletter',
        'exam-waitlist',
        'matematica-a-waitlist',
        'group-classes-waitlist'
      ));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS newsletter_campaigns_audience_idx
  ON public.newsletter_campaigns (audience);

-- 3) O registo de envios passa a suportar upsert por (campanha, email).
--    O índice que já existia é sobre LOWER(email), e o upsert do PostgREST
--    precisa de uma restrição declarada nas colunas. Serve para reentrar numa
--    campanha interrompida sem duplicar linhas nem rebentar com o envio.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_sends_campaign_email_key'
  ) THEN
    ALTER TABLE public.newsletter_sends
      ADD CONSTRAINT newsletter_sends_campaign_email_key UNIQUE (campaign_id, email);
  END IF;
END;
$$;
