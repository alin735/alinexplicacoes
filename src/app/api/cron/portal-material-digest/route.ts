import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { getServiceSupabase } from '@/lib/server-bookings';
import { MATERIAL_LABELS, type MaterialKind } from '@/lib/portal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PORTAL_URL = 'https://aluno.matematica.top';

/** Só estes tipos valem um email: o resto é apoio interno da aula. */
const KINDS_A_NOTIFICAR: MaterialKind[] = ['ficha_revisao', 'teste', 'importante', 'powerpoint', 'gravacao'];

function escapeHtml(v: string) {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function template(nome: string, porSeccao: Record<string, string[]>) {
  const blocos = Object.keys(porSeccao)
    .map((seccao) => {
      const titulos = porSeccao[seccao];
      const itens = titulos.map((t) => `<li style="margin-bottom:6px">${escapeHtml(t)}</li>`).join('');
      return `<p style="margin:18px 0 6px;font-weight:700;font-size:15px">${escapeHtml(seccao)}</p>
              <ul style="margin:0;padding-left:20px;color:#333;font-size:14px">${itens}</ul>`;
    })
    .join('');

  return `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Verdana,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:28px 20px">
    <div style="background:#fff;border-radius:14px;padding:28px">
      <h1 style="margin:0 0 6px;font-size:20px">Olá, ${escapeHtml(nome)}</h1>
      <p style="margin:0;color:#666;font-size:14px">Há material novo no teu portal.</p>
      ${blocos}
      <a href="${PORTAL_URL}" style="display:inline-block;margin-top:24px;background:#000;color:#fff;
         text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px">
        Abrir o portal
      </a>
      <p style="margin:22px 0 0;color:#999;font-size:12px">
        Recebes este email porque pediste para ser avisado. Podes cancelar no portal, no teu perfil.
      </p>
    </div>
    <p style="text-align:center;color:#aaa;font-size:11px;margin-top:16px">MatemáticaTop | matematica.top</p>
  </div></body></html>`;
}

/**
 * Digest diário: junta o material publicado desde a última execução e envia
 * um único email a cada aluno inscrito, só com o material do percurso dele.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const service = getServiceSupabase();

  // Desde quando? Última execução, ou as últimas 24 horas se for a primeira.
  const { data: ultima } = await service
    .from('portal_notify_runs')
    .select('ran_at')
    .order('ran_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const desde = (ultima as { ran_at?: string } | null)?.ran_at
    ?? new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const { data: novos } = await service
    .from('portal_lesson_materials')
    .select('id, title, kind, lesson_id, roadmap_id, created_at')
    .gt('created_at', desde)
    .in('kind', KINDS_A_NOTIFICAR);

  const materiais = novos || [];
  if (materiais.length === 0) {
    await service.from('portal_notify_runs').insert({ materials_count: 0, emails_sent: 0, note: 'sem material novo' });
    return NextResponse.json({ ok: true, materiais: 0, emails: 0 });
  }

  // Descobrir o percurso de cada material (direto, ou através da aula).
  const lessonIds = materiais.map((m: any) => m.lesson_id).filter(Boolean);
  const { data: lessons } = lessonIds.length
    ? await service.from('portal_lessons').select('id, roadmap_id, is_unlocked').in('id', lessonIds)
    : { data: [] as any[] };
  const lessonById: Record<string, any> = {};
  (lessons || []).forEach((l: any) => {
    lessonById[l.id] = l;
  });

  // Material por percurso. Anexos de aulas ainda bloqueadas não contam.
  // Objeto simples em vez de Map: o alvo do TypeScript é es5 e a iteração de
  // Map não sobrevive à transpilação.
  const porPercurso: Record<string, { kind: string; title: string }[]> = {};
  (materiais as any[]).forEach((m) => {
    let roadmapId: string | null = m.roadmap_id;
    if (m.lesson_id) {
      const l = lessonById[m.lesson_id];
      if (!l || !l.is_unlocked) return;
      roadmapId = l.roadmap_id;
    }
    if (!roadmapId) return;
    if (!porPercurso[roadmapId]) porPercurso[roadmapId] = [];
    porPercurso[roadmapId].push({ kind: m.kind, title: m.title });
  });

  // Filtramos em JS: são poucos alunos e evita depender do encadeamento de
  // filtros do PostgREST.
  const alunosRes = await service
    .from('portal_students')
    .select('id, name, email, roadmap_id, preview_all, notify_email');
  const alunos = (alunosRes.data || []).filter(
    (a: any) => a.notify_email === true && typeof a.email === 'string' && a.email.includes('@'),
  );

  let enviados = 0;
  const falhas: string[] = [];

  for (const aluno of (alunos || []) as any[]) {
    const ids: string[] = aluno.preview_all
      ? Object.keys(porPercurso)
      : [aluno.roadmap_id].filter(Boolean);
    const itens: { kind: string; title: string }[] = [];
    ids.forEach((id) => {
      (porPercurso[id] || []).forEach((it) => itens.push(it));
    });
    if (itens.length === 0) continue;

    const porSeccao: Record<string, string[]> = {};
    itens.forEach((it) => {
      const label = MATERIAL_LABELS[it.kind as MaterialKind] || 'Material';
      if (!porSeccao[label]) porSeccao[label] = [];
      porSeccao[label].push(it.title);
    });

    try {
      const n = itens.length;
      await sendEmail(
        aluno.email,
        n === 1 ? 'Novo material no teu portal' : `${n} materiais novos no teu portal`,
        template(String(aluno.name).split(' ')[0], porSeccao),
      );
      enviados++;
    } catch (err: any) {
      falhas.push(`${aluno.email}: ${err?.message || 'erro'}`);
    }
  }

  await service.from('portal_notify_runs').insert({
    materials_count: materiais.length,
    emails_sent: enviados,
    note: falhas.length ? falhas.join(' | ').slice(0, 500) : null,
  });

  return NextResponse.json({ ok: true, materiais: materiais.length, emails: enviados, falhas });
}
