import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Decide se os botões flutuantes (WhatsApp, chat) se devem esconder:
 *  - quando há um modal/pop-up aberto (qualquer elemento com role="dialog");
 *  - quando o utilizador chega perto do rodapé da página.
 *
 * Devolve `true` para esconder. O componente aplica um fade suave; não desmonta
 * o botão, para a transição ser bonita.
 */
export function useFloatingWidgetHidden(): boolean {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let nearFooter = false;
    let dialogOpen = false;
    const update = () => setHidden(nearFooter || dialogOpen);

    // Esconder ao aproximar-se do rodapé.
    const footer = document.querySelector('footer');
    let io: IntersectionObserver | null = null;
    if (footer) {
      io = new IntersectionObserver(
        (entries) => {
          nearFooter = entries.some((entry) => entry.isIntersecting);
          update();
        },
        // Margem positiva no fundo: começa a esconder um pouco antes de o rodapé entrar.
        { rootMargin: '0px 0px 40px 0px', threshold: 0 },
      );
      io.observe(footer);
    }

    // Esconder quando há um modal/pop-up aberto.
    const checkDialog = () => {
      dialogOpen = !!document.querySelector('[role="dialog"]');
      update();
    };
    checkDialog();
    const mo = new MutationObserver(checkDialog);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io?.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return hidden;
}
