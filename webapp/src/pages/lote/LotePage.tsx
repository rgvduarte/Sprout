import { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import { useRichMotion } from '../../components/game';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { useData, useGame } from '../../state';
import { ChapterCiclo } from './ChapterCiclo';
import { ChapterColheita } from './ChapterColheita';
import { ChapterCompromisso } from './ChapterCompromisso';
import { ChapterFim } from './ChapterFim';
import { ChapterOrigem, useDiligence } from './ChapterOrigem';
import { ChapterPreco } from './ChapterPreco';
import { ChapterRiscos } from './ChapterRiscos';
import { JornadaNav, type NavChapter } from './JornadaNav';
import { PhaseTwoLot, UnknownLot } from './LoteStates';
import { endingFor, ENDING_LABEL, isAgentLot, WORLD_COPY, type ChapterId } from './model';
import { journeyBase, JourneyProvider, scrollToChapter, useEffectiveLot, useJourney, type Journey } from './shared';

/* =====================================================================
   Jornada do lote (/lote/:loteId): o ponto de investimento. Seis capítulos
   (Origem, Colheita, Preço, Ciclo, Riscos e Compromisso ou Acompanhamento);
   capítulos fixos com scroll em ecrãs largos, empilhados no telemóvel e com
   movimento reduzido.
   ===================================================================== */

function JornadaContent() {
  const { lot, goTo, ending, order } = useJourney();
  const game = useGame();
  const diligence = useDiligence();
  const copy = WORLD_COPY[lot.world];

  const read = game.riskRead(lot.id).filter((id) => lot.riskFactors.some((r) => r.id === id)).length;
  const total = lot.riskFactors.length;

  const chapters: NavChapter[] = useMemo(() => {
    const all: Record<string, NavChapter> = {
      origem: { id: 'origem', label: 'Origem' },
      colheita: { id: 'colheita', label: copy.colheitaNav, done: lot.analyses.length ? game.hasReadAnalysis(lot.id) : undefined },
      preco: { id: 'preco', label: 'Preço' },
      ciclo: { id: 'ciclo', label: 'Ciclo' },
      riscos: { id: 'riscos', label: 'Riscos', done: read >= total, count: `${read}/${total}` },
    };
    return order.map((id) => all[id] ?? { id, label: ENDING_LABEL[id] });
  }, [copy.colheitaNav, lot.analyses.length, lot.id, game, read, total, order]);

  // J / K: capítulo seguinte / anterior, só com o foco na barra de capítulos (WCAG 2.1.4: atalhos de uma
  // tecla não disparam enquanto se lê ou escreve noutro sítio da página)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k !== 'j' && k !== 'k') return;
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-chrome="jornada"]')) return;
      const line = window.innerHeight * 0.4;
      let idx = 0;
      chapters.forEach((c, i) => {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= line) idx = i;
      });
      const next = k === 'j' ? idx + 1 : idx - 1;
      if (next < 0 || next >= chapters.length) return;
      e.preventDefault();
      goTo(chapters[next].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chapters, goTo]);

  return (
    <>
      <JornadaNav chapters={chapters} lotId={lot.id} onGo={goTo} agent={isAgentLot(lot)} />
      <ChapterOrigem diligence={diligence} />
      <ChapterColheita label={copy.colheitaNav} />
      <ChapterPreco label="Preço" />
      {order.includes('ciclo') && <ChapterCiclo label="Ciclo" />}
      <ChapterRiscos label="Riscos" />
      {ending === 'compromisso' ? <ChapterCompromisso label="Compromisso" /> : <ChapterFim id={ending} label={ENDING_LABEL[ending]} />}
    </>
  );
}

function Jornada({ lotId }: { lotId: string }) {
  const { lot, positions } = useEffectiveLot(lotId);
  const richMotion = useRichMotion();
  const tall = useMediaQuery('(min-height: 720px)', true);
  const reduce = useReducedMotion() ?? false;
  const rich = richMotion && tall;
  const goTo = useCallback((id: string) => scrollToChapter(id, { reduce }), [reduce]);
  const value: Journey | null = useMemo(() => {
    if (!lot) return null;
    // um compromisso que feche o lote mantém o capítulo de compromisso (reflexão e cancelamento)
    const ending = lot.status === 'financiado' && positions.some((p) => p.session) ? 'compromisso' : endingFor(lot);
    // o cesto de água (modelo de agente) não tem financiamento nem janela de 18 meses: sem o capítulo do ciclo
    const order: ChapterId[] = isAgentLot(lot) ? ['origem', 'colheita', 'preco', 'riscos', ending] : ['origem', 'colheita', 'preco', 'ciclo', 'riscos', ending];
    return { lot, positions, rich, goTo, ending, order, ...journeyBase(lot) };
  }, [lot, positions, rich, goTo]);
  if (!value) return null;
  return (
    <div data-world={value.lot.world} className="min-w-0">
      <JourneyProvider value={value}>
        <JornadaContent />
      </JourneyProvider>
    </div>
  );
}

export default function LotePage() {
  const { loteId } = useParams();
  const data = useData();
  const lot = loteId ? data.getLot(loteId) : undefined;
  if (!lot) return <UnknownLot id={loteId} />;
  if (lot.status === 'fase-2') return <PhaseTwoLot lot={lot} />;
  return <Jornada key={lot.id} lotId={lot.id} />;
}
