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
  // desenhados numa grelha de 24 px com poucos traços grossos e folhas cheias: legíveis a 16–24 px nos dois temas
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn('size-5 shrink-0', className)}>
      {level === 'aprendiz' && (
        <>
          {/* rebento: duas folhas sobre a linha da terra */}
          <path d="M4 20h16" />
          <path d="M12 20v-8.5" />
          <path d="M11.6 13.2C11.4 9.6 9 7.4 5.2 7.3c.1 3.6 2.6 5.8 6.4 5.9z" fill="currentColor" strokeWidth={1.25} />
          <path d="M12.4 11.4c.3-3.3 2.6-5.3 6.2-5.3-.2 3.3-2.6 5.2-6.2 5.3z" fill="currentColor" strokeWidth={1.25} />
        </>
      )}
      {level === 'provador' && (
        <>
          {/* copo de prova do painel de azeite */}
          <path d="M5 8h14l-1.3 8.2a3.2 3.2 0 0 1-3.2 2.8H9.5a3.2 3.2 0 0 1-3.2-2.8z" />
          <path d="M6.2 12.5h11.6l-.6 3.7a2 2 0 0 1-2 1.7H8.8a2 2 0 0 1-2-1.7z" fill="currentColor" stroke="none" />
          <path d="M9 4.5c1 1 2 1 3 0s2-1 3 0" />
        </>
      )}
      {level === 'lagareiro' && (
        <>
          {/* mó de lagar vista de lado: a pedra no eixo, sobre o pio */}
          <path d="M12 3.5v4" />
          <rect x="4.5" y="7.5" width="15" height="7" rx="3.5" fill="currentColor" strokeWidth={1.25} />
          <path d="M3 18.5h18" />
          <path d="M5.5 18.5 7 21h10l1.5-2.5" />
        </>
      )}
      {level === 'mestre' && (
        <>
          {/* dois ramos de oliveira que se juntam na base */}
          <path d="M12 21C7.5 19.5 5.2 15.6 5.4 9.5" />
          <path d="M12 21c4.5-1.5 6.8-5.4 6.6-11.5" />
          <ellipse cx="4.4" cy="8.6" rx="1.5" ry="2.8" transform="rotate(-18 4.4 8.6)" fill="currentColor" stroke="none" />
          <ellipse cx="4.6" cy="14" rx="1.5" ry="2.8" transform="rotate(-58 4.6 14)" fill="currentColor" stroke="none" />
          <ellipse cx="8.4" cy="18.4" rx="1.4" ry="2.6" transform="rotate(-80 8.4 18.4)" fill="currentColor" stroke="none" />
          <ellipse cx="19.6" cy="8.6" rx="1.5" ry="2.8" transform="rotate(18 19.6 8.6)" fill="currentColor" stroke="none" />
          <ellipse cx="19.4" cy="14" rx="1.5" ry="2.8" transform="rotate(58 19.4 14)" fill="currentColor" stroke="none" />
          <ellipse cx="15.6" cy="18.4" rx="1.4" ry="2.6" transform="rotate(80 15.6 18.4)" fill="currentColor" stroke="none" />
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
  // escala por troços: os quatro níveis ficam igualmente espaçados
  const pos = (p: number) => {
    const n = LEVELS.length - 1;
    for (let i = 0; i < n; i++) {
      const a = LEVELS[i].minPoints;
      const b = LEVELS[i + 1].minPoints;
      if (p < b) return ((i + Math.max(0, p - a) / (b - a)) / n) * 100;
    }
    return 100;
  };
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
        <div className="@container mt-5">
          <div className="relative h-2 rounded-full bg-[color-mix(in_oklab,var(--accent)_16%,var(--surface-2))]" role="meter" aria-label="Pontos de conhecimento" aria-valuemin={0} aria-valuemax={max} aria-valuenow={points} aria-valuetext={`${points} pontos, nível ${level.nome}`}>
            <div className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${pos(points)}%` }} />
            {LEVELS.map((l) => (
              <span key={l.id} aria-hidden className={cn('absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2', points >= l.minPoints ? 'border-accent bg-accent' : 'border-border bg-surface')} style={{ left: `${pos(l.minPoints)}%` }} />
            ))}
          </div>
          {/* em colunas estreitas (< 30rem) os rótulos passam a lista; acima, ficam por baixo de cada marca */}
          <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 @min-[30rem]:hidden" aria-label="Níveis">
            {LEVELS.map((l) => (
              <li key={l.id} className={cn('flex items-baseline gap-2 text-xs', points >= l.minPoints ? 'text-fg' : 'text-muted')}>
                <span aria-hidden className={cn('inline-block size-2 shrink-0 translate-y-[-1px] rounded-full border', points >= l.minPoints ? 'border-accent bg-accent' : 'border-border bg-surface')} />
                <span className="min-w-0 font-medium">{l.nome}</span>
                <span className="font-mono tnum">{l.minPoints}</span>
              </li>
            ))}
          </ol>
          <ol className="relative mt-2 hidden h-10 @min-[30rem]:block" aria-hidden>
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
