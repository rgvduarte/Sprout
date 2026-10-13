import { FileText, Repeat } from 'lucide-react';
import type { SimRunResult } from '../../data/types';
import { Badge, Button, EmptyState } from '../../components/ui';
import { dateTime } from '../../lib/format';
import { getSimLot, shortName } from './deck';
import { eventIdsFromResult } from './runs';
import { getDeckEvent } from './deck';
import { fe, fpct, WORLD_BG } from './parts';
import { firstSeasonRun } from './LeaguePanel';
import { cn } from '../../lib/cn';

/** Histórico das campanhas jogadas: por data, nunca ordenado por resultado. */
export function HistoryPanel({ runs, onReview, onReplay }: { runs: SimRunResult[]; onReview: (r: SimRunResult) => void; onReplay: (r: SimRunResult) => void }) {
  if (!runs.length) {
    return <EmptyState title="Ainda não completaste nenhuma campanha" body="Cada campanha fica aqui quando abres o balanço: a semente, os lotes, as decisões e o resultado fictício, para a poderes rever ou rejogar." />;
  }
  const season = firstSeasonRun(runs);
  return (
    <div>
      <p className="measure mb-3 text-sm text-muted">Do mais recente para o mais antigo. Não é uma classificação: serve para rever o que decidiste e rejogar com a mesma semente.</p>
      <ol className="divide-y divide-border rounded-md border border-border bg-surface">
        {runs.map((r, i) => {
          const evs = eventIdsFromResult(r)
            .map((id) => getDeckEvent(id)?.title)
            .filter(Boolean) as string[];
          return (
            <li key={r.id + r.at} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="font-mono text-sm text-muted tnum">
                  {dateTime(r.at)} · semente {r.seed}
                  {i === 0 && <span className="font-sans"> · a mais recente</span>}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-fg">
                  {r.allocations.map((a) => (
                    <span key={a.simLotId} className="inline-flex items-center gap-1.5">
                      <span aria-hidden className={cn('size-2 rounded-[2px]', WORLD_BG[getSimLot(a.simLotId)!.world])} />
                      {shortName(a.simLotId)}
                      {a.hedged && <span className="text-muted">(coberto)</span>}
                    </span>
                  ))}
                </p>
                <p className="mt-1 text-sm text-muted">
                  <span className="font-mono text-fg tnum">{fe(r.invested)}</span> → <span className="font-mono text-fg tnum">{fe(r.finalValue)}</span> ({fpct(r.result)}) fictícios
                  {evs.length > 0 && <> · {evs.slice(0, 3).join(', ').toLowerCase()}{evs.length > 3 ? '…' : ''}</>}
                </p>
                {(r.extended || r.refunded || r === season) && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {r === season && <Badge tone="accent">Conta para a liga</Badge>}
                    {r.refunded && <Badge tone="neutral">Refunding</Badge>}
                    {r.extended && <Badge tone="neutral">Extensão</Badge>}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" iconLeft={<FileText aria-hidden className="size-4" strokeWidth={1.75} />} onClick={() => onReview(r)}>
                  Rever balanço
                </Button>
                <Button variant="ghost" size="sm" iconLeft={<Repeat aria-hidden className="size-4" strokeWidth={1.75} />} onClick={() => onReplay(r)}>
                  Rejogar
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
