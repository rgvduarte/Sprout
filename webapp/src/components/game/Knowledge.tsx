import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { LEVELS, levelForPoints } from '../../data';
import type { KnowledgeLevel, LevelId, Quest } from '../../data/types';
import { cn } from '../../lib/cn';
import { date as fmtDate, num } from '../../lib/format';
import { CommodityGlyph } from '../ui/Commodity';

/* =====================================================================
   Progressão de conhecimento. Os pontos vêm só de módulos, missões,
   mini-jogos e do simulador. Nunca do montante investido.
   ===================================================================== */

/** Glifos dos níveis: semente, copo de prova, mó de lagar, ramo de oliveira. */
export function LevelGlyph({ level, className }: { level: LevelId; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn('size-5 shrink-0', className)}>
      {level === 'aprendiz' && (
        <>
          <ellipse cx="12" cy="17" rx="4.2" ry="3.2" />
          <path d="M12 13.8V8" />
          <path d="M12 9.5c-.3-2.6-2.2-4.1-4.6-4.2.1 2.5 2 4.1 4.6 4.2z" />
          <path d="M12 8c.4-2.4 2.2-3.7 4.4-3.8-.1 2.3-1.9 3.7-4.4 3.8z" />
        </>
      )}
      {level === 'provador' && (
        <>
          {/* copo de prova do painel de azeite */}
          <path d="M5 8h14l-1.3 8.2a3.2 3.2 0 0 1-3.2 2.8H9.5a3.2 3.2 0 0 1-3.2-2.8z" />
          <path d="M5.6 11.5h12.8" />
          <path d="M9 4.5c1 1 2 1 3 0s2-1 3 0" />
        </>
      )}
      {level === 'lagareiro' && (
        <>
          {/* mó de lagar */}
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 4v5.5M12 14.5V20M4 12h5.5M14.5 12H20" />
        </>
      )}
      {level === 'mestre' && (
        <>
          {/* ramo de oliveira em coroa */}
          <path d="M6.5 19C3.5 15.5 3.8 9.5 8 6" />
          <path d="M17.5 19c3-3.5 2.7-9.5-1.5-13" />
          <path d="M5.2 14.5c-1.6-.4-2.4-1.6-2.4-2.9 1.4 0 2.6.9 2.4 2.9zM5.6 10.2C4.4 9.4 4.1 8 4.6 6.9c1.2.6 1.8 1.9 1 3.3zM18.8 14.5c1.6-.4 2.4-1.6 2.4-2.9-1.4 0-2.6.9-2.4 2.9zM18.4 10.2c1.2-.8 1.5-2.2 1-3.3-1.2.6-1.8 1.9-1 3.3z" />
          <path d="M9.5 19.5h5" />
        </>
      )}
    </svg>
  );
}

/** Insígnia do nível de conhecimento. */
export function KnowledgeLevelBadge({ level, size = 'md', className }: { level: KnowledgeLevel | LevelId; size?: 'sm' | 'md'; className?: string }) {
  const l = typeof level === 'string' ? LEVELS.find((x) => x.id === level)! : level;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-sm border border-[color-mix(in_oklab,var(--accent)_32%,var(--border))] bg-accent-soft font-medium text-fg',
        size === 'sm' ? 'h-7 px-2 text-sm' : 'h-9 px-3 text-[0.9375rem]',
        className,
      )}
      title={l.description}
    >
      <LevelGlyph level={l.id} className={cn('text-accent', size === 'sm' ? 'size-4' : 'size-5')} />
      <span className="sr-only">Nível de conhecimento: </span>
      {l.nome}
    </span>
  );
}

/** Progresso até ao próximo nível + trilho dos quatro níveis. */
export function LevelProgress({ points, compact, className }: { points: number; compact?: boolean; className?: string }) {
  const { level, next, progress } = levelForPoints(points);
  const max = LEVELS[LEVELS.length - 1].minPoints;
  const pos = (p: number) => Math.min(1, p / max) * 100;
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <KnowledgeLevelBadge level={level} size={compact ? 'sm' : 'md'} />
        <p className="text-sm text-muted">
          <span className="font-mono text-fg tnum">{num(points)}</span> pontos de conhecimento
          {next && (
            <>
              {' '}
              · faltam <span className="font-mono text-fg tnum">{num(next.minPoints - points)}</span> para {next.nome}
            </>
          )}
        </p>
      </div>
      {!compact && (
        <div className="mt-5">
          <div className="relative h-2 rounded-full bg-[color-mix(in_oklab,var(--accent)_16%,var(--surface-2))]" role="meter" aria-label="Pontos de conhecimento" aria-valuemin={0} aria-valuemax={max} aria-valuenow={points} aria-valuetext={`${points} pontos, nível ${level.nome}`}>
            <div className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${pos(points)}%` }} />
            {LEVELS.map((l) => (
              <span key={l.id} aria-hidden className={cn('absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2', points >= l.minPoints ? 'border-accent bg-accent' : 'border-border bg-surface')} style={{ left: `${pos(l.minPoints)}%` }} />
            ))}
          </div>
          <ol className="relative mt-2 h-10" aria-label="Níveis">
            {LEVELS.map((l, i) => (
              <li
                key={l.id}
                className={cn('absolute top-0 text-xs', i === 0 ? 'translate-x-0 text-left' : i === LEVELS.length - 1 ? '-translate-x-full text-right' : '-translate-x-1/2 text-center', points >= l.minPoints ? 'text-fg' : 'text-muted')}
                style={{ left: `${pos(l.minPoints)}%` }}
              >
                <span className="block whitespace-nowrap font-medium">{l.nome}</span>
                <span className="block font-mono tnum">{l.minPoints}</span>
              </li>
            ))}
          </ol>
          <p className="mt-1 text-sm text-muted">
            {next ? `${Math.round(progress * 100)} % do caminho até ${next.nome}. ` : 'Nível máximo. '}Os níveis sobem com módulos, missões, mini-jogos e simulações; nunca com o montante investido.
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ QuestList */

export interface QuestListProps {
  quests: Quest[];
  isDone: (id: string) => boolean;
  completedAt?: (id: string) => string | undefined;
  compact?: boolean;
  /** mostra o mundo de cada missão */
  showWorld?: boolean;
  className?: string;
  emptyText?: string;
}

/** Missões de conhecimento: pequenas tarefas de diligência com ligação para onde se cumprem. */
export function QuestList({ quests, isDone, completedAt, compact, showWorld = true, className, emptyText = 'Sem missões por fazer aqui.' }: QuestListProps) {
  if (!quests.length) return <p className={cn('text-sm text-muted', className)}>{emptyText}</p>;
  return (
    <ul className={cn('divide-y divide-border', className)}>
      {quests.map((q) => {
        const done = isDone(q.id);
        const at = completedAt?.(q.id);
        return (
          <li key={q.id} className={cn('flex min-w-0 items-start gap-3', compact ? 'py-2.5' : 'py-3.5')}>
            <span
              aria-hidden
              className={cn('mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2', done ? 'border-accent bg-accent text-accent-fg' : 'border-[color-mix(in_oklab,var(--fg)_30%,var(--border))]')}
            >
              {done && <Check className="size-3" strokeWidth={3} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('font-medium leading-snug', done ? 'text-muted' : 'text-fg')}>
                {q.title}
                <span className="sr-only">{done ? ' · cumprida' : ' · por fazer'}</span>
              </p>
              {!compact && <p className="mt-0.5 text-sm text-muted">{q.description}</p>}
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="font-mono tnum">+{q.points} pts</span>
                {showWorld && q.world !== 'geral' && (
                  <span className="inline-flex items-center gap-1">
                    <CommodityGlyph world={q.world} className="size-3.5" />
                    {q.world === 'azeite' ? 'Azeite' : q.world === 'agua' ? 'Água' : 'Café'}
                  </span>
                )}
                {done && at && <span>cumprida a {fmtDate(at)}</span>}
              </p>
            </div>
            {!done && (
              <Link to={q.href} className="inline-flex min-h-11 shrink-0 items-center gap-1 px-1 text-sm font-medium text-accent hover:underline" aria-label={`Fazer: ${q.title}`}>
                Fazer
                <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
