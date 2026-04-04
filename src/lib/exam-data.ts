export const EXAM_HISTORY_YEARS = [
  2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
] as const;

export const SCHOOL_YEAR_OPTIONS = ['10º ano', '11º ano', '12º ano'] as const;

export type SchoolYearOption = (typeof SCHOOL_YEAR_OPTIONS)[number];

export type ExamTopicOccurrence = {
  schoolYear: SchoolYearOption;
  broadTheme: string;
  subtheme: string;
  firstPhases: number[];
  secondPhases: number[];
  totalOccurrences: number;
};

export type ExamThemeGroup = {
  broadTheme: string;
  subthemes: string[];
};

export const EXAM_TOPIC_OCCURRENCES: ExamTopicOccurrence[] = [
  { schoolYear: '10º ano', broadTheme: 'Álgebra', subtheme: 'Álgebra', firstPhases: [2016, 2017, 2018, 2019], secondPhases: [2016, 2017, 2018, 2019, 2022], totalOccurrences: 9 },
  { schoolYear: '10º ano', broadTheme: 'Geometria Analítica', subtheme: 'Geometria analítica no espaço', firstPhases: [2016, 2017, 2018, 2019, 2020, 2021, 2023, 2024, 2025], secondPhases: [2016, 2017, 2018, 2019, 2023, 2024, 2025], totalOccurrences: 16 },
  { schoolYear: '10º ano', broadTheme: 'Geometria Analítica', subtheme: 'Geometria analítica no plano', firstPhases: [2016, 2025], secondPhases: [2024], totalOccurrences: 3 },
  { schoolYear: '10º ano', broadTheme: 'Geometria Analítica', subtheme: 'Vetores', firstPhases: [2016, 2017, 2018, 2019, 2023, 2025], secondPhases: [2016, 2017, 2018, 2023, 2024, 2025], totalOccurrences: 12 },
  { schoolYear: '10º ano', broadTheme: 'Funções Reais de Variável Real', subtheme: 'Generalidades acerca de funções', firstPhases: [2024], secondPhases: [2016, 2017, 2018, 2022], totalOccurrences: 5 },
  { schoolYear: '10º ano', broadTheme: 'Funções Reais de Variável Real', subtheme: 'Monotonia, extremos e concavidade', firstPhases: [2016, 2018, 2019, 2021, 2024, 2025], secondPhases: [2016, 2017, 2018, 2019, 2021], totalOccurrences: 11 },
  { schoolYear: '10º ano', broadTheme: 'Funções Reais de Variável Real', subtheme: 'Função quadrática/cúbica/definida por ramos', firstPhases: [2018, 2024, 2025], secondPhases: [2016, 2019, 2022, 2024, 2025], totalOccurrences: 8 },
  { schoolYear: '11º ano', broadTheme: 'Trigonometria', subtheme: 'Círculo trigonométrico', firstPhases: [2024], secondPhases: [2018, 2019, 2021], totalOccurrences: 4 },
  { schoolYear: '11º ano', broadTheme: 'Trigonometria', subtheme: 'Funções trigonométricas', firstPhases: [2016, 2017, 2018, 2019, 2021, 2022, 2023, 2024, 2025], secondPhases: [2016, 2017, 2018, 2019, 2021, 2022, 2023, 2024, 2025], totalOccurrences: 18 },
  { schoolYear: '11º ano', broadTheme: 'Geometria Analítica', subtheme: 'Declive e inclinação de uma reta', firstPhases: [2016, 2017, 2021], secondPhases: [2018, 2020, 2021, 2022], totalOccurrences: 7 },
  { schoolYear: '11º ano', broadTheme: 'Geometria Analítica', subtheme: 'Produto escalar', firstPhases: [2016, 2021, 2022, 2023, 2024, 2025], secondPhases: [2016, 2019, 2022, 2023, 2024, 2025], totalOccurrences: 12 },
  { schoolYear: '11º ano', broadTheme: 'Sucessões', subtheme: 'Generalidades acerca de sucessões', firstPhases: [2017, 2020, 2021, 2022], secondPhases: [2016, 2020, 2021, 2022], totalOccurrences: 8 },
  { schoolYear: '11º ano', broadTheme: 'Sucessões', subtheme: 'Progressões aritméticas e geométricas', firstPhases: [2018, 2019, 2020, 2021, 2022, 2023, 2024], secondPhases: [2016, 2017, 2018, 2019, 2020, 2021, 2023, 2024, 2025], totalOccurrences: 16 },
  { schoolYear: '11º ano', broadTheme: 'Sucessões', subtheme: 'Limites de sucessões', firstPhases: [2016, 2018, 2019, 2020, 2023, 2025], secondPhases: [2018, 2020, 2021, 2022, 2023, 2025], totalOccurrences: 12 },
  { schoolYear: '11º ano', broadTheme: 'Funções Reais de Variável Real', subtheme: 'Continuidade', firstPhases: [2016, 2017, 2019, 2020, 2021, 2025], secondPhases: [2018, 2020, 2024, 2025], totalOccurrences: 10 },
  { schoolYear: '11º ano', broadTheme: 'Funções Reais de Variável Real', subtheme: 'Assíntotas', firstPhases: [2016, 2017, 2018, 2019, 2020, 2021, 2023, 2024, 2025], secondPhases: [2016, 2018, 2019, 2020, 2021, 2023, 2025], totalOccurrences: 16 },
  { schoolYear: '11º ano', broadTheme: 'Funções Reais de Variável Real', subtheme: 'Derivadas', firstPhases: [2016, 2017, 2018, 2019, 2023, 2025], secondPhases: [2016, 2017, 2018, 2021, 2023, 2024, 2025], totalOccurrences: 13 },
  { schoolYear: '11º ano', broadTheme: 'Estatística', subtheme: 'Estatística', firstPhases: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], secondPhases: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], totalOccurrences: 20 },
  { schoolYear: '12º ano', broadTheme: 'Cálculo Combinatório', subtheme: 'Cálculo combinatório', firstPhases: [2016, 2017, 2018, 2019, 2021, 2022, 2023, 2024, 2025], secondPhases: [2016, 2017, 2018, 2019, 2021, 2022, 2023, 2024, 2025], totalOccurrences: 18 },
  { schoolYear: '12º ano', broadTheme: 'Cálculo Combinatório', subtheme: 'Triângulo de Pascal e Binómio de Newton', firstPhases: [2025], secondPhases: [2022], totalOccurrences: 2 },
  { schoolYear: '12º ano', broadTheme: 'Probabilidades', subtheme: 'Espaço de probabilidades', firstPhases: [2017, 2018, 2019, 2024], secondPhases: [2016, 2017, 2018, 2019, 2024], totalOccurrences: 9 },
  { schoolYear: '12º ano', broadTheme: 'Probabilidades', subtheme: 'Probabilidade condicionada', firstPhases: [2017, 2018, 2019, 2020, 2023, 2024, 2025], secondPhases: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], totalOccurrences: 17 },
  { schoolYear: '12º ano', broadTheme: 'Funções Reais de Variável Real', subtheme: 'Limites e continuidade', firstPhases: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024], secondPhases: [2016, 2017, 2020, 2021, 2022, 2023, 2024], totalOccurrences: 16 },
  { schoolYear: '12º ano', broadTheme: 'Funções Reais de Variável Real', subtheme: 'Derivada de 2ª ordem, concavidade, pontos de inflexão', firstPhases: [2016, 2017, 2021, 2022, 2023], secondPhases: [2018, 2019, 2022, 2024, 2025], totalOccurrences: 10 },
  { schoolYear: '12º ano', broadTheme: 'Trigonometria e Funções Trigonométricas', subtheme: 'Diferenciação de funções trigonométricas', firstPhases: [2016, 2017, 2018, 2019, 2021, 2023], secondPhases: [2016, 2017, 2018, 2019, 2024, 2025], totalOccurrences: 12 },
  { schoolYear: '12º ano', broadTheme: 'Funções Exponenciais e Funções Logarítmicas', subtheme: 'Funções exponenciais', firstPhases: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], secondPhases: [2016, 2017, 2018, 2019, 2020, 2023, 2024, 2025], totalOccurrences: 18 },
  { schoolYear: '12º ano', broadTheme: 'Funções Exponenciais e Funções Logarítmicas', subtheme: 'Funções logarítmicas', firstPhases: [2016, 2018, 2019, 2020, 2021, 2022, 2023, 2024], secondPhases: [2016, 2017, 2018, 2019, 2020, 2021, 2023, 2024, 2025], totalOccurrences: 17 },
  { schoolYear: '12º ano', broadTheme: 'Funções Exponenciais e Funções Logarítmicas', subtheme: 'Limites notáveis', firstPhases: [2016, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], secondPhases: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], totalOccurrences: 19 },
  { schoolYear: '12º ano', broadTheme: 'Números Complexos', subtheme: 'Números complexos', firstPhases: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], secondPhases: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025], totalOccurrences: 20 },
];

export const EXAM_THEME_GROUPS: Record<SchoolYearOption, ExamThemeGroup[]> = SCHOOL_YEAR_OPTIONS.reduce(
  (acc, schoolYear) => {
    const groups = new Map<string, Set<string>>();

    EXAM_TOPIC_OCCURRENCES.filter((entry) => entry.schoolYear === schoolYear).forEach((entry) => {
      if (!groups.has(entry.broadTheme)) {
        groups.set(entry.broadTheme, new Set());
      }

      groups.get(entry.broadTheme)?.add(entry.subtheme);
    });

    acc[schoolYear] = Array.from(groups.entries()).map(([broadTheme, subthemes]) => ({
      broadTheme,
      subthemes: Array.from(subthemes),
    }));

    return acc;
  },
  {} as Record<SchoolYearOption, ExamThemeGroup[]>,
);

export function normalizeSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getExamOccurrenceBySelection(
  schoolYear: SchoolYearOption,
  broadTheme: string,
  subtheme: string,
) {
  return EXAM_TOPIC_OCCURRENCES.find(
    (entry) =>
      entry.schoolYear === schoolYear &&
      entry.broadTheme === broadTheme &&
      entry.subtheme === subtheme,
  );
}

export function getExamOccurrenceByQuery(query: string, schoolYear?: SchoolYearOption) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return null;

  return (
    EXAM_TOPIC_OCCURRENCES.find((entry) => {
      if (schoolYear && entry.schoolYear !== schoolYear) {
        return false;
      }

      const broad = normalizeSearchValue(entry.broadTheme);
      const sub = normalizeSearchValue(entry.subtheme);
      const combined = `${broad} ${sub}`;

      return (
        sub.includes(normalizedQuery) ||
        broad.includes(normalizedQuery) ||
        combined.includes(normalizedQuery) ||
        normalizedQuery.includes(sub) ||
        normalizedQuery.includes(broad)
      );
    }) ?? null
  );
}

export function getOccurrencePercentage(totalOccurrences: number) {
  return Math.round((totalOccurrences / (EXAM_HISTORY_YEARS.length * 2)) * 100);
}

export function getOccurrenceTone(totalOccurrences: number) {
  const percentage = getOccurrencePercentage(totalOccurrences);

  if (percentage >= 80) {
    return {
      label: 'Muito frequente',
      description: '>=80% dos exames',
      accentClassName: 'bg-red-500',
      iconSrc: '/images/exames/frequencia-muito-frequente.png',
    };
  }

  if (percentage >= 50) {
    return {
      label: 'Frequente',
      description: '50-79% dos exames',
      accentClassName: 'bg-orange-400',
      iconSrc: '/images/exames/frequencia-frequente.png',
    };
  }

  if (percentage >= 25) {
    return {
      label: 'Ocasional',
      description: '25-49% dos exames',
      accentClassName: 'bg-yellow-400',
      iconSrc: '/images/exames/frequencia-ocasional.png',
    };
  }

  return {
    label: 'Pouco frequente',
    description: '<25% dos exames',
    accentClassName: 'bg-green-500',
    iconSrc: '/images/exames/frequencia-pouco-frequente.png',
  };
}
