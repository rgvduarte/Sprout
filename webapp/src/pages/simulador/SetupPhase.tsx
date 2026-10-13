import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Minus, Play, Plus, RefreshCw, RotateCcw } from 'lucide-react';
import { SIM_RULES, getQuest } from '../../data';
import type { SimLot, WorldId } from '../../data/types';
import { Button, Card, CardHeader, CommodityChip, Divider, Field, Input, Slider } from '../../components/ui';
import { LotGauge, QuestList } from '../../components/game';
import { useGame } from '../../state';
import { cn } from '../../lib/cn';
import { num, pct, price } from '../../lib/format';
import { INVESTOR_SHARE } from '../../data';
import { SCENARIO_LOTS, buyerPriceOf, monthLabel, shortName, simPhysical, getSimLot } from './deck';
import type { Allocation } from './engine';
import { DEFAULT_DRAFT, DEFAULT_SEED, nextSeed, type SimSession } from './store';
import { fe, Switch, WORLD_BG } from './parts';

const STEP = 2500;
const MAX_LOTS = 4;
const MIN_LOTS = 2;

const GROUPS: { world: WorldId; title: string; note: string }[] = [
  { world: 'azeite', title: 'O Olival', note: 'Preço volátil. Há cobertura: venda a prazo ou indexação de parte do volume.' },
  { world: 'agua', title: 'A Nascente', note: 'Preço estável, sem cobertura. O risco está no ritmo das vendas e nos custos.' },
  { world: 'cafe', title: 'A Plantação', note: 'Fase 2, só para treino: no piloto não há lotes de café. Cobertura com futuros ICE KC.' },
];

export interface SetupProps {
  session: SimSession;
  update: (patch: Partial<SimSession>) => void;
  onStart: (seed: number, allocations: Allocation[]) => void;
}

export function validateDraft(draft: Allocation[]): { ok: boolean; message?: string; selected: Allocation[]; total: number } {
  const selected = draft.filter((a) => a.amount > 0);
  const total = selected.reduce((s, a) => s + a.amount, 0);
  if (selected.length < MIN_LOTS) return { ok: false, message: `Escolhe pelo menos ${MIN_LOTS} lotes (tens ${selected.length}).`, selected, total };
  if (selected.length > MAX_LOTS) return { ok: false, message: `No máximo ${MAX_LOTS} lotes.`, selected, total };
  if (total > SIM_RULES.budget) return { ok: false, message: `Passaste o orçamento em ${fe(total - SIM_RULES.budget)}.`, selected, total };
  return { ok: true, selected, total };
}

export function SetupPhase({ session, update, onStart }: SetupProps) {
  const game = useGame();
  const draft = session.draft;
  const v = validateDraft(draft);
  const remaining = SIM_RULES.budget - v.total;
  const [clampNote, setClampNote] = useState<string | null>(null);
  const seedId = useId().replace(/:/g, '');
  const needsPause = session.streak >= 3 && session.pauseAcknowledgedAt < session.streak;

  const setLot = (id: string, patch: Partial<Allocation>) => {
    update({ draft: draft.map((a) => (a.simLotId === id ? { ...a, ...patch } : a)) });
  };

  const setAmount = (lot: SimLot, wanted: number) => {
    const cur = draft.find((a) => a.simLotId === lot.id)!;
    const free = SIM_RULES.budget - (v.total - cur.amount);
    const capped = Math.max(0, Math.min(wanted, SIM_RULES.maxPerLot, Math.floor(free / STEP) * STEP));
    const selectedOthers = draft.filter((a) => a.amount > 0 && a.simLotId !== lot.id).length;
    if (cur.amount === 0 && wanted > 0 && selectedOthers >= MAX_LOTS) {
      setClampNote(`Já tens ${MAX_LOTS} lotes. Retira um antes de juntar ${shortName(lot.id)}.`);
      return;
    }
    setClampNote(capped < wanted ? `Orçamento esgotado: ${shortName(lot.id)} fica em ${fe(capped)}. Tira montante a outro lote para subir.` : null);
    setLot(lot.id, { amount: capped });
  };

  // avisos de proteção (empurrões para a prudência, nunca para o retorno)
  const nudges: string[] = [];
  if (v.selected.length >= 2 && v.total > 0) {
    const top = [...v.selected].sort((a, b) => b.amount - a.amount)[0];
    const share = top.amount / v.total;
    if (share > 0.5) nudges.push(`${pct(share, 0)} do montante está num só lote (${shortName(top.simLotId)}). Se esse lote correr mal, a carteira inteira sente.`);
    const worlds = new Set(v.selected.map((a) => getSimLot(a.simLotId)!.world));
    if (worlds.size === 1) {
      const w = [...worlds][0];
      nudges.push(w === 'agua' ? 'Tudo em água: preço estável, mas um verão chuvoso atrasa todos os lotes ao mesmo tempo.' : `Tudo ${w === 'azeite' ? 'no azeite' : 'no café'}: um choque de preço atinge todos os lotes ao mesmo tempo.`);
    }
    const naked = v.selected.filter((a) => getSimLot(a.simLotId)!.hedge.available && !a.hedged).reduce((s, a) => s + a.amount, 0);
    if (naked / v.total > 0.4) nudges.push(`${pct(naked / v.total, 0)} do montante está em preço volátil sem cobertura.`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      {/* ---------------- baralho ---------------- */}
      <section aria-labelledby="baralho-title" className="min-w-0">
        <div className="mb-5">
          <h2 id="baralho-title" className="text-[1.375rem] leading-tight">
            Escolhe 2 a 4 lotes do baralho
          </h2>
          <p className="measure mt-1 text-muted">
            São lotes de cenário, fictícios, com os parâmetros dos mercados do piloto. Os montantes vão de {fe(SIM_RULES.minAllocation)} a {fe(SIM_RULES.maxPerLot)} por lote, em passos de {fe(STEP)}.
          </p>
        </div>

        <div className="flex flex-col gap-9">
          {GROUPS.map((g) => (
            <div key={g.world} data-world={g.world}>
              <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                <h3 className="text-[1.125rem]">{g.title}</h3>
                <CommodityChip world={g.world} />
                {g.world === 'cafe' && <span className="text-sm font-medium text-cafe-ink">Fase 2 · abre em 2027</span>}
              </div>
              <p className="measure mb-3 text-sm text-muted">{g.note}</p>
              <ul className="flex flex-col gap-3">
                {SCENARIO_LOTS.filter((l) => l.world === g.world).map((lot) => {
                  const a = draft.find((x) => x.simLotId === lot.id)!;
                  return (
                    <li key={lot.id}>
                      <DeckCard
                        lot={lot}
                        alloc={a}
                        canAdd={a.amount > 0 || (v.selected.length < MAX_LOTS && remaining >= STEP)}
                        addReason={v.selected.length >= MAX_LOTS ? `Já tens ${MAX_LOTS} lotes.` : 'Sem orçamento livre.'}
                        onAmount={(n) => setAmount(lot, n)}
                        onHedge={(h) => setLot(lot.id, { hedged: h })}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- orçamento ---------------- */}
      <aside className="min-w-0 lg:sticky lg:top-[73px]" aria-label="Orçamento e regras">
        <Card padding="md">
          <CardHeader title="Orçamento fictício" description={`${fe(SIM_RULES.budget)} para distribuir`} />
          <AllocationBar selected={v.selected} />
          <p className="mt-3 flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted">Por distribuir</span>
            <span className="font-mono text-fg tnum">{fe(Math.max(0, remaining))}</span>
          </p>
          {remaining > 0 && <p className="mt-0.5 text-sm text-muted">Fica parado: não ganha nem perde.</p>}
          <p aria-live="polite" className={cn('text-sm text-warn-ink', clampNote && 'mt-2')}>
            {clampNote}
          </p>

          {nudges.length > 0 && (
            <>
              <Divider />
              <ul className="flex flex-col gap-2.5" aria-label="Avisos de concentração">
                {nudges.map((n) => (
                  <li key={n} className="flex items-start gap-2 text-sm text-fg">
                    <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-warn-ink" strokeWidth={1.75} />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <Divider />
          <h3 className="text-[1rem]">Regras do jogo</h3>
          <dl className="mt-2 flex flex-col gap-2.5 text-sm">
            <Rule term="Partilha">{pct(INVESTOR_SHARE, 0)} da margem bruta vai para os co-financiadores. A perda não é partilhada.</Rule>
            <Rule term="Reserva de primeira perda">Absorve perdas até {pct(SIM_RULES.firstLossReservePct, 0)} do montante de cada lote.</Rule>
            <Rule term="Extensão">No mês 18, se a referência estiver 15 % abaixo da entrada ou faltar vender mais de 30 % do stock: até 6 meses, a 0,3 % ao mês.</Rule>
            <Rule term="Refunding">Depois de um choque de preço, se a perda prevista passar a reserva: 4 meses de armazenagem refinanciada, por 1,5 % do lote.</Rule>
          </dl>

          <Divider />
          <div className="flex items-end gap-2">
            <Field label="Semente da campanha" id={`seed-${seedId}`} hint="A mesma semente repete os mesmos acontecimentos." className="min-w-0 flex-1">
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  inputMode="numeric"
                  value={String(session.draftSeed)}
                  onChange={(e) => {
                    const n = Number(e.target.value.replace(/\D/g, '').slice(0, 4));
                    update({ draftSeed: Number.isFinite(n) ? n : 0 });
                  }}
                  className="font-mono tnum"
                />
              )}
            </Field>
            <Button variant="secondary" className="mb-[26px] shrink-0" iconLeft={<RefreshCw aria-hidden className="size-4" strokeWidth={1.75} />} onClick={() => update({ draftSeed: nextSeed(session.draftSeed || DEFAULT_SEED) })}>
              Outra
            </Button>
          </div>

          {needsPause && (
            <div className="mt-4 rounded-sm bg-surface-2 px-4 py-3" role="note">
              <p className="font-semibold text-fg">Já jogaste {session.streak} campanhas seguidas</p>
              <p className="mt-1 text-sm text-muted">
                Mais sementes não dizem mais sobre um lote real: o simulador não prevê o futuro. Uma pausa, ou a leitura dos fatores de risco de um lote aberto, ensina mais do que outra corrida.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/lote/AZ-2026-021#riscos" className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-[0.2em]">
                  Ler os riscos do AZ-2026-021
                </Link>
                <Button variant="ghost" size="sm" onClick={() => update({ pauseAcknowledgedAt: session.streak })}>
                  Continuar a jogar
                </Button>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2">
            <Button
              size="lg"
              className="w-full"
              disabled={!v.ok || session.draftSeed < 1}
              iconLeft={<Play aria-hidden className="size-4" strokeWidth={1.75} />}
              onClick={() => {
                if (needsPause) update({ pauseAcknowledgedAt: session.streak });
                onStart(session.draftSeed, v.selected.map((a) => ({ ...a })));
              }}
            >
              Começar campanha
            </Button>
            {!v.ok && <p className="text-sm text-muted">{v.message}</p>}
            {v.ok && session.draftSeed < 1 && <p className="text-sm text-muted">Escreve uma semente entre 1 e 9999.</p>}
            <Button variant="ghost" size="sm" className="self-start" iconLeft={<RotateCcw aria-hidden className="size-4" strokeWidth={1.75} />} onClick={() => update({ draft: DEFAULT_DRAFT.map((x) => ({ ...x })), draftSeed: DEFAULT_SEED })}>
              Repor a distribuição sugerida
            </Button>
          </div>

          <Divider />
          <QuestList quests={[getQuest('q-simulador')!]} isDone={game.isQuestDone} completedAt={game.questCompletedAt} compact showWorld={false} />
        </Card>
      </aside>
    </div>
  );
}

function Rule({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-medium text-fg">{term}</dt>
      <dd className="text-muted">{children}</dd>
    </div>
  );
}

/* ------------------------------------------------------------ barra de distribuição */

function AllocationBar({ selected }: { selected: Allocation[] }) {
  const ordered = SCENARIO_LOTS.map((l) => selected.find((a) => a.simLotId === l.id)).filter(Boolean) as Allocation[];
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-xs bg-surface-2" role="img" aria-label={`Distribuição: ${ordered.map((a) => `${shortName(a.simLotId)} ${fe(a.amount)}`).join(', ') || 'nada distribuído'}`}>
        {ordered.map((a) => {
          const lot = getSimLot(a.simLotId)!;
          return <div key={a.simLotId} className={cn('h-full transition-[flex-basis] duration-300 ease-out', WORLD_BG[lot.world])} style={{ flexBasis: `${(a.amount / SIM_RULES.budget) * 100}%` }} />;
        })}
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm">
        {ordered.length === 0 && <li className="text-muted">Ainda não escolheste lotes.</li>}
        {ordered.map((a) => {
          const lot = getSimLot(a.simLotId)!;
          return (
            <li key={a.simLotId} className="flex items-baseline justify-between gap-3">
              <span className="inline-flex min-w-0 items-center gap-2">
                <span aria-hidden className={cn('size-2.5 shrink-0 rounded-[2px]', WORLD_BG[lot.world])} />
                <span className="truncate text-fg">{shortName(a.simLotId)}</span>
                {lot.hedge.available && <span className="shrink-0 text-muted">{a.hedged ? '· coberto' : '· sem cobertura'}</span>}
              </span>
              <span className="shrink-0 font-mono text-fg tnum">{fe(a.amount)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------ carta do baralho */

function DeckCard({ lot, alloc, canAdd, addReason, onAmount, onHedge }: { lot: SimLot; alloc: Allocation; canAdd: boolean; addReason: string; onAmount: (n: number) => void; onHedge: (h: boolean) => void }) {
  const uid = useId().replace(/:/g, '');
  const selected = alloc.amount > 0;
  const phys = simPhysical(lot, alloc.amount);
  const buyer = buyerPriceOf(lot, INVESTOR_SHARE);
  const d = lot.priceUnit === 'L' ? 3 : 2;
  const titleId = `deck-${uid}`;
  return (
    <Card
      as="article"
      padding="md"
      aria-labelledby={titleId}
      className={cn('transition-colors duration-200', selected ? 'border-[color-mix(in_oklab,var(--world)_55%,var(--border))] bg-world-soft' : '')}
    >
      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 gap-y-3 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-x-5">
        <div className="flex flex-col items-center pt-1">
          <LotGauge kind={lot.world} value={alloc.amount / SIM_RULES.maxPerLot} size="md" showScale={false} className="w-[72px] sm:w-[112px]" label={`${shortName(lot.id)}: parte do teto por lote`} valueText={`${fe(alloc.amount)} de ${fe(SIM_RULES.maxPerLot)}`} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <h4 id={titleId} className="text-[1.0625rem] leading-snug">
                {lot.nome}
              </h4>
              <p className="text-sm text-muted">{lot.origem} · vendas previstas de {monthLabel(lot.salesWindow[0])} a {monthLabel(lot.salesWindow[1])}</p>
            </div>
            <Button
              variant={selected ? 'ghost' : 'secondary'}
              size="sm"
              disabled={!selected && !canAdd}
              title={!selected && !canAdd ? addReason : undefined}
              aria-pressed={selected}
              onClick={() => onAmount(selected ? 0 : 10000)}
              iconLeft={selected ? <Minus aria-hidden className="size-4" strokeWidth={1.75} /> : <Plus aria-hidden className="size-4" strokeWidth={1.75} />}
            >
              {selected ? 'Retirar' : 'Juntar'}
            </Button>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
            <Fact label="Entrada (tudo incluído)" value={price(lot.fundingPrice, lot.priceUnit, d)} />
            <Fact label="Venda base" value={price(buyer, lot.priceUnit, d)} />
            <Fact label="Margem base, 18 meses" value={pct(lot.expectedMargin, 1)} />
            <Fact label="Oscilação mensal" value={`± ${pct(lot.monthlyVolatility, 1)}`} />
          </dl>

          <div className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <label htmlFor={`amt-${uid}`} className="text-sm font-medium text-fg">
                Montante fictício
              </label>
              <span className="font-mono text-[0.9375rem] text-fg tnum">{fe(alloc.amount)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                aria-label={`Menos ${fe(STEP)} em ${shortName(lot.id)}`}
                disabled={alloc.amount <= 0}
                onClick={() => onAmount(alloc.amount - STEP)}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm border border-border bg-surface text-fg transition-[transform,background-color] duration-100 hover:bg-surface-2 active:translate-y-px disabled:cursor-not-allowed disabled:text-muted"
              >
                <Minus aria-hidden className="size-4" strokeWidth={1.75} />
              </button>
              <Slider
                id={`amt-${uid}`}
                min={0}
                max={SIM_RULES.maxPerLot}
                step={STEP}
                value={alloc.amount}
                onChange={onAmount}
                disabled={!selected && !canAdd}
                valueText={`${fe(alloc.amount)}, ${phys.primary}`}
              />
              <button
                type="button"
                aria-label={`Mais ${fe(STEP)} em ${shortName(lot.id)}`}
                disabled={alloc.amount >= SIM_RULES.maxPerLot || (!selected && !canAdd)}
                onClick={() => onAmount(alloc.amount + STEP)}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm border border-border bg-surface text-fg transition-[transform,background-color] duration-100 hover:bg-surface-2 active:translate-y-px disabled:cursor-not-allowed disabled:text-muted"
              >
                <Plus aria-hidden className="size-4" strokeWidth={1.75} />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">
              {selected ? (
                <>
                  Compra <span className="font-mono text-fg tnum">{phys.primary}</span> {phys.secondary}
                  {lot.world === 'azeite' && <> · ≈ {num(Math.max(1, Math.round(phys.units / 1000)))} IBC</>}
                </>
              ) : (
                'Fora da carteira.'
              )}
            </p>
          </div>

          <div className="mt-3">
            <Switch
              id={`hedge-${uid}`}
              checked={alloc.hedged && lot.hedge.available}
              onChange={onHedge}
              disabled={!lot.hedge.available || !selected}
              label={lot.hedge.available ? `Cobertura: ${lot.hedge.label.toLowerCase()}` : 'Sem cobertura disponível'}
              description={`Fixa o preço de ${pct(lot.hedge.coverage, 0)} do volume. Custa ${pct(lot.hedge.costPct, 1)} do montante, haja choque ou não.`}
              disabledReason={lot.hedge.available ? 'Junta o lote à carteira para escolher a cobertura.' : `O preço da água oscila cerca de ± ${pct(lot.monthlyVolatility, 1)} ao mês: não há instrumento nem razão para cobrir.`}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono text-fg tnum">{value}</dd>
    </div>
  );
}
