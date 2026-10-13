import { Link } from 'react-router-dom';
import { ArrowRight, KeyRound } from 'lucide-react';
import { LevelGlyph, LevelProgress } from '../../components/game';
import { useGame } from '../../state';
import { LEVEL_PERKS, type Mission } from './missions';

/** Nível de conhecimento, a vantagem do próximo nível (conhecimento e acesso) e o caminho até lá. */
export function LevelPanel({ goal }: { goal?: Mission }) {
  const game = useGame();
  const next = game.nextLevel;
  return (
    <div className="min-w-0">
      <LevelProgress points={game.points} />
      <div className="mt-5 border-t border-border pt-4">
        {next ? (
          <>
            <p className="flex items-center gap-2 text-sm font-medium text-fg">
              <LevelGlyph level={next.id} className="size-4 text-accent" />
              Ao chegar a {next.nome}
            </p>
            <p className="mt-1 text-[0.9375rem] text-fg">{LEVEL_PERKS[next.id]}</p>
          </>
        ) : (
          <p className="text-[0.9375rem] text-fg">Chegaste ao nível máximo: {LEVEL_PERKS.mestre.toLowerCase()}</p>
        )}
        <p className="mt-2 flex items-start gap-2 text-sm text-muted">
          <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
          <span>
            Já tens: {LEVEL_PERKS[game.level.id].charAt(0).toLowerCase() + LEVEL_PERKS[game.level.id].slice(1)} Os níveis abrem conhecimento e acesso; nunca descontos, preços ou prioridade nos lotes.
          </span>
        </p>
      </div>
      {goal && goal.steps.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-fg">Módulos que te levam lá</p>
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
