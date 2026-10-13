import { ScrollProgress, type ScrollChapter } from '../../components/game';
import { CycleChapter } from './CycleChapter';
import { GameSection } from './GameScene';
import { Hook } from './Hook';
import { LotChapter } from './LotCloseUp';
import { PAGE_CSS, useTallViewport } from './parts';
import { Resolution } from './Resolution';
import { TrustChapter } from './TrustStack';
import { ValueChainChapter } from './ValueChain';

/* =====================================================================
   Apresentação (/apresentacao): a história da Sprout para roadshows e
   convites, em sete capítulos. O scroll nunca é sequestrado: capítulos
   fixos com orçamento ≤ 250vh; abaixo de 900 px, com pouca altura ou com
   movimento reduzido ficam empilhados no estado final.
   ===================================================================== */

const CHAPTERS: ScrollChapter[] = [
  { id: 'colheita', label: 'A colheita' },
  { id: 'cadeia', label: 'A cadeia hoje' },
  { id: 'lote', label: 'Um lote' },
  { id: 'ciclo', label: '18 meses' },
  { id: 'jogo', label: 'O jogo' },
  { id: 'confianca', label: 'Confiança' },
  { id: 'acesso', label: 'Acesso' },
];

export default function ApresentacaoPage() {
  const tall = useTallViewport();
  return (
    <div className="apr min-w-0">
      <style>{PAGE_CSS}</style>
      <ScrollProgress chapters={CHAPTERS} />
      <Hook />
      <ValueChainChapter tall={tall} />
      <LotChapter tall={tall} />
      <CycleChapter tall={tall} />
      <GameSection />
      <TrustChapter tall={tall} />
      <Resolution />
    </div>
  );
}
