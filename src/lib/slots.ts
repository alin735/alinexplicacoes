import type { AvailableSlot } from '@/lib/types';

const LESSONS_TIME_ZONE = 'Europe/Lisbon';
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

function normalizeTimeParts(timeValue: string): [number, number, number] {
  const [hoursRaw = '0', minutesRaw = '0', secondsRaw = '0'] = timeValue.split(':');
  return [Number(hoursRaw), Number(minutesRaw), Number(secondsRaw)];
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  const zonedUtcTime = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return zonedUtcTime - date.getTime();
}

export function parseDateInputValue(dateValue: string): Date {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateInputValue(now = new Date()): string {
  return formatDateInputValue(now);
}

export function getSlotStartDateTime(dateValue: string, startTime: string): Date {
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes, seconds] = normalizeTimeParts(startTime);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  const offset = getTimeZoneOffsetMs(utcGuess, LESSONS_TIME_ZONE);
  return new Date(utcGuess.getTime() - offset);
}

export function isSlotBookable(dateValue: string, startTime: string, now = new Date()): boolean {
  return getSlotStartDateTime(dateValue, startTime).getTime() - now.getTime() > THIRTY_MINUTES_MS;
}

export function filterBookableSlots<T extends Pick<AvailableSlot, 'date' | 'start_time'>>(
  slots: T[],
  now = new Date(),
): T[] {
  return slots.filter((slot) => isSlotBookable(slot.date, slot.start_time, now));
}

export function compareAvailableSlots(
  left: Pick<AvailableSlot, 'date' | 'start_time'>,
  right: Pick<AvailableSlot, 'date' | 'start_time'>,
): number {
  return (
    getSlotStartDateTime(left.date, left.start_time).getTime() -
    getSlotStartDateTime(right.date, right.start_time).getTime()
  );
}
