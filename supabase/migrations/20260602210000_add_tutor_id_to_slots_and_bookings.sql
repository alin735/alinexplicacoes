-- ─────────────────────────────────────────────────────────────────────────────
-- Centro de estudos: associar horários e marcações a um explicador (tutor).
--
-- Até agora o sistema assumia um único explicador (Alin). Esta migração adiciona
-- a noção de "dono" a cada horário e marcação. Os registos já existentes passam
-- a pertencer ao Alin (explicador principal).
--
--   Alin: 29bb0035-5cb7-44b7-b6d8-4c04fd378fb9
--   Luís: be20573e-4c43-4fce-8247-52be8112ca24
--
-- O controlo de acesso do painel de Explicador é feito server-side (rotas /api
-- com service role que verificam a identidade do explicador), por isso esta
-- migração só precisa das colunas + backfill + índices.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. available_slots.tutor_id ────────────────────────────────────────────────
ALTER TABLE public.available_slots
  ADD COLUMN IF NOT EXISTS tutor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

UPDATE public.available_slots
  SET tutor_id = '29bb0035-5cb7-44b7-b6d8-4c04fd378fb9'
  WHERE tutor_id IS NULL;

ALTER TABLE public.available_slots
  ALTER COLUMN tutor_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS available_slots_tutor_id_date_idx
  ON public.available_slots (tutor_id, date);

-- 2. bookings.tutor_id ───────────────────────────────────────────────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS tutor_id UUID REFERENCES public.profiles(id);

UPDATE public.bookings
  SET tutor_id = '29bb0035-5cb7-44b7-b6d8-4c04fd378fb9'
  WHERE tutor_id IS NULL;

ALTER TABLE public.bookings
  ALTER COLUMN tutor_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS bookings_tutor_id_idx
  ON public.bookings (tutor_id);
