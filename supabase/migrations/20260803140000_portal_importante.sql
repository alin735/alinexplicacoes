-- ============================================================================
-- Secção "Importante" no portal do aluno
--  * novo tipo de anexo: 'importante'
--  * temas e subtemas por percurso (portal_topics, 2 níveis via parent_id)
--  * itens avulsos: anexos ligados ao percurso em vez de a uma aula
-- Migração ADITIVA — não apaga dados existentes.
-- ============================================================================

-- 1) Novo tipo de anexo.
ALTER TABLE public.portal_lesson_materials
  DROP CONSTRAINT IF EXISTS portal_lesson_materials_kind_check;
ALTER TABLE public.portal_lesson_materials
  ADD CONSTRAINT portal_lesson_materials_kind_check
  CHECK (kind IN ('powerpoint', 'ficha', 'tpc', 'gravacao', 'importante', 'outro'));

-- 2) Temas e subtemas, por percurso.
--    parent_id NULL = tema; parent_id preenchido = subtema desse tema.
CREATE TABLE IF NOT EXISTS public.portal_topics (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES public.portal_roadmaps(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES public.portal_topics(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.portal_topics ENABLE ROW LEVEL SECURITY;

-- 3) Materiais: passam a poder pertencer ao percurso (item avulso, sem aula)
--    e a ser classificados por tema/subtema.
ALTER TABLE public.portal_lesson_materials ALTER COLUMN lesson_id DROP NOT NULL;
ALTER TABLE public.portal_lesson_materials
  ADD COLUMN IF NOT EXISTS roadmap_id UUID REFERENCES public.portal_roadmaps(id) ON DELETE CASCADE;
ALTER TABLE public.portal_lesson_materials
  ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.portal_topics(id) ON DELETE SET NULL;

-- Um material pertence a uma aula OU ao percurso (nunca a nenhum dos dois).
ALTER TABLE public.portal_lesson_materials
  DROP CONSTRAINT IF EXISTS portal_materials_owner_check;
ALTER TABLE public.portal_lesson_materials
  ADD CONSTRAINT portal_materials_owner_check
  CHECK (lesson_id IS NOT NULL OR roadmap_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_portal_topics_roadmap ON public.portal_topics(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_portal_topics_parent ON public.portal_topics(parent_id);
CREATE INDEX IF NOT EXISTS idx_portal_materials_topic ON public.portal_lesson_materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_portal_materials_roadmap ON public.portal_lesson_materials(roadmap_id);
