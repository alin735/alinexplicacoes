-- ============================================================================
-- Secções "Fichas de Revisão" e "Testes" + notificações por email
--  * dois tipos novos de anexo, com secção própria no portal (por percurso)
--  * preferências de notificação do aluno (email + estado do pop-up)
--  * registo das execuções do digest diário, para não repetir envios
-- Migração ADITIVA — não apaga dados existentes.
-- ============================================================================

-- 1) Tipos novos de anexo.
ALTER TABLE public.portal_lesson_materials
  DROP CONSTRAINT IF EXISTS portal_lesson_materials_kind_check;
ALTER TABLE public.portal_lesson_materials
  ADD CONSTRAINT portal_lesson_materials_kind_check
  CHECK (kind IN ('powerpoint', 'ficha', 'tpc', 'gravacao', 'importante',
                  'ficha_revisao', 'teste', 'outro'));

-- 2) Preferências de notificação do aluno.
--    notify_email: aceitou receber emails de material novo.
--    notify_prompt_at: última vez que o pop-up foi dispensado (para voltar
--    a aparecer passados uns dias). NULL = nunca foi dispensado.
ALTER TABLE public.portal_students
  ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.portal_students
  ADD COLUMN IF NOT EXISTS notify_prompt_at TIMESTAMPTZ;

-- 3) Execuções do digest diário. O envio seguinte só considera material
--    criado depois do `ran_at` da última execução com sucesso.
CREATE TABLE IF NOT EXISTS public.portal_notify_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  materials_count INT NOT NULL DEFAULT 0,
  emails_sent     INT NOT NULL DEFAULT 0,
  note            TEXT
);
ALTER TABLE public.portal_notify_runs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_portal_notify_runs_ran_at ON public.portal_notify_runs(ran_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_materials_created ON public.portal_lesson_materials(created_at DESC);
