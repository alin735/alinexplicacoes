import { getServiceSupabase } from '@/lib/server-bookings';
import { getStudentSessionId, getAdminSession } from '@/lib/portal-session';

import type { MaterialKind } from '@/lib/portal-sections';
export * from '@/lib/portal-sections';

// ─── Tipos ──────────────────────────────────────────────────────────────────
export type PortalStudent = {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
  last_active_date: string | null;
  streak_count: number;
  roadmap_id: string | null;
  preview_all: boolean;
  notify_email: boolean;
  notify_prompt_at: string | null;
};

export type PortalRoadmap = {
  id: string;
  title: string;
  position: number;
  created_at: string;
};

export type PortalMaterial = {
  id: string;
  lesson_id: string | null;
  roadmap_id: string | null;
  topic_id: string | null;
  kind: MaterialKind;
  title: string;
  storage_path: string | null;
  external_url: string | null;
  position: number;
};

/** Tema (parent_id null) ou subtema (parent_id preenchido) de um percurso. */
export type PortalTopic = {
  id: string;
  roadmap_id: string;
  parent_id: string | null;
  title: string;
  position: number;
};

export type PortalLesson = {
  id: string;
  position: number;
  title: string;
  subtitle: string | null;
  contents: string | null;
  scheduled_at: string | null;
  is_unlocked: boolean;
};

export type LessonStatus = 'concluida' | 'desbloqueada' | 'bloqueada';

/** Estado de uma aula para um dado aluno. */
export function lessonStatus(lesson: PortalLesson, completed: boolean): LessonStatus {
  if (!lesson.is_unlocked) return 'bloqueada';
  return completed ? 'concluida' : 'desbloqueada';
}

/**
 * Converte um link do YouTube/Vimeo no URL de embed (para <iframe>), ou `null`
 * se não for um vídeo reconhecido.
 */
export function videoEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    // YouTube: youtu.be/ID, youtube.com/watch?v=ID, /embed/ID, /shorts/ID
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/^\/(embed|shorts)\/([^/]+)/);
      if (m) return `https://www.youtube.com/embed/${m[2]}`;
    }

    // Vimeo: vimeo.com/ID
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const m = u.pathname.match(/(\d+)/);
      if (m) return `https://player.vimeo.com/video/${m[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

/** Percursos visíveis para o aluno (todos, se for conta de pré-visualização). */
export async function visibleRoadmapIds(student: PortalStudent): Promise<string[]> {
  const service = getServiceSupabase();
  if (student.preview_all) {
    const { data } = await service.from('portal_roadmaps').select('id');
    return (data || []).map((r: any) => r.id);
  }
  return student.roadmap_id ? [student.roadmap_id] : [];
}

// ─── Sessão do aluno (servidor) ─────────────────────────────────────────────
/**
 * Devolve o aluno da sessão (cookie assinado), ou `null`.
 */
export async function getPortalStudent(): Promise<PortalStudent | null> {
  const id = getStudentSessionId();
  if (!id) return null;

  const service = getServiceSupabase();
  const { data } = await service
    .from('portal_students')
    .select('id, name, email, created_at, last_active_date, streak_count, roadmap_id, preview_all, notify_email, notify_prompt_at')
    .eq('id', id)
    .maybeSingle();

  return (data as PortalStudent) ?? null;
}

/** O visitante tem sessão de admin do portal. */
export async function isPortalAdmin(): Promise<boolean> {
  return getAdminSession();
}

/** Para route handlers: `true` se o pedido tem sessão de admin do portal. */
export function requirePortalAdmin(): boolean {
  return getAdminSession();
}

// ─── Notificações por email ─────────────────────────────────────────────────
/** Dias até voltar a mostrar o convite depois de o aluno o dispensar. */
export const NOTIFY_PROMPT_COOLDOWN_DAYS = 7;

/**
 * Mostrar o convite para receber emails? Não, se já está inscrito ou se o
 * dispensou há menos de uma semana.
 */
export function shouldAskNotify(student: PortalStudent): boolean {
  if (student.notify_email) return false;
  if (!student.notify_prompt_at) return true;
  const dias = (Date.now() - new Date(student.notify_prompt_at).getTime()) / 86_400_000;
  return dias >= NOTIFY_PROMPT_COOLDOWN_DAYS;
}

// ─── Streak ─────────────────────────────────────────────────────────────────
/** Data de hoje em Lisboa no formato YYYY-MM-DD. */
export function todayLisbon(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((db - da) / 86_400_000);
}

/**
 * Recalcula a streak dado o último dia ativo e a streak anterior.
 * - mesmo dia → mantém;
 * - dia seguinte → +1;
 * - falha de dias → reinicia a 1.
 */
export function nextStreak(
  lastActiveDate: string | null,
  previousStreak: number,
  today: string,
): number {
  if (!lastActiveDate) return 1;
  const gap = daysBetween(lastActiveDate, today);
  if (gap <= 0) return Math.max(previousStreak, 1);
  if (gap === 1) return previousStreak + 1;
  return 1;
}
