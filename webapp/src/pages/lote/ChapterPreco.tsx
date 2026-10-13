import { memo, useCallback, useEffect, useRef } from 'react';
import { useMotionValueEvent, type MotionValue } from 'motion/react';
import { CHAIN_DIFFERENTIAL, getMarketSeries, MARKET_TODAY, OLIVE_CHAIN_FACTS, PRODUCER_PRICE_TODAY, priceUnit, referenceToday } from '../../data';
import { Chapter } from '../../components/game';
import { lowerInitial, num, pct, price, tidyText } from '../../lib/format';
import { useGame } from '../../state';
import { channelRefChange, isAgentLot, marginSplit, priceDecimals, referenceChange } from './model';
import { PriceChart } from './PriceChart';
import { ChapterHeading, CHROME_H, useChapterNo, useDwell, useJourney, Wrap } from './shared';

/* =====================================================================
   Capítulo 3 · O preço. O índice de origem (granel) e a referência do
   canal (embalado) nunca se comparam entre si: o lote compra ao índice,
   vende contra a referência do canal, e a escada do meio (custos com o
   co-packer, margem, desconto) mostra para onde vai cada euro.
   ===================================================================== */

/** Intervalo estável do capítulo fixo: o gráfico já está todo desenhado. */
const STABLE: [number, number] = [0.86, 0.995];
/** Tempo mínimo de permanência no intervalo estável para a missão contar. */
const DWELL_MS = 600;

/**
 * Missão por permanência no capítulo fixo: conta só depois de ≥ 600 ms com o
 * progresso dentro do intervalo estável. Saltos (navegação de capítulos,
 * âncoras, tecla End, scroll muito rápido) passam pelo intervalo sem ficar e
 * não contam; um salto de mais de 0,25 de progresso num só evento recomeça.
 */
function useStableDwell(progress: MotionValue<number>, enabled: boolean, onDone: () => void) {
  const timer = useRef<number | undefined>(undefined);
  const last = useRef(progress.get());
  const cb = useRef(onDone);
  useEffect(() => {
    cb.current = onDone;
  });
  const inside = (v: number) => v >= STABLE[0] && v < STABLE[1];
  const stop = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  };
  useMotionValueEvent(progress, 'change', (v) => {
    const jump = Math.abs(v - last.current) > 0.25;
    last.current = v;
    if (!enabled || !inside(v) || jump) return stop();
    if (timer.current === undefined) {
      timer.current = window.setTimeout(() => {
        timer.current = undefined;
        if (inside(progress.get())) cb.current();
      }, DWELL_MS);
    }
  });
  useEffect(() => stop, []);
}

const PrecoBody = memo(function PrecoBody({ progress, rich }: { progress: MotionValue<number>; rich: boolean }) {
  const { lot, win } = useJourney();
  const no = useChapterNo('preco');
  const game = useGame();
  const ref = useRef<HTMLDivElement>(null);
  const e = lot.economics;
  const agent = isAgentLot(lot);
  const unit = priceUnit(lot);
  const d = priceDecimals(lot);
  const split = marginSplit(lot);
  const indexChange = referenceChange(lot);
  const refChange = channelRefChange(lot);
  const indexToday = MARKET_TODAY[lot.world];
  const refToday = referenceToday(lot);
  const series = getMarketSeries(lot.world);
  const fmt = (v: number) => tidyText(price(v, unit, d));
  const per = unit === 'kg' ? 'kg' : 'litro';
  const trigger = lot.hedge.trigger?.match(/(\d+,\d+)\s€\/kg/)?.[1];
  const diff = CHAIN_DIFFERENTIAL[lot.world];
  const producerToday = PRODUCER_PRICE_TODAY[lot.world];
  // diferencial de hoje entre o que o produtor recebe e a referência do canal (embalado), o mesmo dos Mercados
  const differential = (agent ? e.refPrice : refToday) - producerToday;
  // as linhas de custo maiores primeiro (o embalamento no co-packer é a maior no azeite)
  const costTop = [...e.costLines].sort((a, b) => b.value - a.value);
  const shown = costTop.slice(0, 3);
  const rest = costTop.slice(3).reduce((s, c) => s + c.value, 0);

  // missão "Compara o preço de entrada com a referência" (mundo do azeite, lote aberto)
  const canQuest = lot.world === 'azeite' && lot.status === 'aberto';
  const fired = useRef(false);
  const complete = useCallback(() => {
    if (!canQuest || fired.current || game.isQuestDone('q-comparar-preco')) return;
    fired.current = true;
    game.completeQuest('q-comparar-preco');
  }, [canQuest, game]);
  useStableDwell(progress, rich && canQuest, complete);
  useDwell(ref, !rich && canQuest, complete, 1800);

  const lead = agent
    ? `A Sprout não compra a água: junta encomendas de HoReCa num cesto, o engarrafador fatura e entrega, e a Sprout recebe ${pct(e.commissionPct ?? 0, 0)} de comissão. Preço ao comprador: ${e.priceBasis}.`
    : lot.world === 'azeite'
      ? `A Sprout compra o azeite a granel ao lagar, ao índice de origem mais um prémio de ${fmt(e.producerPremium)}, manda-o embalar num co-packer e vende-o a ${lowerInitial(e.channelLabel)}: ${e.priceBasis}. A diferença entre o preço ao comprador e o preço financiado, ${fmt(e.grossMargin)}, é a margem bruta que paga os cofinanciadores, a operação e a reserva.`
      : `A Sprout compra o café verde à fazenda e vende-o a ${lowerInitial(e.channelLabel)}: ${e.priceBasis}. A diferença entre o preço ao comprador e o preço financiado, ${fmt(e.grossMargin)}, é a margem bruta que paga os cofinanciadores, a operação e a reserva.`;

  return (
    <Wrap>
      <ChapterHeading id="preco" n={no} title="O preço" lead={lead} />
      <div ref={ref} className="mt-6 grid min-w-0 gap-x-10 gap-y-6 @5xl:grid-cols-12">
        <div className="min-w-0 @5xl:col-span-9">
          <PriceChart lot={lot} end={win.extended ? win.extEnd : win.end} progress={progress} />
        </div>
        <dl className="grid min-w-0 content-start gap-x-6 gap-y-4 @xl:grid-cols-2 @5xl:col-span-3 @5xl:grid-cols-1">
          {agent ? (
            <>
              <div>
                <dt className="text-sm text-muted">{e.refLabel}</dt>
                <dd className="mt-0.5 font-mono text-[1.0625rem] text-fg tnum">{fmt(e.refPrice)}</dd>
                <dd className="text-sm text-muted">{e.refNote}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Comissão da Sprout</dt>
                <dd className="mt-0.5 font-mono text-[1.0625rem] text-fg tnum">{pct(e.commissionPct ?? 0, 0)}</dd>
                <dd className="text-sm text-muted">
                  Cerca de {fmt(e.grossMargin)} por {per}, faturada ao engarrafador. Sem stock, sem capital de cofinanciadores.
                </dd>
              </div>
            </>
          ) : (
            <>
              <div>
                <dt className="text-sm text-muted">{lot.world === 'azeite' ? 'Índice de origem (granel), hoje' : `${series.label}, hoje`}</dt>
                <dd className="mt-0.5 font-mono text-[1.0625rem] text-fg tnum">{fmt(indexToday)}</dd>
                <dd className="text-sm text-muted">
                  {Math.abs(indexChange) < 0.0005 ? 'igual ao da abertura do lote' : `${pct(indexChange, 1, { sign: true })} face à abertura (${fmt(e.indexAtOpen)})`}. É o que move o preço ao produtor e os gatilhos de cobertura e extensão.
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">{e.refLabel}, hoje</dt>
                <dd className="mt-0.5 font-mono text-[1.0625rem] text-fg tnum">{fmt(refToday)}</dd>
                <dd className="text-sm text-muted">
                  {Math.abs(refChange) < 0.0005 ? `igual à da abertura (${fmt(e.refPrice)})` : `${pct(refChange, 1, { sign: true })} face à abertura (${fmt(e.refPrice)})`}. Produto embalado: é contra ela que se mede o preço ao comprador.
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Custos até à venda, por {per}</dt>
                <dd className="mt-0.5 font-mono text-[1.0625rem] text-fg tnum">{fmt(e.costsPerUnit)}</dd>
                <dd className="text-sm text-muted">
                  {shown.map((c) => `${c.label.charAt(0).toLowerCase()}${c.label.slice(1)} ${num(c.value, d)}`).join(' · ')}
                  {rest > 0.0005 && ` · outros ${num(rest, d)}`}. Já estão no preço financiado.
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Margem bruta por {per}</dt>
                <dd className="mt-0.5 font-mono text-[1.0625rem] text-fg tnum">{fmt(e.grossMargin)}</dd>
                <dd className="text-sm text-muted">
                  {num(split.investors, d)} cofinanciadores · {num(split.operation, d)} operação · {num(split.reserve, d)} reserva comum
                </dd>
              </div>
            </>
          )}
          <div>
            <dt className="text-sm text-muted">{diff.label}, hoje</dt>
            <dd className="mt-0.5 font-mono text-[1.0625rem] text-fg tnum">{fmt(differential)}</dd>
            <dd className="text-sm text-muted">
              {diff.contains.charAt(0).toUpperCase() + diff.contains.slice(1)}, entre {fmt(producerToday)} ao produtor e {agent ? `a ${e.refLabel.toLowerCase()}` : 'a referência do canal de hoje'}.
              {lot.world === 'azeite' && ` Não é a margem do embalador: essa é só ${num(OLIVE_CHAIN_FACTS.packagerNetMargin[0], 2)}–${num(OLIVE_CHAIN_FACTS.packagerNetMargin[1], 2)} €/kg dessa diferença.`}
            </dd>
          </div>
          {trigger && (
            <div>
              <dt className="text-sm text-muted">Gatilho de cobertura</dt>
              <dd className="mt-0.5 font-mono text-[1.0625rem] text-fg tnum">{trigger} €/kg</dd>
              <dd className="text-sm text-muted">{lot.hedge.trigger}</dd>
            </div>
          )}
        </dl>
      </div>
    </Wrap>
  );
});

export function ChapterPreco({ label }: { label: string }) {
  const { rich } = useJourney();
  return (
    <Chapter id="preco" label={label} heightVh={200} static={!rich} className="scroll-mt-6 border-b border-border">
      {(progress, isRich) => (
        <div style={isRich ? { paddingTop: CHROME_H } : undefined} className="min-w-0">
          <PrecoBody progress={progress} rich={isRich} />
        </div>
      )}
    </Chapter>
  );
}
