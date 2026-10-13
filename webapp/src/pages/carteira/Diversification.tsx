import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { getWorld } from '../../data';
import type { WorldId } from '../../data';
import { Badge, SegmentedControl } from '../../components/ui';
import { CommodityGlyph } from '../../components/ui/Commodity';
import type { PositionView } from '../../state';
import { cn } from '../../lib/cn';
import { eur, pct } from '../../lib/format';
import { CONCENTRATION_LIMIT } from './positions';

/* =====================================================================
   Diversificação: quanto do montante financiado depende de cada produtor,
   lote e mundo. O empurrão é de proteção (concentração), nunca de retorno.
   ===================================================================== */

type By = 'produtor' | 'lote' | 'mundo';

interface Slice {
  id: string;
  label: string;
  sub: string;
  world: WorldId;
  amount: number;
  share: number;
}

function slices(positions: PositionView[], by: By): Slice[] {
  const active = positions.filter((p) => p.status !== 'liquidado');
  const total = active.reduce((s, p) => s + p.amount, 0) || 1;
  const acc = new Map<string, { p: PositionView; amount: number; lots: Set<string> }>();
  for (const p of active) {
    const key = by === 'produtor' ? p.producer.id : by === 'lote' ? p.lot.id : p.lot.world;
    const prev = acc.get(key) ?? { p, amount: 0, lots: new Set<string>() };
    prev.amount += p.amount;
    prev.lots.add(p.lot.id);
    acc.set(key, prev);
  }
  const lotsText = (n: number) => `${n} ${n === 1 ? 'lote' : 'lotes'}`;
  return [...acc.entries()]
    .map(([id, { p, amount, lots }]) => ({
      id,
      label: by === 'produtor' ? p.producer.nome : by === 'lote' ? p.lot.id : getWorld(p.lot.world).commodity,
      sub: by === 'produtor' ? `${lotsText(lots.size)} · ${p.producer.localidade}` : by === 'lote' ? p.producer.nome : lotsText(lots.size),
      world: p.lot.world,
      amount,
      share: amount / total,
    }))
    .sort((a, b) => b.share - a.share);
}

const BY_LABEL: Record<By, string> = { produtor: 'Produtor', lote: 'Lote', mundo: 'Mundo' };

export function Diversification({ positions }: { positions: PositionView[] }) {
  const [by, setBy] = useState<By>('produtor');
  const rows = slices(positions, by);
  const limited = by !== 'mundo';
  const byProducer = slices(positions, 'produtor');
  const byLot = slices(positions, 'lote');
  const topProducer = byProducer[0];
  const topLot = byLot[0];
  const producerOver = topProducer && topProducer.share > CONCENTRATION_LIMIT && byProducer.length > 1;
  const lotOver = topLot && topLot.share > CONCENTRATION_LIMIT && byLot.length > 1;
  const olive = slices(positions, 'mundo').find((s) => s.world === 'azeite');

  if (!rows.length) return null;

  return (
    <div className="min-w-0">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<By> label="Ver concentração por" value={by} onChange={setBy} options={(['produtor', 'lote', 'mundo'] as By[]).map((v) => ({ value: v, label: BY_LABEL[v] }))} />
        {limited && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <span aria-hidden className="inline-block h-4 w-0.5 bg-fg" />
            Limite de atenção: {pct(CONCENTRATION_LIMIT, 0)} por {by}
          </p>
        )}
      </div>
      <ul className="space-y-4" aria-label={`Montante financiado por ${by}`}>
        {rows.map((r) => {
          const over = limited && r.share > CONCENTRATION_LIMIT && rows.length > 1;
          return (
            <li key={r.id} className="grid min-w-0 gap-x-4 gap-y-1.5 sm:grid-cols-[13rem_minmax(0,1fr)_7.5rem] sm:items-center" data-world={r.world}>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-medium text-fg">
                  <CommodityGlyph world={r.world} className="size-4 text-world-ink" />
                  <span className={cn('truncate', by === 'lote' && 'font-mono tnum')}>{r.label}</span>
                </p>
                <p className="truncate text-xs text-muted">{r.sub}</p>
              </div>
              <div className="relative h-6 min-w-0" role="img" aria-label={`${r.label}: ${pct(r.share, 0)} do montante financiado, ${eur(r.amount)}${over ? ', acima do limite de atenção' : ''}`}>
                <div className="absolute inset-y-1.5 left-0 right-0 rounded-xs bg-surface-2" />
                <div className="absolute inset-y-1.5 left-0 rounded-r-[4px] bg-world transition-[width] duration-300 ease-out" style={{ width: `${r.share * 100}%` }} />
                {limited && <div aria-hidden className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-fg" style={{ left: `${CONCENTRATION_LIMIT * 100}%` }} />}
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                <span className="font-mono text-sm text-fg tnum">{pct(r.share, 0)}</span>
                <span className="font-mono text-xs text-muted tnum">{eur(r.amount)}</span>
              </div>
              {over && (
                <div className="sm:col-start-2 sm:col-end-4">
                  <Badge tone="warn" icon={<ShieldAlert aria-hidden className="size-3.5" strokeWidth={1.75} />}>
                    Acima do limite de atenção
                  </Badge>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {(producerOver || lotOver) && (
        <div role="note" className="mt-6 flex items-start gap-3 rounded-sm bg-[color-mix(in_oklab,var(--warn)_10%,var(--surface))] px-4 py-3 text-sm">
          <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warn-ink" strokeWidth={1.75} />
          <div className="min-w-0 text-fg">
            {producerOver && (
              <p>
                <strong className="font-semibold">{topProducer.label} concentra {pct(topProducer.share, 0)} do montante financiado</strong> ({topProducer.sub.split(' · ')[0]}). Se o lagar tiver um problema de qualidade ou de armazenagem, os lotes sofrem ao mesmo tempo.
              </p>
            )}
            {lotOver && !producerOver && (
              <p>
                <strong className="font-semibold">O lote {topLot.label} pesa {pct(topLot.share, 0)} do montante financiado.</strong> Um atraso nesse lote atrasa a maior parte do teu capital.
              </p>
            )}
            <p className="mt-1 text-muted">
              Antes de um novo compromisso no mesmo produtor, relê os fatores de risco de qualidade e de custódia. Diversificar não é investir mais: é não depender de um só lagar, lote ou mercadoria.
            </p>
          </div>
        </div>
      )}
      {by === 'mundo' && olive && (
        <p className="mt-5 text-sm text-muted">
          {pct(olive.share, 0)} do montante financiado depende do preço do azeite, que caiu mais de 35 % desde o início de 2025. A água tem preço estável mas margem fina por litro; o café só entra na Fase 2.
        </p>
      )}
    </div>
  );
}
