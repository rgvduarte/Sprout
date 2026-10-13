import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { Tone } from '../../data/types';
import { TONE_DOT } from './Badge';

export interface ToastInput {
  title: string;
  description?: string;
  tone?: Extract<Tone, 'neutral' | 'accent' | 'ok' | 'warn' | 'crit' | 'info' | 'seal'>;
  /** ms; 0 = fica até fechar */
  duration?: number;
}

export interface ToastItem extends ToastInput {
  id: string;
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    const d = item.duration ?? 5200;
    if (!d) return;
    const t = window.setTimeout(() => onDismiss(item.id), d);
    return () => window.clearTimeout(t);
  }, [item, onDismiss]);
  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto flex w-full items-start gap-3 rounded-md border border-border bg-surface px-4 py-3 shadow-overlay"
    >
      <span aria-hidden className={cn('mt-1.5 size-2 shrink-0 rounded-full', TONE_DOT[item.tone ?? 'neutral'])} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-fg">{item.title}</p>
        {item.description && <p className="mt-0.5 text-sm text-muted">{item.description}</p>}
      </div>
      <button type="button" onClick={() => onDismiss(item.id)} aria-label="Fechar aviso" className="relative -mr-1 inline-flex size-8 items-center justify-center rounded-sm text-muted after:absolute after:-inset-1.5 after:content-[''] hover:bg-surface-2 hover:text-fg">
        <X className="size-4" strokeWidth={1.75} />
      </button>
    </motion.li>
  );
}

/**
 * Zona de avisos (aria-live educado). No telemóvel fica no topo, por baixo da
 * barra superior, e mostra só os dois mais recentes, para não tapar campos de
 * formulário nem a barra de controlos do simulador; a partir de 640 px fica no
 * canto inferior direito.
 */
export function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div aria-live="polite" aria-relevant="additions" className="pointer-events-none fixed inset-x-0 top-[57px] z-[60] flex justify-end px-3 pt-2 sm:bottom-0 sm:top-auto sm:p-6">
      <ol className="flex w-full max-w-[380px] flex-col gap-2 max-sm:[&>li:nth-last-child(n+3)]:hidden">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <ToastCard key={t.id} item={t} onDismiss={onDismiss} />
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}
