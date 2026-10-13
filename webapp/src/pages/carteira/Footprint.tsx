import { useId, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { LotGauge, EASE_OUT } from '../../components/game';
import { Card } from '../../components/ui';
import { CommodityGlyph } from '../../components/ui/Commodity';
import type { PositionView } from '../../state';
import { num, t as tonnes } from '../../lib/format';
import { footprint } from './positions';

/* =====================================================================
   A pegada física da carteira: o montante traduzido em mercadoria. Um
   IBC desenhado por cada 1 000 kg de azeite, uma palete por cada palete
   de água. O dinheiro aparece ao lado, como facto, não como abertura.
   ===================================================================== */

/** Palete de água em miniatura: duas camadas de packs sobre o estrado. */
function PaleteGlyph({ fill, index }: { fill: number; index: number }) {
  const reduce = useReducedMotion();
  const clip = `pg-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 18 18" className="block size-[18px] shrink-0" aria-hidden>
      <defs>
        <clipPath id={clip}>
          <rect x="1.5" y="1.5" width="15" height="11.5" rx="1" />
        </clipPath>
      </defs>
      <rect x="1.5" y="1.5" width="15" height="11.5" rx="1" fill="none" stroke="color-mix(in oklab, var(--fg) 22%, var(--surface))" strokeWidth="1" />
      <g clipPath={`url(#${clip})`}>
        <motion.rect
          x="1.5"
          y="1.5"
          width="15"
          height="11.5"
          fill="var(--c-agua)"
          initial={reduce ? false : { scaleY: 0 }}
          animate={{ scaleY: fill }}
          style={{ originY: 1 }}
          transition={{ duration: 0.5, delay: reduce ? 0 : Math.min(0.6, index * 0.012), ease: EASE_OUT }}
        />
      </g>
      <line x1="1.5" x2="16.5" y1="7.25" y2="7.25" stroke="var(--surface)" strokeWidth="1" />
      <line x1="9" x2="9" y1="1.5" y2="13" stroke="var(--surface)" strokeWidth="1" />
      <rect x="1" y="14" width="16" height="2.5" rx="0.5" fill="none" stroke="color-mix(in oklab, var(--fg) 45%, var(--surface))" strokeWidth="1" />
    </svg>
  );
}

function IbcRow({ kg }: { kg: number }) {
  const reduce = useReducedMotion();
  const n = Math.ceil(kg / 1000);
  const shown = Math.min(n, 40);
  return (
    <div className="flex flex-wrap gap-1.5" role="img" aria-label={`${num(kg)} kg de azeite, cerca de ${n} IBC de 1 000 kg`}>
      {Array.from({ length: shown }, (_, i) => {
        const fill = Math.min(1, Math.max(0, kg / 1000 - i));
        return <LotGauge key={i} kind="ibc" size="xs" value={fill} label={`IBC ${i + 1}`} animateOnMount={!reduce} className="w-9 sm:w-10" />;
      })}
    </div>
  );
}

function PaleteRow({ paletes }: { paletes: number }) {
  const n = Math.ceil(paletes);
  const shown = Math.min(n, 120);
  return (
    <div className="flex max-w-[420px] flex-wrap gap-[3px]" role="img" aria-label={`${num(paletes, 1)} paletes de água de 1,5 L`}>
      {Array.from({ length: shown }, (_, i) => (
        <PaleteGlyph key={i} index={i} fill={Math.min(1, Math.max(0, paletes - i))} />
      ))}
    </div>
  );
}

export function Footprint({ positions, aside }: { positions: PositionView[]; aside: ReactNode }) {
  const fp = footprint(positions);
  return (
    <Card padding="lg" className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-0">
      <section className="min-w-0 lg:pr-8" aria-labelledby="pegada-title">
        <h2 id="pegada-title" className="text-[1.1875rem] leading-tight">
          A mercadoria que financias
        </h2>
        <p className="mt-1 text-sm text-muted">Cada desenho é um contentor real: um IBC de 1 000 kg de azeite, uma palete de 504 garrafas de água.</p>
        <div className="mt-6 space-y-7">
          {fp.oliveKg > 0 && (
            <div className="min-w-0" data-world="azeite">
              <p className="mb-3 flex flex-wrap items-baseline gap-x-2">
                <CommodityGlyph world="azeite" className="size-4 self-center text-world-ink" />
                <span className="font-display text-[1.375rem] font-bold leading-none text-fg pnum">{tonnes(fp.oliveKg)} de azeite</span>
                <span className="text-muted">
                  ≈ <span className="font-mono text-fg tnum">{num(fp.oliveJugs)}</span> garrafões de 5 L · {fp.oliveLots} {fp.oliveLots === 1 ? 'lote' : 'lotes'}
                </span>
              </p>
              <IbcRow kg={fp.oliveKg} />
            </div>
          )}
          {fp.paletes > 0 && (
            <div className="min-w-0" data-world="agua">
              <p className="mb-3 flex flex-wrap items-baseline gap-x-2">
                <CommodityGlyph world="agua" className="size-4 self-center text-world-ink" />
                <span className="font-display text-[1.375rem] font-bold leading-none text-fg pnum">{num(fp.paletes, 1)} paletes de água</span>
                <span className="text-muted">
                  ≈ <span className="font-mono text-fg tnum">{num(fp.waterBottles)}</span> garrafas de 1,5 L · {fp.waterLots} {fp.waterLots === 1 ? 'lote' : 'lotes'}
                </span>
              </p>
              <PaleteRow paletes={fp.paletes} />
            </div>
          )}
        </div>
      </section>
      <div className="min-w-0 border-border lg:border-l lg:pl-8">{aside}</div>
    </Card>
  );
}
