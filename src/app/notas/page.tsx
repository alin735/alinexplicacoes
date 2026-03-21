'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MathRain from '@/components/MathRain';
import { createClient } from '@/lib/supabase';
import {
  type StudyTimeUnit,
  type StudentGradeUpdate,
  type StudentPlan,
  type StudentSubject,
} from '@/lib/types';

type PlanForm = {
  mainDifficulties: string;
  currentActions: string;
  goals: string;
  studyHours: string;
  studyUnit: Extract<StudyTimeUnit, 'day' | 'week'>;
};

type LocalNotasData = {
  subjects: StudentSubject[];
  updates: StudentGradeUpdate[];
  plan: StudentPlan | null;
  planFormDraft: PlanForm | null;
};

type PlanPayload = {
  mainDifficulties: string;
  currentActions: string;
  goals: string;
  studyTimeValue: number;
  studyTimeUnit: Extract<StudyTimeUnit, 'day' | 'week'>;
};

type PlanTestImage = {
  id: string;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  base64Data: string;
};

type StudentPlanInputRow = {
  main_difficulties: string;
  improvement_focus: string;
  biggest_difficulties: string;
  study_time_value: number;
  study_time_unit: Extract<StudyTimeUnit, 'day' | 'week' | 'hour'>;
};

const NOTAS_LOCAL_STORAGE_PREFIX = 'matematicatop-notas';
const MATH_SUBJECT = 'Matemática';
const CHART_LEFT = 18;
const CHART_RIGHT = 116;
const CHART_TOP = 8;
const CHART_BOTTOM = 92;

const EMPTY_PLAN_FORM: PlanForm = {
  mainDifficulties: '',
  currentActions: '',
  goals: '',
  studyHours: '',
  studyUnit: 'week',
};

const MAX_PLAN_TEST_IMAGES = 20;
const MAX_PLAN_IMAGE_BASE64_LENGTH = 1_800_000;
const MAX_PLAN_IMAGE_SIDE = 1280;
const PLAN_IMAGE_QUALITY = 0.72;

type PlanApiImagePayload = {
  id: string;
  fileName: string;
  mimeType: PlanTestImage['mimeType'];
  base64Data: string;
};

function createLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getNotasStorageKey(userId: string): string {
  return `${NOTAS_LOCAL_STORAGE_PREFIX}:${userId}`;
}

function getEmptyLocalNotas(): LocalNotasData {
  return {
    subjects: [],
    updates: [],
    plan: null,
    planFormDraft: null,
  };
}

function readLocalNotas(userId: string): LocalNotasData {
  if (typeof window === 'undefined') return getEmptyLocalNotas();

  const stored = window.localStorage.getItem(getNotasStorageKey(userId));
  if (!stored) return getEmptyLocalNotas();

  try {
    const parsed = JSON.parse(stored) as Partial<LocalNotasData>;
    const maybeForm = parsed.planFormDraft as PlanForm | null | undefined;
    return {
      subjects: Array.isArray(parsed.subjects) ? (parsed.subjects as StudentSubject[]) : [],
      updates: Array.isArray(parsed.updates) ? (parsed.updates as StudentGradeUpdate[]) : [],
      plan: parsed.plan ? (parsed.plan as StudentPlan) : null,
      planFormDraft:
        maybeForm && typeof maybeForm === 'object'
          ? {
              mainDifficulties: String(maybeForm.mainDifficulties || ''),
              currentActions: String(
                (maybeForm as Partial<PlanForm> & { improvementFocus?: string }).currentActions ||
                  (maybeForm as Partial<PlanForm> & { improvementFocus?: string }).improvementFocus ||
                  '',
              ),
              goals: String((maybeForm as Partial<PlanForm>).goals || ''),
              studyHours: String(
                (maybeForm as Partial<PlanForm> & { studyTimeValue?: number }).studyHours ||
                  (maybeForm as Partial<PlanForm> & { studyTimeValue?: number }).studyTimeValue ||
                  '',
              ),
              studyUnit:
                ((maybeForm as Partial<PlanForm> & { studyTimeUnit?: PlanForm['studyUnit'] }).studyUnit ||
                  (maybeForm as Partial<PlanForm> & { studyTimeUnit?: PlanForm['studyUnit'] }).studyTimeUnit ||
                  'week') === 'day'
                  ? 'day'
                  : 'week',
            }
          : null,
    };
  } catch {
    return getEmptyLocalNotas();
  }
}

function writeLocalNotas(userId: string, data: LocalNotasData): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getNotasStorageKey(userId), JSON.stringify(data));
}

function isNotasSchemaError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;

  const maybeError = err as Record<string, unknown>;
  const code = String(maybeError.code || '').toUpperCase();
  const message = `${String(maybeError.message || '')} ${String(maybeError.details || '')} ${String(maybeError.hint || '')}`.toLowerCase();

  const missingNotasTable =
    message.includes('student_subjects') ||
    message.includes('student_grade_updates') ||
    message.includes('student_plan_inputs') ||
    message.includes('student_plans');

  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    (message.includes('schema cache') && missingNotasTable) ||
    (message.includes('does not exist') && missingNotasTable)
  );
}

function getReadableError(err: unknown, fallbackMessage: string): string {
  if (err && typeof err === 'object') {
    const maybeError = err as Record<string, unknown>;
    if (typeof maybeError.message === 'string' && maybeError.message.trim().length > 0) {
      return maybeError.message;
    }
  }

  return fallbackMessage;
}

function parseGrade(raw: string | number): number {
  const value = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
  return Math.min(20, Math.max(0, value));
}

function calculateAverage(series: StudentGradeUpdate[]): number {
  if (series.length === 0) return 0;
  const total = series.reduce((acc, item) => acc + Number(item.grade), 0);
  return Math.round((total / series.length) * 10) / 10;
}

function getTodayDateInput(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateInputToIso(dateValue: string): string {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59)).toISOString();
}

function getChartScale(series: StudentGradeUpdate[]) {
  if (series.length === 0) {
    return { min: 0, max: 20, ticks: [0, 5, 10, 15, 20] };
  }

  const grades = series.map((item) => Number(item.grade));
  const minGrade = Math.min(...grades);
  const maxGrade = Math.max(...grades);

  let min = minGrade;
  let max = maxGrade;

  if (min === max) {
    min = Math.max(0, min - 1);
    max = Math.min(20, max + 1);
  } else {
    const padding = Math.max(0.5, (max - min) * 0.2);
    min = Math.max(0, min - padding);
    max = Math.min(20, max + padding);
  }

  if (max - min < 1) {
    min = Math.max(0, min - 0.5);
    max = Math.min(20, max + 0.5);
  }

  const ticks = [0, 1, 2, 3, 4].map((i) => min + ((max - min) * i) / 4);

  return { min, max, ticks };
}

function mapGradeToY(grade: number, scale: { min: number; max: number }) {
  const ratio = (grade - scale.min) / (scale.max - scale.min || 1);
  return CHART_BOTTOM - ratio * (CHART_BOTTOM - CHART_TOP);
}

function getChartPoints(series: StudentGradeUpdate[], scale: { min: number; max: number }): string {
  if (series.length === 0) return '';

  return series
    .map((item, index) => {
      const x =
        series.length === 1
          ? (CHART_LEFT + CHART_RIGHT) / 2
          : CHART_LEFT + (index / (series.length - 1)) * (CHART_RIGHT - CHART_LEFT);
      const y = mapGradeToY(Number(item.grade), scale);
      return `${x},${y}`;
    })
    .join(' ');
}

function getAreaPath(series: StudentGradeUpdate[], scale: { min: number; max: number }): string {
  if (series.length === 0) return '';

  const points = series.map((item, index) => {
    const x =
      series.length === 1
        ? (CHART_LEFT + CHART_RIGHT) / 2
        : CHART_LEFT + (index / (series.length - 1)) * (CHART_RIGHT - CHART_LEFT);
    const y = mapGradeToY(Number(item.grade), scale);
    return { x, y };
  });

  const first = points[0];
  const last = points[points.length - 1];
  const linePath = points.map((point) => `L ${point.x} ${point.y}`).join(' ');
  return `M ${first.x} ${CHART_BOTTOM} ${linePath} L ${last.x} ${CHART_BOTTOM} Z`;
}

function formatAxisLabel(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function getInitialMathGrade(user: any): number | null {
  const metadataSubjects = user?.user_metadata?.initial_subjects;

  if (Array.isArray(metadataSubjects)) {
    const mathEntry =
      metadataSubjects.find((item) => item?.subject === MATH_SUBJECT) || metadataSubjects[0];
    if (mathEntry && mathEntry.grade !== undefined && mathEntry.grade !== null) {
      const parsed = Number(String(mathEntry.grade).replace(',', '.'));
      if (!Number.isNaN(parsed)) {
        return Math.min(20, Math.max(0, parsed));
      }
    }
  }

  if (typeof window !== 'undefined' && user?.id) {
    const fallbackRaw = window.localStorage.getItem(`matematicatop-signup-initial:${user.id}`);
    if (fallbackRaw) {
      try {
        const parsed = JSON.parse(fallbackRaw) as { grade?: number };
        if (typeof parsed.grade === 'number' && !Number.isNaN(parsed.grade)) {
          return Math.min(20, Math.max(0, parsed.grade));
        }
      } catch {
        return null;
      }
    }
  }

  return null;
}

function formatPlanText(rawText: string): string {
  return rawText
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
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isPlanHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^\d+\)\s+/.test(trimmed)) return true;

  const normalized = trimmed
    .toLowerCase()
    .replace(/^\d+\)\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

  const knownHeadings = [
    'observações',
    'estratégia para ultrapassar as dificuldades',
    'como melhorar o que já estás a fazer',
    'plano semanal de execução (4 semanas)',
    'indicadores de progresso e metas objetivas',
    'plano da próxima explicação',
    'checklist da semana',
  ];

  if (knownHeadings.some((heading) => normalized === heading)) return true;

  return /^[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ0-9 ()/:-]{10,}$/.test(trimmed) && trimmed === trimmed.toUpperCase();
}

function isPlanSubtitle(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  if (/^semana\s+\d+/i.test(trimmed)) return true;
  if (
    /^(foco principal|tarefas|distribuição horária|resultado esperado|meta semanal|objetivo semanal|decisão da semana|procedimentos concretos)\s*:/i.test(
      trimmed,
    )
  ) {
    return true;
  }

  return false;
}

function getPlanImagesForApi(images: PlanTestImage[]): PlanApiImagePayload[] {
  return images
    .filter((image) => image.base64Data.trim().length > 0)
    .slice(0, MAX_PLAN_TEST_IMAGES)
    .map((image) => ({
      id: image.id,
      fileName: image.fileName,
      mimeType: image.mimeType,
      base64Data: image.base64Data,
    }));
}

function dataUrlToBase64(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex < 0) return '';
  return dataUrl.slice(commaIndex + 1);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Imagem inválida.'));
    image.src = dataUrl;
  });
}

async function compressImageFileToBase64(file: File): Promise<{ base64Data: string; mimeType: PlanTestImage['mimeType'] }> {
  const sourceDataUrl = await fileToDataUrl(file);
  const image = await loadImageFromDataUrl(sourceDataUrl);

  const maxDimension = Math.max(image.width, image.height);
  const scale = maxDimension > MAX_PLAN_IMAGE_SIDE ? MAX_PLAN_IMAGE_SIDE / maxDimension : 1;
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível processar a imagem.');

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const preferredMime: PlanTestImage['mimeType'] =
    file.type === 'image/png'
      ? 'image/png'
      : file.type === 'image/webp'
        ? 'image/webp'
        : 'image/jpeg';

  const compressedDataUrl = canvas.toDataURL(preferredMime, PLAN_IMAGE_QUALITY);
  return { base64Data: dataUrlToBase64(compressedDataUrl), mimeType: preferredMime };
}

export default function NotasPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [mathSubject, setMathSubject] = useState<StudentSubject | null>(null);
  const [updates, setUpdates] = useState<StudentGradeUpdate[]>([]);
  const [plan, setPlan] = useState<StudentPlan | null>(null);
  const [hasCompletedBooking, setHasCompletedBooking] = useState(false);
  const [schemaUnavailable, setSchemaUnavailable] = useState(false);
  const [showInitialGradeModal, setShowInitialGradeModal] = useState(false);
  const [initialGradeInput, setInitialGradeInput] = useState('');
  const [savingInitialGrade, setSavingInitialGrade] = useState(false);

  const [instrumentName, setInstrumentName] = useState('');
  const [instrumentGrade, setInstrumentGrade] = useState('');
  const [instrumentDate, setInstrumentDate] = useState(getTodayDateInput());
  const [savingInstrument, setSavingInstrument] = useState(false);
  const [removingUpdateId, setRemovingUpdateId] = useState<string | null>(null);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState<PlanForm>(EMPTY_PLAN_FORM);
  const [planTestImages, setPlanTestImages] = useState<PlanTestImage[]>([]);
  const [processingTestImages, setProcessingTestImages] = useState(false);
  const [savingPlanInputs, setSavingPlanInputs] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const sortedUpdates = useMemo(
    () =>
      [...updates].sort((a, b) => {
        const sourceDiff = (a.source === 'signup' ? 0 : 1) - (b.source === 'signup' ? 0 : 1);
        if (sourceDiff !== 0) return sourceDiff;
        return new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime();
      }),
    [updates],
  );

  const manualUpdates = useMemo(
    () => sortedUpdates.filter((item) => item.source === 'manual_update'),
    [sortedUpdates],
  );

  const evolutionSeries = useMemo(() => {
    let runningTotal = 0;
    return sortedUpdates.map((item, index) => {
      runningTotal += Number(item.grade);
      return {
        ...item,
        grade: Number((runningTotal / (index + 1)).toFixed(2)),
      };
    });
  }, [sortedUpdates]);

  const averageGrade = useMemo(() => {
    if (sortedUpdates.length > 0) {
      return calculateAverage(sortedUpdates);
    }
    return mathSubject ? Number(mathSubject.current_grade) : 0;
  }, [mathSubject, sortedUpdates]);

  const initialClassification = useMemo(() => {
    const signupUpdate = sortedUpdates.find((item) => item.source === 'signup');
    return signupUpdate ? Number(signupUpdate.grade) : null;
  }, [sortedUpdates]);

  const needsInitialGradeCta = useMemo(() => {
    if (!mathSubject) return true;
    if (initialClassification === null) return true;
    return initialClassification <= 0 && manualUpdates.length === 0;
  }, [mathSubject, initialClassification, manualUpdates.length]);

  const latestUpdateDate = sortedUpdates[sortedUpdates.length - 1]?.recorded_at || null;
  const chartScale = getChartScale(evolutionSeries);
  const chartPoints = getChartPoints(evolutionSeries, chartScale);
  const chartAreaPath = getAreaPath(evolutionSeries, chartScale);
  const formattedPlanText = useMemo(() => (plan ? formatPlanText(plan.plan_text) : ''), [plan]);

  const persistLocalData = (
    nextSubject: StudentSubject | null,
    nextUpdates: StudentGradeUpdate[],
    nextPlan: StudentPlan | null = plan,
    nextPlanForm: PlanForm | null = planForm,
  ) => {
    if (!user?.id) return;
    writeLocalNotas(user.id, {
      subjects: nextSubject ? [nextSubject] : [],
      updates: nextUpdates,
      plan: nextPlan,
      planFormDraft: nextPlanForm,
    });
  };

  const ensureMathSubject = async (fallbackGrade: number): Promise<StudentSubject> => {
    if (mathSubject) return mathSubject;
    if (!user?.id) {
      throw new Error('Sessão inválida. Inicia sessão novamente.');
    }

    const gradeToUse = getInitialMathGrade(user) ?? fallbackGrade;
    const nowIso = new Date().toISOString();

    if (schemaUnavailable) {
      const localSubject: StudentSubject = {
        id: createLocalId(),
        student_id: user.id,
        subject: MATH_SUBJECT,
        topic: '',
        current_grade: gradeToUse,
        created_at: nowIso,
        updated_at: nowIso,
      };
      setMathSubject(localSubject);
      persistLocalData(localSubject, updates);
      return localSubject;
    }

    const { data, error: upsertError } = await supabase
      .from('student_subjects')
      .upsert(
        {
          student_id: user.id,
          subject: MATH_SUBJECT,
          topic: '',
          current_grade: gradeToUse,
        },
        { onConflict: 'student_id,subject' },
      )
      .select('*')
      .single();

    if (upsertError) throw upsertError;

    const createdSubject = data as StudentSubject;
    setMathSubject(createdSubject);
    return createdSubject;
  };

  const fetchNotasData = async (currentUser: any) => {
    const userId = currentUser.id as string;

    const { count, error: completedBookingsError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', userId)
      .eq('status', 'completed');

    if (completedBookingsError) {
      throw completedBookingsError;
    }

    setHasCompletedBooking((count ?? 0) > 0);

    const [subjectResult, updatesResult, planResult, planInputResult] = await Promise.all([
      supabase
        .from('student_subjects')
        .select('*')
        .eq('student_id', userId)
        .eq('subject', MATH_SUBJECT)
        .maybeSingle(),
      supabase
        .from('student_grade_updates')
        .select('*')
        .eq('student_id', userId)
        .eq('subject', MATH_SUBJECT)
        .order('recorded_at', { ascending: true }),
      supabase.from('student_plans').select('*').eq('student_id', userId).maybeSingle(),
      supabase
        .from('student_plan_inputs')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const notasError =
      subjectResult.error ||
      updatesResult.error ||
      planResult.error ||
      planInputResult.error;

    if (notasError && isNotasSchemaError(notasError)) {
      setSchemaUnavailable(true);

      let localData = readLocalNotas(userId);
      const initialGrade = getInitialMathGrade(currentUser);

      if (localData.subjects.length === 0 && initialGrade !== null) {
        const nowIso = new Date().toISOString();
        const signupRecordedAt = currentUser.created_at || nowIso;
        const localSubject: StudentSubject = {
          id: createLocalId(),
          student_id: userId,
          subject: MATH_SUBJECT,
          topic: '',
          current_grade: initialGrade,
          created_at: signupRecordedAt,
          updated_at: nowIso,
        };
        const signupUpdate: StudentGradeUpdate = {
          id: createLocalId(),
          student_subject_id: localSubject.id,
          student_id: userId,
          subject: MATH_SUBJECT,
          topic: 'Classificação inicial',
          grade: initialGrade,
          source: 'signup',
          recorded_at: signupRecordedAt,
        };
        localData = {
          ...localData,
          subjects: [localSubject],
          updates: [signupUpdate],
        };
        writeLocalNotas(userId, localData);
      } else if (
        localData.subjects.length > 0 &&
        localData.updates.length === 0
      ) {
        const nowIso = new Date().toISOString();
        const baselineSubject = localData.subjects[0];
        const signupRecordedAt =
          baselineSubject.created_at || currentUser.created_at || nowIso;
        const signupUpdate: StudentGradeUpdate = {
          id: createLocalId(),
          student_subject_id: baselineSubject.id,
          student_id: userId,
          subject: MATH_SUBJECT,
          topic: 'Classificação inicial',
          grade: Number(baselineSubject.current_grade),
          source: 'signup',
          recorded_at: signupRecordedAt,
        };
        localData = {
          ...localData,
          updates: [signupUpdate],
        };
        writeLocalNotas(userId, localData);
      }

      setMathSubject(localData.subjects[0] || null);
      setUpdates(localData.updates.filter((item) => item.subject === MATH_SUBJECT));
      setPlan(localData.plan);
      const needsInitialGrade = !localData.subjects[0];
      setShowInitialGradeModal(needsInitialGrade);
      if (needsInitialGrade && initialGrade !== null) {
        setInitialGradeInput(String(initialGrade));
      }
      if (localData.planFormDraft) {
        setPlanForm(localData.planFormDraft);
      }
      return;
    }

    if (notasError) {
      throw notasError;
    }

    setSchemaUnavailable(false);

    let subjectData = (subjectResult.data as StudentSubject | null) || null;
    let updatesData = (updatesResult.data as StudentGradeUpdate[] | null) || [];
    const initialGrade = getInitialMathGrade(currentUser);

    if (!subjectData && initialGrade !== null) {
      const { data: insertedSubject, error: insertSubjectError } = await supabase
        .from('student_subjects')
        .upsert(
          {
            student_id: userId,
            subject: MATH_SUBJECT,
            topic: '',
            current_grade: initialGrade,
          },
          { onConflict: 'student_id,subject' },
        )
        .select('*')
        .single();

      if (insertSubjectError) throw insertSubjectError;
      subjectData = insertedSubject as StudentSubject;
    }

    if (subjectData && updatesData.length === 0) {
      const signupGrade = initialGrade ?? Number(subjectData.current_grade);
      const signupRecordedAt = subjectData.created_at || currentUser.created_at || new Date().toISOString();
      const { data: insertedUpdate, error: insertUpdateError } = await supabase
        .from('student_grade_updates')
        .insert({
          student_subject_id: subjectData.id,
          student_id: userId,
          subject: MATH_SUBJECT,
          topic: 'Classificação inicial',
          grade: signupGrade,
          source: 'signup',
          recorded_at: signupRecordedAt,
        })
        .select('*')
        .single();

      if (insertUpdateError) throw insertUpdateError;
      updatesData = [insertedUpdate as StudentGradeUpdate];
    }

    if (subjectData && updatesData.length > 0) {
      const computedAverage = calculateAverage(updatesData);
      if (Math.abs(Number(subjectData.current_grade) - computedAverage) > 0.01) {
        const { error: syncError } = await supabase
          .from('student_subjects')
          .update({ current_grade: computedAverage })
          .eq('id', subjectData.id)
          .eq('student_id', userId);

        if (syncError) throw syncError;
        subjectData = {
          ...subjectData,
          current_grade: computedAverage,
          updated_at: new Date().toISOString(),
        };
      }
    }

    setMathSubject(subjectData);
    setUpdates(updatesData);
    setPlan((planResult.data as StudentPlan | null) || null);
    const needsInitialGrade = !subjectData;
    setShowInitialGradeModal(needsInitialGrade);
    if (needsInitialGrade && initialGrade !== null) {
      setInitialGradeInput(String(initialGrade));
    }

    const latestInput = (planInputResult.data as StudentPlanInputRow | null) || null;
    if (latestInput) {
      setPlanForm({
        mainDifficulties: latestInput.main_difficulties || '',
        currentActions: latestInput.improvement_focus || '',
        goals: latestInput.biggest_difficulties || '',
        studyHours:
          latestInput.study_time_value && Number(latestInput.study_time_value) > 0
            ? String(latestInput.study_time_value)
            : '',
        studyUnit: latestInput.study_time_unit === 'day' ? 'day' : 'week',
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError(getReadableError(sessionError, 'Não foi possível validar a sessão.'));
        setLoading(false);
        return;
      }

      let currentUser = sessionData.session?.user ?? null;

      if (!currentUser) {
        const { data: userData, error: authError } = await supabase.auth.getUser();
        if (authError) {
          setError(getReadableError(authError, 'Não foi possível validar a sessão.'));
          setLoading(false);
          return;
        }
        currentUser = userData.user ?? null;
      }

      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      try {
        await fetchNotasData(currentUser);
      } catch (err: unknown) {
        setError(getReadableError(err, 'Não foi possível carregar a área de notas.'));
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!loading && hasCompletedBooking && !plan && !showInitialGradeModal && !needsInitialGradeCta) {
      setShowPlanModal(true);
    }
  }, [loading, hasCompletedBooking, plan, showInitialGradeModal, needsInitialGradeCta]);

  useEffect(() => {
    if (needsInitialGradeCta && initialClassification !== null) {
      setInitialGradeInput(String(initialClassification));
    }
  }, [needsInitialGradeCta, initialClassification]);

  const handleSaveInitialGrade = async () => {
    setSavingInitialGrade(true);
    setError('');
    setSuccess('');

    try {
      if (!user?.id) {
        throw new Error('Sessão inválida. Inicia sessão novamente.');
      }

      const parsedGrade = parseGrade(initialGradeInput);
      if (Number.isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > 20) {
        throw new Error('A classificação inicial deve estar entre 0 e 20.');
      }

      const subjectData = await ensureMathSubject(parsedGrade);
      const signupRecordedAt = user.created_at || new Date().toISOString();

      if (schemaUnavailable) {
        const existingSignup = updates.find((item) => item.source === 'signup');
        const signupUpdate: StudentGradeUpdate = existingSignup
          ? { ...existingSignup, grade: parsedGrade }
          : {
              id: createLocalId(),
              student_subject_id: subjectData.id,
              student_id: user.id,
              subject: MATH_SUBJECT,
              topic: 'Classificação inicial',
              grade: parsedGrade,
              source: 'signup',
              recorded_at: signupRecordedAt,
            };

        const nextUpdates = existingSignup
          ? updates.map((item) => (item.id === existingSignup.id ? signupUpdate : item))
          : [signupUpdate, ...updates];

        const sortedNextUpdates = [...nextUpdates].sort(
          (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
        );
        const avg = calculateAverage(sortedNextUpdates);
        const updatedSubject: StudentSubject = {
          ...subjectData,
          current_grade: avg,
          updated_at: new Date().toISOString(),
        };

        setMathSubject(updatedSubject);
        setUpdates(sortedNextUpdates);
        persistLocalData(updatedSubject, sortedNextUpdates);
      } else {
        const { data: signupRows, error: signupFetchError } = await supabase
          .from('student_grade_updates')
          .select('id')
          .eq('student_id', user.id)
          .eq('subject', MATH_SUBJECT)
          .eq('source', 'signup')
          .order('recorded_at', { ascending: true })
          .limit(1);

        if (signupFetchError) throw signupFetchError;

        const existingSignupId = signupRows?.[0]?.id;
        if (existingSignupId) {
          const { error: updateSignupError } = await supabase
            .from('student_grade_updates')
            .update({ grade: parsedGrade, topic: 'Classificação inicial' })
            .eq('id', existingSignupId)
            .eq('student_id', user.id);

          if (updateSignupError) throw updateSignupError;
        } else {
          const { error: insertSignupError } = await supabase
            .from('student_grade_updates')
            .insert({
              student_subject_id: subjectData.id,
              student_id: user.id,
              subject: MATH_SUBJECT,
              topic: 'Classificação inicial',
              grade: parsedGrade,
              source: 'signup',
              recorded_at: signupRecordedAt,
            });

          if (insertSignupError) throw insertSignupError;
        }

        const { data: freshUpdates, error: freshUpdatesError } = await supabase
          .from('student_grade_updates')
          .select('*')
          .eq('student_id', user.id)
          .eq('subject', MATH_SUBJECT)
          .order('recorded_at', { ascending: true });

        if (freshUpdatesError) throw freshUpdatesError;

        const nextUpdates = (freshUpdates as StudentGradeUpdate[] | null) || [];
        const avg = calculateAverage(nextUpdates);

        const { error: updateSubjectError } = await supabase
          .from('student_subjects')
          .update({ current_grade: avg })
          .eq('id', subjectData.id)
          .eq('student_id', user.id);

        if (updateSubjectError) throw updateSubjectError;

        setMathSubject({
          ...subjectData,
          current_grade: avg,
          updated_at: new Date().toISOString(),
        });
        setUpdates(nextUpdates);
      }

      setShowInitialGradeModal(false);
      setSuccess('Classificação inicial guardada com sucesso.');
    } catch (err: unknown) {
      setError(getReadableError(err, 'Não foi possível guardar a classificação inicial.'));
    } finally {
      setSavingInitialGrade(false);
    }
  };

  const addInstrument = async () => {
    setSavingInstrument(true);
    setError('');
    setSuccess('');

    try {
      if (!user?.id) {
        throw new Error('Sessão inválida. Inicia sessão novamente.');
      }

      const trimmedName = instrumentName.trim();
      if (!trimmedName) {
        throw new Error('Indica o instrumento de avaliação.');
      }

      if (needsInitialGradeCta) {
        setShowInitialGradeModal(true);
        throw new Error('Define primeiro a classificação inicial de Matemática.');
      }

      const parsedGrade = parseGrade(instrumentGrade);
      if (Number.isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > 20) {
        throw new Error('A classificação do instrumento deve estar entre 0 e 20.');
      }

      if (!instrumentDate) {
        throw new Error('Seleciona a data do instrumento de avaliação.');
      }

      const recordedAt = dateInputToIso(instrumentDate);
      const currentSubject = await ensureMathSubject(parsedGrade);

      if (schemaUnavailable) {
        const insertedUpdate: StudentGradeUpdate = {
          id: createLocalId(),
          student_subject_id: currentSubject.id,
          student_id: user.id,
          subject: MATH_SUBJECT,
          topic: trimmedName,
          grade: parsedGrade,
          source: 'manual_update',
          recorded_at: recordedAt,
        };

        const nextUpdates = [...updates, insertedUpdate].sort(
          (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
        );
        const avg = calculateAverage(nextUpdates);
        const updatedSubject: StudentSubject = {
          ...currentSubject,
          current_grade: avg,
          updated_at: new Date().toISOString(),
        };

        setMathSubject(updatedSubject);
        setUpdates(nextUpdates);
        persistLocalData(updatedSubject, nextUpdates);
      } else {
        const { data: insertedUpdate, error: insertUpdateError } = await supabase
          .from('student_grade_updates')
          .insert({
            student_subject_id: currentSubject.id,
            student_id: user.id,
            subject: MATH_SUBJECT,
            topic: trimmedName,
            grade: parsedGrade,
            source: 'manual_update',
            recorded_at: recordedAt,
          })
          .select('*')
          .single();

        if (insertUpdateError) throw insertUpdateError;

        const nextUpdates = [...updates, insertedUpdate as StudentGradeUpdate].sort(
          (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
        );
        const avg = calculateAverage(nextUpdates);

        const { error: updateSubjectError } = await supabase
          .from('student_subjects')
          .update({ current_grade: avg })
          .eq('id', currentSubject.id)
          .eq('student_id', user.id);

        if (updateSubjectError) throw updateSubjectError;

        setMathSubject((prev) =>
          prev
            ? {
                ...prev,
                current_grade: avg,
                updated_at: new Date().toISOString(),
              }
            : prev,
        );
        setUpdates(nextUpdates);
      }

      setInstrumentName('');
      setInstrumentGrade('');
      setInstrumentDate(getTodayDateInput());
      setSuccess('Instrumento de avaliação adicionado com sucesso.');
    } catch (err: unknown) {
      setError(getReadableError(err, 'Não foi possível adicionar o instrumento.'));
    } finally {
      setSavingInstrument(false);
    }
  };

  const removeInstrument = async (updateItem: StudentGradeUpdate) => {
    if (updateItem.source !== 'manual_update') {
      setError('A classificação inicial não pode ser removida.');
      return;
    }

    const confirmMessage = `Queres remover o instrumento "${updateItem.topic || 'Sem título'}" (${Number(updateItem.grade).toFixed(1)})?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setRemovingUpdateId(updateItem.id);
    setError('');
    setSuccess('');

    try {
      if (!user?.id) {
        throw new Error('Sessão inválida. Inicia sessão novamente.');
      }

      const remainingUpdates = updates.filter((item) => item.id !== updateItem.id);
      const nextAverage = calculateAverage(remainingUpdates);

      if (schemaUnavailable) {
        const updatedSubject = mathSubject
          ? {
              ...mathSubject,
              current_grade: nextAverage,
              updated_at: new Date().toISOString(),
            }
          : null;

        setMathSubject(updatedSubject);
        setUpdates(remainingUpdates);
        persistLocalData(updatedSubject, remainingUpdates);
      } else {
        const { error: deleteError } = await supabase
          .from('student_grade_updates')
          .delete()
          .eq('id', updateItem.id)
          .eq('student_id', user.id);

        if (deleteError) throw deleteError;

        if (mathSubject) {
          const { error: updateSubjectError } = await supabase
            .from('student_subjects')
            .update({ current_grade: nextAverage })
            .eq('id', mathSubject.id)
            .eq('student_id', user.id);

          if (updateSubjectError) throw updateSubjectError;
        }

        setMathSubject((prev) =>
          prev
            ? {
                ...prev,
                current_grade: nextAverage,
                updated_at: new Date().toISOString(),
              }
            : prev,
        );
        setUpdates(remainingUpdates);
      }

      setSuccess('Instrumento removido com sucesso.');
    } catch (err: unknown) {
      setError(getReadableError(err, 'Não foi possível remover o instrumento.'));
    } finally {
      setRemovingUpdateId(null);
    }
  };

  const buildPlanPayload = (): PlanPayload => {
    const mainDifficulties = planForm.mainDifficulties.trim();
    const currentActions = planForm.currentActions.trim();
    const goals = planForm.goals.trim();
    const rawStudyTimeValue = Number(String(planForm.studyHours).replace(',', '.'));
    const studyTimeUnit = planForm.studyUnit;

    if (!mainDifficulties || !currentActions || !goals) {
      throw new Error('Preenche os 3 primeiros campos do plano para continuar.');
    }

    if (Number.isNaN(rawStudyTimeValue) || rawStudyTimeValue <= 0) {
      throw new Error('Indica o tempo de estudo em horas.');
    }

    const studyTimeValue = Math.max(1, Math.round(rawStudyTimeValue));

    return {
      mainDifficulties,
      currentActions,
      goals,
      studyTimeValue,
      studyTimeUnit,
    };
  };

  const savePlanInputs = async (payload: PlanPayload) => {
    if (!user?.id) {
      throw new Error('Sessão inválida. Inicia sessão novamente.');
    }

    const normalizedForm: PlanForm = {
      mainDifficulties: payload.mainDifficulties,
      currentActions: payload.currentActions,
      goals: payload.goals,
      studyHours: String(payload.studyTimeValue),
      studyUnit: payload.studyTimeUnit,
    };
    setPlanForm(normalizedForm);

    if (schemaUnavailable) {
      persistLocalData(mathSubject, updates, plan, normalizedForm);
      return;
    }

    const { error: saveInputsError } = await supabase.from('student_plan_inputs').insert({
      student_id: user.id,
      main_difficulties: payload.mainDifficulties,
      improvement_focus: payload.currentActions,
      biggest_difficulties: payload.goals,
      suggestions: payload.currentActions,
      classification_causes: payload.goals,
      study_time_value: payload.studyTimeValue,
      study_time_unit: payload.studyTimeUnit,
      use_current_grades: true,
    });

    if (saveInputsError) throw saveInputsError;
  };

  const handlePlanTestImagesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    const availableSlots = MAX_PLAN_TEST_IMAGES - planTestImages.length;
    if (availableSlots <= 0) {
      setError(`Já atingiste o limite de ${MAX_PLAN_TEST_IMAGES} imagens.`);
      return;
    }

    const acceptedFiles = files.slice(0, availableSlots);
    const rejectedByType = acceptedFiles.filter(
      (file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    );
    if (rejectedByType.length > 0) {
      setError('Usa apenas imagens JPG, PNG ou WEBP.');
      return;
    }

    setProcessingTestImages(true);
    setError('');

    try {
      const compressed = await Promise.all(
        acceptedFiles.map(async (file) => {
          const normalized = await compressImageFileToBase64(file);
          if (!normalized.base64Data || normalized.base64Data.length > MAX_PLAN_IMAGE_BASE64_LENGTH) {
            throw new Error(
              `A imagem "${file.name}" ficou demasiado grande. Tenta uma foto mais focada ou com menos resolução.`,
            );
          }

          return {
            id: createLocalId(),
            fileName: file.name,
            mimeType: normalized.mimeType,
            base64Data: normalized.base64Data,
          } satisfies PlanTestImage;
        }),
      );

      setPlanTestImages((prev) => [...prev, ...compressed].slice(0, MAX_PLAN_TEST_IMAGES));
      if (files.length > acceptedFiles.length) {
        setSuccess(`Foram adicionadas ${acceptedFiles.length} imagens. Limite: ${MAX_PLAN_TEST_IMAGES}.`);
      }
    } catch (err: unknown) {
      setError(getReadableError(err, 'Não foi possível processar as imagens dos testes.'));
    } finally {
      setProcessingTestImages(false);
    }
  };

  const removePlanTestImage = (imageId: string) => {
    setPlanTestImages((prev) => prev.filter((item) => item.id !== imageId));
  };

  const handleSavePlanInputs = async () => {
    setSavingPlanInputs(true);
    setError('');
    setSuccess('');

    try {
      const payload = buildPlanPayload();
      await savePlanInputs(payload);
      setSuccess('Respostas do plano guardadas com sucesso.');
      setShowPlanModal(false);
    } catch (err: unknown) {
      setError(getReadableError(err, 'Não foi possível guardar as respostas do plano.'));
    } finally {
      setSavingPlanInputs(false);
    }
  };

  const exportPlanToPdf = async (planText: string) => {
    setExportingPdf(true);

    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 52;
      const marginY = 58;
      const maxWidth = pageWidth - marginX * 2;
      let y = marginY;

      doc.setFillColor(13, 47, 74);
      doc.roundedRect(marginX - 8, y - 28, maxWidth + 16, 40, 10, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(19);
      doc.text('Plano personalizado de Matemática', marginX, y + 2);
      doc.setTextColor(30, 30, 30);
      y += 30;

      const cleanText = formatPlanText(planText);
      const rows = cleanText.split('\n');

      const ensureSpace = (requiredHeight: number) => {
        if (y + requiredHeight > pageHeight - marginY) {
          doc.addPage();
          y = marginY;
        }
      };

      for (const row of rows) {
        const line = row.trim();

        if (!line) {
          y += 8;
          continue;
        }

        if (isPlanHeading(line)) {
          doc.setDrawColor(52, 152, 219);
          doc.setLineWidth(0.8);
          ensureSpace(28);
          doc.line(marginX, y - 10, marginX + maxWidth, y - 10);
          doc.setTextColor(26, 82, 118);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14.5);
          const wrapped = doc.splitTextToSize(line, maxWidth) as string[];
          ensureSpace(wrapped.length * 19 + 5);
          for (const chunk of wrapped) {
            doc.text(chunk, marginX, y);
            y += 19;
          }
          doc.setTextColor(30, 30, 30);
          y += 4;
          continue;
        }

        if (isPlanSubtitle(line)) {
          doc.setTextColor(20, 64, 96);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          const wrapped = doc.splitTextToSize(line, maxWidth) as string[];
          ensureSpace(wrapped.length * 16 + 2);
          for (const chunk of wrapped) {
            doc.text(chunk, marginX, y);
            y += 16;
          }
          doc.setTextColor(30, 30, 30);
          y += 1;
          continue;
        }

        if (line.startsWith('• ')) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10.5);
          const bulletText = line.slice(2).trim();
          const wrapped = doc.splitTextToSize(bulletText, maxWidth - 16) as string[];
          ensureSpace(wrapped.length * 14 + 2);
          wrapped.forEach((chunk, index) => {
            if (index === 0) {
              doc.setTextColor(52, 152, 219);
              doc.text('•', marginX, y);
              doc.setTextColor(30, 30, 30);
            }
            doc.setFont('helvetica', index === 0 ? 'bold' : 'normal');
            doc.text(chunk, marginX + 12, y);
            y += 14;
          });
          y += 2;
          continue;
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        const wrapped = doc.splitTextToSize(line, maxWidth) as string[];
        ensureSpace(wrapped.length * 14 + 1);
        for (const chunk of wrapped) {
          doc.text(chunk, marginX, y);
          y += 14;
        }
        y += 1;
      }

      doc.save(`plano-personalizado-matematica-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  };

  const generatePlan = async () => {
    setGeneratingPlan(true);
    setError('');
    setSuccess('');

    try {
      if (!hasCompletedBooking) {
        throw new Error('O plano só fica disponível após a tua primeira explicação concluída.');
      }

      if (!mathSubject) {
        throw new Error('A classificação de Matemática ainda não está disponível.');
      }

      if (needsInitialGradeCta) {
        setShowInitialGradeModal(true);
        throw new Error('Define primeiro a tua classificação inicial de Matemática.');
      }

      const payload = buildPlanPayload();
      await savePlanInputs(payload);
      const planImagesForApi = getPlanImagesForApi(planTestImages);

      const normalizedPlanSubject: StudentSubject = {
        ...mathSubject,
        subject: MATH_SUBJECT,
        topic: mathSubject.topic || 'Matemática',
      };
      const normalizedPlanUpdates = sortedUpdates.map((item) => ({
        ...item,
        subject: MATH_SUBJECT,
      }));

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error('Sessão inválida. Inicia sessão novamente para criar o plano.');
      }

      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          subjects: [normalizedPlanSubject],
          updates: normalizedPlanUpdates,
          questionnaire: payload,
          testImages: planImagesForApi,
        }),
      });

      const apiPayload = await response.json();
      if (!response.ok) {
        throw new Error(apiPayload.error || 'Não foi possível criar o plano.');
      }

      let finalPlan: StudentPlan;

      if (schemaUnavailable) {
        const nowIso = new Date().toISOString();
        finalPlan = {
          id: plan?.id || createLocalId(),
          student_id: user.id,
          plan_text: apiPayload.plan,
          ai_model: apiPayload.model || 'claude-sonnet-4-6',
          context_json: {
            subjects: [normalizedPlanSubject],
            questionnaire: payload,
          },
          created_at: plan?.created_at || nowIso,
          updated_at: nowIso,
        };
        persistLocalData(mathSubject, updates, finalPlan, {
          mainDifficulties: payload.mainDifficulties,
          currentActions: payload.currentActions,
          goals: payload.goals,
          studyHours: String(payload.studyTimeValue),
          studyUnit: payload.studyTimeUnit,
        });
      } else {
        const { data: savedPlan, error: savePlanError } = await supabase
          .from('student_plans')
          .upsert(
            {
              student_id: user.id,
              plan_text: apiPayload.plan,
              ai_model: apiPayload.model || 'claude-sonnet-4-6',
              context_json: {
                subjects: [normalizedPlanSubject],
                questionnaire: payload,
              },
            },
            { onConflict: 'student_id' },
          )
          .select('*')
          .single();

        if (savePlanError) throw savePlanError;
        finalPlan = savedPlan as StudentPlan;
      }

      setPlan(finalPlan);
      setShowPlanModal(false);
      setPlanTestImages([]);
      await exportPlanToPdf(finalPlan.plan_text);
      setSuccess('Plano personalizado criado com sucesso e exportado em PDF.');
    } catch (err: unknown) {
      setError(getReadableError(err, 'Não foi possível criar o plano.'));
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="animate-spin w-8 h-8 border-4 border-[#000000] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-[#f5f5f5]">
        <div className="relative bg-white border-b border-black/15 py-12 px-4 overflow-hidden">
          <MathRain />
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#000000] mb-2">Notas</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Acompanha a tua classificação de Matemática, regista instrumentos de avaliação e prepara o teu plano personalizado.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10">
          {(error || success) && (
            <div className="mb-6 space-y-3">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                  {success}
                </div>
              )}
            </div>
          )}

          {needsInitialGradeCta && (
            <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex flex-wrap items-center justify-between gap-3">
              <span>
                Define a tua classificação inicial de Matemática para iniciar corretamente o teu progresso e o plano personalizado.
              </span>
              <button
                onClick={() => setShowInitialGradeModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
              >
                Definir classificação
              </button>
            </div>
          )}

          <div className="space-y-6">
            <section className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#000000]">Classificação de Matemática</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Média global calculada a partir da classificação inicial e dos instrumentos registados.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-[#000000] leading-none">
                    {Number.isFinite(averageGrade) ? averageGrade.toFixed(1) : '0.0'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">/20</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 mt-6">
                <div className="rounded-xl bg-[#fafafa] border border-[#000000]/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Classificação inicial</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-lg font-bold text-[#000000]">
                      {initialClassification !== null ? initialClassification.toFixed(1) : '--'}
                    </p>
                    <button
                      onClick={() => setShowInitialGradeModal(true)}
                      className="px-2.5 py-1 rounded-md border border-[#000000]/30 text-[#111111] text-xs font-semibold hover:bg-[#000000]/10 transition-colors"
                    >
                      Editar
                    </button>
                  </div>
                </div>
                <div className="rounded-xl bg-[#fafafa] border border-[#000000]/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Instrumentos realizados</p>
                  <p className="text-lg font-bold text-[#000000]">{manualUpdates.length}</p>
                </div>
                <div className="rounded-xl bg-[#fafafa] border border-[#000000]/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Última atualização</p>
                  <p className="text-lg font-bold text-[#000000]">
                    {latestUpdateDate
                      ? new Date(latestUpdateDate).toLocaleDateString('pt-PT')
                      : '--'}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                  Instrumentos registados
                </p>
                {manualUpdates.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Ainda sem instrumentos registados.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {manualUpdates
                      .slice()
                      .reverse()
                      .slice(0, 4)
                      .map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#000000]/10 text-[#111111] text-xs font-semibold"
                        >
                          {item.topic || 'Instrumento'}
                          <span className="text-[#000000]">{Number(item.grade).toFixed(1)}</span>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </section>

            <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6">
              <div className="space-y-6">
                <section className="bg-white rounded-2xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-[#000000] mb-2">
                    Evolução da classificação de Matemática
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Gráfico da evolução da média com base nas classificações registadas.
                  </p>

                  {evolutionSeries.length === 0 ? (
                    <div className="text-sm text-gray-500 bg-[#fafafa] border border-gray-100 rounded-lg p-4 text-center">
                      Ainda não existem classificações suficientes para mostrar evolução.
                    </div>
                  ) : (
                    <div className="w-full h-52 bg-[#fafafa] border border-[#000000]/15 rounded-lg p-3">
                      <svg viewBox="0 0 120 100" className="w-full h-full">
                        {chartScale.ticks.map((tick, index) => {
                          const y = mapGradeToY(tick, chartScale);
                          return (
                            <g key={`tick-${index}`}>
                              <line
                                x1={CHART_LEFT}
                                y1={y}
                                x2={CHART_RIGHT}
                                y2={y}
                                stroke={index === 0 || index === chartScale.ticks.length - 1 ? '#c7d8ea' : '#e6edf7'}
                                strokeWidth={index === 0 || index === chartScale.ticks.length - 1 ? 1.1 : 0.8}
                              />
                              <text
                                x={2}
                                y={y + 1.8}
                                fontSize="4.2"
                                fill="#6b7d95"
                                fontWeight="600"
                              >
                                {formatAxisLabel(tick)}
                              </text>
                            </g>
                          );
                        })}
                        <line x1={CHART_LEFT} y1={CHART_TOP} x2={CHART_LEFT} y2={CHART_BOTTOM} stroke="#b7cade" strokeWidth="1" />
                        <line x1={CHART_LEFT} y1={CHART_BOTTOM} x2={CHART_RIGHT} y2={CHART_BOTTOM} stroke="#b7cade" strokeWidth="1" />
                        {chartPoints && (
                          <>
                            <path d={chartAreaPath} fill="rgba(52, 152, 219, 0.18)" />
                            <polyline
                              fill="none"
                              stroke="#1f83c5"
                              strokeWidth="2.8"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                              points={chartPoints}
                            />
                            {evolutionSeries.map((item, index) => {
                              const x =
                                evolutionSeries.length === 1
                                  ? (CHART_LEFT + CHART_RIGHT) / 2
                                  : CHART_LEFT + (index / (evolutionSeries.length - 1)) * (CHART_RIGHT - CHART_LEFT);
                              const y = mapGradeToY(Number(item.grade), chartScale);
                              return (
                                <circle
                                  key={item.id}
                                  cx={x}
                                  cy={y}
                                  r="2.5"
                                  fill="#145d8d"
                                  stroke="#ffffff"
                                  strokeWidth="0.8"
                                />
                              );
                            })}
                          </>
                        )}
                      </svg>
                    </div>
                  )}
                </section>

                <section className="bg-white rounded-2xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-[#000000] mb-2">Instrumentos de avaliação</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Adiciona classificações de novos instrumentos para atualizar a média global.
                  </p>

                  <div className="grid sm:grid-cols-12 gap-3 p-4 rounded-xl bg-[#fafafa] border border-gray-100">
                    <div className="sm:col-span-5">
                      <label className="block text-xs text-gray-500 mb-1">Instrumento</label>
                      <input
                        value={instrumentName}
                        onChange={(e) => setInstrumentName(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none"
                        placeholder="Ex: Teste 1, Mini-ficha, Oral..."
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Classificação</label>
                      <input
                        value={instrumentGrade}
                        onChange={(e) => setInstrumentGrade(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none"
                        placeholder="0-20"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">Data</label>
                      <input
                        type="date"
                        value={instrumentDate}
                        onChange={(e) => setInstrumentDate(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-end">
                      <button
                        onClick={addInstrument}
                        disabled={savingInstrument}
                        className="w-full py-2.5 bg-[#000000] text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all disabled:opacity-60"
                      >
                        {savingInstrument ? 'A guardar...' : 'Adicionar'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
                    {manualUpdates.length === 0 ? (
                      <div className="text-sm text-gray-500 bg-[#fafafa] border border-gray-100 rounded-lg p-4 text-center">
                        Ainda não registaste instrumentos de avaliação.
                      </div>
                    ) : (
                      manualUpdates
                        .slice()
                        .reverse()
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 text-sm border border-gray-100 rounded-lg px-3 py-2.5 bg-white"
                          >
                            <div>
                              <p className="font-semibold text-[#000000]">
                                {item.topic || 'Instrumento'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(item.recorded_at).toLocaleDateString('pt-PT')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[#000000] font-bold">
                                {Number(item.grade).toFixed(1)}
                              </span>
                              <button
                                onClick={() => removeInstrument(item)}
                                disabled={removingUpdateId === item.id}
                                className="px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors text-xs"
                              >
                                {removingUpdateId === item.id ? '...' : 'Remover'}
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </section>
              </div>

              <section className="bg-white rounded-2xl shadow-md p-6 h-fit">
                <h3 className="text-lg font-bold text-[#000000] mb-1">Plano personalizado</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Responde às perguntas com detalhe para criar um plano orientado aos teus objetivos.
                </p>

                {!hasCompletedBooking && (
                  <div className="mb-4 bg-[#f5f5f5] border border-gray-100 rounded-xl p-4">
                    <p className="text-sm text-gray-600">
                      Podes preencher e guardar já as respostas do plano. O acesso ao plano criado fica disponível após a tua primeira explicação concluída.
                    </p>
                  </div>
                )}

                {hasCompletedBooking && plan ? (
                  <>
                    <p className="text-xs text-gray-400 mb-3">
                      Atualizado em {new Date(plan.updated_at).toLocaleDateString('pt-PT')}
                    </p>
                    <div className="rounded-xl border border-[#000000]/15 bg-gradient-to-br from-[#fafafa] to-[#f3f3f3] p-4 mb-3">
                      <p className="text-sm text-gray-700">
                        O teu plano está pronto. O conteúdo completo está disponível em PDF.
                      </p>
                    </div>
                    <button
                      onClick={() => exportPlanToPdf(formattedPlanText || plan.plan_text)}
                      disabled={exportingPdf}
                      className="mt-3 inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl border border-[#000000]/25 text-[#111111] font-semibold text-sm hover:bg-[#000000]/10 transition-colors disabled:opacity-60"
                    >
                      {exportingPdf ? 'A exportar PDF...' : 'Descarregar plano em PDF'}
                    </button>
                  </>
                ) : hasCompletedBooking ? (
                  <div className="bg-[#fafafa] border border-gray-100 rounded-xl p-4 mb-4 text-sm text-gray-600">
                    Já tens o plano desbloqueado. Completa o questionário e cria o plano.
                  </div>
                ) : null}

                <div className="space-y-3 mt-4">
                  <button
                    onClick={() => setShowPlanModal(true)}
                    className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-[#000000] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
                  >
                    {hasCompletedBooking
                      ? plan
                        ? 'Atualizar plano criado'
                        : 'Criar plano personalizado'
                      : 'Preencher respostas do plano'}
                  </button>

                  {!hasCompletedBooking && (
                    <Link
                      href="/marcar"
                      className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl border border-[#000000]/25 text-[#111111] font-semibold text-sm hover:bg-[#000000]/10 transition-colors"
                    >
                      Marcar primeira explicação
                    </Link>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {showPlanModal && (
        <div className="fixed inset-0 z-[80] bg-black/55 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-fade-in-up">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#000000]">Plano personalizado</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Responde às perguntas detalhadamente para criar um plano orientado aos teus objetivos.
                </p>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                className="w-9 h-9 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Principais dificuldades
                </label>
                <textarea
                  rows={4}
                  value={planForm.mainDifficulties}
                  onChange={(e) =>
                    setPlanForm((prev) => ({ ...prev, mainDifficulties: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none text-sm bg-[#f5f5f5]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  O que já estou a fazer para melhorar
                </label>
                <textarea
                  rows={4}
                  value={planForm.currentActions}
                  onChange={(e) =>
                    setPlanForm((prev) => ({ ...prev, currentActions: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none text-sm bg-[#f5f5f5]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Objetivos
                </label>
                <textarea
                  rows={4}
                  value={planForm.goals}
                  onChange={(e) =>
                    setPlanForm((prev) => ({ ...prev, goals: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none text-sm bg-[#f5f5f5]"
                  placeholder="Ex: subir para 15 valores até ao final do período"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Últimos testes (até 20 imagens)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handlePlanTestImagesSelected}
                  disabled={processingTestImages || planTestImages.length >= MAX_PLAN_TEST_IMAGES}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-[#eaf3fb] file:text-[#111111] file:font-semibold hover:file:bg-[#dcecf9] file:cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Envia fotos dos teus testes e da tua resolução, incluindo os erros assinalados e a correção do professor.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {planTestImages.length}/{MAX_PLAN_TEST_IMAGES} imagens adicionadas
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Assim conseguimos identificar padrões de erro e ajustar melhor o teu plano.
                </p>

                {planTestImages.length > 0 && (
                  <div className="mt-3 grid sm:grid-cols-2 gap-2">
                    {planTestImages.map((image) => (
                      <div
                        key={image.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
                      >
                        <p className="text-xs text-gray-600 truncate">{image.fileName}</p>
                        <button
                          type="button"
                          onClick={() => removePlanTestImage(image.id)}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {processingTestImages && (
                  <p className="text-xs text-[#111111] mt-2">A processar imagens...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tempo disponível (horas)
                </label>
                <input
                  value={planForm.studyHours}
                  onChange={(e) =>
                    setPlanForm((prev) => ({ ...prev, studyHours: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none text-sm bg-[#f5f5f5]"
                  placeholder="Ex: 2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Unidade de tempo
                </label>
                <select
                  value={planForm.studyUnit}
                  onChange={(e) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      studyUnit: e.target.value as PlanForm['studyUnit'],
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none text-sm bg-[#f5f5f5]"
                >
                  <option value="day">Por dia</option>
                  <option value="week">Por semana</option>
                </select>
              </div>
            </div>

            {!hasCompletedBooking && (
              <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                As respostas podem ser guardadas agora. O plano só pode ser gerado após a primeira explicação concluída.
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-end mt-7">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePlanInputs}
                disabled={savingPlanInputs}
                className="px-4 py-2.5 rounded-xl border border-[#000000]/25 text-[#111111] text-sm font-semibold hover:bg-[#000000]/10 transition-colors disabled:opacity-60"
              >
                {savingPlanInputs ? 'A guardar...' : 'Guardar respostas'}
              </button>
              {hasCompletedBooking && (
                <button
                  onClick={generatePlan}
                  disabled={generatingPlan || exportingPdf || processingTestImages}
                  className="px-4 py-2.5 rounded-xl bg-[#000000] text-white text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60"
                >
                  {generatingPlan ? 'A criar plano...' : 'Criar plano'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showInitialGradeModal && (
        <div className="fixed inset-0 z-[90] bg-black/55 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-fade-in-up mt-12">
            <h2 className="text-2xl font-bold text-[#000000] mb-2">Classificação inicial de Matemática</h2>
            <p className="text-sm text-gray-500 mb-5">
              Podes atualizar esta classificação sempre que precisares de corrigir o ponto de partida.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Classificação inicial (0-20)
              </label>
              <input
                value={initialGradeInput}
                onChange={(e) => setInitialGradeInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000000] focus:border-transparent outline-none text-sm bg-[#f5f5f5]"
                placeholder="Ex: 12"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end mt-7">
              <button
                onClick={() => setShowInitialGradeModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={handleSaveInitialGrade}
                disabled={savingInitialGrade}
                className="px-4 py-2.5 rounded-xl bg-[#000000] text-white text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60"
              >
                {savingInitialGrade ? 'A guardar...' : 'Guardar classificação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
