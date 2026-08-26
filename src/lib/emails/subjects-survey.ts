import { buildSurveyUrl } from '@/lib/email-audiences';
import { isKnownCourse } from '@/lib/secondary-subjects';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Primeiro nome apresentável, ou null quando o que está guardado não serve.
 * Há quem tenha escrito o email no campo do nome, ou só emojis, e nesses
 * casos é melhor não tratar a pessoa por nome nenhum.
 */
export function displayFirstName(fullName: string | null | undefined): string | null {
  const raw = String(fullName || '').trim().split(/\s+/)[0] || '';
  if (!/^[A-Za-zÀ-ÿ'-]{2,15}$/.test(raw)) return null;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function firstName(fullName: string | null | undefined, fallbackEmail: string) {
  return displayFirstName(fullName) || fallbackEmail.split('@')[0];
}

export const SUBJECTS_SURVEY_SUBJECT = 'Queres explicações de que disciplinas?';

/** Com o nome à frente, quando o temos. É o que mais pesa na taxa de abertura. */
export function subjectsSurveySubject(fullName: string | null | undefined) {
  const name = displayFirstName(fullName);
  return name ? `${name}, queres explicações de que disciplinas?` : SUBJECTS_SURVEY_SUBJECT;
}

/**
 * Email do inquérito às disciplinas, enviado à lista de espera das
 * Explicações Top. Cada pessoa recebe o seu link, já com o curso que indicou
 * quando se inscreveu, para bastar carregar nas disciplinas.
 */
export function subjectsSurveyEmailHtml(options: {
  name: string;
  course: string | null;
  email: string;
}) {
  const { course, email } = options;
  const name = escapeHtml(options.name);
  const url = buildSurveyUrl(email);
  const courseLine = isKnownCourse(course)
    ? `Disseste que és de <strong>${escapeHtml(course as string)}</strong>, por isso já preparei a lista de disciplinas desse curso.`
    : 'Preparei uma lista para escolheres, e tens um espaço para escrever qualquer outra disciplina.';

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body style="margin:0;padding:24px 12px;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#000000,#2a2a2a);padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Explicações Top</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">A tua opinião decide as primeiras disciplinas</p>
          </div>

          <div style="padding:32px;">
            <p style="margin:0 0 16px;color:#111111;font-size:16px;line-height:1.6;">
              Olá, <strong>${name}</strong>!
            </p>
            <p style="margin:0 0 16px;color:#111111;font-size:15px;line-height:1.7;">
              Entraste na lista de espera das Explicações Top e prometi avisar-te assim que
              abríssemos vagas. Antes disso, quero que sejas tu a escolher por onde começamos.
            </p>
            <p style="margin:0 0 16px;color:#111111;font-size:15px;line-height:1.7;">
              ${courseLine} Leva menos de um minuto: carregas nas disciplinas que te interessam
              e no ano que vais frequentar.
            </p>

            <a
              href="${url}"
              style="display:block;margin:26px 0 8px;background:#000000;color:#ffffff !important;text-decoration:none;padding:15px 24px;border-radius:12px;font-size:15px;font-weight:700;text-align:center;"
            >
              Escolher as minhas disciplinas
            </a>
            <p style="margin:0;color:#8a8f98;font-size:12px;line-height:1.6;text-align:center;word-break:break-all;">
              Se o botão não funcionar, abre este endereço:<br />
              <a href="${url}" style="color:#8a8f98;">${url}</a>
            </p>

            <p style="margin:26px 0 0;color:#111111;font-size:15px;line-height:1.7;">
              As disciplinas mais pedidas são as primeiras a abrir, e quem responder fica à
              frente na fila.
            </p>
            <p style="margin:16px 0 0;color:#111111;font-size:15px;line-height:1.7;">
              Obrigado,<br />
              <strong>Alin</strong>, MatemáticaTop
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
