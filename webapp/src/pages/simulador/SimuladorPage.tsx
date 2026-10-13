import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import { BookOpen } from 'lucide-react';
import { SIM_RULES, getQuest } from '../../data';
import type { SimRunResult } from '../../data/types';
import { Badge, ButtonLink, Page, PageHeader, Section, Stepper, Tabs } from '../../components/ui';
import { useGame, useRole } from '../../state';
import { now } from '../../lib/clock';
import { tidyText } from '../../lib/format';
import { SCENARIO_LOTS, monthLabel, shortName } from './deck';
import { simulate, type Allocation } from './engine';
import { DebriefPhase } from './DebriefPhase';
import { HistoryPanel } from './HistoryPanel';
import { LeaguePanel, pseudonymFor } from './LeaguePanel';
import { LEAGUE_SEED } from './league';
import { PlayPhase } from './PlayPhase';
import { decisionsFromResult, toResult } from './runs';
import { SetupPhase } from './SetupPhase';
import { useSimSession, type Phase } from './store';
import { SimBand } from './parts';

/* =====================================================================
   Simulador de campanha (/academia/simulador). O único sítio onde o
   retorno e o risco se jogam, sempre com dinheiro fictício.
   Preparar → Jogar (mês a mês) → Balanço (com "e se?").
   ===================================================================== */

const STEPS = [
  { id: 'preparar', label: 'Preparar', description: 'lotes e cobertura' },
  { id: 'jogar', label: 'Jogar', description: '18 meses' },
  { id: 'balanco', label: 'Balanço', description: 'e se?' },
];
const PHASE_INDEX: Record<Phase, number> = { setup: 0, play: 1, debrief: 2 };

/** Rascunho completo (todos os lotes do baralho) a partir de uma distribuição. */
function toDraft(allocations: Allocation[]): Allocation[] {
  return SCENARIO_LOTS.map((l) => {
    const a = allocations.find((x) => x.simLotId === l.id);
    return a ? { ...a } : { simLotId: l.id, amount: 0, hedged: false };
  });
}

export default function SimuladorPage() {
  const { profileId } = useRole();
  const [session, update] = useSimSession(profileId);
  const game = useGame();
  const reduce = useReducedMotion();
  const phaseRef = useRef<HTMLDivElement>(null);
  const phaseKey = `${session.phase}-${session.runNonce}`;
  const prevPhaseKey = useRef(phaseKey);

  const run = useMemo(() => {
    if (session.phase === 'setup' || !session.allocations.length) return null;
    return simulate(session.seed, session.allocations, session.decisions, { stopAtPending: session.phase === 'play' });
  }, [session.phase, session.seed, session.allocations, session.decisions]);

  // ao mudar de fase, leva o topo da fase ao ecrã (sem sequestrar o scroll)
  useEffect(() => {
    if (prevPhaseKey.current === phaseKey) return;
    prevPhaseKey.current = phaseKey;
    const el = phaseRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.6) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [phaseKey, reduce]);

  // Vinda da Jornada do lote (?lote=sim-…): põe o lote de cenário com os mesmos parâmetros no
  // baralho, com o montante mínimo, se ainda não estiver e houver espaço. Nunca troca a fase.
  const [params] = useSearchParams();
  const fromLot = params.get('lote');
  const [preselected, setPreselected] = useState<string | null>(null);
  useEffect(() => {
    if (!fromLot || session.phase !== 'setup' || !SCENARIO_LOTS.some((l) => l.id === fromLot)) return;
    setPreselected(fromLot);
    update((s) => {
      const current = s.draft.find((a) => a.simLotId === fromLot);
      if (!current || current.amount > 0) return {};
      const selected = s.draft.filter((a) => a.amount > 0);
      const used = selected.reduce((sum, a) => sum + a.amount, 0);
      if (selected.length >= 4 || SIM_RULES.budget - used < SIM_RULES.minAllocation) return {};
      return { draft: s.draft.map((a) => (a.simLotId === fromLot ? { ...a, amount: SIM_RULES.minAllocation } : a)) };
    });
    // só ao chegar com o parâmetro
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLot]);

  // a série de campanhas seguidas termina quando se sai do simulador
  useEffect(() => () => update({ streak: 0, pauseAcknowledgedAt: 0 }), [update]);

  const start = (seed: number, allocations: Allocation[]) => {
    update((s) => ({
      phase: 'play',
      seed,
      allocations: allocations.filter((a) => a.amount > 0).map((a) => ({ ...a })),
      decisions: {},
      month: 0,
      recordedRunId: undefined,
      reviewing: false,
      pointsAwarded: 0,
      runNonce: s.runNonce + 1,
      draft: toDraft(allocations),
      draftSeed: seed,
    }));
  };

  const openDebrief = () => {
    if (!run || !run.complete || !run.final) return;
    if (session.recordedRunId || session.reviewing) {
      update({ phase: 'debrief' });
      return;
    }
    const quest = getQuest('q-simulador');
    const questPts = quest && !game.isQuestDone(quest.id) ? quest.points : 0;
    const id = `sim-${profileId}-${game.simRuns.length + 1}-${session.seed}-${session.runNonce}`;
    game.recordSimRun(toResult(run, id, now().toISOString()));
    update((s) => ({ phase: 'debrief', recordedRunId: id, pointsAwarded: questPts, streak: s.streak + 1 }));
    // os pontos chegam pela missão «Joga uma campanha completa no simulador» (o aviso «Missão cumprida» já os anuncia); o balanço explica-os
  };

  const review = (r: SimRunResult) => {
    update((s) => ({ phase: 'debrief', seed: r.seed, allocations: r.allocations.map((a) => ({ ...a })), decisions: decisionsFromResult(r), reviewing: true, recordedRunId: r.id, pointsAwarded: 0, runNonce: s.runNonce + 1 }));
  };

  const stop = run ? (run.pending ? run.pending.month : run.end) : 0;

  return (
    <Page>
      <PageHeader
        title="Simulador de campanha"
        description={tidyText('Joga 18 meses de uma campanha com 50 000 € fictícios. Vês o que a cobertura, a reserva comum de primeira perda, a extensão e o refunding fazem ao resultado, incluindo campanhas que acabam em perda.')}
        meta={
          <>
            <Badge tone="info" dot>
              Dinheiro fictício
            </Badge>
            <Badge tone="neutral">
              Calendário de {monthLabel(1)} a {monthLabel(SIM_RULES.months)}
            </Badge>
          </>
        }
        actions={
          <ButtonLink to="/academia#m-simulacao-perdas" variant="ghost" iconLeft={<BookOpen aria-hidden className="size-4" strokeWidth={1.75} />}>
            Módulo: simular perdas
          </ButtonLink>
        }
      />
      <SimBand />
      {preselected && session.phase === 'setup' && (
        <p className="mt-3 text-sm text-muted" role="status">
          Vieste da jornada de um lote: o lote de cenário com os mesmos parâmetros, <span className="font-medium text-fg">{shortName(preselected)}</span>, está no baralho. Ajusta os montantes como quiseres.
        </p>
      )}

      <div ref={phaseRef} className="scroll-mt-[72px] pt-6">
        <Stepper steps={STEPS} current={PHASE_INDEX[session.phase]} className="mb-6" />

        {session.phase === 'setup' && <SetupPhase session={session} update={update} onStart={start} />}

        {session.phase === 'play' && run && (
          <PlayPhase
            key={`${session.seed}-${session.runNonce}`}
            run={run}
            month={Math.min(session.month, stop)}
            budget={SIM_RULES.budget}
            onAdvance={(n) => update((s) => ({ month: Math.min(stop, s.month + n) }))}
            onDecide={(key, choice) => update((s) => ({ decisions: { ...s.decisions, [key]: choice } }))}
            onOpenDebrief={openDebrief}
            onAbandon={() => update({ phase: 'setup' })}
          />
        )}

        {session.phase === 'debrief' && run?.final && (
          <DebriefPhase
            key={`${session.seed}-${session.runNonce}`}
            run={run}
            reviewing={Boolean(session.reviewing)}
            pointsAwarded={session.pointsAwarded}
            streak={session.streak}
            onReplay={start}
            onEdit={() => update({ phase: 'setup', draft: toDraft(session.allocations), draftSeed: session.seed })}
          />
        )}
      </div>

      <Section id="historico-liga" title="As tuas campanhas e a liga" description="O histórico guarda as campanhas jogadas nesta sessão. A liga é opcional, usa a mesma campanha para todos e só existe com dinheiro fictício." className="mt-14">
        <Tabs
          label="Histórico e liga"
          items={[
            {
              value: 'historico',
              label: 'Histórico',
              count: game.simRuns.length,
              content: <HistoryPanel runs={game.simRuns} onReview={review} onReplay={(r) => start(r.seed, r.allocations)} />,
            },
            {
              value: 'liga',
              label: 'Liga de campanha 2026/27',
              content: (
                <LeaguePanel
                  optIn={game.league.optIn}
                  pseudonym={pseudonymFor(game.league.pseudonymIndex)}
                  runs={game.simRuns}
                  onOptIn={(v) => game.setLeague({ optIn: v })}
                  onNextPseudonym={() => game.setLeague({ pseudonymIndex: game.league.pseudonymIndex + 1 })}
                  onPlaySeason={() => {
                    update({ phase: 'setup', draftSeed: LEAGUE_SEED });
                    phaseRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
                  }}
                />
              ),
            },
          ]}
        />
      </Section>
    </Page>
  );
}
