import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { chapterScrollTop } from '../components/game';

/**
 * Volta ao topo ao mudar de rota. Com #âncora (p.ex. /lote/AZ-2026-021#riscos)
 * espera que o ecrã carregue e leva o leitor até à secção (um capítulo fixo
 * aterra no seu progresso estável, com tudo à vista).
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    const t = window.setInterval(() => {
      const el = document.getElementById(id);
      if (el || ++tries > 20) {
        window.clearInterval(t);
        // um capítulo fixo aterra no progresso estável (tudo à vista); o resto por baixo das barras fixas (scroll-padding-top)
        if (el) window.scrollTo({ top: chapterScrollTop(el, parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0) });
        else window.scrollTo(0, 0);
      }
    }, 100);
    return () => window.clearInterval(t);
  }, [pathname, hash]);
  return null;
}
