import { WHATSAPP_NUMBER } from '@/lib/site';
import { displayFirstName } from '@/lib/emails/subjects-survey';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Onde a pessoa deixou o contacto. Dizê-lo no início do email reduz muito as
 * queixas de spam, porque a maioria já não se lembra de se ter inscrito.
 */
const ORIGEM: Record<string, string> = {
  secundario: 'no questionário de escolha de curso',
  'correcao-prova-matematica-9-ano-2026': 'na correção da prova de Matemática do 9.º ano',
  'explicacoes-top': 'na página das Explicações Top',
};

/** Cursos em que o aluno tem mesmo Matemática A. */
const CURSOS_COM_MATEMATICA_A = ['Ciências e Tecnologias', 'Ciências Socioeconómicas'];

function temMatematicaA(course: string | null | undefined) {
  return CURSOS_COM_MATEMATICA_A.includes(String(course || '').trim());
}

export const OFERTA_ASSUNTO = 'Já tenho explicador para ti';

export function ofertaAssunto(fullName: string | null | undefined) {
  const nome = displayFirstName(fullName);
  return nome ? `${nome}, já tenho explicador para ti` : OFERTA_ASSUNTO;
}

function linkWhatsApp(nome: string | null) {
  const texto = nome
    ? `Olá, Alin! Sou o ${nome} e queria saber mais sobre as explicações.`
    : 'Olá, Alin! Queria saber mais sobre as explicações.';
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}

/**
 * Email de oferta à lista de espera das Explicações Top: já há equipa de
 * explicadores, e o argumento é o salto do 9.º para o 10.º ano.
 */
export function ofertaEmailHtml(options: {
  fullName: string | null;
  email: string;
  source: string | null;
  course: string | null;
}) {
  const nome = displayFirstName(options.fullName);
  const saudacao = nome ? `Olá, ${escapeHtml(nome)}!` : 'Olá!';
  const origem = ORIGEM[options.source || ''] || 'no site';
  const url = linkWhatsApp(nome);
  // A Matemática A só se nomeia a quem a vai ter. Nos outros cursos, a frase
  // seria falsa e faria a mensagem parecer um envio em massa.
  const salto = temMatematicaA(options.course)
    ? 'O salto do 9.º para o 10.º é grande, sobretudo a Matemática A, e ao contrário do básico as notas já contam para a média da universidade.'
    : 'O salto do 9.º para o 10.º é grande e ao contrário do básico as notas já contam para a média da universidade.';

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="margin:0;padding:24px 12px;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#000000,#2a2a2a);padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Explicações Top</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">As aulas já começaram</p>
          </div>

          <div style="padding:32px;">
            <p style="margin:0 0 16px;color:#111111;font-size:16px;line-height:1.6;">${saudacao}</p>

            <p style="margin:0 0 16px;color:#111111;font-size:15px;line-height:1.7;">
              Deixaste-me o teu contacto ${origem} para saberes das explicações.
            </p>

            <p style="margin:0 0 16px;color:#111111;font-size:15px;line-height:1.7;">
              Este ano já tenho explicadores disponíveis para <strong>Matemática</strong>, do básico
              ao secundário. Se precisares de outra disciplina, diz-me na mesma que eu vejo o que
              consigo arranjar.
            </p>

            <p style="margin:0 0 16px;color:#111111;font-size:15px;line-height:1.7;">
              A entrada no secundário apanha quase toda a gente desprevenida. ${salto}
            </p>

            <p style="margin:0 0 16px;color:#111111;font-size:15px;line-height:1.7;">
              Se começares já com as explicações, acompanhas logo a matéria desde o início e, assim,
              poderás evitar surpresas.
            </p>

            <a
              href="${url}"
              style="display:block;margin:26px 0 10px;background:#000000;color:#ffffff !important;text-decoration:none;padding:15px 24px;border-radius:12px;font-size:15px;font-weight:700;text-align:center;"
            >
              Falar comigo no WhatsApp
            </a>
            <p style="margin:0;color:#8a8f98;font-size:13px;line-height:1.6;text-align:center;">
              Ou responde a este email com a disciplina e o ano.
            </p>

            <p style="margin:26px 0 0;color:#111111;font-size:15px;line-height:1.7;">
              Até já,<br />
              <strong>Alin</strong>, MatemáticaTop
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
