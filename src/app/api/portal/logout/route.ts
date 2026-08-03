import { NextResponse } from 'next/server';
import { clearStudentSession } from '@/lib/portal-session';

export const runtime = 'nodejs';

export async function POST() {
  clearStudentSession();
  return NextResponse.json({ ok: true });
}
