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
import { endingFor, ENDING_LABEL, WORLD_COPY } from './model';
import { journeyBase, JourneyProvider, scrollToChapter, useEffectiveLot, useJourney, type Journey } from './shared';

/* =====================================================================
   Jornada do lote (/lote/:loteId): o ponto de investimento. Seis capítulos
   (Origem, Colheita, Preço, Ciclo, Riscos e Compromisso ou Acompanhamento);
   capítulos fixos com scroll em ecrãs largos, empilhados no telemóvel e com
   movimento reduzido.
   ===================================================================== */

const STICKY = new Set(['colheita', 'preco', 'ciclo']);

function JornadaContent() {
  const { lot, goTo, ending } = useJourney();
  const game = useGame();
  const diligence = useDiligence();
  const copy = WORLD_COPY[lot.world];

  const read = game.riskRead(lot.id).filter((id) => lot.riskFactors.some((r) => r.id === id)).length;
  const total = lot.riskFactors.length;

  const chapters: NavChapter[] = useMemo(
    () => [
      { id: 'origem', label: 'Origem' },
      { id: 'colheita', label: copy.colheitaNav, done: lot.analyses.length ? game.hasReadAnalysis(lot.id) : undefined },
      { id: 'preco', label: 'Preço' },
      { id: 'ciclo', label: 'Ciclo' },
      { id: 'riscos', label: 'Riscos', done: read >= total, count: `${read}/${total}` },
      { id: ending, label: ENDING_LABEL[ending] },
    ],
    [copy.colheitaNav, lot.analyses.length, lot.id, game, read, total, ending],
  );

  // J / K: capítulo seguinte / anterior (fora de campos de texto e diálogos)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k !== 'j' && k !== 'k') return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="alertdialog"]')) return;
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
      <JornadaNav chapters={chapters} lotId={lot.id} onGo={goTo} />
      <ChapterOrigem diligence={diligence} />
      <ChapterColheita label={copy.colheitaNav} />
      <ChapterPreco label="Preço" />
      <ChapterCiclo label="Ciclo" />
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
  const goTo = useCallback((id: string) => scrollToChapter(id, { reduce, sticky: rich && STICKY.has(id) }), [reduce, rich]);
  const value: Journey | null = useMemo(() => {
    if (!lot) return null;
    // um compromisso que feche o lote mantém o capítulo de compromisso (reflexão e cancelamento)
    const ending = lot.status === 'financiado' && positions.some((p) => p.session) ? 'compromisso' : endingFor(lot);
    return { lot, positions, rich, goTo, ending, ...journeyBase(lot) };
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
