import type { Metadata } from 'next';
import MateriasClient from './MateriasClient';

export const metadata: Metadata = {
  title: 'Matérias do exame de Matemática A',
  description:
    'Lista das matérias que podem sair no exame de Matemática A, para marcares o que já dominas.',
};

/**
 * Ao contrário do resto do portal, esta página não pede PIN: qualquer aluno
 * pode abrir aluno.matematica.top/materias e marcar as matérias. O progresso
 * fica guardado no browser dele, não na base de dados.
 */
export default function MateriasPage() {
  return <MateriasClient />;
}
