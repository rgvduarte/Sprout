import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Volta ao topo ao mudar de rota. Com #âncora (p.ex. /lote/AZ-2026-021#riscos)
 * espera que o ecrã carregue e leva o leitor até à secção.
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
        if (el) el.scrollIntoView({ block: 'start' });
        else window.scrollTo(0, 0);
      }
    }, 100);
    return () => window.clearInterval(t);
  }, [pathname, hash]);
  return null;
}
