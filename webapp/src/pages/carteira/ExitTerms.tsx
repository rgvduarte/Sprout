import type { ReactNode } from 'react';
import { EXTENSION_MONTHS, SETTLEMENT_MONTHS } from '../../data';
import type { Lot } from '../../data';
import { cn } from '../../lib/cn';
import { date as fmtDate } from '../../lib/format';
import { plannedSettlement, playbookFor, REFLECTION_DAYS, windowOf } from './positions';

/**
 * Regras de saída em linguagem simples (prazo, liquidação, extensão,
 * refunding, liquidez). Sem lote: as regras gerais do piloto. Com lote: as
 * datas e condições desse lote.
 */
export function ExitTerms({ lot, className }: { lot?: Lot; className?: string }) {
  const w = lot ? windowOf(lot) : undefined;
  const settle = lot ? plannedSettlement(lot) : undefined;
  const pb = lot ? playbookFor(lot) : undefined;
  const items: { term: string; body: ReactNode }[] = [
    {
      term: 'Prazo',
      body: w ? (
        <>
          Janela de {SETTLEMENT_MONTHS} meses, de <span className="font-mono tnum text-fg">{fmtDate(w.start)}</span> a <span className="font-mono tnum text-fg">{fmtDate(w.end)}</span>
          {w.projected ? ', contada a partir do fecho do financiamento.' : '.'}
        </>
      ) : (
        `Cada lote tem uma janela de ${SETTLEMENT_MONTHS} meses, contada a partir do dia em que o financiamento fecha.`
      ),
    },
    {
      term: 'Liquidação',
      body: (
        <>
          De uma só vez, quando o lote está vendido e os compradores pagaram; pode ser antes do mês {SETTLEMENT_MONTHS}.
          {settle && (
            <>
              {' '}
              Prevista para <span className="font-mono tnum text-fg">{fmtDate(settle)}</span>, sem garantia.
            </>
          )}{' '}
          Transferência SEPA da conta segregada para o IBAN registado.
        </>
      ),
    },
    {
      term: 'Extensão',
      body: `Uma única vez, até ${EXTENSION_MONTHS} meses, só se no mês ${SETTLEMENT_MONTHS} a referência estiver 15 % ou mais abaixo do preço de entrada, ou se mais de 30 % do stock estiver por vender. É comunicada 30 dias antes do fim da janela, e a armazenagem continua a custar dinheiro.`,
    },
    {
      term: 'Refunding',
      body: pb ? `${pb.title}: ${pb.trigger.charAt(0).toLowerCase()}${pb.trigger.slice(1)} Dá tempo ao lote, com custo; não elimina a perda.` : 'Cada lote tem um plano escrito antes de abrir, com gatilhos, prazos e responsáveis. Dá tempo ao lote, com custo; não elimina a perda.',
    },
    {
      term: 'Liquidez',
      body: 'Não há mercado secundário no piloto: não é possível vender a posição antes da liquidação. Compromete só capital de que não precisas durante 18 meses, ou 24 com extensão.',
    },
    {
      term: 'Reflexão',
      body: `Depois de cada compromisso tens ${REFLECTION_DAYS} dias para cancelar sem custos, antes de a transferência ser aplicada no lote.`,
    },
    {
      term: 'Informação',
      body: 'Extrato mensal no dia 5 de cada mês, inventário físico mensal de cada lote e relatório final na liquidação.',
    },
  ];
  return (
    <dl className={cn('divide-y divide-border', className)}>
      {items.map((it) => (
        <div key={it.term} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
          <dt className="text-sm font-semibold text-fg">{it.term}</dt>
          <dd className="text-sm text-muted">{it.body}</dd>
        </div>
      ))}
    </dl>
  );
}
