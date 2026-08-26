import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { parseSurveyToken } from '@/lib/email-audiences';
import { getAllowedSubjects, SCHOOL_YEARS } from '@/lib/secondary-subjects';

export const dynamic = 'force-dynamic';

type SubmitBody = {
  token?: string;
  subjects?: unknown;
  schoolYear?: string;
  otherSubject?: string;
};

/** Quem é a pessoa do token e o que já sabemos dela. */
async function loadLead(email: string) {
  const supabase = getServiceSupabase();

  const { data: lead } = await supabase
    .from('exam_correction_waitlist')
    .select('full_name, course')
    .ilike('email', email)
    .maybeSingle();

  const { data: answer } = await supabase
    .from('waitlist_subject_interest')
    .select('subjects, school_year, other_subject')
    .ilike('email', email)
    .maybeSingle();

  return { lead, answer };
}

export async function GET(req: NextRequest) {
  const token = (new URL(req.url).searchParams.get('t') || '').trim();
  const email = token ? parseSurveyToken(token) : null;

  if (!email) {
    return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 400 });
  }

  const { lead, answer } = await loadLead(email);

  return NextResponse.json({
    email,
    fullName: lead?.full_name || null,
    course: lead?.course || null,
    answer: answer
      ? {
          subjects: answer.subjects || [],
          schoolYear: answer.school_year || '',
          otherSubject: answer.other_subject || '',
        }
      : null,
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as SubmitBody;
  const token = String(body.token || '').trim();
  const email = token ? parseSurveyToken(token) : null;

  if (!email) {
    return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 400 });
  }

  const { lead } = await loadLead(email);
  const course = lead?.course || null;

  const allowed = getAllowedSubjects(course);
  const subjects = Array.isArray(body.subjects)
    ? Array.from(
        new Set(
          body.subjects
            .map((item) => String(item || '').trim())
            .filter((item) => allowed.has(item)),
        ),
      )
    : [];

  const schoolYear = SCHOOL_YEARS.includes(String(body.schoolYear || '').trim())
    ? String(body.schoolYear).trim()
    : null;

  const otherSubject = String(body.otherSubject || '').trim().slice(0, 200) || null;

  if (subjects.length === 0 && !otherSubject) {
    return NextResponse.json({ error: 'Escolhe pelo menos uma disciplina.' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('waitlist_subject_interest').upsert(
    {
      email,
      full_name: lead?.full_name || null,
      course,
      school_year: schoolYear,
      subjects,
      other_subject: otherSubject,
      source: 'exam-waitlist',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' },
  );

  if (error) {
    return NextResponse.json({ error: 'Não foi possível guardar a resposta.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
