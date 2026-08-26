/**
 * Disciplinas do secundário por curso, na estrutura em que os alunos as
 * reconhecem: a trienal, as bienais e o tronco comum (Português e Filosofia)
 * que toda a gente tem.
 */

export type SubjectGroup = {
  title: string;
  hint?: string;
  subjects: string[];
};

export const COMMON_SUBJECTS: SubjectGroup = {
  title: 'Tronco comum',
  hint: 'Todos os cursos têm estas.',
  subjects: ['Português', 'Filosofia'],
};

const COURSE_GROUPS: Record<string, SubjectGroup[]> = {
  'Ciências e Tecnologias': [
    { title: 'Trienal', subjects: ['Matemática A'] },
    {
      title: 'Bienais',
      hint: 'Escolhes duas.',
      subjects: ['Biologia e Geologia', 'Física e Química A', 'Geometria Descritiva A'],
    },
  ],
  'Ciências Socioeconómicas': [
    { title: 'Trienal', subjects: ['Matemática A'] },
    {
      title: 'Bienais',
      hint: 'Escolhes duas.',
      subjects: ['Economia A', 'Geografia A', 'História B'],
    },
  ],
  'Línguas e Humanidades': [
    { title: 'Trienal', subjects: ['História A'] },
    {
      title: 'Bienais',
      hint: 'Escolhes duas.',
      subjects: ['Geografia A', 'Língua Estrangeira', 'Literatura Portuguesa', 'Latim A'],
    },
  ],
  'Artes Visuais': [
    { title: 'Trienal', subjects: ['Desenho A'] },
    {
      title: 'Bienais',
      hint: 'Escolhes duas.',
      subjects: ['Geometria Descritiva A', 'Matemática B', 'História da Cultura e das Artes'],
    },
  ],
};

/**
 * Para quem não tem um curso científico-humanístico identificado (curso
 * "Outro" ou profissional). Aqui não faz sentido a estrutura de trienais e
 * bienais: fica o essencial, e o resto escrevem no campo "falta alguma?".
 */
const FALLBACK_GROUPS: SubjectGroup[] = [
  {
    title: 'Disciplinas',
    subjects: ['Matemática', 'Português'],
  },
];

export function getCourseGroups(course: string | null | undefined): SubjectGroup[] {
  const key = String(course || '').trim();
  const groups = COURSE_GROUPS[key];
  if (!groups) return FALLBACK_GROUPS;
  return [...groups, COMMON_SUBJECTS];
}

export function isKnownCourse(course: string | null | undefined) {
  return Boolean(COURSE_GROUPS[String(course || '').trim()]);
}

/** Todas as disciplinas válidas para um curso, para validar o que chega do formulário. */
export function getAllowedSubjects(course: string | null | undefined): Set<string> {
  const all = new Set<string>();
  getCourseGroups(course).forEach((group) => group.subjects.forEach((subject) => all.add(subject)));
  // Quem não é de um curso conhecido pode na mesma escolher do tronco comum.
  FALLBACK_GROUPS.forEach((group) => group.subjects.forEach((subject) => all.add(subject)));
  COMMON_SUBJECTS.subjects.forEach((subject) => all.add(subject));
  return all;
}

export const SCHOOL_YEARS = ['10.º ano', '11.º ano', '12.º ano', 'Já acabei o secundário'];
