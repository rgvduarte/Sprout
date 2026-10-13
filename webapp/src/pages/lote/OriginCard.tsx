import { motion, useReducedMotion } from 'motion/react';
import type { Lot, Producer, Region } from '../../data/types';
import { EASE_OUT } from '../../components/game';
import { cn } from '../../lib/cn';
import { date as fmtDate, num } from '../../lib/format';
import { lotQuantityLabel } from '../../lib/physical';
import { Terrain } from './Terrain';

/* =====================================================================
   Carta de origem: carta colecionável do lote, com estatísticas reais
   (região, variedade, análise, extração, quantidade, campanha). Não é
   transmissível, não se resgata e não tem mercado.
   ===================================================================== */

function keyStat(lot: Lot): { label: string; value: string } | undefined {
  const a = lot.analyses[lot.analyses.length - 1];
  if (!a) return undefined;
  const pick = (id: string) => a.params.find((p) => p.id === id);
  if (lot.world === 'azeite') {
    const p = pick('acidez');
    return p && { label: 'Acidez', value: `${num(p.value, 2)} %` };
  }
  if (lot.world === 'agua') {
    const p = pick('residuo');
    return p && { label: 'Resíduo seco', value: `${num(p.value)} mg/L` };
  }
  const p = pick('sca');
  return p && { label: 'Pontuação SCA', value: `${num(p.value, 2)} pts` };
}

export function OriginCard({ lot, producer, region, reveal, className }: { lot: Lot; producer: Producer; region: Region; reveal: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const colhido = lot.milestones.find((m) => m.stage === 'colhido');
  const stat = keyStat(lot);
  const rows = [
    { label: 'Lote', value: lot.id, mono: true },
    { label: 'Região', value: `${producer.localidade}, ${region.nome}` },
    { label: lot.world === 'agua' ? 'Água' : 'Variedades', value: producer.variedades.join(', ') },
    ...(stat ? [{ label: stat.label, value: stat.value, mono: true }] : []),
    { label: lot.world === 'agua' ? 'Engarrafado' : 'Extração', value: colhido?.date ? fmtDate(colhido.date) : '—', mono: true },
    { label: 'Quantidade', value: lotQuantityLabel(lot), mono: true },
    { label: 'Campanha', value: lot.campanha, mono: true },
  ];
  return (
    <motion.figure
      data-world={lot.world}
      className={cn('relative w-full max-w-[360px] overflow-hidden rounded-md border border-world-line bg-surface', className)}
      initial={false}
      animate={reveal ? { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 } : { clipPath: reduce ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)', opacity: reduce ? 0 : 1 }}
      transition={{ duration: reduce ? 0.2 : 0.65, ease: EASE_OUT }}
      aria-hidden={!reveal}
    >
      <div className="bg-world-soft px-4 pt-3">
        <Terrain world={lot.world} seed={`${lot.id}-carta`} label={`Paisagem de ${producer.nome}`} />
      </div>
      <div className="px-4 pb-4 pt-3">
        <p className="font-display text-[1.25rem] font-bold leading-tight text-fg">{producer.nome}</p>
        <p className="text-sm text-muted">
          {region.nome} · Campanha {lot.campanha}
        </p>
        <dl className="mt-3 divide-y divide-border border-y border-border text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-4 py-1.5">
              <dt className="shrink-0 text-muted">{r.label}</dt>
              <dd className={cn('min-w-0 text-right text-fg', r.mono && 'font-mono tnum')}>{r.value}</dd>
            </div>
          ))}
        </dl>
        <figcaption className="mt-3 text-xs leading-snug text-muted">Carta de origem · não transmissível, não resgatável, sem valor monetário.</figcaption>
      </div>
    </motion.figure>
  );
}
