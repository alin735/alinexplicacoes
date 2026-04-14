// Exam topics data - What appears in exams (O que sai nos exames)
// Based on official exam data from 2016-2025

// Years available in the data
export const EXAM_YEARS = [
  '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'
] as const;

export const SCHOOL_YEARS = ['10º ano', '11º ano', '12º ano'] as const;

// Topic structure
export interface SubtopicData {
  name: string;
  occurrences: Record<string, boolean>;
}

export interface BroadTopicData {
  name: string;
  subtopics: SubtopicData[];
  // If true, skip subtopic selection and show results directly
  singleSubtopic?: boolean;
}

export interface SchoolYearData {
  year: string;
  broadTopics: BroadTopicData[];
}

// All exam topics organized by school year
export const EXAM_TOPICS_DATA: SchoolYearData[] = [
  {
    year: '10º ano',
    broadTopics: [
      {
        name: 'Álgebra',
        singleSubtopic: true,
        subtopics: [
          {
            name: 'Álgebra',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': true, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': true,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': false, '2021_F2': false,
              '2022_F1': false, '2022_F2': true,
              '2023_F1': false, '2023_F2': false,
              '2024_F1': false, '2024_F2': false,
              '2025_F1': false, '2025_F2': false,
            }
          }
        ]
      },
      {
        name: 'Geometria Analítica',
        subtopics: [
          {
            name: 'Geometria analítica no espaço',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': true, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': true,
              '2020_F1': true, '2020_F2': false,
              '2021_F1': true, '2021_F2': false,
              '2022_F1': false, '2022_F2': false,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': true, '2024_F2': true,
              '2025_F1': true, '2025_F2': true,
            }
          },
          {
            name: 'Geometria analítica no plano',
            occurrences: {
              '2016_F1': true, '2016_F2': false,
              '2017_F1': false, '2017_F2': false,
              '2018_F1': false, '2018_F2': false,
              '2019_F1': false, '2019_F2': false,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': false, '2021_F2': false,
              '2022_F1': false, '2022_F2': false,
              '2023_F1': false, '2023_F2': false,
              '2024_F1': false, '2024_F2': true,
              '2025_F1': true, '2025_F2': false,
            }
          },
          {
            name: 'Vetores',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': true, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': false,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': false, '2021_F2': false,
              '2022_F1': false, '2022_F2': false,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': false, '2024_F2': true,
              '2025_F1': true, '2025_F2': true,
            }
          },
        ]
      },
      {
        name: 'Funções Reais de Variável Real',
        subtopics: [
          {
            name: 'Generalidades acerca de funções',
            occurrences: {
              '2016_F1': false, '2016_F2': true,
              '2017_F1': true, '2017_F2': false,
              '2018_F1': false, '2018_F2': false,
              '2019_F1': false, '2019_F2': false,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': false, '2021_F2': false,
              '2022_F1': true, '2022_F2': true,
              '2023_F1': false, '2023_F2': false,
              '2024_F1': false, '2024_F2': false,
              '2025_F1': false, '2025_F2': false,
            }
          },
          {
            name: 'Monotonia, extremos e concavidade',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': false, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': true,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': true, '2021_F2': true,
              '2022_F1': false, '2022_F2': false,
              '2023_F1': false, '2023_F2': false,
              '2024_F1': true, '2024_F2': false,
              '2025_F1': true, '2025_F2': false,
            }
          },
          {
            name: 'Função quadrática/cúbica/definida por ramos',
            occurrences: {
              '2016_F1': false, '2016_F2': true,
              '2017_F1': false, '2017_F2': false,
              '2018_F1': true, '2018_F2': false,
              '2019_F1': false, '2019_F2': true,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': false, '2021_F2': false,
              '2022_F1': false, '2022_F2': true,
              '2023_F1': false, '2023_F2': false,
              '2024_F1': true, '2024_F2': true,
              '2025_F1': true, '2025_F2': true,
            }
          },
        ]
      },
    ]
  },
  {
    year: '11º ano',
    broadTopics: [
      {
        name: 'Trigonometria',
        subtopics: [
          {
            name: 'Círculo trigonométrico',
            occurrences: {
              '2016_F1': false, '2016_F2': false,
              '2017_F1': false, '2017_F2': false,
              '2018_F1': false, '2018_F2': true,
              '2019_F1': false, '2019_F2': true,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': false, '2021_F2': true,
              '2022_F1': false, '2022_F2': false,
              '2023_F1': false, '2023_F2': false,
              '2024_F1': true, '2024_F2': false,
              '2025_F1': false, '2025_F2': false,
            }
          },
          {
            name: 'Funções trigonométricas',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': true, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': true,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': true, '2021_F2': true,
              '2022_F1': true, '2022_F2': true,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': true, '2024_F2': true,
              '2025_F1': true, '2025_F2': true,
            }
          },
        ]
      },
      {
        name: 'Geometria Analítica',
        subtopics: [
          {
            name: 'Declive e inclinação de uma reta',
            occurrences: {
              '2016_F1': true, '2016_F2': false,
              '2017_F1': true, '2017_F2': false,
              '2018_F1': false, '2018_F2': true,
              '2019_F1': false, '2019_F2': false,
              '2020_F1': false, '2020_F2': true,
              '2021_F1': true, '2021_F2': true,
              '2022_F1': false, '2022_F2': true,
              '2023_F1': false, '2023_F2': false,
              '2024_F1': false, '2024_F2': false,
              '2025_F1': false, '2025_F2': false,
            }
          },
          {
            name: 'Produto escalar',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': false, '2017_F2': false,
              '2018_F1': false, '2018_F2': false,
              '2019_F1': false, '2019_F2': true,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': true, '2021_F2': false,
              '2022_F1': true, '2022_F2': true,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': true, '2024_F2': true,
              '2025_F1': true, '2025_F2': true,
            }
          },
        ]
      },
      {
        name: 'Sucessões',
        subtopics: [
          {
            name: 'Generalidades acerca de sucessões',
            occurrences: {
              '2016_F1': false, '2016_F2': false,
              '2017_F1': false, '2017_F2': false,
              '2018_F1': false, '2018_F2': false,
              '2019_F1': false, '2019_F2': false,
              '2020_F1': true, '2020_F2': true,
              '2021_F1': true, '2021_F2': true,
              '2022_F1': false, '2022_F2': false,
              '2023_F1': false, '2023_F2': false,
              '2024_F1': false, '2024_F2': false,
              '2025_F1': false, '2025_F2': false,
            }
          },
          {
            name: 'Progressões aritméticas e geométricas',
            occurrences: {
              '2016_F1': false, '2016_F2': true,
              '2017_F1': false, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': true,
              '2020_F1': true, '2020_F2': true,
              '2021_F1': true, '2021_F2': true,
              '2022_F1': true, '2022_F2': false,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': true, '2024_F2': true,
              '2025_F1': false, '2025_F2': true,
            }
          },
          {
            name: 'Limites de sucessões',
            occurrences: {
              '2016_F1': true, '2016_F2': false,
              '2017_F1': false, '2017_F2': false,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': false,
              '2020_F1': true, '2020_F2': true,
              '2021_F1': false, '2021_F2': true,
              '2022_F1': false, '2022_F2': true,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': false, '2024_F2': false,
              '2025_F1': true, '2025_F2': true,
            }
          },
        ]
      },
      {
        name: 'Funções Reais de Variável Real',
        subtopics: [
          {
            name: 'Continuidade',
            occurrences: {
              '2016_F1': true, '2016_F2': false,
              '2017_F1': true, '2017_F2': false,
              '2018_F1': false, '2018_F2': true,
              '2019_F1': true, '2019_F2': false,
              '2020_F1': true, '2020_F2': true,
              '2021_F1': true, '2021_F2': false,
              '2022_F1': false, '2022_F2': false,
              '2023_F1': false, '2023_F2': false,
              '2024_F1': false, '2024_F2': true,
              '2025_F1': true, '2025_F2': true,
            }
          },
          {
            name: 'Assíntotas',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': true, '2017_F2': false,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': true,
              '2020_F1': true, '2020_F2': true,
              '2021_F1': true, '2021_F2': true,
              '2022_F1': false, '2022_F2': false,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': true, '2024_F2': false,
              '2025_F1': true, '2025_F2': true,
            }
          },
          {
            name: 'Derivadas',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': true, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': false,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': false, '2021_F2': true,
              '2022_F1': false, '2022_F2': false,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': false, '2024_F2': true,
              '2025_F1': true, '2025_F2': true,
            }
          },
        ]
      },
      {
        name: 'Estatística',
        singleSubtopic: true,
        subtopics: [
          {
            name: 'Estatística',
            occurrences: {
              '2016_F1': false, '2016_F2': false,
              '2017_F1': false, '2017_F2': false,
              '2018_F1': false, '2018_F2': false,
              '2019_F1': false, '2019_F2': false,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': false, '2021_F2': false,
              '2022_F1': false, '2022_F2': false,
              '2023_F1': false, '2023_F2': false,
              '2024_F1': true, '2024_F2': true,
              '2025_F1': true, '2025_F2': true,
            }
          }
        ]
      },
    ]
  },
  {
    year: '12º ano',
    broadTopics: [
      {
        name: 'Cálculo Combinatório',
        subtopics: [
          {
            name: 'Cálculo combinatório',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': true, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': true,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': true, '2021_F2': true,
              '2022_F1': true, '2022_F2': true,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': true, '2024_F2': true,
              '2025_F1': true, '2025_F2': true,
            }
          },
          {
            name: 'Triângulo de Pascal e Binómio de Newton',
            occurrences: {
              '2016_F1': false, '2016_F2': false,
              '2017_F1': false, '2017_F2': false,
              '2018_F1': false, '2018_F2': false,
              '2019_F1': false, '2019_F2': false,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': false, '2021_F2': false,
              '2022_F1': false, '2022_F2': true,
              '2023_F1': false, '2023_F2': false,
              '2024_F1': false, '2024_F2': false,
              '2025_F1': true, '2025_F2': false,
            }
          },
        ]
      },
      {
        name: 'Probabilidades',
        subtopics: [
          {
            name: 'Espaço de probabilidades',
            occurrences: {
              '2016_F1': false, '2016_F2': true,
              '2017_F1': true, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': true,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': false, '2021_F2': false,
              '2022_F1': false, '2022_F2': false,
              '2023_F1': false, '2023_F2': false,
              '2024_F1': true, '2024_F2': true,
              '2025_F1': false, '2025_F2': true,
            }
          },
          {
            name: 'Probabilidade condicionada',
            occurrences: {
              '2016_F1': false, '2016_F2': true,
              '2017_F1': true, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': true,
              '2020_F1': true, '2020_F2': true,
              '2021_F1': false, '2021_F2': true,
              '2022_F1': false, '2022_F2': true,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': true, '2024_F2': true,
              '2025_F1': true, '2025_F2': true,
            }
          },
        ]
      },
      {
        name: 'Funções Reais de Variável Real',
        subtopics: [
          {
            name: 'Limites e continuidade',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': true, '2017_F2': true,
              '2018_F1': true, '2018_F2': false,
              '2019_F1': true, '2019_F2': false,
              '2020_F1': true, '2020_F2': true,
              '2021_F1': true, '2021_F2': true,
              '2022_F1': true, '2022_F2': true,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': true, '2024_F2': true,
              '2025_F1': false, '2025_F2': false,
            }
          },
          {
            name: 'Derivada de 2ª ordem, concavidade, pontos de inflexão',
            occurrences: {
              '2016_F1': true, '2016_F2': false,
              '2017_F1': true, '2017_F2': false,
              '2018_F1': false, '2018_F2': true,
              '2019_F1': false, '2019_F2': true,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': true, '2021_F2': false,
              '2022_F1': true, '2022_F2': true,
              '2023_F1': true, '2023_F2': false,
              '2024_F1': false, '2024_F2': true,
              '2025_F1': false, '2025_F2': true,
            }
          },
        ]
      },
      {
        name: 'Trigonometria e Funções Trigonométricas',
        subtopics: [
          {
            name: 'Diferenciação de funções trigonométricas',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': true, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': true,
              '2020_F1': false, '2020_F2': false,
              '2021_F1': true, '2021_F2': false,
              '2022_F1': false, '2022_F2': false,
              '2023_F1': true, '2023_F2': false,
              '2024_F1': false, '2024_F2': true,
              '2025_F1': false, '2025_F2': true,
            }
          },
        ]
      },
      {
        name: 'Funções Exponenciais e Funções Logarítmicas',
        subtopics: [
          {
            name: 'Funções exponenciais',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': true, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': true,
              '2020_F1': true, '2020_F2': true,
              '2021_F1': true, '2021_F2': false,
              '2022_F1': true, '2022_F2': false,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': true, '2024_F2': true,
              '2025_F1': true, '2025_F2': true,
            }
          },
          {
            name: 'Funções logarítmicas',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': false, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': true,
              '2020_F1': true, '2020_F2': true,
              '2021_F1': true, '2021_F2': true,
              '2022_F1': true, '2022_F2': false,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': true, '2024_F2': true,
              '2025_F1': false, '2025_F2': true,
            }
          },
          {
            name: 'Limites notáveis',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': false, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': true,
              '2020_F1': true, '2020_F2': true,
              '2021_F1': true, '2021_F2': true,
              '2022_F1': true, '2022_F2': true,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': true, '2024_F2': true,
              '2025_F1': true, '2025_F2': true,
            }
          },
        ]
      },
      {
        name: 'Números Complexos',
        singleSubtopic: true,
        subtopics: [
          {
            name: 'Números complexos',
            occurrences: {
              '2016_F1': true, '2016_F2': true,
              '2017_F1': true, '2017_F2': true,
              '2018_F1': true, '2018_F2': true,
              '2019_F1': true, '2019_F2': true,
              '2020_F1': true, '2020_F2': true,
              '2021_F1': true, '2021_F2': true,
              '2022_F1': true, '2022_F2': true,
              '2023_F1': true, '2023_F2': true,
              '2024_F1': true, '2024_F2': true,
              '2025_F1': true, '2025_F2': true,
            }
          }
        ]
      },
    ]
  }
];

// Helper functions
export function getSchoolYears(): string[] {
  return EXAM_TOPICS_DATA.map(sy => sy.year);
}

export function getBroadTopicsForYear(schoolYear: string): string[] {
  const yearData = EXAM_TOPICS_DATA.find(sy => sy.year === schoolYear);
  if (!yearData) return [];
  return yearData.broadTopics.map(bt => bt.name);
}

export function getBroadTopic(schoolYear: string, broadTopicName: string): BroadTopicData | undefined {
  const yearData = EXAM_TOPICS_DATA.find(sy => sy.year === schoolYear);
  if (!yearData) return undefined;
  return yearData.broadTopics.find(bt => bt.name === broadTopicName);
}

export function getSubtopicsForBroadTopic(schoolYear: string, broadTopicName: string): string[] {
  const bt = getBroadTopic(schoolYear, broadTopicName);
  if (!bt) return [];
  return bt.subtopics.map(st => st.name);
}

export function getOccurrencesForSubtopic(
  schoolYear: string,
  broadTopicName: string,
  subtopicName: string
): Record<string, boolean> | null {
  const bt = getBroadTopic(schoolYear, broadTopicName);
  if (!bt) return null;
  const st = bt.subtopics.find(s => s.name === subtopicName);
  if (!st) return null;
  return st.occurrences;
}

export function countOccurrences(occurrences: Record<string, boolean>): number {
  return Object.values(occurrences).filter(v => v).length;
}

export function isSingleSubtopic(schoolYear: string, broadTopicName: string): boolean {
  const bt = getBroadTopic(schoolYear, broadTopicName);
  return bt?.singleSubtopic === true;
}
