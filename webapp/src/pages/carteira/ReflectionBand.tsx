import { Info } from 'lucide-react';
import { Button } from '../../components/ui';
import type { PositionView } from '../../state';
import { toDate, useNow } from '../../lib/clock';
import { date as fmtDate, eur } from '../../lib/format';
import { REFLECTION_DAYS, reflectionUntil } from './positions';

/**
 * Período de reflexão depois de um compromisso: uma banda calma de 4 dias,
 * com as datas e o que acontece a seguir. Sem contagem decrescente.
 */
export function ReflectionBand({ p }: { p: PositionView }) {
  const until = reflectionUntil(p);
  const current = useNow(60_000);
  if (!until) return null;
  const start = toDate(p.committedAt).getTime();
  const end = toDate(until).getTime();
  const t = Math.max(0, Math.min(1, (current.getTime() - start) / (end - start)));
  const open = t < 1;
  return (
    <div className="min-w-0 rounded-sm bg-[color-mix(in_oklab,var(--info)_9%,var(--surface))] px-4 py-3" role="group" aria-label={`Período de reflexão do compromisso no lote ${p.lot.id}`}>
      <p className="text-sm text-fg">
        <span className="font-semibold">{open ? `Pode cancelar sem custos até ${fmtDate(until)}` : 'Período de reflexão terminado'}</span>
        <span className="text-muted">
          {' '}
          · compromisso de <span className="font-mono text-fg tnum">{eur(p.amount)}</span> a <span className="font-mono tnum">{fmtDate(p.committedAt)}</span>, {REFLECTION_DAYS} dias de reflexão
        </span>
      </p>
      <div className="mt-3" aria-hidden>
        <div className="relative h-2 rounded-full bg-[color-mix(in_oklab,var(--info)_18%,var(--surface-2))]">
          <div className="absolute inset-y-0 left-0 rounded-full bg-info" style={{ width: `${t * 100}%` }} />
          {Array.from({ length: REFLECTION_DAYS - 1 }, (_, i) => (
            <span key={i} className="absolute top-0 h-full w-0.5 bg-[color-mix(in_oklab,var(--info)_8%,var(--surface))]" style={{ left: `${((i + 1) / REFLECTION_DAYS) * 100}%` }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between font-mono text-xs text-muted tnum">
          <span>{fmtDate(p.committedAt)}</span>
          <span>{fmtDate(until)}</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">
        Transfere por SEPA para a conta segregada no PSP, com a referência <span className="font-mono text-fg tnum">{p.id.toUpperCase()}</span>. Depois de {fmtDate(until)} a transferência é aplicada no lote.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="quiet-danger" size="sm" disabled aria-describedby={`cancel-${p.id}`}>
          Cancelar compromisso
        </Button>
        <p id={`cancel-${p.id}`} className="flex items-start gap-1.5 text-sm text-muted">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
          Indisponível nesta demonstração: o cancelamento é feito pela equipa de operações e não está simulado.
        </p>
      </div>
    </div>
  );
}
