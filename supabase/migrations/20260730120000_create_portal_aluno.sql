-- ============================================================================
-- Portal do aluno — época especial de Matemática A
-- Roadmap de aulas, PINs de inscrição de uso único, materiais e progresso.
-- Autenticação: PIN pessoal + sessão por cookie (sem Supabase Auth / email).
-- Todo o acesso do portal é feito no servidor via service role.
-- ============================================================================

-- Recomeço limpo das tabelas do portal (sem dados de produção a preservar).
DROP TABLE IF EXISTS public.portal_lesson_progress CASCADE;
DROP TABLE IF EXISTS public.portal_lesson_materials CASCADE;
DROP TABLE IF EXISTS public.portal_lessons CASCADE;
DROP TABLE IF EXISTS public.portal_pins CASCADE;
DROP TABLE IF EXISTS public.portal_students CASCADE;

-- ─── Alunos ─────────────────────────────────────────────────────────────────
CREATE TABLE public.portal_students (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT,
  pin_hash         TEXT NOT NULL,          -- PIN pessoal (scrypt), nunca em claro
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_date DATE,
  streak_count     INT NOT NULL DEFAULT 0
);
ALTER TABLE public.portal_students ENABLE ROW LEVEL SECURITY;

-- ─── PINs de inscrição (uso único) ──────────────────────────────────────────
CREATE TABLE public.portal_pins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  label       TEXT,                        -- p/ o admin saber de quem é
  used_by     UUID REFERENCES public.portal_students(id) ON DELETE SET NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.portal_pins ENABLE ROW LEVEL SECURITY;

-- ─── Aulas do roadmap ───────────────────────────────────────────────────────
CREATE TABLE public.portal_lessons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position     INT NOT NULL DEFAULT 0,
  title        TEXT NOT NULL,
  subtitle     TEXT,
  contents     TEXT,
  scheduled_at TIMESTAMPTZ,
  is_unlocked  BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.portal_lessons ENABLE ROW LEVEL SECURITY;

-- ─── Materiais das aulas ─────────────────────────────────────────────────────
CREATE TABLE public.portal_lesson_materials (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    UUID NOT NULL REFERENCES public.portal_lessons(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL DEFAULT 'outro'
               CHECK (kind IN ('powerpoint', 'ficha', 'tpc', 'gravacao', 'outro')),
  title        TEXT NOT NULL,
  storage_path TEXT,
  external_url TEXT,
  position     INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.portal_lesson_materials ENABLE ROW LEVEL SECURITY;

-- ─── Progresso por aluno ────────────────────────────────────────────────────
CREATE TABLE public.portal_lesson_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES public.portal_students(id) ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES public.portal_lessons(id) ON DELETE CASCADE,
  completed    BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  viewed_at    TIMESTAMPTZ,
  UNIQUE (student_id, lesson_id)
);
ALTER TABLE public.portal_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_portal_lessons_position ON public.portal_lessons(position);
CREATE INDEX idx_portal_materials_lesson ON public.portal_lesson_materials(lesson_id);
CREATE INDEX idx_portal_progress_student ON public.portal_lesson_progress(student_id);

-- RLS: sem políticas de acesso público. O portal usa sempre a service role
-- (que ignora RLS); ao negar tudo ao anon/authenticated, as tabelas ficam
-- fechadas a acessos diretos com a chave anónima.

-- ─── Storage: bucket privado para os materiais ──────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('portal-materiais', 'portal-materiais', false)
ON CONFLICT (id) DO NOTHING;
