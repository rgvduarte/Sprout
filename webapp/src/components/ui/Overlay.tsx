import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

const EASE = [0.16, 1, 0.3, 1] as const;

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]';

/** Paragens reais de Tab dentro do painel (sem tabindex=-1 dos grupos com foco itinerante, sem nós escondidos). */
function tabStops(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.tabIndex >= 0 && n.offsetParent !== null && !n.closest('[inert]'));
}

/** Torna inerte tudo o que está fora do portal do diálogo (a app por trás não recebe foco nem cliques). */
function inertOutside(host: HTMLElement | null): () => void {
  if (!host) return () => {};
  const changed: HTMLElement[] = [];
  for (const el of Array.from(document.body.children) as HTMLElement[]) {
    if (el.contains(host) || el.tagName === 'SCRIPT' || el.hasAttribute('inert')) continue;
    // o portal dos avisos (aria-live) fica fora do diálogo mas deve continuar a ser anunciado
    if (el.hasAttribute('data-toast-root')) continue;
    el.setAttribute('inert', '');
    changed.push(el);
  }
  return () => changed.forEach((el) => el.removeAttribute('inert'));
}

/** Armadilha de foco + Esc + devolução do foco ao fechar + bloqueio do scroll. */
function useModalBehaviour(open: boolean, onClose: () => void, panel: React.RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    let restoreInert = () => {};
    const t = window.setTimeout(() => {
      const el = panel.current;
      // o painel vive num portal: o que está fora dele (a app) fica inerte enquanto o diálogo está aberto
      restoreInert = inertOutside(el?.closest<HTMLElement>('[data-overlay-root]') ?? el ?? null);
      const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? (el ? tabStops(el)[0] : undefined);
      (first ?? el)?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const nodes = tabStops(panel.current);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = Boolean(active && panel.current.contains(active));
      if (e.shiftKey && (active === first || active === panel.current || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      restoreInert();
      document.removeEventListener('keydown', onKey);
      html.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, [open, panel]);
}

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'right' | 'left';
  width?: 'sm' | 'md' | 'lg';
  /** painel escuro (rail) para a navegação móvel */
  tone?: 'surface' | 'rail';
  /** esconde o cabeçalho visual (o título continua acessível) */
  hideHeader?: boolean;
}

/** Gaveta lateral: tarefas com contexto preservado. Preferir a modais. */
export function Drawer({ open, onClose, title, description, children, footer, side = 'right', width = 'md', tone = 'surface', hideHeader }: DrawerProps) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '');
  useModalBehaviour(open, onClose, panel);
  const offset = side === 'right' ? '100%' : '-100%';
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" data-overlay-root>
          <motion.div
            className="absolute inset-0 bg-[var(--overlay-scrim)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-t`}
            aria-describedby={description ? `${id}-d` : undefined}
            tabIndex={-1}
            className={cn(
              'absolute inset-y-0 flex w-full flex-col shadow-overlay outline-none',
              side === 'right' ? 'right-0' : 'left-0',
              width === 'sm' && 'max-w-[320px]',
              width === 'md' && 'max-w-[440px]',
              width === 'lg' && 'max-w-[640px]',
              tone === 'rail' ? 'on-rail bg-rail text-rail-fg' : 'bg-surface text-fg',
            )}
            initial={reduce ? { opacity: 0 } : { x: offset }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: offset, transition: { duration: 0.2, ease: [0.7, 0, 0.84, 0] } }}
            transition={{ duration: 0.38, ease: EASE }}
          >
            {hideHeader ? (
              <div className="flex justify-end px-3 pt-3">
                {/* só o título e a descrição ficam acessíveis; um único botão "Fechar", visível, recebe o foco inicial */}
                <h2 id={`${id}-t`} className="sr-only">
                  {title}
                </h2>
                {description && (
                  <p id={`${id}-d`} className="sr-only">
                    {description}
                  </p>
                )}
                <IconButton label="Fechar" icon={<X className="size-5" strokeWidth={1.75} />} onClick={onClose} variant={tone === 'rail' ? 'on-rail' : 'ghost'} />
              </div>
            ) : (
              <div className={cn('flex items-start justify-between gap-3 px-5 pb-3 pt-4', tone === 'rail' ? '' : 'border-b border-border')}>
                <div className="min-w-0 pt-2">
                  <h2 id={`${id}-t`} className={cn('text-lg leading-tight', tone === 'rail' && 'text-rail-fg')}>
                    {title}
                  </h2>
                  {description && (
                    <p id={`${id}-d`} className={cn('mt-1 text-sm', tone === 'rail' ? 'text-rail-muted' : 'text-muted')}>
                      {description}
                    </p>
                  )}
                </div>
                <IconButton label="Fechar" icon={<X className="size-5" strokeWidth={1.75} />} onClick={onClose} variant={tone === 'rail' ? 'on-rail' : 'ghost'} />
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <div className="border-t border-border px-5 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md';
  /** diálogo de alerta (exige ação) */
  role?: 'dialog' | 'alertdialog';
}

/** Diálogo central. Só para decisões que precisam de foco protegido. */
export function Dialog({ open, onClose, title, description, children, footer, size = 'sm', role = 'dialog' }: DialogProps) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '');
  useModalBehaviour(open, onClose, panel);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" data-overlay-root>
          <motion.div className="absolute inset-0 bg-[var(--overlay-scrim)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} onClick={onClose} aria-hidden />
          <motion.div
            ref={panel}
            role={role}
            aria-modal="true"
            aria-labelledby={`${id}-t`}
            aria-describedby={description ? `${id}-d` : undefined}
            tabIndex={-1}
            className={cn('relative w-full rounded-md border border-border bg-surface text-fg shadow-overlay outline-none', size === 'sm' ? 'max-w-[440px]' : 'max-w-[600px]')}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 8, transition: { duration: 0.15 } }}
            transition={{ duration: 0.32, ease: EASE }}
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-5">
              <div className="min-w-0">
                <h2 id={`${id}-t`} className="text-lg leading-tight">
                  {title}
                </h2>
                {description && (
                  <p id={`${id}-d`} className="mt-1 text-sm text-muted">
                    {description}
                  </p>
                )}
              </div>
              <IconButton label="Fechar" icon={<X className="size-5" strokeWidth={1.75} />} onClick={onClose} className="-mr-2 -mt-2" />
            </div>
            {children && <div className="px-5 py-4">{children}</div>}
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
