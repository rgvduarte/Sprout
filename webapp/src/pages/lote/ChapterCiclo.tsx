import { memo, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useTransform, type MotionValue } from 'motion/react';
import { REFUNDING_PLAYBOOKS } from '../../data';
import { Chapter, HarvestBand, useMapRange } from '../../components/game';
import { addMonths, toDate } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { date as fmtDate, lisbonParts, monthYear, pct } from '../../lib/format';
import { useTokens, seriesColor } from '../../lib/useTokens';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { salesShareAt, stageDate } from './model';
import { ChapterHeading, CHROME_H, useChapterNo, useJourney, useWidth, Wrap } from './shared';

/* =====================================================================
   Capítulo 4 · O ciclo de 18 meses. O cursor percorre a janela com o
   scroll: compra, armazenagem, vendas B2B (curva esperada) e liquidação
   prevista. No fim da janela, a bifurcação: liquidação, extensão
   condicionada ou refunding, com as condições de cada caminho.
   ===================================================================== */

/** Mesma escala do HarvestBand: células mensais desde o 1.º dia do mês de início. */
function makeScale(start: string, totalMonths: number) {
  const s = lisbonParts(`${start.slice(0, 7)}-15`);
  return (iso: string) => {
    const p = lisbonParts(iso.length === 10 ? iso : iso.slice(0, 10));
    const idx = (p.year - s.year) * 12 + (p.month - s.month);
    const days = new Date(Date.UTC(p.year, p.month, 0)).getUTCDate();
    return Math.max(0, Math.min(1, (idx + (p.day - 1) / days) / totalMonths));
  };
}

const CicloBody = memo(function CicloBody({ progress, rich }: { progress: MotionValue<number>; rich: boolean }) {
  const no = useChapterNo('ciclo');
  const { lot, ctx, win } = useJourney();
  const tokens = useTokens();
  const color = seriesColor(tokens, lot.world);
  const boxRef = useRef<HTMLDivElement>(null);
  const width = useWidth(boxRef, 900);
  const wide = useMediaQuery('(min-width: 768px)');
  const total = win.months + lot.extension.maxMonths + 1;
  const pos = makeScale(win.start, total);
  const H = 226;
  const plotTop = 22;
  const plotBottom = 112;
  const base = 146;
  const branchB = 182;
  const branchC = 212;
  const X = (iso: string) => pos(iso) * width;

  const venda = stageDate(lot, 'em-venda').date;
  const expedido = stageDate(lot, 'expedido').date;
  const decision = addMonths(win.start, win.months - 1);
  const settledAt = lot.settlement.settledAt;
  const settledResult = lot.settlement.settledResult;

  // curva de vendas esperada (cumulativa), amostrada por quinzena
  const curvePts: [number, number][] = [];
  if (venda && expedido) {
    const a = toDate(venda).getTime();
    const b = toDate(expedido).getTime();
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const t = new Date(a + ((b - a) * i) / steps).toISOString().slice(0, 10);
      curvePts.push([X(t), plotBottom - salesShareAt(lot, t) * (plotBottom - plotTop)]);
    }
    curvePts.push([X(win.end), plotTop]);
  }
  const curveLine = curvePts.length ? `M${X(win.start)},${plotBottom} L${curvePts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L')}` : '';
  const curveArea = curvePts.length ? `${curveLine} L${X(win.end).toFixed(1)},${plotBottom} Z` : '';

  // cursor ligado ao scroll (janela 0–18) e a bifurcação no fim
  const cursor = useMapRange(progress, [0.04, 0.8], [0, 1]);
  const forkP = useMapRange(progress, [0.8, 0.95], [0, 1]);
  const xStart = X(win.start);
  const xEnd = X(win.end);
  const cursorX = useTransform(cursor, (v) => xStart + (xEnd - xStart) * v);
  const clipW = useTransform(cursorX, (x) => Math.max(0, x));
  const forkW = useTransform(forkP, (v) => Math.max(0, v * (width - X(decision) + 4)));
  const [month, setMonth] = useState(() => (rich ? Math.round(cursor.get() * win.months) : win.months));
  useMotionValueEvent(cursor, 'change', (v) => {
    const m = Math.round(v * win.months);
    setMonth((prev) => (prev === m ? prev : m));
  });
  const shownMonth = rich ? month : win.months;
  const at = addMonths(win.start, shownMonth);
  const sold = salesShareAt(lot, at);

  const phaseText = (() => {
    if (shownMonth === 0) return `Fecho do financiamento: a Sprout paga a ${ctx.producer.nome} e o lote fica identificado em ${lot.storage.containers} ${lot.storage.containers === 1 ? 'contentor' : ctx.copy.containerPlural}.`;
    if (shownMonth >= win.months) return 'Fim da janela: liquidação prevista. Se as condições se verificarem, a Tesouraria propõe extensão ou refunding 30 dias antes.';
    if (venda && toDate(at) < toDate(venda))
      return lot.world === 'azeite' ? `Armazenagem: o azeite repousa sob azoto a 15–18 °C em ${lot.storage.local}. Reanálise a cada 4 meses.` : `Armazenagem: paletes em armazém coberto, com rotação por data de engarrafamento.`;
    if (expedido && toDate(at) < toDate(expedido)) return `Vendas B2B: ${pct(sold, 0)} do stock vendido no cenário base${lot.hedge.instrument === 'forward' ? ', com as entregas da venda a prazo' : ''}.`;
    return 'Stock expedido. A liquidação espera que os compradores paguem na conta segregada.';
  })();

  const playbook = REFUNDING_PLAYBOOKS.find((p) => p.id === lot.refundingPlaybookId);
  const emphasis: 'a' | 'b' | null = lot.status === 'liquidado' ? 'a' : win.extended ? 'b' : null;
  const xd = X(decision);
  const xExt = X(win.extEnd);
  const branchPath = (y: number) => `M${xd.toFixed(1)},${base} C${(xd + 30).toFixed(1)},${base} ${(xd + 20).toFixed(1)},${y} ${(xd + 56).toFixed(1)},${y} L${xExt.toFixed(1)},${y}`;
  const today = '2026-10-13';
  const showToday = toDate(today) > toDate(win.start) && toDate(today) < toDate(win.extEnd);

  return (
    <Wrap>
      <ChapterHeading
        id="ciclo"
        n={no}
        title={`O ciclo de ${win.months} meses`}
        lead={`Do fecho do financiamento à liquidação prevista a ${fmtDate(win.end)}. No fim da janela há três caminhos possíveis e cada um tem condições escritas antes de o lote abrir.`}
      />

      <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1" aria-live="off">
        <p className="font-display text-[1.375rem] font-semibold text-fg">
          Mês <span className="tnum">{shownMonth}</span> de {win.months}
        </p>
        <p className="font-mono text-sm text-muted tnum">{monthYear(at)}</p>
        <p className="min-w-0 basis-full text-[0.9375rem] text-fg sm:basis-auto sm:flex-1">{phaseText}</p>
      </div>

      <div ref={boxRef} className="relative mt-4 min-w-0" data-world={lot.world}>
        <svg width={width} height={H} className="block overflow-visible" role="img" aria-label={`Ciclo do lote ${lot.id}: janela de ${fmtDate(win.start)} a ${fmtDate(win.end)}; vendas previstas entre ${venda ? fmtDate(venda) : '—'} e ${expedido ? fmtDate(expedido) : '—'}; extensão possível até ${fmtDate(win.extEnd)}.`}>
          <defs>
            <clipPath id={`cursor-${lot.id}`}>
              <motion.rect x={0} y={0} height={H} width={clipW} />
            </clipPath>
            <clipPath id={`fork-${lot.id}`}>
              <motion.rect x={xd - 2} y={0} height={H} width={forkW} />
            </clipPath>
          </defs>
          {/* grelha da curva de vendas */}
          {[0, 0.5, 1].map((v) => {
            const y = plotBottom - v * (plotBottom - plotTop);
            return (
              <g key={v}>
                <line x1={0} x2={xEnd} y1={y} y2={y} stroke={tokens.chartGrid} strokeWidth={1} />
                <text x={xEnd + 8} y={y + 4} fontSize="12" fontFamily={tokens.fontMono} fill={tokens.chartAxis}>
                  {v === 1 ? '100 % vendido' : `${Math.round(v * 100)} %`}
                </text>
              </g>
            );
          })}
          {/* curva esperada: desenhada até ao cursor */}
          <g clipPath={`url(#cursor-${lot.id})`}>
            <path d={curveArea} fill={color} fillOpacity={0.12} />
            <path d={curveLine} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
          </g>
          {/* linha da janela */}
          <line x1={xStart} x2={xd} y1={base} y2={base} stroke={tokens.fg} strokeWidth={2} />
          {/* bifurcação: revela-se da decisão para a direita */}
          <g clipPath={`url(#fork-${lot.id})`}>
            <path d={`M${xd},${base} L${xEnd},${base}`} fill="none" stroke={tokens.fg} strokeWidth={2} opacity={emphasis === 'b' ? 0.45 : 1} />
            <path d={branchPath(branchB)} fill="none" stroke={tokens.fg} strokeWidth={emphasis === 'b' ? 2.5 : 2} strokeDasharray="6 4" opacity={emphasis === 'a' ? 0.4 : 1} />
            <path d={branchPath(branchC)} fill="none" stroke={tokens.chartAxis} strokeWidth={2} strokeDasharray="2 4" strokeLinecap="round" opacity={emphasis ? 0.4 : 1} />
          </g>
          {/* marcos */}
          {[
            { iso: win.start, label: win.startKnown ? 'Compra' : 'Compra (prev.)', anchor: 'start' as const, above: false },
            ...(venda ? [{ iso: venda, label: 'Em venda', anchor: 'middle' as const, above: !wide }] : []),
            ...(expedido ? [{ iso: expedido, label: 'Expedido', anchor: 'middle' as const, above: false }] : []),
          ].map((mk) => (
            <g key={mk.label}>
              <circle cx={X(mk.iso)} cy={base} r={5} fill={tokens.surface} stroke={tokens.fg} strokeWidth={2} />
              <text x={X(mk.iso)} y={mk.above ? base - 12 : base + 22} textAnchor={mk.anchor} fontSize="12" fill={tokens.fg} paintOrder="stroke" stroke={tokens.bg} strokeWidth={3}>
                {mk.label}
              </text>
            </g>
          ))}
          <circle cx={xd} cy={base} r={4} fill={tokens.fg} />
          <circle cx={xEnd} cy={base} r={6} fill={emphasis === 'a' ? tokens.fg : tokens.surface} stroke={tokens.fg} strokeWidth={2} />
          {/* rótulos dos caminhos: sempre visíveis (só os desenhos acompanham o scroll) */}
          <g>
            <text x={xEnd - 8} y={base - 10} textAnchor="end" fontSize="12" fontWeight={600} fill={tokens.fg}>
              {settledAt ? `Liquidado ${fmtDate(settledAt)}` : `Liquidação prevista ${wide ? fmtDate(win.end) : ''}`}
            </text>
            {wide && (
              <>
                <text x={xd + 60} y={branchB - 6} fontSize="12" fill={tokens.fg} fontWeight={emphasis === 'b' ? 600 : 400}>
                  {win.extended ? `Em extensão até ${fmtDate(win.extEnd)}` : `Extensão até ${fmtDate(win.extEnd)}`}
                </text>
                <text x={xd + 60} y={branchC - 6} fontSize="12" fill={tokens.muted}>
                  Refunding
                </text>
              </>
            )}
          </g>
          {/* hoje */}
          {showToday && (
            <g>
              <line x1={X(today)} x2={X(today)} y1={plotTop - 8} y2={base + 8} stroke={tokens.fg} strokeWidth={1} strokeOpacity={0.6} />
              <text x={X(today)} y={plotTop - 11} textAnchor="middle" fontSize="12" fontFamily={tokens.fontMono} fill={tokens.fg}>
                hoje
              </text>
            </g>
          )}
          {/* cursor do scroll */}
          {rich && <motion.line x1={cursorX} x2={cursorX} y1={plotTop - 4} y2={base + 10} stroke={tokens.accent} strokeWidth={3} strokeLinecap="round" />}
        </svg>

        <HarvestBand world={lot.world} start={win.start} months={win.months} extensionMonths={lot.extension.maxMonths} progress={rich ? cursor : undefined} legend={false} className="mt-1" />
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
          <li className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block h-3 w-4 rounded-[2px] border border-border" style={{ background: 'color-mix(in oklab, var(--world) 26%, var(--surface))' }} />
            {ctx.world.season.phases[0]?.label}
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block h-3 w-4 rounded-[2px] border border-border" style={{ background: 'color-mix(in oklab, var(--world) 9%, var(--surface))' }} />
            {ctx.world.season.phases[1]?.label}
          </li>
          <li className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block h-2 w-4 rounded-[2px] bg-world-ink" />
            Janela de {win.months} meses
          </li>
          <li className="inline-flex items-center gap-2">
            <svg aria-hidden width="16" height="10" className="shrink-0">
              <rect x="0.5" y="0.5" width="15" height="9" rx="1.5" fill="none" stroke="var(--world-ink)" />
              <path d="M3 9 L9 1 M8 9 L14 1" stroke="var(--world-ink)" strokeWidth="1.2" />
            </svg>
            {win.extended ? 'Extensão em curso' : `Extensão possível, até ${lot.extension.maxMonths} meses`}
          </li>
          <li className="inline-flex items-center gap-2">
            <svg aria-hidden width="18" height="6" className="shrink-0">
              <line x1="1" y1="3" x2="17" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
            </svg>
            Vendas esperadas (cenário base)
          </li>
        </ul>
      </div>

      {/* os três caminhos */}
      <ol className="mt-6 grid gap-x-8 gap-y-4 border-t border-border pt-5 md:grid-cols-3" aria-label="Caminhos no fim da janela">
        <li className={cn('min-w-0', emphasis && emphasis !== 'a' && 'opacity-80')}>
          <p className="flex items-center gap-2 font-semibold text-fg">
            <svg aria-hidden width="22" height="6" className="shrink-0">
              <line x1="1" y1="3" x2="21" y2="3" stroke="var(--fg)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {lot.status === 'liquidado' ? 'Liquidação' : 'Liquidação prevista'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {settledAt
              ? `Liquidado a ${fmtDate(settledAt)} com ${pct(settledResult ?? 0, 1, { sign: true })} do capital.`
              : 'Quando o stock está vendido e os compradores pagaram: capital e resultado numa única transferência para o IBAN registado. Pode acontecer antes do mês 18.'}
          </p>
        </li>
        <li className="min-w-0">
          <p className="flex items-center gap-2 font-semibold text-fg">
            <svg aria-hidden width="22" height="6" className="shrink-0">
              <line x1="1" y1="3" x2="21" y2="3" stroke="var(--fg)" strokeWidth="2" strokeDasharray="5 3" />
            </svg>
            Extensão condicionada
          </p>
          <p className="mt-1 text-sm text-muted">
            Uma vez, até {lot.extension.maxMonths} meses, se {lot.extension.conditions.join(' ').replace(/^O /, 'o ')} Proposta pela Tesouraria e comunicada 30 dias antes. A armazenagem continua a custar.
          </p>
        </li>
        <li className="min-w-0">
          <p className="flex items-center gap-2 font-semibold text-fg">
            <svg aria-hidden width="22" height="6" className="shrink-0">
              <line x1="1" y1="3" x2="21" y2="3" stroke="var(--muted)" strokeWidth="2" strokeDasharray="2 3" />
            </svg>
            Refunding
          </p>
          <p className="mt-1 text-sm text-muted">
            {playbook ? `Gatilho: ${playbook.trigger.charAt(0).toLowerCase()}${playbook.trigger.slice(1)} ` : ''}Uma nova ronda refinancia a armazenagem à espera de melhor preço. Tem custo e não elimina a perda.
            {playbook && ` Playbook «${playbook.title}»: ${playbook.steps.length} passos escritos antes de o lote abrir.`}
          </p>
        </li>
      </ol>
    </Wrap>
  );
});

export function ChapterCiclo({ label }: { label: string }) {
  const { rich } = useJourney();
  return (
    <Chapter id="ciclo" label={label} heightVh={240} static={!rich} className="scroll-mt-6 border-b border-border">
      {(progress, isRich) => (
        <div style={isRich ? { paddingTop: CHROME_H } : undefined} className="min-w-0">
          <CicloBody progress={progress} rich={isRich} />
        </div>
      )}
    </Chapter>
  );
}
