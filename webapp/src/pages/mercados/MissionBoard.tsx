import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { fundedFraction, getWorld, ILLUSTRATIVE_LABEL, isIllustrative, stageLabel, unitLabel } from '../../data';
import type { Lot, WorldId } from '../../data/types';
import { Badge, Button, ButtonLink, DataTable, StatusPill, TextLink, Tooltip } from '../../components/ui';
import type { Column } from '../../components/ui';
import { LotGauge } from '../../components/game';
import { addMonths } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { date as fmtDate, eur, monthYear, num, pct } from '../../lib/format';
import { lotQuantityLabel, physicalForAmount } from '../../lib/physical';
import { useData, useGame } from '../../state';
import { HEDGE_PILL, lotGoalTitle, lotPlace, unitPrice } from './model';

/* =====================================================================
   Lotes abertos: o medidor físico enche até ao financiamento (ou ao stock
   real, nos lotes em preparação), com o preço ao comprador e o seu canal,
   investimento mínimo, janela de liquidação, saída e cobertura em
   linguagem simples. Financiar não é uma missão (não dá pontos).
   ===================================================================== */

export function HedgePill({ world, lot }: { world: WorldId; lot?: Lot }) {
  const h = HEDGE_PILL[world];
  const pill = (
    <Badge tone={h.tone} icon={<ShieldCheck aria-hidden className="size-3.5" strokeWidth={1.75} />}>
      {h.label}
    </Badge>
  );
  if (!lot) return pill;
  return (
    <Tooltip content={h.detail(lot)}>
      <span tabIndex={0} className="inline-flex rounded-xs" aria-label={`Cobertura: ${h.label}. ${h.detail(lot)}`}>
        {pill}
      </span>
    </Tooltip>
  );
}

function stockFraction(lot: Lot) {
  return lot.quantity > 0 ? Math.min(1, lot.stock / lot.quantity) : 0;
}

function Term({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5 font-mono text-[0.9375rem] text-fg tnum">{value}</dd>
      {hint && <dd className="mt-0.5 text-sm text-muted">{hint}</dd>}
    </div>
  );
}

/** Uma missão aberta, por abrir (stock a encher) ou de pré-visualização (Fase 2). */
function MissionRow({ lot }: { lot: Lot }) {
  const world = lot.world;
  const game = useGame();
  const { positions } = useData();
  const mine = positions.filter((p) => p.lotId === lot.id && p.status !== 'liquidado');
  const mineTotal = mine.reduce((s, p) => s + p.amount, 0);
  const open = lot.status === 'aberto';
  const preparing = lot.status === 'em-preparacao';
  const preview = lot.status === 'fase-2';
  const cesto = lot.status === 'cesto';
  const funded = fundedFraction(lot);
  const gaugeValue = preparing || cesto ? stockFraction(lot) : funded;
  const read = game.riskRead(lot.id).length;
  const factors = lot.riskFactors.length;
  const min = physicalForAmount(lot, lot.funding.minTicket);
  // sem data fixada (em preparação, Fase 2): estimativa a partir da abertura, em mês e ano
  const end = lot.settlement.plannedEnd ?? addMonths(lot.funding.opensPlanned ?? lot.funding.opensAt, lot.settlement.windowMonths);
  const endExact = Boolean(lot.settlement.plannedEnd);
  const physicalUnit = world === 'agua' ? 'paletes' : world === 'cafe' ? 'sacas' : 'kg';
  const gaugeLabel = preparing ? `Stock do ${lot.id} a encher` : cesto ? `Stock engarrafado do cesto ${lot.id}` : preview ? `${lot.id}, pré-visualização da Fase 2` : `Financiamento do ${lot.id}`;
  const gaugeText = preparing || cesto ? `${num(lot.stock)} de ${num(lot.quantity)} ${physicalUnit}` : `${Math.round(funded * 100)} %`;
  const reasonId = `razao-${lot.id}`;

  return (
    <article className="grid gap-x-6 gap-y-4 py-6 first:pt-1 last:pb-1 sm:grid-cols-[auto_minmax(0,1fr)] xl:grid-cols-[auto_minmax(0,1fr)_14.5rem]" aria-labelledby={`m-${lot.id}`}>
      <Link to={`/lote/${lot.id}`} className="block self-start rounded-sm" aria-label={`Abrir a jornada do lote ${lot.id}`} tabIndex={-1}>
        <LotGauge kind={world} value={gaugeValue} size="md" label={gaugeLabel} valueText={gaugeText} caption={<span className="font-mono tnum">{gaugeText}</span>} className="max-sm:w-24" />
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-fg tnum">{lot.id}</span>
          <StatusPill status={lot.status} />
          <HedgePill world={world} lot={lot} />
        </div>
        <h3 id={`m-${lot.id}`} className="mt-2 text-[1.1875rem] leading-snug">
          <Link to={`/lote/${lot.id}`} className="hover:underline">
            {lotGoalTitle(lot)}
          </Link>
        </h3>
        <p className="mt-1 text-[0.9375rem] text-muted">
          {lot.title} · {lotPlace(lot)}
        </p>
        <p className="mt-2 text-[0.9375rem] text-fg">
          {open && (
            <>
              <span className="font-mono tnum">{eur(lot.funding.raised)}</span> financiados de <span className="font-mono tnum">{eur(lot.funding.goal)}</span> · {num(lot.funding.coFinancers)} cofinanciadores
            </>
          )}
          {preparing && (
            <>
              Em {world === 'agua' ? 'engarrafamento' : 'extração'}: <span className="font-mono tnum">{num(lot.stock)}</span> de <span className="font-mono tnum">{lotQuantityLabel(lot)}</span>. Abre a financiamento a <span className="font-mono tnum">{fmtDate(lot.funding.opensPlanned ?? lot.funding.opensAt)}</span>.
            </>
          )}
          {cesto && (
            <>
              Cesto · sem financiamento: <span className="font-mono tnum">{num(lot.stock)}</span> de <span className="font-mono tnum">{lotQuantityLabel(lot)}</span> engarrafadas. O engarrafador fatura e entrega; a Sprout recebe{' '}
              <span className="font-mono tnum">{pct(lot.economics.commissionPct ?? 0, 0)}</span> de comissão.
            </>
          )}
          {preview && (
            <>
              {getWorld(world).faseLabel}: objetivo de <span className="font-mono tnum">{eur(lot.funding.goal)}</span> para <span className="font-mono tnum">{lotQuantityLabel(lot)}</span>. Em due diligence, sem financiamento aberto.
            </>
          )}
        </p>
        {mineTotal > 0 && (
          <p className="mt-1 text-sm text-muted">
            A tua parte: <span className="font-mono text-fg tnum">{eur(mineTotal)}</span> · {physicalForAmount(lot, mineTotal).primary} ({pct(mineTotal / lot.funding.goal, 1)} do lote)
          </p>
        )}

        {cesto ? (
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
            <Term label={`Preço ao comprador · ${lot.economics.channelLabel}`} value={unitPrice(world, lot.economics.buyerPrice)} hint={lot.economics.priceBasis} />
            <Term label="Financiamento" value="Nenhum" hint="Sem capital de cofinanciadores" />
          </dl>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-4">
              <Term label={`Preço ao comprador · ${lot.economics.channelLabel}`} value={unitPrice(world, lot.economics.buyerPrice)} hint={lot.economics.priceBasis} />
              <Term label="Investimento mínimo" value={eur(lot.funding.minTicket)} hint={`≈ ${min.primary}`} />
              <Term label="Janela" value={`${lot.settlement.windowMonths} meses`} hint={endExact ? `liquidação prevista a ${fmtDate(end)}` : `liquidação prevista por volta de ${monthYear(end)}`} />
              <Term label="Extensão" value={`até ${lot.extension.maxMonths} meses`} hint="condicionada, uma só vez" />
            </dl>
            <p className="measure mt-3 text-sm text-muted">
              Saída só na liquidação: não há mercado secundário no piloto. Extrato mensal do lote; a liquidação é única, quando o comprador paga na conta segregada.
            </p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:col-start-2 xl:col-start-auto xl:self-start">
        <ButtonLink to={`/lote/${lot.id}`} variant={open ? 'primary' : 'secondary'} iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
          {preview ? 'Explorar a jornada' : 'Ver a jornada'}
        </ButtonLink>
        {!preview && !cesto && (
          <ButtonLink to={`/lote/${lot.id}#riscos`} variant="secondary">
            Fatores de risco <span className={cn('font-mono tnum', read === factors ? 'text-ok-ink' : 'text-muted')}>{read}/{factors}</span>
          </ButtonLink>
        )}
        {preview && (
          <>
            <Button variant="secondary" disabled aria-describedby={reasonId}>
              Financiar
            </Button>
            <p id={reasonId} className="text-sm text-muted">
              Só abre na Fase 2, depois de um go/no-go próprio. Até lá, joga-o no <TextLink to="/academia/simulador">simulador</TextLink>.
            </p>
          </>
        )}
        {open && game.commitBlock && (
          <p className="text-sm text-muted">
            {game.commitBlock === 'equipa' ? 'Vista da equipa: só o investidor pode comprometer capital.' : game.commitBlock === 'bloqueado' ? 'O piloto está fechado a investidores qualificados.' : 'Para financiar, conclui o registo.'}{' '}
            {game.commitBlock === 'onboarding' && <TextLink to={`/onboarding?lote=${lot.id}`}>Ir para o onboarding</TextLink>}
          </p>
        )}
        {open && !game.commitBlock && read < factors && <p className="text-sm text-muted">O compromisso só abre depois de leres os {factors} fatores de risco.</p>}
      </div>
    </article>
  );
}

export function MissionList({ lots, emptyText }: { lots: Lot[]; emptyText: string }) {
  if (!lots.length) return <p className="py-4 text-muted">{emptyText}</p>;
  return (
    <div className="divide-y divide-border">
      {lots.map((l) => (
        <MissionRow key={l.id} lot={l} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ em curso e liquidados */

export function RunningLotsTable({ lots, world }: { lots: Lot[]; world: WorldId }) {
  const unit = world === 'agua' ? 'paletes' : 'kg';
  const columns: Column<Lot>[] = [
    {
      key: 'stock',
      header: 'Stock',
      srHeader: true,
      render: (l) => <LotGauge kind={world} value={stockFraction(l)} size="xs" label={`Stock do ${l.id} em armazenagem`} valueText={`${num(l.stock)} de ${num(l.quantity)} ${unit}`} />,
    },
    {
      key: 'id',
      header: 'Lote',
      sortValue: (l) => l.id,
      minWidth: 200,
      render: (l) => (
        <div className="min-w-0">
          <TextLink to={`/lote/${l.id}`} className="font-mono tnum">
            {l.id}
          </TextLink>
          <p className="truncate text-muted">{lotPlace(l)}</p>
          {isIllustrative(l) && <p className="text-xs font-medium text-warn-ink">{ILLUSTRATIVE_LABEL}</p>}
        </div>
      ),
    },
    { key: 'stage', header: 'Etapa', sortValue: (l) => l.stage, render: (l) => stageLabel(world, l.stage) },
    {
      key: 'qty',
      header: 'Em armazenagem',
      align: 'right',
      mono: true,
      sortValue: (l) => l.stock / l.quantity,
      render: (l) => (
        <span className="whitespace-nowrap">
          {num(l.stock)} / {num(l.quantity)} {unitLabel(l) === 'kg' ? 'kg' : 'pal.'}
        </span>
      ),
    },
    {
      key: 'window',
      header: 'Janela de 18 meses',
      sortValue: (l) => l.settlement.start ?? '',
      minWidth: 168,
      render: (l) =>
        l.status === 'cesto' ? (
          <span className="text-muted">Cesto · sem janela</span>
        ) : (
        <span className="whitespace-nowrap font-mono tnum">
          {l.settlement.start ? monthYear(l.settlement.start) : '—'} → {l.settlement.plannedEnd ? monthYear(l.settlement.plannedEnd) : '—'}
          {l.settlement.extendedTo && <span className="block text-muted">estendida até {fmtDate(l.settlement.extendedTo)}</span>}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortValue: (l) => l.status,
      minWidth: 150,
      render: (l) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill status={l.status} />
          {l.status === 'liquidado' && l.settlement.settledResult !== undefined && (
            <span className="whitespace-nowrap text-muted">
              a {fmtDate(l.settlement.settledAt!)} · <span className="font-mono text-fg tnum">{pct(l.settlement.settledResult, 1, { sign: true })}</span>
            </span>
          )}
        </div>
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={lots}
      getRowId={(l) => l.id}
      caption={`Lotes em curso e liquidados em ${getWorld(world).nome}`}
      framed={false}
      empty={{ title: 'Ainda não há lotes em curso neste mundo.' }}
    />
  );
}
