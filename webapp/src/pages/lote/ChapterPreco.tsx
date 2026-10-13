import { useCallback, useRef } from 'react';
import { useMotionValueEvent, type MotionValue } from 'motion/react';
import { CHAIN_DIFFERENTIAL, MARKET_TODAY, OLIVE_CHAIN_FACTS, PRODUCER_PRICE_TODAY, priceUnit } from '../../data';
import { Chapter } from '../../components/game';
import { cn } from '../../lib/cn';
import { num, pct, price, tidyText } from '../../lib/format';
import { useGame } from '../../state';
import { marginSplit, priceDecimals, referenceChange } from './model';
import { PriceChart } from './PriceChart';
import { ChapterHeading, CHROME_H, useDwell, useJourney, Wrap } from './shared';

/* =====================================================================
   Capítulo 3 · O preço. Referência vs preço do lote, com a banda de
   desconto ao comprador e a margem que paga o ciclo.
   ===================================================================== */

function PrecoBody({ progress, rich }: { progress: MotionValue<number>; rich: boolean }) {
  const { lot, win } = useJourney();
  const game = useGame();
  const ref = useRef<HTMLDivElement>(null);
  const e = lot.economics;
  const unit = priceUnit(lot);
  const d = priceDecimals(lot);
  const split = marginSplit(lot);
  const change = referenceChange(lot);
  const today = MARKET_TODAY[lot.world];
  const fmt = (v: number) => tidyText(price(v, unit, d));
  const trigger = lot.hedge.trigger?.match(/(\d+,\d+)\s€\/kg/)?.[1];
  const diff = CHAIN_DIFFERENTIAL[lot.world];
  const producerToday = PRODUCER_PRICE_TODAY[lot.world];
  const differential = e.refPrice - producerToday;

  // missão "Compara o preço de entrada com a referência" (mundo do azeite, lote aberto)
  const canQuest = lot.world === 'azeite' && lot.status === 'aberto';
  const fired = useRef(false);
  const complete = useCallback(() => {
    if (!canQuest || fired.current || game.isQuestDone('q-comparar-preco')) return;
    fired.current = true;
    game.completeQuest('q-comparar-preco');
  }, [canQuest, game]);
  useMotionValueEvent(progress, 'change', (v) => {
    if (rich && v > 0.86) complete();
  });
  useDwell(ref, !rich && canQuest, complete, 1800);

  return (
    <Wrap>
      <ChapterHeading
        id="preco"
        n={3}
        title="O preço"
        lead={`A Sprout compra ${lot.world === 'agua' ? 'as paletes à nascente, sem grossista pelo meio,' : lot.world === 'cafe' ? 'o café verde à fazenda' : 'o azeite a granel ao lagar, sem passar por um embalador,'} e vende ao comprador B2B ${pct(e.discountPct, 0)} abaixo da referência. A diferença entre esse preço e o custo do lote, ${fmt(e.grossMargin)}, é a margem bruta que paga os co-financiadores, a operação e a reserva.`}
      />
      <div ref={ref} className="mt-6 grid min-w-0 gap-x-10 gap-y-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-9">
          <PriceChart lot={lot} end={win.extended ? win.extEnd : win.end} progress={progress} />
        </div>
        <dl className="grid min-w-0 content-start gap-x-6 gap-y-4 sm:grid-cols-3 lg:col-span-3 lg:grid-cols-1">
          <div>
            <dt className="text-sm text-muted">Referência hoje</dt>
            <dd className="mt-0.5 font-mono text-[1.0625rem] text-fg tnum">{fmt(today)}</dd>
            <dd className="text-sm text-muted">
              {Math.abs(change) < 0.0005 ? 'igual à da abertura do lote' : `${pct(change, 1, { sign: true })} face à abertura (${fmt(e.refPrice)})`}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Margem bruta por {unit === 'kg' ? 'kg' : 'litro'}</dt>
            <dd className="mt-0.5 font-mono text-[1.0625rem] text-fg tnum">{fmt(e.grossMargin)}</dd>
            <dd className="text-sm text-muted">
              {num(split.investors, d)} co-financiadores · {num(split.operation, d)} operação · {num(split.reserve, d)} reserva
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">{diff.label}</dt>
            <dd className="mt-0.5 font-mono text-[1.0625rem] text-fg tnum">{fmt(differential)}</dd>
            <dd className="text-sm text-muted">
              {diff.contains.charAt(0).toUpperCase() + diff.contains.slice(1)}, entre {fmt(producerToday)} ao produtor (hipótese) e a referência.
              {lot.world === 'azeite' && ` A margem líquida do embalador é só ${num(OLIVE_CHAIN_FACTS.packagerNetMargin[0], 2)}–${num(OLIVE_CHAIN_FACTS.packagerNetMargin[1], 2)} €/kg dessa diferença.`}
              {lot.world === 'agua' && ' Na água não há embalador: engarrafa-se na origem.'}
            </dd>
          </div>
          {trigger && (
            <div className={cn('sm:col-span-3 lg:col-span-1')}>
              <dt className="text-sm text-muted">Gatilho de cobertura</dt>
              <dd className="mt-0.5 font-mono text-[1.0625rem] text-fg tnum">{trigger} €/kg</dd>
              <dd className="text-sm text-muted">{lot.hedge.trigger}</dd>
            </div>
          )}
        </dl>
      </div>
    </Wrap>
  );
}

export function ChapterPreco({ label }: { label: string }) {
  const { rich } = useJourney();
  return (
    <Chapter id="preco" label={label} heightVh={200} static={!rich} className={cn(!rich && 'scroll-mt-6 border-b border-border')}>
      {(progress, isRich) => (
        <div style={isRich ? { paddingTop: CHROME_H } : undefined} className="min-w-0">
          <PrecoBody progress={progress} rich={isRich} />
        </div>
      )}
    </Chapter>
  );
}
