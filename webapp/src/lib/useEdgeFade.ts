import { useEffect, useState, type CSSProperties, type RefObject } from 'react';

/**
 * Esbatimento nas margens de um contentor com scroll horizontal: mostra que há
 * mais conteúdo para o lado (em vez de uma coluna ou um separador cortado sem
 * pista). Devolve o estilo (mask-image) para o próprio contentor de scroll.
 */
export function useEdgeFade(ref: RefObject<HTMLElement | null>, size = 28): CSSProperties | undefined {
  const [edges, setEdges] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const left = max > 1 && el.scrollLeft > 1;
      const right = max > 1 && el.scrollLeft < max - 1;
      setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(el);
      if (el.firstElementChild) ro.observe(el.firstElementChild);
    }
    return () => {
      el.removeEventListener('scroll', update);
      ro?.disconnect();
    };
  }, [ref]);
  if (!edges.left && !edges.right) return undefined;
  const mask = `linear-gradient(to right, ${edges.left ? `transparent, #000 ${size}px` : '#000'}, ${edges.right ? `#000 calc(100% - ${size}px), transparent` : '#000'})`;
  return { maskImage: mask, WebkitMaskImage: mask };
}

/** Desloca um contentor com scroll horizontal até um filho ficar à vista (sem mexer no scroll vertical da página). */
export function revealInline(container: HTMLElement | null, child: HTMLElement | null, pad = 24) {
  if (!container || !child || container.scrollWidth <= container.clientWidth) return;
  const c = container.getBoundingClientRect();
  const r = child.getBoundingClientRect();
  if (r.left < c.left + pad) container.scrollLeft -= c.left + pad - r.left;
  else if (r.right > c.right - pad) container.scrollLeft += r.right - (c.right - pad);
}
