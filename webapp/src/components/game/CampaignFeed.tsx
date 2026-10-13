import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { EVENT_KIND_LABEL } from '../../data';
import type { CampaignEvent } from '../../data/types';
import { useNow } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { relative, time } from '../../lib/format';
import { CommodityGlyph } from '../ui/Commodity';
import { EASE_OUT } from './motion';

/* =====================================================================
   Diário de campanha: eventos reais dos produtores (telemetria, análises,
   expedições). Os novos entram no topo sem empurrar o leitor.
   ===================================================================== */

export interface CampaignFeedProps {
  events: CampaignEvent[];
  limit?: number;
  /** cabeçalho "Ao vivo / Em pausa" */
  live?: { paused: boolean; reason?: 'reduced-motion' | 'hidden' | 'disabled' | null };
  compact?: boolean;
  /** ligações para os lotes (por omissão sim) */
  linkLots?: boolean;
  className?: string;
  emptyText?: string;
}

const PAUSE_TEXT = {
  'reduced-motion': 'em pausa: movimento reduzido ativo',
  hidden: 'em pausa: separador em segundo plano',
  disabled: 'em pausa',
} as const;

export function CampaignFeed({ events, limit = 8, live, compact, linkLots = true, className, emptyText = 'Sem eventos registados.' }: CampaignFeedProps) {
  const reduce = useReducedMotion();
  const now = useNow(20_000);
  const list = events.slice(0, limit);
  return (
    <div className={cn('min-w-0', className)}>
      {live && (
        <p className="mb-2 flex items-center gap-2 text-sm text-muted" aria-live="off">
          <span aria-hidden className={cn('size-2 rounded-full', live.paused ? 'bg-muted' : 'bg-ok')} />
          {live.paused ? `Telemetria ${PAUSE_TEXT[live.reason ?? 'disabled']}` : 'Telemetria dos produtores em direto'}
        </p>
      )}
      {list.length === 0 ? (
        <p className="text-sm text-muted">{emptyText}</p>
      ) : (
        <ol className="divide-y divide-border" aria-label="Diário de campanha">
          <AnimatePresence initial={false}>
            {list.map((e) => (
              <motion.li
                key={e.id}
                layout={!reduce ? 'position' : false}
                initial={reduce ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
                className={cn('flex min-w-0 items-start gap-3', compact ? 'py-2' : 'py-3')}
                data-world={e.world}
              >
                <span aria-hidden className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-world-soft text-world-ink">
                  <CommodityGlyph world={e.world} className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn('leading-snug text-fg', compact ? 'text-sm' : 'text-[0.9375rem]')}>{e.title}</p>
                  {!compact && e.detail && <p className="mt-0.5 text-sm text-muted">{e.detail}</p>}
                  <p className="mt-0.5 text-xs text-muted">
                    <span>{EVENT_KIND_LABEL[e.kind]}</span>
                    {' · '}
                    <time dateTime={e.at} className="font-mono tnum" title={time(e.at)}>
                      {relative(e.at, now)}
                    </time>
                  </p>
                </div>
                {linkLots && e.lotId && (
                  <Link to={`/lote/${e.lotId}`} className="inline-flex min-h-11 shrink-0 items-center gap-1 px-1 font-mono text-xs text-accent hover:underline" aria-label={`Abrir lote ${e.lotId}`}>
                    {e.lotId}
                    <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
                  </Link>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </div>
  );
}
