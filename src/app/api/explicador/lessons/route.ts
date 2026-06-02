import { NextRequest, NextResponse } from 'next/server';
import { requireTutorFromRequest, tutorAuthErrorStatus } from '@/lib/server-tutor-auth';
import { getServiceSupabase } from '@/lib/server-bookings';
import { lessonCreatedEmailTemplate, sendEmail } from '@/lib/email';

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro inesperado.';
  return NextResponse.json({ error: message }, { status: tutorAuthErrorStatus(message) });
}

function extractStoragePath(fileUrl: string): string | null {
  const marker = '/object/public/lesson-files/';
  const idx = fileUrl.indexOf(marker);
  if (idx !== -1) return fileUrl.substring(idx + marker.length);

  const marker2 = '/object/sign/lesson-files/';
  const idx2 = fileUrl.indexOf(marker2);
  if (idx2 !== -1) return fileUrl.substring(idx2 + marker2.length).split('?')[0];

  return null;
}

// Confirma que o aluno já marcou aula com este explicador (evita que o
// explicador crie aulas para alunos que não são dele).
async function tutorHasStudent(
  supabase: ReturnType<typeof getServiceSupabase>,
  tutorId: string,
  studentId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('bookings')
    .select('id')
    .eq('tutor_id', tutorId)
    .eq('student_id', studentId)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

// GET — aulas criadas por este explicador, com anexos (links assinados) e aluno.
export async function GET(req: NextRequest) {
  try {
    const { tutor } = await requireTutorFromRequest(req);
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('lessons')
      .select('*, lesson_attachments(*)')
      .eq('created_by', tutor.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Não foi possível carregar as aulas.' }, { status: 500 });
    }

    const lessons = data || [];

    // Junta o perfil de cada aluno (sem depender de relação embutida no PostgREST).
    const studentIds = Array.from(new Set(lessons.map((l: any) => l.student_id).filter(Boolean)));
    if (studentIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', studentIds);
      const profileById = new Map((profiles || []).map((p: any) => [p.id, p]));
      for (const lesson of lessons) {
        (lesson as any).profiles = profileById.get((lesson as any).student_id) || null;
      }
    }

    // Gera links assinados para cada anexo (bucket privado).
    const signedUrls: Record<string, string> = {};
    for (const lesson of lessons) {
      for (const att of (lesson as any).lesson_attachments || []) {
        const path = extractStoragePath(att.file_url);
        if (!path) continue;
        const { data: signed } = await supabase.storage
          .from('lesson-files')
          .createSignedUrl(path, 60 * 60 * 24);
        if (signed?.signedUrl) signedUrls[att.id] = signed.signedUrl;
      }
    }

    return NextResponse.json({ lessons, signedUrls });
  } catch (error) {
    return handleError(error);
  }
}

// POST — cria uma aula (com ficheiros) para um aluno deste explicador.
export async function POST(req: NextRequest) {
  try {
    const { tutor } = await requireTutorFromRequest(req);
    const supabase = getServiceSupabase();

    const form = await req.formData();
    const studentId = String(form.get('studentId') || '').trim();
    const title = String(form.get('title') || '').trim();
    const subject = String(form.get('subject') || '').trim();
    const date = String(form.get('date') || '').trim();
    const observations = String(form.get('observations') || '').trim();
    const files = form.getAll('files').filter((item): item is File => item instanceof File);

    if (!studentId || !title || !subject || !date) {
      return NextResponse.json({ error: 'Preenche todos os campos obrigatórios.' }, { status: 400 });
    }

    const allowed = await tutorHasStudent(supabase, tutor.id, studentId);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Só podes criar aulas para alunos que já marcaram explicação contigo.' },
        { status: 403 },
      );
    }

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        student_id: studentId,
        title,
        subject,
        date,
        observations,
        created_by: tutor.id,
      })
      .select()
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Não foi possível criar a aula.' }, { status: 500 });
    }

    let uploadedCount = 0;
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${lesson.id}/${Date.now()}_${i}_${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('lesson-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error(`Upload failed for ${file.name}:`, uploadError.message);
        continue;
      }

      const { data: urlData } = supabase.storage.from('lesson-files').getPublicUrl(filePath);
      const { error: attachError } = await supabase.from('lesson_attachments').insert({
        lesson_id: lesson.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
      });

      if (!attachError) uploadedCount += 1;
    }

    // Notifica o aluno por email (não bloqueia a criação se falhar).
    let notificationWarning: string | null = null;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', studentId)
        .single();
      const { data: userData } = await supabase.auth.admin.getUserById(studentId);
      const studentEmail = userData?.user?.email;
      if (studentEmail) {
        const studentName = profile?.full_name || profile?.username || 'Aluno';
        const html = lessonCreatedEmailTemplate(studentName, title, subject, date);
        await sendEmail(studentEmail, `Nova aula — ${subject}: ${title}`, html);
      }
    } catch (notificationError) {
      console.error('Lesson created but notification failed:', notificationError);
      notificationWarning = 'A aula foi criada, mas houve falha no envio de email ao aluno.';
    }

    return NextResponse.json({
      lessonId: lesson.id,
      uploadedCount,
      totalFiles: files.length,
      notificationWarning,
    });
  } catch (error) {
    return handleError(error);
  }
}
