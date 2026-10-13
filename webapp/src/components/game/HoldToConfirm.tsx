import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { motion, useMotionValue, useReducedMotion, useTransform, animate } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Form';

/* =====================================================================
   HoldToConfirm · confirmação por pressão contínua (~1,2 s). O anel enche
   enquanto se mantém premido; soltar antes cancela, tal como arrastar o
   ponteiro para fora do botão (8 px de folga) ou, no toque, mover o dedo
   mais de 10 px (um deslize vertical faz scroll e cancela). Teclado: manter
   Espaço ou Enter. Alternativa acessível: confirmação com caixa de
   verificação.
   ===================================================================== */

/** folga à volta do botão antes de cancelar (rato, caneta) */
const LEAVE_SLACK = 8;
/** deslocação máxima do dedo antes de cancelar (toque) */
const TOUCH_SLOP = 10;

export interface HoldToConfirmProps {
  onConfirm: () => void;
  /** texto do botão, p.ex. "Manter premido para confirmar 5 000 €" */
  label: string;
  /** texto depois de confirmado */
  confirmedLabel?: string;
  /** texto da caixa na alternativa acessível, p.ex. "Confirmo o compromisso de 5 000 € no lote AZ-2026-021" */
  confirmText?: string;
  holdMs?: number;
  disabled?: boolean;
  /** motivo visível quando desativado */
  disabledReason?: string;
  /** mostra a ligação para a alternativa sem pressão contínua (por omissão sim) */
  alternative?: boolean;
  className?: string;
}

export function HoldToConfirm({
  onConfirm,
  label,
  confirmedLabel = 'Confirmado',
  confirmText = 'Li os fatores de risco e confirmo este compromisso.',
  holdMs = 1200,
  disabled,
  disabledReason,
  alternative = true,
  className,
}: HoldToConfirmProps) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const progress = useMotionValue(0);
  const dash = useTransform(progress, (v) => 1 - v);
  const [status, setStatus] = useState<'idle' | 'holding' | 'done'>('idle');
  const [announce, setAnnounce] = useState('');
  const [altOpen, setAltOpen] = useState(false);
  const [altChecked, setAltChecked] = useState(false);
  const raf = useRef<number | null>(null);
  const start = useRef(0);
  const origin = useRef<{ x: number; y: number; id: number; type: string } | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  const stopLoop = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  const complete = useCallback(() => {
    stopLoop();
    progress.set(1);
    setStatus('done');
    setAnnounce(confirmedLabel);
    onConfirm();
  }, [confirmedLabel, onConfirm, progress]);

  const begin = () => {
    if (disabled || statusRef.current !== 'idle') return;
    setStatus('holding');
    setAnnounce('A confirmar. Mantém premido.');
    start.current = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start.current) / holdMs);
      progress.set(p);
      if (p >= 1) complete();
      else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const cancel = (why: 'soltar' | 'fora' = 'soltar') => {
    origin.current = null;
    if (statusRef.current !== 'holding') return;
    stopLoop();
    setStatus('idle');
    setAnnounce(why === 'fora' ? 'Confirmação cancelada. O ponteiro saiu do botão.' : 'Confirmação cancelada. Soltaste antes do fim.');
    if (reduce) progress.set(0);
    else animate(progress, 0, { duration: 0.2, ease: [0.7, 0, 0.84, 0] });
  };

  useEffect(() => () => stopLoop(), []);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    origin.current = { x: e.clientX, y: e.clientY, id: e.pointerId, type: e.pointerType };
    // a captura só garante que o pointerup chega a este botão; sair do botão é verificado em onPointerMove
    e.currentTarget.setPointerCapture?.(e.pointerId);
    begin();
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const o = origin.current;
    if (!o || o.id !== e.pointerId || statusRef.current !== 'holding') return;
    if (o.type === 'touch') {
      if (Math.hypot(e.clientX - o.x, e.clientY - o.y) > TOUCH_SLOP) cancel('fora');
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const outside = e.clientX < r.left - LEAVE_SLACK || e.clientX > r.right + LEAVE_SLACK || e.clientY < r.top - LEAVE_SLACK || e.clientY > r.bottom + LEAVE_SLACK;
    if (outside) cancel('fora');
  };
  const onPointerEnd = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    cancel();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault();
      begin();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
    }
  };
  const onKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      cancel();
    }
  };

  const done = status === 'done';
  const reasonId = disabled && disabledReason && !done ? `htc-${uid}-reason` : undefined;

  return (
    <div className={cn('min-w-0', className)}>
      <button
        type="button"
        aria-disabled={disabled || done || undefined}
        aria-describedby={[reasonId, `htc-${uid}-hint`].filter(Boolean).join(' ')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onLostPointerCapture={() => cancel()}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={() => cancel()}
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => e.preventDefault()}
        className={cn(
          // pan-y: um deslize vertical que comece no botão faz scroll da página (e o browser cancela o gesto)
          'relative flex h-14 w-full touch-pan-y select-none items-center gap-3 overflow-hidden rounded-sm px-4 text-left font-medium transition-colors duration-150 [-webkit-touch-callout:none] sm:w-auto sm:min-w-[340px]',
          done ? 'bg-accent-soft text-fg' : disabled ? 'cursor-not-allowed bg-surface-2 text-muted' : 'bg-accent text-accent-fg hover:bg-[color-mix(in_oklab,var(--accent)_88%,var(--fg))]',
        )}
      >
        {/* preenchimento da barra (feedback espacial) */}
        {!disabled && !done && <motion.span aria-hidden className="absolute inset-0 origin-left bg-[color-mix(in_oklab,var(--accent-fg)_14%,transparent)]" style={{ scaleX: progress }} />}
        <span className="relative inline-flex size-8 shrink-0 items-center justify-center">
          <svg viewBox="0 0 32 32" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
            <motion.circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" style={{ strokeDashoffset: dash }} />
          </svg>
          {done && <Check aria-hidden className="relative size-4" strokeWidth={2.5} />}
        </span>
        <span className="relative min-w-0 flex-1">{done ? confirmedLabel : label}</span>
      </button>
      <p id={`htc-${uid}-hint`} className="mt-2 text-sm text-muted">
        {done ? 'Compromisso registado.' : 'Mantém premido cerca de 1 segundo (rato, toque, Espaço ou Enter). Soltar antes cancela.'}
      </p>
      {reasonId && !done && (
        <p id={reasonId} className="mt-1 text-sm text-warn-ink">
          {disabledReason}
        </p>
      )}
      {alternative && !done && !disabled && (
        <div className="mt-2">
          {!altOpen ? (
            <button type="button" onClick={() => setAltOpen(true)} className="min-h-11 text-sm font-medium text-accent underline underline-offset-[0.2em]">
              Confirmar sem manter premido
            </button>
          ) : (
            <div className="mt-2 rounded-sm border border-border bg-surface p-3">
              <Checkbox label={confirmText} checked={altChecked} onChange={(e) => setAltChecked(e.target.checked)} />
              <Button className="mt-2" variant="primary" disabled={!altChecked} onClick={complete}>
                Confirmar compromisso
              </Button>
            </div>
          )}
        </div>
      )}
      <span className="sr-only" aria-live="assertive">
        {announce}
      </span>
    </div>
  );
}
