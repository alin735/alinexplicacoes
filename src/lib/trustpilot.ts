// Integração com o Trustpilot InviteJS: envia um convite de avaliação ao aluno
// depois de ele ter tido explicações. É disparado no browser do aluno (client-side),
// com o business unit fornecido pelo Trustpilot.

const BUSINESS_UNIT_ID = 'SrTL3njXzrCxrYCS';

declare global {
  interface Window {
    tp?: (...args: unknown[]) => void;
    TrustpilotObject?: string;
  }
}

// Carrega o script do InviteJS uma única vez e regista o business unit.
function loadInviteJs() {
  if (typeof window === 'undefined' || window.tp) return;

  (function (w: Window, d: Document, s: 'script', r: string, n: string) {
    w.TrustpilotObject = n;
    // Fila de comandos enquanto o script assíncrono ainda não carregou.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = w as any;
    win[n] =
      win[n] ||
      function (...args: unknown[]) {
        (win[n].q = win[n].q || []).push(args);
      };
    const a = d.createElement(s);
    a.async = true;
    a.src = r;
    a.type = 'text/java' + s;
    const f = d.getElementsByTagName(s)[0];
    f.parentNode?.insertBefore(a, f);
  })(window, document, 'script', 'https://invitejs.trustpilot.com/tp.min.js', 'tp');

  (window as { tp?: (...args: unknown[]) => void }).tp?.('register', BUSINESS_UNIT_ID);
}

/**
 * Cria um convite de avaliação (Service Review) para o aluno. O Trustpilot envia
 * o email de convite de acordo com as definições da tua conta. Só dispara uma vez
 * por `referenceId` (guardado neste dispositivo) para não convidar repetidamente.
 */
export function sendTrustpilotInvite(params: { email: string; name?: string; referenceId: string }) {
  const { email, name, referenceId } = params;
  if (typeof window === 'undefined' || !email || !referenceId) return;

  const flag = `tp_invited_${referenceId}`;
  try {
    if (localStorage.getItem(flag)) return;
  } catch {
    // localStorage indisponível: seguimos e deixamos o Trustpilot fazer a deduplicação.
  }

  loadInviteJs();

  try {
    window.tp?.('createInvitation', {
      recipientEmail: email,
      recipientName: name || email,
      referenceId,
      source: 'matematica-top-aulas',
    });
    try {
      localStorage.setItem(flag, '1');
    } catch {
      // ignora
    }
  } catch {
    // ignora falhas de rede/script
  }
}
