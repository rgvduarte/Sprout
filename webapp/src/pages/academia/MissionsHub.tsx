import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, Zap } from 'lucide-react';
import { Button, CommodityGlyph, EmptyState, Meter, SegmentedControl } from '../../components/ui';
import { getLot, getMiniGame, getModule, getProducer, getRegion, getSeal, getWorld, QUESTS } from '../../data';
import type { Quest, WorldId } from '../../data/types';
import { useGame, type GameView } from '../../state';
import { TODAY } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { date as fmtDate, num } from '../../lib/format';

/* =====================================================================
   Central de missões: todas as missões, o gatilho de cada uma e o
   progresso ao vivo. Os gatilhos são eventos de conhecimento e
   diligência; nunca depósitos, montantes ou volume.
   ===================================================================== */

type StateFilter = 'todas' | 'por-fazer' | 'cumpridas';
type WorldFilter = 'todos' | WorldId | 'geral';

const GROUPS: { id: string; title: string; description: string; test: (q: Quest) => boolean }[] = [
  { id: 'lotes', title: 'Diligência nos lotes', description: 'Ler o que está por trás de um lote antes de decidir.', test: (q) => Boolean(q.lotId) || q.href.startsWith('/lote/') },
  { id: 'aprender', title: 'Aprender e jogar', description: 'Módulos, mini-jogos e o simulador de campanha.', test: (q) => ['module', 'minigame', 'sim-complete'].includes(q.criteria.type) },
  { id: 'explorar', title: 'Explorar os mundos', description: 'Mapas de origens, produtores e preços de referência.', test: () => true },
];

function groupOf(q: Quest) {
  return GROUPS.find((g) => g.test(q))!.id;
}

export interface QuestProgress {
  done: boolean;
  value: number;
  total: number;
  text: string;
}

export function questProgress(q: Quest, game: GameView): QuestProgress {
  const done = game.isQuestDone(q.id);
  const c = q.criteria;
  switch (c.type) {
    case 'module': {
      const m = getModule(c.moduleId);
      const ok = game.isModuleDone(c.moduleId);
      return { done, value: ok ? 1 : 0, total: 1, text: ok ? `Módulo «${m?.title}» concluído` : `Módulo «${m?.title}» por concluir` };
    }
    case 'minigame': {
      const best = game.miniGameBest(c.gameId) ?? 0;
      return { done, value: Math.min(best, c.minScore), total: c.minScore, text: best ? `Melhor resultado: ${best} · precisa de ${c.minScore}` : `Ainda não jogado · precisa de ${c.minScore} certas` };
    }
    case 'risk-read': {
      const lot = getLot(c.lotId);
      const total = lot?.riskFactors.length ?? 0;
      const read = game.riskRead(c.lotId).filter((id) => lot?.riskFactors.some((r) => r.id === id)).length;
      return { done, value: done ? total : read, total, text: `${done ? total : read} de ${total} fatores lidos` };
    }
    case 'analysis-read': {
      const ok = game.hasReadAnalysis(c.lotId);
      return { done, value: ok ? 1 : 0, total: 1, text: ok ? 'Boletim aberto' : 'Boletim por abrir' };
    }
    case 'sim-complete':
      return { done, value: game.simRuns.length > 0 ? 1 : 0, total: 1, text: game.simRuns.length > 0 ? `${game.simRuns.length} ${game.simRuns.length === 1 ? 'campanha jogada' : 'campanhas jogadas'}` : 'Nenhuma campanha jogada' };
    default:
      return { done, value: done ? 1 : 0, total: 1, text: done ? 'Cumprida' : 'Por fazer' };
  }
}

/** O evento que fecha a missão, em linguagem simples. */
export function triggerText(q: Quest): string {
  const c = q.criteria;
  switch (c.type) {
    case 'module':
      return `Concluir o módulo «${getModule(c.moduleId)?.title}».`;
    case 'minigame':
      return `O melhor resultado no ${getMiniGame(c.gameId).title} chegar a ${c.minScore} respostas certas.`;
    case 'risk-read':
      return `Abrir o último dos ${getLot(c.lotId)?.riskFactors.length ?? ''} fatores de risco do lote ${c.lotId}.`;
    case 'analysis-read':
      return `Abrir o boletim de análises do lote ${c.lotId}.`;
    case 'sim-complete':
      return 'Ler o balanço final de uma campanha no simulador.';
    case 'region-visit':
      return `Abrir a região ${getRegion(c.regionId)?.nome ?? ''} no mapa de origens.`;
    case 'world-visit':
      return `Entrar no mundo ${getWorld(c.worldId).nome}.`;
    case 'manual':
      return 'Encontrar a informação no ecrã indicado; a missão fecha aí.';
  }
}

function actionLabel(q: Quest): string {
  const c = q.criteria;
  if (c.type === 'module') return 'Abrir módulo';
  if (c.type === 'minigame') return 'Jogar';
  if (c.type === 'sim-complete') return 'Abrir simulador';
  if (c.type === 'world-visit') return 'Entrar no mundo';
  if (c.type === 'region-visit') return 'Abrir o mapa';
  if (q.href.startsWith('/lote/')) return 'Abrir o lote';
  return 'Ir';
}

const WORLD_LABEL: Record<WorldId, string> = { azeite: 'Azeite', agua: 'Água', cafe: 'Café' };

export function MissionsHub() {
  const game = useGame();
  const [stateFilter, setStateFilter] = useState<StateFilter>('todas');
  const [worldFilter, setWorldFilter] = useState<WorldFilter>('todos');

  const doneCount = QUESTS.filter((q) => game.isQuestDone(q.id)).length;
  const donePoints = QUESTS.filter((q) => game.isQuestDone(q.id)).reduce((s, q) => s + q.points, 0);
  const totalPoints = QUESTS.reduce((s, q) => s + q.points, 0);

  const visible = useMemo(
    () =>
      QUESTS.filter((q) => (worldFilter === 'todos' ? true : q.world === worldFilter)).filter((q) =>
        stateFilter === 'todas' ? true : stateFilter === 'cumpridas' ? game.isQuestDone(q.id) : !game.isQuestDone(q.id),
      ),
    [worldFilter, stateFilter, game],
  );

  return (
    <div className="min-w-0">
      <div className="mb-5 flex min-w-0 flex-wrap items-end gap-3">
        <SegmentedControl<StateFilter>
          label="Estado das missões"
          value={stateFilter}
          onChange={setStateFilter}
          options={[
            { value: 'todas', label: 'Todas' },
            { value: 'por-fazer', label: `Por fazer · ${QUESTS.length - doneCount}` },
            { value: 'cumpridas', label: `Cumpridas · ${doneCount}` },
          ]}
        />
        <SegmentedControl<WorldFilter>
          label="Mundo"
          value={worldFilter}
          onChange={setWorldFilter}
          size="md"
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'geral', label: 'Geral' },
            { value: 'azeite', label: 'Azeite' },
            { value: 'agua', label: 'Água' },
            { value: 'cafe', label: 'Café' },
          ]}
        />
      </div>
      <p className="mb-4 text-sm text-muted" aria-live="polite">
        <span className="font-mono text-fg tnum">{doneCount}</span> de <span className="font-mono tnum">{QUESTS.length}</span> missões cumpridas · <span className="font-mono text-fg tnum">{num(donePoints)}</span> de{' '}
        <span className="font-mono tnum">{num(totalPoints)}</span> pontos das missões
      </p>

      {visible.length === 0 ? (
        <EmptyState
          title={stateFilter === 'por-fazer' ? 'Nada por fazer com estes filtros' : 'Sem missões com estes filtros'}
          body={stateFilter === 'por-fazer' ? 'Cumpriste todas as missões deste mundo. Há mais nos outros mundos.' : 'Muda o mundo ou o estado para ver mais missões.'}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setStateFilter('todas');
                setWorldFilter('todos');
              }}
            >
              Ver todas as missões
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          {GROUPS.map((g) => {
            const list = visible.filter((q) => groupOf(q) === g.id).sort((a, b) => Number(game.isQuestDone(a.id)) - Number(game.isQuestDone(b.id)));
            if (!list.length) return null;
            const groupDone = QUESTS.filter((q) => groupOf(q) === g.id && game.isQuestDone(q.id)).length;
            const groupTotal = QUESTS.filter((q) => groupOf(q) === g.id).length;
            return (
              <section key={g.id} aria-labelledby={`grupo-${g.id}`} className="min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-2">
                  <h3 id={`grupo-${g.id}`} className="text-[1.0625rem]">
                    {g.title}
                  </h3>
                  <p className="font-mono text-sm text-muted tnum">
                    {groupDone}/{groupTotal}
                  </p>
                </div>
                <ul className="divide-y divide-border">
                  {list.map((q) => (
                    <MissionRow key={q.id} quest={q} game={game} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MissionRow({ quest: q, game }: { quest: Quest; game: GameView }) {
  const reduce = useReducedMotion();
  const p = questProgress(q, game);
  const at = game.questCompletedAt(q.id);
  const justNow = Boolean(at && new Date(at).getTime() >= TODAY.getTime());
  const seal = q.sealId ? getSeal(q.sealId) : undefined;
  const sealProducer = seal ? getProducer(seal.producerId) : undefined;
  const multi = p.total > 1;
  return (
    <li className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      <span aria-hidden className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center">
        {p.done ? (
          <motion.span
            key="done"
            className="inline-flex size-6 items-center justify-center rounded-full bg-accent text-accent-fg"
            initial={justNow && !reduce ? { scale: 0.4, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Check className="size-3.5" strokeWidth={3} />
          </motion.span>
        ) : (
          <span className="inline-flex size-6 rounded-full border-2 border-[color-mix(in_oklab,var(--fg)_28%,var(--border))]" />
        )}
      </span>
      <div className="min-w-0">
        <p className={cn('font-medium leading-snug', p.done ? 'text-muted' : 'text-fg')}>
          {q.title}
          <span className="sr-only">{p.done ? ' · cumprida' : ' · por fazer'}</span>
        </p>
        {!p.done && <p className="mt-0.5 text-sm text-muted">{q.description}</p>}
        <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted">
          <Zap aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
          <span>
            <span className="text-fg">Gatilho:</span> {triggerText(q)}
          </span>
        </p>
        {!p.done && multi && <Meter className="mt-2 max-w-[340px]" size="sm" value={p.value / p.total} label={p.text} valueLabel={`${p.value}/${p.total}`} tone={q.world === 'geral' ? 'accent' : q.world} />}
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span className="font-mono tnum text-fg">+{q.points} pts</span>
          {q.world !== 'geral' && (
            <span className="inline-flex items-center gap-1">
              <CommodityGlyph world={q.world} className="size-3.5" />
              {WORLD_LABEL[q.world]}
            </span>
          )}
          {seal && sealProducer && (
            <span className="inline-flex items-center gap-1.5">
              <WaxDrop />
              Selo {sealProducer.nome} · {seal.campanha}
            </span>
          )}
          {!multi && !p.done && <span>{p.text}</span>}
          {p.done && at && (justNow ? <span className="font-medium text-accent">cumprida agora</span> : <span>cumprida a {fmtDate(at)}</span>)}
        </p>
      </div>
      {!p.done && (
        <Link
          to={q.href}
          className="col-start-2 mt-2 inline-flex min-h-11 items-center gap-1 justify-self-start text-sm font-medium text-accent hover:underline sm:col-start-3 sm:row-start-1 sm:mt-0 sm:self-start sm:justify-self-end sm:px-1"
          aria-label={`${actionLabel(q)}: ${q.title}`}
        >
          {actionLabel(q)}
          <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
        </Link>
      )}
    </li>
  );
}

/** Gota de lacre: a missão conta para um selo de origem. */
function WaxDrop() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden className="size-3 shrink-0">
      <path d="M6 .8c1.1.3 1.6 1.3 2.7 1.5 1 .7.6 1.9 1.3 2.8.5 1 0 1.9-.4 2.8-.3 1.1-1.3 1.4-2 2.1-.9.6-1.9.4-2.9.3-1-.2-1.9-.7-2.5-1.5C1.5 7.9.8 7 1 5.9c.1-1 .9-1.7 1.4-2.6C3 2.3 4.8.5 6 .8z" fill="var(--seal)" />
      <circle cx="6" cy="6" r="2.2" fill="none" stroke="var(--seal-on)" strokeWidth="0.9" />
    </svg>
  );
}
