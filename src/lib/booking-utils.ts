export type BookingMode = 'individual' | 'group';

export type BookingMeta = {
  mode: BookingMode;
  groupId: string | null;
  hostId: string;
  size: number;
  participants: string[];
};

const META_PREFIX = '[BOOKING_META';

export function getInviteCodeFromUserId(userId: string): string {
  return `MET-${userId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

export function getPricePerStudentCents(groupSize: number): number {
  if (groupSize <= 1) return 1300;
  if (groupSize === 2) return 1000;
  if (groupSize <= 4) return 800;
  return 500;
}

export function formatEuroFromCents(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')}€`;
}

export function buildBookingMeta(meta: BookingMeta): string {
  const participantsPart = meta.participants.join(',');
  const groupValue = meta.groupId ?? 'none';
  return `${META_PREFIX} mode=${meta.mode} group=${groupValue} host=${meta.hostId} size=${meta.size} participants=${participantsPart}]`;
}

export function parseBookingMeta(observations: string | null | undefined): BookingMeta | null {
  if (!observations) return null;
  const firstLine = observations.split('\n')[0]?.trim();
  if (!firstLine || !firstLine.startsWith(META_PREFIX)) return null;

  const modeMatch = firstLine.match(/\bmode=(individual|group)\b/);
  const groupMatch = firstLine.match(/\bgroup=([^\s\]]+)\b/);
  const hostMatch = firstLine.match(/\bhost=([^\s\]]+)\b/);
  const sizeMatch = firstLine.match(/\bsize=(\d+)\b/);
  const participantsMatch = firstLine.match(/\bparticipants=([^\]]+)\b/);

  if (!modeMatch || !groupMatch || !hostMatch || !sizeMatch || !participantsMatch) {
    return null;
  }

  const participants = participantsMatch[1]
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    mode: modeMatch[1] as BookingMode,
    groupId: groupMatch[1] === 'none' ? null : groupMatch[1],
    hostId: hostMatch[1],
    size: Number(sizeMatch[1]),
    participants,
  };
}

export function stripBookingMeta(observations: string | null | undefined): string {
  if (!observations) return '';
  const lines = observations.split('\n');
  if (lines[0]?.startsWith(META_PREFIX)) {
    return lines.slice(1).join('\n').trim();
  }
  return observations.trim();
}

export function composeBookingObservations(meta: BookingMeta, notes: string): string {
  const cleanNotes = notes.trim();
  if (!cleanNotes) return buildBookingMeta(meta);
  return `${buildBookingMeta(meta)}\n${cleanNotes}`;
}
