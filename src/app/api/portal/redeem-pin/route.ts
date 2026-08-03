import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/server-bookings';
import { hashPin, setStudentSession } from '@/lib/portal-session';

export const runtime = 'nodejs';

/**
 * Inscrição: valida o PIN de convite (uso único), cria o aluno com o PIN
 * pessoal que ele escolheu e abre a sessão. Sem email.
 */
export async function POST(req: NextRequest) {
  let body: { code?: string; name?: string; pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const code = (body.code || '').trim();
  const name = (body.name || '').trim();
  const pin = (body.pin || '').trim();

  if (!code || !name || !pin) {
    return NextResponse.json({ error: 'Preenche o PIN de convite, o nome e o PIN pessoal.' }, { status: 400 });
  }
  if (pin.length < 4 || pin.length > 32) {
    return NextResponse.json({ error: 'O PIN pessoal deve ter entre 4 e 32 caracteres.' }, { status: 400 });
  }

  const service = getServiceSupabase();

  // 1) Validar o PIN de convite.
  const { data: invite, error: pinError } = await service
    .from('portal_pins')
    .select('id, used_by')
    .eq('code', code)
    .maybeSingle();

  if (pinError) return NextResponse.json({ error: 'Erro a validar o PIN.' }, { status: 500 });
  if (!invite) return NextResponse.json({ error: 'PIN de convite inválido.' }, { status: 404 });
  if (invite.used_by) {
    return NextResponse.json(
      { error: 'Este PIN de convite já foi utilizado. Se já te inscreveste, usa "Já tenho conta".' },
      { status: 409 },
    );
  }

  // 2) Criar o aluno com o PIN pessoal (hash).
  const { data: student, error: studentError } = await service
    .from('portal_students')
    .insert({ name, pin_hash: hashPin(pin) })
    .select('id')
    .single();

  if (studentError || !student) {
    return NextResponse.json({ error: 'Não foi possível criar o teu perfil.' }, { status: 500 });
  }

  // 3) Queimar o PIN de convite (só se ainda não foi usado: evita corrida).
  const { data: burned, error: burnError } = await service
    .from('portal_pins')
    .update({ used_by: student.id, used_at: new Date().toISOString() })
    .eq('id', invite.id)
    .is('used_by', null)
    .select('id')
    .maybeSingle();

  if (burnError || !burned) {
    // Reverter o aluno criado se o PIN foi usado entretanto.
    await service.from('portal_students').delete().eq('id', student.id);
    return NextResponse.json(
      { error: 'Este PIN de convite acabou de ser utilizado.' },
      { status: 409 },
    );
  }

  // 4) Abrir a sessão (fica guardada no browser).
  setStudentSession(student.id);

  return NextResponse.json({ ok: true });
}
