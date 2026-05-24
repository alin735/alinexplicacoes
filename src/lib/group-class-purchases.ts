import { getServiceSupabase } from '@/lib/server-bookings';
import {
  GROUP_CLASS_LESSONS,
  type GroupClassPackageId,
} from '@/lib/group-classes';

const TABLE = 'group_class_user_lessons';

export type RecordPurchaseInput = {
  userId: string;
  packageId: GroupClassPackageId;
  lessonIds: number[];
  stripeSessionId: string;
};

export async function recordGroupClassPurchase(input: RecordPurchaseInput) {
  const supabase = getServiceSupabase();
  const rows = input.lessonIds.map((lessonId) => ({
    user_id: input.userId,
    lesson_id: lessonId,
    package_id: input.packageId,
    stripe_session_id: input.stripeSessionId,
  }));

  // Upsert to handle webhook retries idempotently.
  const { error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true });

  if (error) {
    throw new Error(`Erro ao registar aulas compradas: ${error.message}`);
  }
}

export async function getUserPurchasedLessonIds(userId: string): Promise<number[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select('lesson_id')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Erro ao buscar aulas compradas: ${error.message}`);
  }
  return (data || []).map((r: { lesson_id: number }) => r.lesson_id);
}

export async function userHasCompletePackage(userId: string): Promise<boolean> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('package_id', 'completo')
    .limit(1);

  if (error) {
    throw new Error(`Erro ao verificar pacote completo: ${error.message}`);
  }
  return (data || []).length > 0;
}

export function lessonIdsForPackage(
  packageId: GroupClassPackageId,
  selectedLessonIds: number[] | null | undefined,
): number[] {
  if (packageId === 'completo') {
    return GROUP_CLASS_LESSONS.map((l) => l.id);
  }
  const expectedCount = packageId === 'intermedio' ? 7 : 1;
  const ids = (selectedLessonIds || [])
    .map((n) => Number(n))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 15);
  // Deduplicate while preserving order.
  const seen = new Set<number>();
  const unique: number[] = [];
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      unique.push(id);
    }
  }
  if (unique.length !== expectedCount) {
    throw new Error(
      `Número de aulas inválido para o pacote ${packageId}: esperado ${expectedCount}, recebido ${unique.length}.`,
    );
  }
  return unique;
}
