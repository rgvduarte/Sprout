import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LEVELS } from '../../data';
import { LevelGlyph } from '../../components/game';
import { Meter } from '../../components/ui';
import { useGame } from '../../state';
import { cn } from '../../lib/cn';
import { num } from '../../lib/format';
import { levelPerk, type Mission } from './missions';

/**
 * Escada dos níveis de conhecimento com o que cada um abre (conhecimento e
 * acesso, nunca vantagens financeiras) e o caminho até ao próximo.
 */
export function LevelPanel({ goal }: { goal?: Mission }) {
  const game = useGame();
  const next = game.nextLevel;
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted">
        <span className="font-mono text-fg tnum">{num(game.points)}</span> pontos de conhecimento
        {next && (
          <>
            {' '}
            · faltam <span className="font-mono text-fg tnum">{num(game.pointsToNext)}</span> para {next.nome}
          </>
        )}
      </p>
      <ol className="mt-4" aria-label="Níveis de conhecimento">
        {LEVELS.map((l, i) => {
          const reached = game.points >= l.minPoints;
          const current = l.id === game.level.id;
          const isNext = next?.id === l.id;
          const last = i === LEVELS.length - 1;
          return (
            <li key={l.id} className="relative flex gap-3 pb-5 last:pb-0" aria-current={current ? 'step' : undefined}>
              {!last && <span aria-hidden className={cn('absolute left-[17px] top-9 h-[calc(100%-32px)] w-0.5 rounded-full', game.points >= LEVELS[i + 1].minPoints ? 'bg-accent' : 'bg-border')} />}
              <span
                aria-hidden
                className={cn(
                  'relative inline-flex size-9 shrink-0 items-center justify-center rounded-full border-2',
                  reached ? 'border-accent bg-accent text-accent-fg' : isNext ? 'border-accent bg-surface text-accent' : 'border-border bg-surface text-muted',
                )}
              >
                <LevelGlyph level={l.id} className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className={cn('font-semibold leading-tight', reached || isNext ? 'text-fg' : 'text-muted')}>{l.nome}</span>
                  <span className="font-mono text-xs text-muted tnum">{num(l.minPoints)} pts</span>
                  {current && <span className="text-xs font-medium text-accent">o teu nível</span>}
                </p>
                <p className={cn('mt-0.5 text-sm', reached || isNext ? 'text-fg' : 'text-muted')}>
                  <span className="text-muted">{reached ? 'Já tens: ' : 'Abre: '}</span>
                  {levelPerk(l.id)}
                </p>
                {isNext && (
                  <Meter
                    className="mt-2"
                    value={game.levelProgress}
                    label={`Progresso até ${l.nome}`}
                    valueLabel={`${num(game.points)} de ${num(l.minPoints)} pts`}
                    size="sm"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-sm text-muted">Os níveis sobem com módulos, missões, mini-jogos e simulações. Nunca com o montante investido, e nunca dão descontos, melhores preços ou prioridade nos lotes.</p>
      {goal && goal.steps.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-sm font-medium text-fg">Módulos que te levam a {next?.nome}</p>
          <ul className="mt-1">
            {goal.steps.map((s) => (
              <li key={s.id}>
                <Link to={s.href} className="group flex min-h-11 items-center justify-between gap-3 border-b border-border text-sm text-fg no-underline last:border-b-0 hover:text-accent">
                  <span className="min-w-0">{s.label}</span>
                  <ArrowRight aria-hidden className="size-4 shrink-0 text-muted group-hover:text-accent" strokeWidth={1.75} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
