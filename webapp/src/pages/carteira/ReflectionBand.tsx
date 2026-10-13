import { useState } from 'react';
import { Button, Dialog } from '../../components/ui';
import { transferReference, useGame, useToast, type PositionView } from '../../state';
import { toDate, useNow } from '../../lib/clock';
import { date as fmtDate, eur } from '../../lib/format';
import { physicalForAmount } from '../../lib/physical';
import { REFLECTION_DAYS, reflectionUntil } from './positions';

/**
 * Período de reflexão depois de um compromisso: uma banda calma de 4 dias,
 * com as datas e o que acontece a seguir. Sem contagem decrescente.
 */
export function ReflectionBand({ p }: { p: PositionView }) {
  const until = reflectionUntil(p);
  const current = useNow(60_000);
  const game = useGame();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState(false);
  if (!until) return null;
  const start = toDate(p.committedAt).getTime();
  const end = toDate(until).getTime();
  const t = Math.max(0, Math.min(1, (current.getTime() - start) / (end - start)));
  const open = t < 1;
  return (
    <div className="min-w-0 rounded-sm bg-[color-mix(in_oklab,var(--info)_9%,var(--surface))] px-4 py-3" role="group" aria-label={`Período de reflexão do compromisso no lote ${p.lot.id}`}>
      <p className="text-sm text-fg">
        <span className="font-semibold">{open ? `Podes cancelar sem custos até ${fmtDate(until)}` : 'Período de reflexão terminado'}</span>
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
        Transfere por SEPA para a conta segregada no PSP, com a referência <span className="font-mono text-fg tnum">{transferReference(p)}</span>. Depois de {fmtDate(until)} a transferência é aplicada no lote.
      </p>
      {open && p.session && (
        <div className="mt-3">
          <Button variant="quiet-danger" size="sm" onClick={() => setConfirm(true)}>
            Cancelar compromisso
          </Button>
        </div>
      )}
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        role="alertdialog"
        title={`Cancelar o compromisso de ${eur(p.amount)}?`}
        description={`Estás dentro do período de reflexão (até ${fmtDate(until)}): o cancelamento não tem custos e nenhuma transferência foi aplicada.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)} data-autofocus>
              Manter compromisso
            </Button>
            <Button
              variant="quiet-danger"
              onClick={() => {
                const r = game.cancelCommitment(p.id);
                setConfirm(false);
                toast(r.ok ? { tone: 'neutral', title: `Compromisso cancelado · ${p.lot.id}`, description: 'Sem custos. Nenhuma transferência tinha sido aplicada.' } : { tone: 'warn', title: 'Não foi possível cancelar', description: r.message });
                // o cartão da posição sai da lista: o foco vai para o título "Os teus lotes" (não cai para a página)
                if (r.ok) window.requestAnimationFrame(() => document.getElementById('lotes-title')?.focus());
              }}
            >
              Cancelar compromisso
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          A fatia de {physicalForAmount(p.lot, p.amount).primary} sai do lote {p.lot.id}. O teu nível de conhecimento e as missões cumpridas não mudam: nunca dependeram do montante.
        </p>
      </Dialog>
    </div>
  );
}
