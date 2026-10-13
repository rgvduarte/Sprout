import { ArrowRight } from 'lucide-react';
import { getQuestsByWorld, getWorld } from '../../data';
import type { WorldId } from '../../data/types';
import { ButtonLink, Card, CardHeader, Meter } from '../../components/ui';
import { QuestList } from '../../components/game';
import { MONTHS_SHORT, num } from '../../lib/format';
import { useGame } from '../../state';
import { miniGameFor } from './model';

/* =====================================================================
   Aprender o mundo: vocabulário, calendário, missões de conhecimento e o
   mini-jogo. Os pontos vêm só daqui; nunca do dinheiro.
   ===================================================================== */

function MiniGameArt({ world }: { world: WorldId }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 96 72" aria-hidden className="h-[72px] w-24 shrink-0 text-world-ink">
      {world === 'azeite' && (
        <g {...common}>
          {/* copo de prova com tampa de vidro de relógio */}
          <path d="M30 22 C30 46, 34 56, 48 56 C62 56, 66 46, 66 22 Z" />
          <path d="M33 40 C38 43, 58 43, 63 40" />
          <path d="M30 40 C30 51, 37 56, 48 56 C59 56, 66 51, 66 40 C59 44, 37 44, 30 40 Z" fill="var(--world)" fillOpacity={0.55} stroke="none" />
          <path d="M26 17 C38 12, 58 12, 70 17" />
          <path d="M40 62 L56 62" />
        </g>
      )}
      {world === 'agua' && (
        <g {...common}>
          {/* garrafa com rótulo */}
          <path d="M43 8 H53 V14 C53 18, 60 20, 60 28 V62 C60 65, 58 66, 56 66 H40 C38 66, 36 65, 36 62 V28 C36 20, 43 18, 43 14 Z" />
          <rect x="36" y="34" width="24" height="18" fill="var(--world)" fillOpacity={0.35} />
          <path d="M40 40 H56 M40 45 H52" />
          <path d="M70 30 H86 M70 38 H82 M70 46 H86" opacity={0.7} />
        </g>
      )}
      {world === 'cafe' && (
        <g {...common}>
          {/* cereja → grão → chávena */}
          <circle cx="16" cy="36" r="9" fill="var(--world)" fillOpacity={0.45} />
          <path d="M16 27 C17 22, 20 19, 24 18" />
          <path d="M30 36 H36" />
          <ellipse cx="46" cy="36" rx="6" ry="8.5" transform="rotate(25 46 36)" />
          <path d="M43 42 C46 38, 47 34, 49 30" />
          <path d="M58 36 H64" />
          <path d="M68 30 H88 V38 C88 45, 83 48, 78 48 C73 48, 68 45, 68 38 Z" />
          <path d="M88 33 C92 33, 92 39, 88 39" />
        </g>
      )}
    </svg>
  );
}

export function LearnWorld({ world }: { world: WorldId }) {
  const w = getWorld(world);
  const game = useGame();
  const quests = getQuestsByWorld(world);
  const done = quests.filter((q) => game.isQuestDone(q.id));
  const earned = done.reduce((s, q) => s + q.points, 0);
  const possible = quests.reduce((s, q) => s + q.points, 0);
  const mg = miniGameFor(world);
  const best = game.miniGameBest(mg.id);
  const mgPoints = best !== undefined ? Math.round((Math.min(best, mg.maxScore) / mg.maxScore) * mg.maxPoints) : 0;

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <Card>
        <CardHeader title={`O vocabulário d${world === 'azeite' ? 'o' : 'a'} ${w.nome.replace(/^(O|A) /, '')}`} description="As palavras que aparecem nas análises, nos diários e nos contratos." />
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {w.vocabulario.map((t) => (
            <div key={t.termo} className="min-w-0">
              <dt className="font-display text-[1.0625rem] font-semibold text-fg">{t.termo}</dt>
              <dd className="mt-0.5 text-[0.9375rem] text-muted">{t.definicao}</dd>
            </div>
          ))}
        </dl>

        <hr className="my-6 border-border" />
        <h3 className="text-[1.0625rem]">Calendário: {w.season.label}</h3>
        <ol className="mt-3 flex flex-col gap-3">
          {w.season.phases.map((ph) => (
            <li key={ph.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
              <span className="font-mono text-sm text-world-ink tnum">
                {MONTHS_SHORT[ph.startMonth - 1]}–{MONTHS_SHORT[ph.endMonth - 1]}
              </span>
              <span className="min-w-0">
                <span className="font-medium text-fg">{ph.label}</span>
                <span className="block text-sm text-muted">{ph.description}</span>
              </span>
            </li>
          ))}
        </ol>

        <hr className="my-6 border-border" />
        <h3 className="text-[1.0625rem]">A unidade física</h3>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted">Contentor</dt>
            <dd className="text-fg">{w.physical.container}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Capacidade</dt>
            <dd className="font-mono text-[0.9375rem] text-fg tnum">{w.physical.containerCapacity}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Armazenagem</dt>
            <dd className="text-fg">{w.physical.storage}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-muted">
          <strong className="font-semibold text-fg">Cobertura de preço: {w.hedge.label}.</strong> {w.hedge.description}
        </p>
      </Card>

      <div className="flex min-w-0 flex-col gap-6">
        <Card>
          <CardHeader title="Missões de conhecimento" description="Pequenas tarefas de diligência. Dão pontos de conhecimento, nunca vantagens financeiras." />
          <Meter value={quests.length ? done.length / quests.length : 0} label={`${done.length} de ${quests.length} cumpridas`} valueLabel={`${num(earned)} de ${num(possible)} pts`} tone={world} />
          <QuestList className="mt-2" quests={quests} isDone={game.isQuestDone} completedAt={game.questCompletedAt} showWorld={false} />
        </Card>

        <Card tinted data-world={world} className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <MiniGameArt world={world} />
            <div className="min-w-0">
              <h3 className="text-[1.1875rem] leading-tight">{mg.title}</h3>
              <p className="mt-1 text-[0.9375rem] text-muted">{mg.summary}</p>
            </div>
          </div>
          <p className="text-sm text-world-ink">
            {best !== undefined ? (
              <>
                Melhor jogada: <span className="font-mono tnum">{best} de {mg.maxScore}</span> · <span className="font-mono tnum">{mgPoints} de {mg.maxPoints} pts</span>
              </>
            ) : (
              <>
                Ainda não jogaste · até <span className="font-mono tnum">{mg.maxPoints} pts</span> de conhecimento
              </>
            )}
          </p>
          <ButtonLink to={`/academia#${mg.id}`} variant="primary" className="self-start" iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
            {best !== undefined ? 'Jogar outra vez' : `Jogar ${mg.title}`}
          </ButtonLink>
        </Card>
      </div>
    </div>
  );
}
