import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, RotateCcw, X } from 'lucide-react';
import { Button } from '../../../components/ui';
import { getMiniGame } from '../../../data';
import type { MiniGameId } from '../../../data/types';
import { useGame, useToast } from '../../../state';
import { cn } from '../../../lib/cn';
import type { Rng } from '../../../lib/prng';
import { miniGamePointsFor } from '../points';

/* =====================================================================
   Peças comuns dos mini-jogos: opções, veredicto, marcadores de
   progresso e o ecrã de resultado. Os pontos são só de conhecimento.
   ===================================================================== */

export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Baralha sem alterar o original. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------------------------ opção */

export type ChoiceState = 'idle' | 'right' | 'wrong' | 'missed' | 'dim';

/** Botão de resposta. 'missed' = a certa que não foi escolhida (revelada). */
export function Choice({ state = 'idle', disabled, onClick, children, className, hint }: { state?: ChoiceState; disabled?: boolean; onClick?: () => void; children: ReactNode; className?: string; hint?: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={state === 'right' || state === 'wrong' ? true : undefined}
      className={cn(
        'flex min-h-11 w-full min-w-0 items-start gap-2 rounded-sm border px-3 py-2.5 text-left text-[0.9375rem] transition-[background-color,border-color,color,opacity] duration-150',
        state === 'idle' && 'border-border bg-surface text-fg enabled:hover:border-world-line enabled:hover:bg-world-soft',
        state === 'right' && 'border-[color-mix(in_oklab,var(--ok)_50%,var(--border))] bg-[color-mix(in_oklab,var(--ok)_13%,var(--surface))] text-fg',
        state === 'missed' && 'border-[color-mix(in_oklab,var(--ok)_50%,var(--border))] border-dashed bg-surface text-fg',
        state === 'wrong' && 'border-[color-mix(in_oklab,var(--crit)_40%,var(--border))] bg-[color-mix(in_oklab,var(--crit)_8%,var(--surface))] text-fg',
        state === 'dim' && 'border-border bg-surface text-muted',
        'disabled:cursor-default',
        className,
      )}
    >
      {(state === 'right' || state === 'missed') && <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-ok-ink" strokeWidth={2.25} />}
      {state === 'wrong' && <X aria-hidden className="mt-0.5 size-4 shrink-0 text-crit-ink" strokeWidth={2.25} />}
      <span className="min-w-0">
        <span className="block">{children}</span>
        {hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}
        {state === 'right' && <span className="sr-only"> · a tua resposta, certa</span>}
        {state === 'wrong' && <span className="sr-only"> · a tua resposta, errada</span>}
        {state === 'missed' && <span className="sr-only"> · a resposta certa</span>}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------ veredicto */

export function Verdict({ ok, title, children, className }: { ok: boolean; title: ReactNode; children?: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="status"
      className={cn('flex items-start gap-2.5 rounded-sm px-3.5 py-3', ok ? 'bg-[color-mix(in_oklab,var(--ok)_11%,var(--surface))]' : 'bg-[color-mix(in_oklab,var(--crit)_8%,var(--surface))]', className)}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      <span aria-hidden className={cn('mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full', ok ? 'bg-ok text-surface' : 'bg-crit text-surface')}>
        {ok ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
      </span>
      <div className="min-w-0">
        <p className={cn('font-semibold', ok ? 'text-ok-ink' : 'text-crit-ink')}>{title}</p>
        {children && <div className="mt-1 text-[0.9375rem] text-fg">{children}</div>}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------ marcadores */

export type PipState = 'todo' | 'current' | 'right' | 'wrong';

export function Pips({ items, label, className }: { items: { id: string; label: string; state: PipState }[]; label: string; className?: string }) {
  return (
    <ol aria-label={label} className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {items.map((it) => (
        <li
          key={it.id}
          aria-current={it.state === 'current' ? 'step' : undefined}
          className={cn(
            'inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-full border px-1.5 font-mono text-xs tnum transition-colors duration-200',
            it.state === 'todo' && 'border-border text-muted',
            it.state === 'current' && 'border-world-ink bg-world-soft text-world-ink',
            it.state === 'right' && 'border-transparent bg-[color-mix(in_oklab,var(--ok)_16%,var(--surface))] text-ok-ink',
            it.state === 'wrong' && 'border-[color-mix(in_oklab,var(--crit)_40%,var(--border))] text-crit-ink',
          )}
        >
          {it.state === 'right' && <Check aria-hidden className="size-3" strokeWidth={3} />}
          {it.state === 'wrong' && <X aria-hidden className="size-3" strokeWidth={3} />}
          {it.label}
          <span className="sr-only">{it.state === 'right' ? ' certa' : it.state === 'wrong' ? ' errada' : it.state === 'current' ? ' em jogo' : ' por jogar'}</span>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------ fim do jogo */

export interface FinishResult {
  score: number;
  max: number;
  gained: number;
  best: number;
  prevBest: number;
}

/** Regista o resultado na loja e avisa (só pontos de conhecimento). */
export function useFinishGame(id: MiniGameId) {
  const game = useGame();
  const { toast } = useToast();
  return (score: number): FinishResult => {
    const meta = getMiniGame(id);
    const prevBest = game.miniGameBest(id) ?? 0;
    const best = Math.max(prevBest, score);
    const gained = miniGamePointsFor(id, best) - miniGamePointsFor(id, prevBest);
    game.recordMiniGame(id, score);
    toast({
      tone: 'accent',
      title: `${meta.title}: ${score} de ${meta.maxScore}`,
      description: gained > 0 ? `+${gained} pontos de conhecimento. Novo melhor resultado.` : `O teu melhor continua a ser ${prevBest} de ${meta.maxScore}. Os pontos contam o melhor jogo.`,
    });
    return { score, max: meta.maxScore, gained, best, prevBest };
  };
}

export function ResultPanel({ result, title, onReplay, children }: { result: FinishResult; title: string; onReplay: () => void; children?: ReactNode }) {
  const reduce = useReducedMotion();
  const pct = result.score / result.max;
  return (
    <div className="min-w-0">
      <motion.div
        className="flex flex-wrap items-end gap-x-8 gap-y-4"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className="font-display text-[2.75rem] font-bold leading-none text-fg pnum">
            {result.score}
            <span className="text-[1.5rem] text-muted"> de {result.max}</span>
          </p>
        </div>
        <div className="min-w-0 pb-1">
          <p className="text-[0.9375rem] text-fg">
            {result.gained > 0 ? (
              <>
                <span className="font-mono tnum">+{result.gained}</span> pontos de conhecimento
              </>
            ) : result.prevBest > 0 ? (
              `Sem pontos novos: o melhor resultado continua a ser ${result.prevBest} de ${result.max}.`
            ) : (
              'Sem pontos neste jogo.'
            )}
          </p>
          <p className="text-sm text-muted">{pct === 1 ? 'Tudo certo.' : pct >= 0.5 ? 'Revê abaixo as que falharam e joga outra vez.' : 'Lê as explicações abaixo antes de voltar a jogar.'}</p>
        </div>
        <Button variant="secondary" iconLeft={<RotateCcw aria-hidden className="size-4" strokeWidth={1.75} />} onClick={onReplay} className="sm:ml-auto">
          Jogar outra vez
        </Button>
      </motion.div>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
