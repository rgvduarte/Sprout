import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Target } from 'lucide-react';
import { Button, Meter } from '../../components/ui';
import { getModule, getQuest } from '../../data';
import { useGame, useRole, useToast, type GameView } from '../../state';
import { now } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { date as fmtDate } from '../../lib/format';
import { GOALS, type GoalItem, type LearningGoal as Goal } from './content';
import { setGoal, useAcademiaLocal } from './localStore';

function itemInfo(item: GoalItem, game: GameView): { label: string; done: boolean; href: string } {
  if (item.kind === 'module') {
    const m = getModule(item.id)!;
    return { label: `Módulo: ${m.title}`, done: game.isModuleDone(item.id), href: `/academia#${item.id}` };
  }
  const q = getQuest(item.id)!;
  return { label: q.title, done: game.isQuestDone(item.id), href: q.href };
}

function goalProgress(goal: Goal, game: GameView) {
  const items = goal.items.map((it) => itemInfo(it, game));
  return { items, done: items.filter((i) => i.done).length, total: items.length };
}

/** Objetivo de aprendizagem com progresso (escolhido pelo utilizador). */
export function LearningGoalPanel() {
  const game = useGame();
  const { profileId } = useRole();
  const local = useAcademiaLocal(profileId);
  const { toast } = useToast();
  const [choosing, setChoosing] = useState(false);
  const current = GOALS.find((g) => g.id === local.goal);
  const showChooser = choosing || !current;

  const choose = (g: Goal) => {
    setGoal(profileId, g.id, now().toISOString());
    setChoosing(false);
    toast({ tone: 'accent', title: 'Objetivo definido', description: g.title });
  };

  return (
    <section aria-labelledby="objetivo-title" className="rounded-md border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-start gap-2.5">
        <Target aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.75} />
        <div className="min-w-0">
          <h3 id="objetivo-title" className="text-[1.0625rem] leading-tight">
            Objetivo de aprendizagem
          </h3>
          <p className="mt-0.5 text-sm text-muted">{current && !choosing ? `Definido a ${fmtDate(local.goalSetAt ?? now())}` : 'Escolhe o que queres dominar primeiro. Podes mudar quando quiseres.'}</p>
        </div>
      </div>

      {showChooser ? (
        <fieldset className="mt-4">
          <legend className="sr-only">Objetivos disponíveis</legend>
          <ul className="flex flex-col gap-2">
            {GOALS.map((g) => {
              const p = goalProgress(g, game);
              const selected = g.id === local.goal;
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => choose(g)}
                    aria-pressed={selected}
                    className={cn(
                      'w-full rounded-sm border px-3 py-2.5 text-left transition-colors duration-150',
                      selected ? 'border-accent bg-accent-soft' : 'border-border hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--border))] hover:bg-surface-2',
                    )}
                  >
                    <span className="block font-medium leading-snug text-fg">{g.title}</span>
                    <span className="mt-0.5 block text-sm text-muted">{g.why}</span>
                    <span className="mt-1 block font-mono text-xs text-muted tnum">
                      {p.done} de {p.total} feitos
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {current && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setChoosing(false)}>
              Manter «{current.title}»
            </Button>
          )}
        </fieldset>
      ) : (
        <GoalDetail goal={current!} game={game} onChange={() => setChoosing(true)} />
      )}
    </section>
  );
}

function GoalDetail({ goal, game, onChange }: { goal: Goal; game: GameView; onChange: () => void }) {
  const p = goalProgress(goal, game);
  const complete = p.done === p.total;
  return (
    <div className="mt-4">
      <p className="font-medium leading-snug text-fg">{goal.title}</p>
      <Meter className="mt-3" value={p.done / p.total} label={complete ? 'Objetivo cumprido' : 'Progresso do objetivo'} valueLabel={`${p.done} de ${p.total}`} />
      <ul className="mt-3 flex flex-col">
        {p.items.map((it) => (
          <li key={it.label} className="flex min-w-0 items-start gap-2.5 py-1.5">
            <span
              aria-hidden
              className={cn(
                'mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border-2',
                it.done ? 'border-accent bg-accent text-accent-fg' : 'border-[color-mix(in_oklab,var(--fg)_28%,var(--border))]',
              )}
            >
              {it.done && <Check className="size-3" strokeWidth={3} />}
            </span>
            {it.done ? (
              <span className="min-w-0 text-sm text-muted">
                {it.label}
                <span className="sr-only"> · feito</span>
              </span>
            ) : (
              <Link to={it.href} className="min-w-0 text-sm text-fg underline decoration-[color-mix(in_oklab,var(--accent)_45%,transparent)] underline-offset-[0.2em] hover:decoration-accent">
                {it.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {complete && <p className="mt-2 text-sm text-fg">Cumpriste este objetivo. Escolhe o próximo.</p>}
      <Button variant="secondary" size="sm" className="mt-3" onClick={onChange}>
        {complete ? 'Escolher o próximo objetivo' : 'Mudar de objetivo'}
      </Button>
    </div>
  );
}
