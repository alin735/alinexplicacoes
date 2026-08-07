-- ============================================================================
-- Percursos (roadmaps) no portal do aluno
-- Cada percurso = um conjunto de aulas atribuído a um aluno. Um aluno vê o seu
-- percurso; a flag preview_all dá acesso a todos (conta de pré-visualização).
-- Migração ADITIVA — não apaga dados existentes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.portal_roadmaps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.portal_roadmaps ENABLE ROW LEVEL SECURITY;

-- Cada aula pertence a um percurso.
ALTER TABLE public.portal_lessons
  ADD COLUMN IF NOT EXISTS roadmap_id UUID REFERENCES public.portal_roadmaps(id) ON DELETE CASCADE;

-- Cada aluno é atribuído a um percurso (ou vê todos via preview_all).
ALTER TABLE public.portal_students
  ADD COLUMN IF NOT EXISTS roadmap_id UUID REFERENCES public.portal_roadmaps(id) ON DELETE SET NULL;
ALTER TABLE public.portal_students
  ADD COLUMN IF NOT EXISTS preview_all BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_portal_lessons_roadmap ON public.portal_lessons(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_portal_students_roadmap ON public.portal_students(roadmap_id);

-- Backfill: mete as aulas já existentes (sem percurso) num percurso inicial "Diogo".
DO $$
DECLARE rid UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.portal_lessons WHERE roadmap_id IS NULL) THEN
    INSERT INTO public.portal_roadmaps (title, position) VALUES ('Diogo', 0)
      RETURNING id INTO rid;
    UPDATE public.portal_lessons SET roadmap_id = rid WHERE roadmap_id IS NULL;
  END IF;
END $$;

-- A conta de pré-visualização já existe (nome "Alin", criada pelo utilizador):
-- marca-a para ver TODOS os percursos. Não cria conta nem toca no PIN pessoal.
-- Se o nome não corresponder, não faz nada — podes ligar "Vê todos" no /admin.
UPDATE public.portal_students SET preview_all = true WHERE lower(name) = 'alin';
