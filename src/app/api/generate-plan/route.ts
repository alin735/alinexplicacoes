import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServiceSupabase } from '@/lib/server-bookings';

type SubjectInput = {
  subject: string;
  topic: string;
  current_grade: number;
};

type UpdateInput = {
  subject: string;
  topic: string;
  grade: number;
  recorded_at: string;
};

type QuestionnaireInput = {
  mainDifficulties: string;
  currentActions: string;
  goals: string;
  studyTimeValue: number;
  studyTimeUnit: 'day' | 'week';
};

type TestImageInput = {
  id: string;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  base64Data: string;
};

type QualityCriteria = {
  personalization: number;
  specificity: number;
  timeFit: number;
  goalAlignment: number;
  examOrientation: number;
  professionalQuality: number;
};

type QualitySource = 'heuristic';

type QualityReport = {
  source: QualitySource;
  totalScore: number;
  criteria: QualityCriteria;
  hardFails: string[];
  mustFix: string[];
  strengths: string[];
  summary: string;
};

type PlanAttempt = {
  plan: string;
  quality: QualityReport;
};

const FORCED_SUBJECT = 'Matemática';

const QUALITY_RULES = {
  totalScore: 84,
  revisionScore: 76,
  criteriaMinimums: {
    personalization: 20,
    specificity: 14,
    timeFit: 10,
    goalAlignment: 10,
    examOrientation: 10,
    professionalQuality: 7,
  },
} as const;

const CRITERIA_MAX = {
  personalization: 25,
  specificity: 20,
  timeFit: 15,
  goalAlignment: 15,
  examOrientation: 15,
  professionalQuality: 10,
} as const;

function extractAnthropicText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const contentRaw = (payload as { content?: unknown }).content;
  const content = Array.isArray(contentRaw) ? contentRaw : [];
  const chunks: string[] = [];

  for (const item of content) {
    if (
      item &&
      typeof item === 'object' &&
      (item as { type?: string }).type === 'text' &&
      typeof (item as { text?: string }).text === 'string'
    ) {
      chunks.push((item as { text: string }).text);
    }
  }

  return chunks.join('\n').trim();
}

function normalizeEnvValue(rawValue: string | undefined): string {
  if (!rawValue) return '';
  let normalized = rawValue.trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized;
}

function normalizeAnthropicApiKey(rawValue: string | undefined): string {
  return normalizeEnvValue(rawValue).replace(/\s+/g, '');
}

function isLikelyAnthropicApiKey(value: string): boolean {
  return value.startsWith('sk-ant-') && value.length >= 20;
}

function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const total = values.reduce((acc, value) => acc + value, 0);
  return Number((total / values.length).toFixed(1));
}

function parseTargetGradeFromGoals(goals: string): number | null {
  const normalized = goals.replace(',', '.');
  const matches = normalized.match(/\b(?:[0-1]?\d(?:\.\d+)?)\b/g);
  if (!matches) return null;

  const candidates = matches
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0 && value <= 20);

  if (candidates.length === 0) return null;
  return Number(candidates[candidates.length - 1].toFixed(1));
}

function getTrendSummary(updates: UpdateInput[]): string {
  if (updates.length < 2) {
    return 'Sem histórico suficiente para tendência robusta.';
  }

  const sorted = [...updates].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );
  const first = Number(sorted[0].grade);
  const last = Number(sorted[sorted.length - 1].grade);
  const delta = Number((last - first).toFixed(1));

  if (delta > 0) return `Evolução positiva de +${delta} valores.`;
  if (delta < 0) return `Oscilação negativa de ${delta} valores.`;
  return 'Evolução estável.';
}

function getMomentumSummary(updates: UpdateInput[]): string {
  if (updates.length < 4) return 'Sem dados suficientes para comparar blocos recentes.';

  const sorted = [...updates].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );
  const recent = sorted.slice(-3).map((item) => Number(item.grade));
  const previous = sorted.slice(-6, -3).map((item) => Number(item.grade));
  if (previous.length === 0) return 'Sem histórico suficiente para momentum.';

  const recentAvg = calculateAverage(recent);
  const previousAvg = calculateAverage(previous);
  const delta = Number((recentAvg - previousAvg).toFixed(1));

  if (delta > 0) return `Momentum positivo: +${delta} valores no bloco mais recente.`;
  if (delta < 0) return `Momentum negativo: ${delta} valores no bloco mais recente.`;
  return 'Momentum neutro no bloco mais recente.';
}

function getTopicPerformanceSummary(updates: UpdateInput[]): string {
  if (updates.length === 0) return 'Sem registos por tema.';

  const topicMap = new Map<
    string,
    { count: number; total: number; latestDate: number; latestGrade: number }
  >();

  for (const update of updates) {
    const topic = update.topic?.trim() || 'Tema não indicado';
    const grade = Number(update.grade);
    if (Number.isNaN(grade)) continue;

    const timestamp = new Date(update.recorded_at).getTime();
    const existing = topicMap.get(topic);
    if (!existing) {
      topicMap.set(topic, {
        count: 1,
        total: grade,
        latestDate: Number.isFinite(timestamp) ? timestamp : 0,
        latestGrade: grade,
      });
      continue;
    }

    const shouldReplaceLatest = Number.isFinite(timestamp) && timestamp >= existing.latestDate;
    topicMap.set(topic, {
      count: existing.count + 1,
      total: existing.total + grade,
      latestDate: shouldReplaceLatest ? timestamp : existing.latestDate,
      latestGrade: shouldReplaceLatest ? grade : existing.latestGrade,
    });
  }

  const entries = Array.from(topicMap.entries())
    .map(([topic, stats]) => ({
      topic,
      average: Number((stats.total / stats.count).toFixed(1)),
      count: stats.count,
      latestGrade: Number(stats.latestGrade.toFixed(1)),
    }))
    .sort((a, b) => a.average - b.average || b.count - a.count)
    .slice(0, 4);

  if (entries.length === 0) return 'Sem registos por tema.';

  return entries
    .map(
      (entry) =>
        `- ${entry.topic}: média ${entry.average.toFixed(1)}/20 (${entry.count} registos, último ${entry.latestGrade.toFixed(1)}/20)`,
    )
    .join('\n');
}

function getRecentUpdatesSummary(updates: UpdateInput[]): string {
  if (updates.length === 0) return 'Sem registos de avaliação.';

  return updates
    .slice(-6)
    .map(
      (item) =>
        `- ${new Date(item.recorded_at).toLocaleDateString('pt-PT')}: ${Number(item.grade).toFixed(1)}/20${item.topic ? ` (${item.topic})` : ''}`,
    )
    .join('\n');
}

function normalizeGeneratedPlanText(plan: string): string {
  return plan
    .replace(/\r/g, '')
    .replace(/[—–]/g, '-')
    .replace(/\b[oO]\s+aluno\s+deverá\b/g, 'Tu vais')
    .replace(/\b[oO]\s+aluno\s+deve\b/g, 'Tu vais')
    .replace(/\b[dD]everás\b/g, 'Vais')
    .replace(/\b[dD]eves\b/g, 'Vai')
    .replace(/^\s*#{1,6}\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '')
    .replace(/^\s*[*-]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, (match) => `${match.trimEnd()} `)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function looksTruncatedPlan(plan: string): boolean {
  const text = plan.trim();
  if (!text) return true;

  const lower = text.toLowerCase();
  const requiredHeadings = [
    '1) observações',
    '2) estratégia para ultrapassar as dificuldades',
    '3) como melhorar o que já estás a fazer',
    '4) plano semanal de execução (4 semanas)',
    '5) indicadores de progresso e metas objetivas',
    '6) plano da próxima explicação',
    'checklist da semana',
  ];

  const hasAllHeadings = requiredHeadings.every((heading) => lower.includes(heading));
  if (!hasAllHeadings) return true;

  if (/[a-záàãâéêíóôõúç]{3,}\.$/i.test(text)) return false;
  if (/[a-záàãâéêíóôõúç]{3,}:$/i.test(text)) return true;

  const lastChar = text[text.length - 1];
  if (!['.', '!', '?'].includes(lastChar)) return true;

  return false;
}

function sanitizeTestImages(input: unknown): TestImageInput[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const root = item as Record<string, unknown>;
      const mimeType = String(root.mimeType || '');
      const fileName = String(root.fileName || '').slice(0, 120);
      const base64Data = String(root.base64Data || '').replace(/\s+/g, '');

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) return null;
      if (!base64Data || base64Data.length > 1_800_000) return null;

      return {
        id: String(root.id || ''),
        fileName: fileName || 'teste',
        mimeType: mimeType as TestImageInput['mimeType'],
        base64Data,
      } satisfies TestImageInput;
    })
    .filter((item): item is TestImageInput => Boolean(item))
    .slice(0, 20);
}

function buildTestImagesPrompt(images: TestImageInput[]): string {
  if (images.length === 0) {
    return 'Sem imagens de testes anexadas.';
  }

  return [
    `Foram anexadas ${images.length} imagens dos testes recentes para análise detalhada.`,
    'Analisa essas imagens para identificar:',
    '- erros recorrentes de procedimento e cálculo;',
    '- falhas de interpretação do enunciado;',
    '- padrões de raciocínio que estão a bloquear a nota;',
    '- pontos fortes que podem ser aproveitados.',
    'Integra essas conclusões no plano com ações corretivas específicas.',
  ].join('\n');
}

function buildTestImageContentBlocks(images: TestImageInput[]): Array<{ type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: TestImageInput['mimeType']; data: string } }> {
  const blocks: Array<
    { type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: TestImageInput['mimeType']; data: string } }
  > = [];

  for (const image of images) {
    blocks.push({
      type: 'text',
      text: `Imagem de teste: ${image.fileName}`,
    });
    blocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: image.mimeType,
        data: image.base64Data,
      },
    });
  }

  return blocks;
}

function isValidQuestionnaire(questionnaire: QuestionnaireInput | undefined): questionnaire is QuestionnaireInput {
  if (!questionnaire) return false;
  const studyValue = Number(questionnaire.studyTimeValue);
  const validUnit = questionnaire.studyTimeUnit === 'day' || questionnaire.studyTimeUnit === 'week';
  return Boolean(
    questionnaire.mainDifficulties?.trim() &&
      questionnaire.currentActions?.trim() &&
      questionnaire.goals?.trim() &&
      !Number.isNaN(studyValue) &&
      studyValue > 0 &&
      validUnit,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildHeuristicQualityReport(plan: string): QualityReport {
  const lower = plan.toLowerCase();

  const headingTokens = [
    'diagnóstico personalizado',
    'estratégia para ultrapassar as dificuldades',
    'otimização do que já estás a fazer',
    'plano semanal de execução',
    'indicadores de progresso',
    'plano da próxima explicação',
  ];

  const foundHeadings = headingTokens.filter((token) => lower.includes(token)).length;
  const weekMatches = lower.match(/semana\s*[1-4]/g) || [];
  const uniqueWeeks = Array.from(new Set(weekMatches.map((item) => item.trim())));
  const actionLines = plan
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^(-|•|\*|\d+\.)\s+/.test(line));

  const hasDifficulty = lower.includes('dificuld');
  const hasCurrentActions =
    lower.includes('já está') ||
    lower.includes('já estás') ||
    lower.includes('o que já') ||
    lower.includes('atualmente');
  const hasGoals = lower.includes('objetiv');
  const hasMetrics = lower.includes('indicador') || lower.includes('meta') || /\/20\b/.test(lower);
  const hasExamFocus = lower.includes('exame') || lower.includes('tipo exame') || lower.includes('simulado');
  const hasTimeFit = lower.includes('por dia') || lower.includes('por semana') || /\b\d+\s*(h|hora|horas|min)\b/.test(lower);
  const hasDistribution = lower.includes('distribuição horária') || lower.includes('carga horária');

  const criteria: QualityCriteria = {
    personalization: clamp(
      8 +
        (hasDifficulty ? 6 : 0) +
        (hasCurrentActions ? 4 : 0) +
        (hasGoals ? 5 : 0) +
        (lower.includes('tema') ? 2 : 0),
      0,
      CRITERIA_MAX.personalization,
    ),
    specificity: clamp(
      5 +
        Math.min(actionLines.length, 8) +
        (/\b\d+\s*(h|hora|horas|min)\b/.test(lower) ? 3 : 0) +
        (hasMetrics ? 3 : 0),
      0,
      CRITERIA_MAX.specificity,
    ),
    timeFit: clamp(
      4 +
        (hasTimeFit ? 6 : 0) +
        (hasDistribution ? 3 : 0) +
        (uniqueWeeks.length >= 4 ? 2 : 0),
      0,
      CRITERIA_MAX.timeFit,
    ),
    goalAlignment: clamp(
      4 +
        (hasGoals ? 6 : 0) +
        (hasMetrics ? 3 : 0) +
        (lower.includes('impacto') || lower.includes('resultado esperado') ? 2 : 0),
      0,
      CRITERIA_MAX.goalAlignment,
    ),
    examOrientation: clamp(
      3 +
        (hasExamFocus ? 6 : 0) +
        (lower.includes('prova') || lower.includes('simulado') ? 3 : 0) +
        (lower.includes('prioridade') || lower.includes('tema') ? 2 : 0),
      0,
      CRITERIA_MAX.examOrientation,
    ),
    professionalQuality: clamp(
      3 +
        Math.min(foundHeadings, 4) +
        (uniqueWeeks.length >= 4 ? 2 : 0) +
        (plan.length >= 900 ? 1 : 0),
      0,
      CRITERIA_MAX.professionalQuality,
    ),
  };

  const totalScore = Number(
    (
      criteria.personalization +
      criteria.specificity +
      criteria.timeFit +
      criteria.goalAlignment +
      criteria.examOrientation +
      criteria.professionalQuality
    ).toFixed(1),
  );

  const hardFails: string[] = [];
  if (uniqueWeeks.length < 4) hardFails.push('Plano semanal incompleto: faltam semanas explícitas.');
  if (!hasMetrics) hardFails.push('Faltam métricas objetivas de acompanhamento.');
  if (!(hasDifficulty && hasGoals)) {
    hardFails.push('O plano não liga de forma explícita dificuldades e objetivos.');
  }

  const mustFix: string[] = [];
  if (!hasCurrentActions) mustFix.push('Integrar explicitamente o que o aluno já está a fazer e como otimizar.');
  if (!hasExamFocus) mustFix.push('Reforçar orientação ao exame com treino tipo prova/simulado.');
  if (!hasTimeFit) mustFix.push('Detalhar melhor o ajuste ao tempo disponível por dia/semana.');

  const strengths: string[] = [];
  if (foundHeadings >= 5) strengths.push('Estrutura organizada e profissional.');
  if (actionLines.length >= 8) strengths.push('Boa granularidade de ações concretas.');
  if (hasExamFocus) strengths.push('Boa orientação para exame.');

  return {
    source: 'heuristic',
    totalScore,
    criteria,
    hardFails,
    mustFix,
    strengths,
    summary:
      'Avaliação heurística local aplicada por fallback técnico (parser JSON da avaliação automática indisponível).',
  };
}

function isQualityApproved(report: QualityReport): boolean {
  if (report.hardFails.length > 0) return false;
  if (report.totalScore < QUALITY_RULES.totalScore) return false;

  return (
    report.criteria.personalization >= QUALITY_RULES.criteriaMinimums.personalization &&
    report.criteria.specificity >= QUALITY_RULES.criteriaMinimums.specificity &&
    report.criteria.timeFit >= QUALITY_RULES.criteriaMinimums.timeFit &&
    report.criteria.goalAlignment >= QUALITY_RULES.criteriaMinimums.goalAlignment &&
    report.criteria.examOrientation >= QUALITY_RULES.criteriaMinimums.examOrientation &&
    report.criteria.professionalQuality >= QUALITY_RULES.criteriaMinimums.professionalQuality
  );
}

function buildRevisionChecklist(report: QualityReport): string {
  const items = new Set<string>();

  for (const hardFail of report.hardFails) items.add(hardFail);
  for (const mustFix of report.mustFix) items.add(mustFix);

  if (report.criteria.personalization < QUALITY_RULES.criteriaMinimums.personalization) {
    items.add('Aumentar a personalização explícita: ligar cada ação às dificuldades, ao histórico e aos objetivos do aluno.');
  }
  if (report.criteria.specificity < QUALITY_RULES.criteriaMinimums.specificity) {
    items.add('Substituir recomendações vagas por tarefas concretas com duração, frequência e critério de execução.');
  }
  if (report.criteria.timeFit < QUALITY_RULES.criteriaMinimums.timeFit) {
    items.add('Garantir ajuste rigoroso ao tempo disponível por dia/semana, sem carga impossível.');
  }
  if (report.criteria.goalAlignment < QUALITY_RULES.criteriaMinimums.goalAlignment) {
    items.add('Mapear claramente como cada bloco do plano contribui para os objetivos definidos pelo aluno.');
  }
  if (report.criteria.examOrientation < QUALITY_RULES.criteriaMinimums.examOrientation) {
    items.add('Aumentar orientação ao exame: foco por tema, treino tipo exame e critérios de desempenho.');
  }
  if (report.criteria.professionalQuality < QUALITY_RULES.criteriaMinimums.professionalQuality) {
    items.add('Melhorar qualidade profissional: clareza, prioridade e linguagem pedagógica de alto nível.');
  }

  if (items.size === 0) {
    items.add('Tornar o plano ainda mais acionável e diferenciado para este aluno específico.');
  }

  return Array.from(items)
    .map((item, index) => `${index + 1}. ${item}`)
    .join('\n');
}

function estimateImageComplexity(images: TestImageInput[]): string {
  if (images.length === 0) return 'Sem anexos de testes.';
  if (images.length <= 4) return 'Análise concentrada dos erros mais recentes.';
  if (images.length <= 10) return 'Análise ampla com foco em padrões repetidos.';
  return 'Análise extensiva de padrões de raciocínio e erros recorrentes.';
}

async function callAnthropicText(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  userContentBlocks?: Array<
    { type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: TestImageInput['mimeType']; data: string } }
  >;
  maxTokens: number;
  temperature: number;
}): Promise<string> {
  const content =
    params.userContentBlocks && params.userContentBlocks.length > 0
      ? params.userContentBlocks
      : [{ type: 'text' as const, text: params.userPrompt }];

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': params.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: params.model,
      system: params.systemPrompt,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    }),
  });

  const rawResponse = await anthropicResponse.text();
  if (!anthropicResponse.ok) {
    let parsedError: Record<string, unknown> | null = null;
    try {
      const parsed = JSON.parse(rawResponse) as Record<string, unknown>;
      parsedError = parsed;
    } catch {
      parsedError = null;
    }

    const apiMessage =
      parsedError &&
      typeof parsedError.error === 'object' &&
      parsedError.error &&
      typeof (parsedError.error as Record<string, unknown>).message === 'string'
        ? String((parsedError.error as Record<string, unknown>).message)
        : rawResponse;

    const requestId =
      parsedError && typeof parsedError.request_id === 'string'
        ? String(parsedError.request_id)
        : '';

    if (anthropicResponse.status === 401) {
      throw new Error(
        `Autenticação Anthropic inválida (401: ${apiMessage}). Verifica ANTHROPIC_API_KEY no .env.local (sem aspas nem espaços), confirma que a chave está ativa e reinicia o servidor.${requestId ? ` request_id: ${requestId}` : ''}`,
      );
    }

    throw new Error(
      `Anthropic API ${anthropicResponse.status}: ${apiMessage}${requestId ? ` (request_id: ${requestId})` : ''}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error('A resposta da Anthropic não está num formato JSON válido.');
  }

  const text = extractAnthropicText(parsed);
  if (!text) {
    throw new Error('A resposta da Anthropic não incluiu conteúdo textual.');
  }

  return text;
}

async function evaluatePlanQuality(params: { plan: string }): Promise<QualityReport> {
  return buildHeuristicQualityReport(params.plan);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Sessão inválida. Faz login novamente para criar o plano.' },
      { status: 401 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Configuração Supabase incompleta no servidor.' },
      { status: 500 },
    );
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json(
      { error: 'Sessão inválida. Faz login novamente para criar o plano.' },
      { status: 401 },
    );
  }

  const serviceSupabase = getServiceSupabase();
  const { count: completedCount, error: completedError } = await serviceSupabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', authData.user.id)
    .eq('status', 'completed');

  if (completedError) {
    return NextResponse.json(
      { error: 'Não foi possível validar o estado das tuas explicações.' },
      { status: 500 },
    );
  }

  if (!completedCount || completedCount < 1) {
    return NextResponse.json(
      { error: 'O plano só fica disponível após a tua primeira explicação concluída.' },
      { status: 403 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const subjects = (body.subjects || []) as SubjectInput[];
  const updates = (body.updates || []) as UpdateInput[];
  const questionnaire = body.questionnaire as QuestionnaireInput | undefined;
  const testImages = sanitizeTestImages(body.testImages);

  if (!Array.isArray(subjects) || subjects.length === 0 || !isValidQuestionnaire(questionnaire)) {
    return NextResponse.json({ error: 'Dados insuficientes para gerar o plano.' }, { status: 400 });
  }

  const anthropicApiKey = normalizeAnthropicApiKey(process.env.ANTHROPIC_API_KEY);
  if (!anthropicApiKey) {
    return NextResponse.json(
      {
        error:
          'ANTHROPIC_API_KEY não configurada. Adiciona ANTHROPIC_API_KEY=... no ficheiro .env.local e reinicia o servidor para gerar o plano com Claude Sonnet.',
      },
      { status: 503 },
    );
  }

  if (!isLikelyAnthropicApiKey(anthropicApiKey)) {
    return NextResponse.json(
      {
        error:
          'ANTHROPIC_API_KEY parece inválida (formato inesperado). Coloca a chave completa sem aspas/espaços no .env.local e reinicia o servidor.',
      },
      { status: 503 },
    );
  }

  const anthropicModel = normalizeEnvValue(process.env.ANTHROPIC_MODEL) || 'claude-sonnet-4-6';

  const incomingSubject = subjects[0];
  const mainSubject: SubjectInput = {
    subject: FORCED_SUBJECT,
    topic: incomingSubject?.topic || 'Matemática',
    current_grade: Number(incomingSubject?.current_grade || 0),
  };

  const scopedUpdates = (updates.length > 0 ? updates : [])
    .map((item) => ({
      ...item,
      subject: FORCED_SUBJECT,
      topic: item.topic || 'Instrumento de avaliação',
    }))
    .filter((item) => Number.isFinite(Number(item.grade)));

  const currentGrade = Number(mainSubject.current_grade || 0);
  const recentAverage = calculateAverage(scopedUpdates.slice(-6).map((item) => Number(item.grade)));
  const targetGrade = parseTargetGradeFromGoals(questionnaire.goals);
  const studyLoad = `${questionnaire.studyTimeValue}h ${questionnaire.studyTimeUnit === 'day' ? 'por dia' : 'por semana'}`;
  const trendSummary = getTrendSummary(scopedUpdates);
  const momentumSummary = getMomentumSummary(scopedUpdates);
  const recentUpdatesSummary = getRecentUpdatesSummary(scopedUpdates);
  const topicPerformanceSummary = getTopicPerformanceSummary(scopedUpdates);
  const targetGradeSummary =
    targetGrade === null
      ? 'Objetivo numérico final não indicado explicitamente.'
      : `Objetivo de classificação identificado: ${targetGrade.toFixed(1)}/20 (gap atual: ${(targetGrade - currentGrade).toFixed(1)} valores).`;

  const studentContext = [
    `Disciplina: ${FORCED_SUBJECT}`,
    `Classificação atual: ${currentGrade.toFixed(1)}/20`,
    `Média recente: ${recentAverage.toFixed(1)}/20`,
    `Tendência: ${trendSummary}`,
    `Momentum: ${momentumSummary}`,
    `Carga de estudo disponível: ${studyLoad}`,
    targetGradeSummary,
    '',
    'Desempenho por tema (prioridade pelos mais fracos):',
    topicPerformanceSummary,
    '',
    'Registos recentes:',
    recentUpdatesSummary,
    '',
    'Questionário preenchido:',
    `- Principais dificuldades: ${questionnaire.mainDifficulties}`,
    `- O que já está a fazer para melhorar: ${questionnaire.currentActions}`,
    `- Objetivos: ${questionnaire.goals}`,
  ].join('\n');

  const systemPrompt = [
    'És o explicador Alin e estás a falar diretamente com o aluno.',
    'A disciplina é SEMPRE Matemática. Nunca menciones outra disciplina.',
    'Escreve sempre na segunda pessoa singular (tu).',
    'Nunca uses: "o aluno", "deve", "deves", "deverá".',
    'Usa verbos diretos como: faz, revê, organiza, treina, corrige.',
    'Tom: próximo, claro, confiante e útil, sem formalismo de professor.',
    'Proibido texto genérico, frases vagas, linguagem comercial ou conteúdo de template.',
    'Cada recomendação tem de ligar: dificuldade -> ação -> resultado esperado.',
    'Não uses travessão longo (—), markdown com asteriscos, nem títulos com #.',
    'Entrega texto limpo, pronto para PDF.',
    'Estrutura obrigatória com estes títulos exatos:',
    '1) Observações',
    '2) Estratégia para ultrapassar as dificuldades',
    '3) Como melhorar o que já estás a fazer',
    '4) Plano semanal de execução (4 semanas)',
    '5) Indicadores de progresso e metas objetivas',
    '6) Plano da próxima explicação',
    'No ponto 4, cada semana deve ter: foco principal, decisões da semana, procedimentos concretos, distribuição horária e resultado esperado.',
    'No final, acrescenta um bloco curto: "Checklist da semana".',
    'Se existirem imagens de testes, analisa-as com profundidade: erros, raciocínio, padrões e decisões de resolução.',
    'Traduz a análise dos testes em ações corretivas práticas no plano.',
    'Escreve com linguagem natural de aluno para aluno, menos formal, sem soar robotizado.',
    'Sê específico nas estratégias: decisões práticas, procedimentos claros e ações semanais concretas.',
  ].join('\n');

  const testImagePrompt = buildTestImagesPrompt(testImages);
  const testImageComplexity = estimateImageComplexity(testImages);

  const baseUserPrompt = [
    'Cria um plano individual com base no contexto real abaixo.',
    'Comprimento alvo: 520-760 palavras.',
    'Máximo de 36 bullets no total.',
    'Não uses markdown.',
    'Mantém um tom natural e direto.',
    'Contexto do aluno:',
    studentContext,
    '',
    'Análise de testes:',
    testImagePrompt,
    testImageComplexity,
  ].join('\n\n');

  const baseUserBlocks = [
    { type: 'text' as const, text: baseUserPrompt },
    ...buildTestImageContentBlocks(testImages),
  ];

  const attempts: PlanAttempt[] = [];

  try {
    const firstPlan = await callAnthropicText({
      apiKey: anthropicApiKey,
      model: anthropicModel,
      systemPrompt,
      userPrompt: baseUserPrompt,
      userContentBlocks: baseUserBlocks,
      maxTokens: 1400,
      temperature: 0.25,
    });

    const firstPlanFixed = looksTruncatedPlan(firstPlan)
      ? await callAnthropicText({
          apiKey: anthropicApiKey,
          model: anthropicModel,
          systemPrompt,
          userPrompt: [
            baseUserPrompt,
            'O plano anterior ficou incompleto. Reescreve completo até ao fim, mantendo todas as secções obrigatórias e terminando com frases completas.',
            'Garante que o texto termina de forma natural e não cortada.',
          ].join('\n\n'),
          userContentBlocks: [
            {
              type: 'text',
              text: [
                baseUserPrompt,
                'O plano anterior ficou incompleto. Reescreve completo até ao fim, mantendo todas as secções obrigatórias e terminando com frases completas.',
                'Garante que o texto termina de forma natural e não cortada.',
              ].join('\n\n'),
            },
            ...buildTestImageContentBlocks(testImages),
          ],
          maxTokens: 1500,
          temperature: 0.2,
        })
      : firstPlan;

    const firstQuality = await evaluatePlanQuality({
      plan: firstPlanFixed,
    });
    attempts.push({ plan: firstPlanFixed, quality: firstQuality });

    const shouldRegenerate =
      firstQuality.hardFails.length > 0 || firstQuality.totalScore < QUALITY_RULES.revisionScore;

    if (shouldRegenerate) {
      const revisionChecklist = buildRevisionChecklist(firstQuality);
      const revisionPrompt = [
        baseUserPrompt,
        'Reescreve o plano para ficar mais claro, personalizado e acionável.',
        'Garante que todas as secções estão completas e terminam sem cortes.',
        'Corrige obrigatoriamente estes pontos:',
        revisionChecklist,
      ].join('\n\n');

      const revisedPlan = await callAnthropicText({
        apiKey: anthropicApiKey,
        model: anthropicModel,
        systemPrompt,
        userPrompt: revisionPrompt,
        userContentBlocks: [
          { type: 'text', text: revisionPrompt },
          ...buildTestImageContentBlocks(testImages),
        ],
        maxTokens: 1500,
        temperature: 0.15,
      });

      const revisedPlanFixed = looksTruncatedPlan(revisedPlan)
        ? await callAnthropicText({
            apiKey: anthropicApiKey,
            model: anthropicModel,
            systemPrompt,
            userPrompt: [
              revisionPrompt,
              'Ainda ficou incompleto. Reescreve até ao fim com todas as secções obrigatórias concluídas.',
            ].join('\n\n'),
            userContentBlocks: [
              {
                type: 'text',
                text: [
                  revisionPrompt,
                  'Ainda ficou incompleto. Reescreve até ao fim com todas as secções obrigatórias concluídas.',
                ].join('\n\n'),
              },
              ...buildTestImageContentBlocks(testImages),
            ],
            maxTokens: 1500,
            temperature: 0.1,
          })
        : revisedPlan;

      const revisedQuality = await evaluatePlanQuality({
        plan: revisedPlanFixed,
      });
      attempts.push({ plan: revisedPlanFixed, quality: revisedQuality });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido na geração do plano.';
    return NextResponse.json(
      { error: `Falha na geração do plano com Claude Sonnet: ${message}` },
      { status: 502 },
    );
  }

  const approvedAttempt = attempts.find((attempt) => isQualityApproved(attempt.quality));
  const bestAttempt =
    approvedAttempt ??
    [...attempts].sort((a, b) => b.quality.totalScore - a.quality.totalScore)[0];

  if (!bestAttempt || !bestAttempt.plan.trim()) {
    return NextResponse.json(
      { error: 'Não foi possível gerar um plano válido para este aluno.' },
      { status: 502 },
    );
  }

  const approved = isQualityApproved(bestAttempt.quality);
  const normalizedPlan = normalizeGeneratedPlanText(bestAttempt.plan);

  return NextResponse.json({
    plan: normalizedPlan,
    model: anthropicModel,
    provider: 'anthropic',
    generated_locally: false,
    quality: {
      approved,
      attempts: attempts.length,
      totalScore: bestAttempt.quality.totalScore,
      criteria: bestAttempt.quality.criteria,
      hardFails: bestAttempt.quality.hardFails,
      summary: bestAttempt.quality.summary,
      source: bestAttempt.quality.source,
    },
  });
}
