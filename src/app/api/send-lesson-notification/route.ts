import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { lessonCreatedEmailTemplate, sendEmail } from '@/lib/email';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { studentId, title, subject, date } = await req.json();
    if (!studentId || !title || !subject || !date) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', studentId)
      .single();

    const { data: userData } = await supabase.auth.admin.getUserById(studentId);
    const studentEmail = userData?.user?.email;

    if (!studentEmail) {
      return NextResponse.json({ error: 'Student email not found' }, { status: 404 });
    }

    const studentName = profile?.full_name || profile?.username || 'Aluno';
    const html = lessonCreatedEmailTemplate(studentName, title, subject, date);
    await sendEmail(studentEmail, `📝 Nova aula — ${subject}: ${title}`, html);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error sending lesson notification:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
