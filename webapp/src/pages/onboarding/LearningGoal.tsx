import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LEVELS, MINI_GAMES, MODULES, QUESTS, getWorld } from '../../data';
import type { LevelId, WorldId } from '../../data/types';
import { Button, CommodityGlyph, Meter, RadioGroup, SegmentedControl } from '../../components/ui';
import { KnowledgeLevelBadge } from '../../components/game';
import { useGame, useToast, type ProfileId } from '../../state';
import { now } from '../../lib/clock';
import { date as fmtDate, num } from '../../lib/format';
import { cn } from '../../lib/cn';
import { useLearningGoal } from './learningGoal';

/* =====================================================================
   Objetivo de aprendizagem: a última missão do registo. Escolhe-se um
   mundo e um nível; o progresso mede-se só em pontos de conhecimento.
   ===================================================================== */

interface NextStep {
  id: string;
  kind: 'Módulo' | 'Mini-jogo' | 'Missão';
  title: string;
  points: number;
  href: string;
}

function useNextSteps(world: WorldId, limit = 4): NextStep[] {
  const game = useGame();
  const own = MODULES.filter((m) => m.world === world && !game.isModuleDone(m.id)).map<NextStep>((m) => ({ id: m.id, kind: 'Módulo', title: m.title, points: m.points, href: `/academia#${m.id}` }));
  const games = MINI_GAMES.filter((g) => g.world === world)
    .map<NextStep | null>((g) => {
      const best = game.miniGameBest(g.id) ?? 0;
      const left = g.maxPoints - Math.round((Math.min(best, g.maxScore) / g.maxScore) * g.maxPoints);
      return left > 0 ? { id: g.id, kind: 'Mini-jogo', title: g.title, points: left, href: `/academia#${g.id}` } : null;
    })
    .filter((x): x is NextStep => x !== null);
  const quests = QUESTS.filter((q) => q.world === world && !game.isQuestDone(q.id)).map<NextStep>((q) => ({ id: q.id, kind: 'Missão', title: q.title, points: q.points, href: q.href }));
  const general = MODULES.filter((m) => m.world === 'geral' && !game.isModuleDone(m.id)).map<NextStep>((m) => ({ id: m.id, kind: 'Módulo', title: m.title, points: m.points, href: `/academia#${m.id}` }));
  return [...own, ...games, ...quests, ...general].slice(0, limit);
}

/** «pelo Olival», «pela Nascente», «pela Plantação». */
const POR: Record<WorldId, string> = { azeite: 'pelo Olival', agua: 'pela Nascente', cafe: 'pela Plantação' };
/** «no Olival», «na Nascente», «na Plantação». */
const EM: Record<WorldId, string> = { azeite: 'no Olival', agua: 'na Nascente', cafe: 'na Plantação' };

const WORLD_HINT: Record<WorldId, string> = {
  azeite: 'Lagares, depósitos, painel de prova e cobertura por venda a prazo.',
  agua: 'Tipos de água, rótulos, paletes e prazos de venda.',
  cafe: 'Fase 2 · abre em 2027. Origens, processos e futuros ICE KC, por agora só na Academia.',
};

export function LearningGoalPanel({ profileId, className, headingLevel = 2 }: { profileId: ProfileId; className?: string; headingLevel?: 2 | 3 }) {
  const game = useGame();
  const { toast } = useToast();
  const [goal, setGoal] = useLearningGoal(profileId);
  const options = LEVELS.filter((l) => l.minPoints > game.points);
  const [world, setWorld] = useState<WorldId>(goal?.world ?? 'azeite');
  const [level, setLevel] = useState<LevelId | undefined>(goal?.level ?? options[0]?.id);
  const [editing, setEditing] = useState(false);
  const steps = useNextSteps(goal?.world ?? world);
  const H = headingLevel === 2 ? 'h2' : 'h3';
  const hid = useId().replace(/:/g, '');

  const target = goal ? LEVELS.find((l) => l.id === goal.level)! : undefined;
  const showForm = !goal || editing;
  const chosenLevel = level && options.some((o) => o.id === level) ? level : options[0]?.id;

  const save = () => {
    if (!chosenLevel) return;
    const lv = LEVELS.find((l) => l.id === chosenLevel)!;
    setGoal({ world, level: chosenLevel, setAt: now().toISOString() });
    setEditing(false);
    toast({
      tone: 'accent',
      title: `Objetivo definido: ${lv.nome}, a começar ${POR[world]}`,
      description: `Faltam ${num(Math.max(0, lv.minPoints - game.points))} pontos de conhecimento. Os pontos vêm de módulos, missões e mini-jogos.`,
    });
  };

  return (
    <section aria-labelledby={`lg-${hid}`} className={cn('min-w-0 rounded-md border border-border bg-surface p-5 sm:p-6', className)}>
      <div>
        <div className="min-w-0">
          <H id={`lg-${hid}`} className="text-[1.1875rem] leading-tight">
            {showForm ? 'Define o teu objetivo de aprendizagem' : `Objetivo: ${target!.nome}, a começar ${POR[goal!.world]}`}
          </H>
          <p className="max-w-[60ch] mt-1 text-sm text-muted">
            {showForm
              ? 'A última missão do registo. Escolhe por onde começas e até onde queres chegar. Medimos só pontos de conhecimento, nunca dinheiro.'
              : `Definido a ${fmtDate(goal!.setAt)}. Medimos só pontos de conhecimento, nunca dinheiro.`}
          </p>
        </div>
      </div>

      {showForm ? (
        options.length === 0 ? (
          <p className="mt-4 text-fg">
            Já és <KnowledgeLevelBadge level={game.level} size="sm" className="mx-1 align-middle" />. Não há nível acima: o que falta aprender está nas missões dos três mundos.
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-5">
            <RadioGroup<WorldId>
              legend="Por onde começas"
              name={`lg-world-${hid}`}
              value={world}
              onChange={setWorld}
              options={(['azeite', 'agua', 'cafe'] as WorldId[]).map((w) => ({
                value: w,
                label: (
                  <span className="inline-flex items-center gap-2">
                    <CommodityGlyph world={w} className={cn('size-4', w === 'azeite' ? 'text-azeite-ink' : w === 'agua' ? 'text-agua-ink' : 'text-cafe-ink')} />
                    {getWorld(w).nome}
                  </span>
                ),
                description: WORLD_HINT[w],
              }))}
            />
            <div>
              <p className="mb-1.5 text-sm font-medium text-fg">Até onde queres chegar</p>
              <SegmentedControl<LevelId>
                label="Nível de conhecimento a alcançar"
                value={chosenLevel!}
                onChange={setLevel}
                options={options.map((l) => ({ value: l.id, label: l.nome }))}
                className="flex-wrap"
              />
              <p className="mt-2 text-sm text-muted">
                Tens <span className="font-mono text-fg tnum">{num(game.points)}</span> pontos ({game.level.nome}).{' '}
                {chosenLevel && (
                  <>
                    {LEVELS.find((l) => l.id === chosenLevel)!.nome} pede <span className="font-mono text-fg tnum">{num(LEVELS.find((l) => l.id === chosenLevel)!.minPoints)}</span>.
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={save}>
                Definir objetivo
              </Button>
              {editing && (
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Manter o atual
                </Button>
              )}
            </div>
          </div>
        )
      ) : (
        <div className="mt-5">
          {game.points >= target!.minPoints ? (
            <p className="text-fg">
              Objetivo cumprido: chegaste a <KnowledgeLevelBadge level={target!} size="sm" className="mx-1 align-middle" />.
            </p>
          ) : (
            <Meter
              value={game.points / target!.minPoints}
              label={`Pontos até ${target!.nome}`}
              valueLabel={`${num(game.points)} / ${num(target!.minPoints)}`}
            />
          )}
          {steps.length > 0 && (
            <>
              <p className="mt-5 text-sm font-medium text-fg">Próximos passos {EM[goal!.world]}</p>
              <ul className="mt-1 divide-y divide-border">
                {steps.map((s) => (
                  <li key={s.id} className="flex min-w-0 items-center gap-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9375rem] leading-snug text-fg">{s.title}</p>
                      <p className="text-sm text-muted">
                        {s.kind} · <span className="font-mono tnum">+{s.points} pts</span>
                      </p>
                    </div>
                    <Link to={s.href} className="inline-flex min-h-11 shrink-0 items-center gap-1 px-1 text-sm font-medium text-accent hover:underline" aria-label={`Abrir: ${s.title}`}>
                      Abrir
                      <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setWorld(goal!.world);
                setLevel(options[0]?.id);
                setEditing(true);
              }}
            >
              Mudar objetivo
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
