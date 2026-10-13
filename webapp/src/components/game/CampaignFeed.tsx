import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Pause, Play } from 'lucide-react';
import { EVENT_KIND_LABEL } from '../../data';
import type { CampaignEvent } from '../../data/types';
import { useNow } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { relative, time } from '../../lib/format';
import type { FeedPauseReason } from '../../lib/useLiveFeed';
import { useFeed } from '../../state';
import { CommodityGlyph } from '../ui/Commodity';
import { EASE_OUT } from './motion';

/* =====================================================================
   Diário de campanha: eventos reais dos produtores (telemetria, análises,
   expedições). Os novos entram no topo sem empurrar o leitor (com
   movimento reduzido entram sem animação). Com `live`, mostra o estado da
   telemetria e o botão "Pausar Diário / Retomar Diário" (WCAG 2.2.2).
   ===================================================================== */

export interface CampaignFeedProps {
  events: CampaignEvent[];
  limit?: number;
  /** cabeçalho "Ao vivo / Em pausa" com o botão de pausa (o estado vem do Diário ao vivo) */
  live?: boolean | { paused?: boolean; reason?: FeedPauseReason | null };
  compact?: boolean;
  /** ligações para os lotes (por omissão sim) */
  linkLots?: boolean;
  className?: string;
  emptyText?: string;
}

const PAUSE_TEXT: Record<FeedPauseReason, string> = {
  user: 'em pausa',
  'reduced-motion': 'em pausa',
  hidden: 'em pausa: separador em segundo plano',
  disabled: 'em pausa',
};

/** Estado da telemetria + botão para pausar ou retomar as leituras ao vivo (guardado neste browser). */
export function FeedLiveHeader({ className, label = 'Telemetria dos produtores' }: { className?: string; label?: string }) {
  const feed = useFeed();
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-x-3 gap-y-1', className)}>
      <p className="flex items-center gap-2 text-sm text-muted" aria-live="off">
        <span aria-hidden className={cn('size-2 shrink-0 rounded-full', feed.paused ? 'bg-muted' : 'bg-ok')} />
        {feed.paused ? `${label} ${PAUSE_TEXT[feed.pauseReason ?? 'disabled']}` : `${label} em direto`}
      </p>
      {feed.pauseReason !== 'disabled' && (
        <button
          type="button"
          onClick={() => feed.setUserPaused(!feed.userPaused)}
          aria-pressed={feed.userPaused}
          className="relative inline-flex h-9 items-center gap-1.5 rounded-sm px-2 text-sm font-medium text-accent after:absolute after:-inset-1 after:content-[''] hover:bg-surface-2"
        >
          {feed.userPaused ? <Play aria-hidden className="size-4" strokeWidth={1.75} /> : <Pause aria-hidden className="size-4" strokeWidth={1.75} />}
          {feed.userPaused ? 'Retomar Diário' : 'Pausar Diário'}
        </button>
      )}
    </div>
  );
}

export function CampaignFeed({ events, limit = 8, live, compact, linkLots = true, className, emptyText = 'Sem eventos registados.' }: CampaignFeedProps) {
  const reduce = useReducedMotion();
  const now = useNow(20_000);
  const list = events.slice(0, limit);
  return (
    <div className={cn('min-w-0', className)}>
      {live && <FeedLiveHeader className="mb-2" />}
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
