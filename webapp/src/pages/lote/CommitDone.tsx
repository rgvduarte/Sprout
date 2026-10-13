import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, PackageOpen } from 'lucide-react';
import { fundedFraction, getSeal, getSealForLot } from '../../data';
import type { Position } from '../../data/types';
import { LotGauge, WaxSealStamp } from '../../components/game';
import { Button, ButtonLink, Dialog, RadioGroup, RiskNote, StatusPill } from '../../components/ui';
import { daysBetween, TODAY_DATE } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { date as fmtDate, eur, pct } from '../../lib/format';
import { physicalForAmount } from '../../lib/physical';
import { useData, useRole, useToast } from '../../state';
import { cancelCommitment, requestSample, sampleKey, useLedger } from './ledger';
import { addDays, containersFor, firstStatement, REFLECTION_DAYS, reflectionEnd, transferDue } from './model';
import { OriginCard } from './OriginCard';
import { useJourney } from './shared';

/* =====================================================================
   Depois do compromisso: o selo de lacre carimba, a fatia entra no
   depósito, a carta de origem revela-se. A seguir, calma: período de
   reflexão com cancelamento sem custos, próximos passos, amostra do lote.
   Sem confetes, sem conversa de lucro, sem convite a comprometer mais.
   ===================================================================== */

export interface CommitMoment {
  position: Position;
  /** fração financiada antes do compromisso (para animar a fatia) */
  prevFunded: number;
  sealId?: string;
  firstSeal: boolean;
  /** compromisso acabado de fazer (anima o ritual) ou posição já existente (estado final) */
  fresh: boolean;
}

/** Banda calma do período de reflexão: dias desde o compromisso até ao fim, com "hoje". */
function ReflectionBand({ committedAt }: { committedAt: string }) {
  const start = committedAt.slice(0, 10);
  const end = reflectionEnd(committedAt);
  const elapsed = Math.max(0, Math.min(REFLECTION_DAYS, daysBetween(start, TODAY_DATE)));
  const days = Array.from({ length: REFLECTION_DAYS }, (_, i) => addDays(start, i));
  return (
    <div>
      <p className="text-[1.0625rem] font-medium text-fg">
        Podes cancelar sem custos até <span className="font-mono tnum">{fmtDate(end)}</span>
      </p>
      <div className="mt-2 grid gap-0.5" style={{ gridTemplateColumns: `repeat(${REFLECTION_DAYS}, minmax(0, 1fr))` }} role="img" aria-label={`Período de reflexão de ${REFLECTION_DAYS} dias, de ${fmtDate(start)} a ${fmtDate(end)}. Dia ${elapsed + 1} de ${REFLECTION_DAYS}.`}>
        {days.map((d, i) => (
          <div key={d} className="min-w-0">
            <div className={cn('h-2.5', i === 0 && 'rounded-l-xs', i === days.length - 1 && 'rounded-r-xs', i <= elapsed ? 'bg-accent' : 'bg-[color-mix(in_oklab,var(--accent)_16%,var(--surface-2))]')} />
            <p className={cn('mt-1 font-mono text-xs tnum', i === elapsed ? 'text-fg' : 'text-muted')}>
              {fmtDate(d).slice(0, 5)}
              {i === elapsed && ' · hoje'}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-1 text-sm text-muted">Nenhuma transferência é pedida antes do fim deste período.</p>
    </div>
  );
}

function SampleRequest() {
  const { lot, ctx } = useJourney();
  const { profileId } = useRole();
  const { toast } = useToast();
  const ledger = useLedger();
  const [option, setOption] = useState<'sede' | 'visita'>('sede');
  const req = ledger.samples[sampleKey(profileId, lot.id)];
  const ship = addDays(TODAY_DATE, 14);
  return (
    <div>
      <h4 className="flex items-center gap-2 font-display text-[1.0625rem] font-semibold">
        <PackageOpen aria-hidden className="size-5 text-world-ink" strokeWidth={1.75} />
        Amostra do lote
      </h4>
      <p className="mt-1 text-sm text-muted">Cada co-financiador pode pedir uma amostra, seja qual for o montante: {ctx.copy.sample}.</p>
      {req ? (
        <p className="mt-3 text-[0.9375rem] text-fg" role="status">
          Amostra pedida a <span className="font-mono tnum">{fmtDate(req.at)}</span> ·{' '}
          {req.option === 'sede' ? `envio para a sede registada até ${fmtDate(ship)}` : `levantamento numa visita a ${ctx.producer.nome}, a combinar`}.
        </p>
      ) : (
        <div className="mt-3">
          <RadioGroup
            legend="Como queres receber a amostra"
            name={`amostra-${lot.id}`}
            value={option}
            onChange={setOption}
            options={[
              { value: 'sede', label: 'Enviar para a morada da sede registada no KYB', description: `Envio até ${fmtDate(ship)}` },
              { value: 'visita', label: `Levantar numa visita a ${ctx.producer.nome}`, description: 'Data a combinar com o produtor durante a campanha' },
            ]}
          />
          <Button
            variant="secondary"
            className="mt-2"
            onClick={() => {
              requestSample(profileId, lot.id, option);
              toast({ tone: 'neutral', title: 'Amostra pedida', description: `${lot.id} · ${option === 'sede' ? 'envio para a sede' : 'levantamento numa visita'}` });
            }}
          >
            Pedir amostra do lote
          </Button>
        </div>
      )}
    </div>
  );
}

export function CommitDone({ moment, onCancelled }: { moment: CommitMoment; onCancelled: () => void }) {
  const { lot, ctx } = useJourney();
  const data = useData();
  const { profileId } = useRole();
  const { toast } = useToast();
  const [stampNow, setStampNow] = useState(!moment.fresh);
  const [revealed, setRevealed] = useState(!moment.fresh);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!moment.fresh) return;
    const t = window.setTimeout(() => setStampNow(true), 420);
    return () => window.clearTimeout(t);
  }, [moment.fresh]);
  const onStamped = useCallback(() => setRevealed(true), []);
  const [gaugeValue, setGaugeValue] = useState(moment.fresh ? moment.prevFunded : fundedFraction(lot));
  const p = moment.position;
  const phys = physicalForAmount(lot, p.amount);
  const now = fundedFraction(lot);
  useEffect(() => {
    const t = window.setTimeout(() => setGaugeValue(now), moment.fresh ? 120 : 0);
    return () => window.clearTimeout(t);
  }, [now, moment.fresh]);
  const seal = moment.sealId ? getSeal(moment.sealId) : getSealForLot(lot);
  const sealView = seal ? data.seals.find((s) => s.def.id === seal.id) : undefined;
  const reflEnd = reflectionEnd(p.committedAt);
  const inReflection = daysBetween(TODAY_DATE, reflEnd) >= 0;
  const ref = `SPR-${lot.id.replace(/-/g, '')}-${(p.id.match(/s(\d+)/)?.[1] ?? '1').padStart(3, '0')}`;


  return (
    <div className="grid min-w-0 gap-x-12 gap-y-10 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-7">
        <div className="flex items-end gap-5">
          <LotGauge
            kind={lot.world}
            value={gaugeValue}
            highlight={[Math.max(0, now - p.amount / lot.funding.goal), now]}
            size="md"
            label={`Financiamento do lote ${lot.id} com o teu compromisso`}
            valueText={`${pct(now, 1)} financiado; a tua fatia ${pct(p.amount / lot.funding.goal, 1)}`}
            className="w-[112px] shrink-0 [&_svg]:h-auto [&_svg]:w-full"
          />
          <div className="min-w-0 pb-1">
            <StatusPill label="Aguarda transferência" tone="info" />
            <h3 className="mt-2 text-[1.5rem] leading-tight">Compromisso registado</h3>
            <p className="mt-1 text-[1.0625rem] text-fg">
              <span className="font-mono tnum">{eur(p.amount)}</span> no lote <span className="font-mono tnum">{lot.id}</span>
            </p>
            <p className="text-sm text-muted">
              A tua fração: {phys.primary} ({containersFor(lot, phys.base)}) · {phys.secondary} · {pct(phys.shareOfLot, 1)} do lote
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          {inReflection ? (
            <>
              <ReflectionBand committedAt={p.committedAt} />
              <Button variant="quiet-danger" className="mt-4" onClick={() => setConfirm(true)}>
                Cancelar compromisso
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted">O período de reflexão terminou a {fmtDate(reflEnd)}.</p>
          )}
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <h4 className="font-display text-[1.0625rem] font-semibold">Próximos passos</h4>
          <ol className="mt-3 space-y-4">
            <li className="flex gap-3">
              <span aria-hidden className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold tnum">1</span>
              <div className="min-w-0">
                <p className="font-medium text-fg">Transferência SEPA para a conta segregada</p>
                <p className="mt-0.5 text-sm text-muted">
                  Depois de {fmtDate(reflEnd)} e até {fmtDate(transferDue(p.committedAt))}, transfere {eur(p.amount)} para a conta segregada do lote num prestador de pagamentos licenciado na UE. Sem numerário; a reconciliação é diária.
                </p>
                <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
                  <dt className="text-muted">IBAN</dt>
                  <dd className="font-mono text-fg tnum">PT50 0000 0000 0000 0000 0000 0 (demonstração)</dd>
                  <dt className="text-muted">Referência</dt>
                  <dd className="font-mono text-fg tnum">{ref}</dd>
                </dl>
              </div>
            </li>
            <li className="flex gap-3">
              <span aria-hidden className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold tnum">2</span>
              <div className="min-w-0">
                <p className="font-medium text-fg">Documentos</p>
                <p className="mt-0.5 text-sm text-muted">
                  Contrato Plataforma–Investidor (18 meses, extensão, força maior), ficha do lote e boletim {lot.analyses[lot.analyses.length - 1]?.reportId ?? 'de análises'} ficam na tua Carteira.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span aria-hidden className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold tnum">3</span>
              <div className="min-w-0">
                <p className="font-medium text-fg">Acompanhamento</p>
                <p className="mt-0.5 text-sm text-muted">
                  Relatório de inventário mensal com fotografia, extrato trimestral (o primeiro a {fmtDate(firstStatement(p.committedAt))}) e uma única liquidação no fim do ciclo.
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <SampleRequest />
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <ButtonLink to="/carteira" variant="primary" iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
            Ver na Carteira
          </ButtonLink>
          <ButtonLink to="/caderno" variant="secondary">
            Abrir o Caderno de colheita
          </ButtonLink>
        </div>
        <RiskNote className="mt-6" />
      </div>

      {/* o lacre e a carta de origem */}
      <div className="min-w-0 lg:col-span-5">
        <div className="relative mx-auto w-full max-w-[360px] pt-10 lg:mx-0">
          <OriginCard lot={lot} producer={ctx.producer} region={ctx.region} reveal={revealed} />
          {seal && sealView && (
            <div className="absolute -top-2 right-[-8px] sm:right-[-18px]">
              <WaxSealStamp
                seal={seal}
                producer={sealView.producer}
                region={sealView.region}
                size={104}
                stamped={stampNow}
                onStamped={onStamped}
              />
            </div>
          )}
          {!revealed && !seal && <span className="sr-only">A carta de origem aparece depois do carimbo.</span>}
          <p className="mt-3 text-sm text-muted" aria-live="polite">
            {!sealView
              ? 'Carta de origem deste lote no teu Caderno.'
              : moment.firstSeal
                ? `Novo selo de origem no teu Caderno: ${sealView.producer.nome} · ${seal?.campanha}. A carta de origem do lote junta-se à coleção.`
                : sealView.earned?.by === 'diligencia'
                  ? `O selo de ${sealView.producer.nome} · ${seal?.campanha} já estava no teu Caderno, ganho por diligência. Este compromisso junta-lhe a carta de origem do lote.`
                  : `Selo de ${sealView.producer.nome} · ${seal?.campanha} e carta de origem do lote no teu Caderno.`}
          </p>
          <p className="mt-2 text-sm text-muted">Selos e cartas registam participação e diligência. Não dão pontos, não se trocam e não têm valor.</p>
        </div>
      </div>

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        role="alertdialog"
        title={`Cancelar o compromisso de ${eur(p.amount)}?`}
        description={`Estás dentro do período de reflexão (até ${fmtDate(reflEnd)}): o cancelamento não tem custos e nenhuma transferência foi pedida.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)} data-autofocus>
              Manter compromisso
            </Button>
            <Button
              variant="quiet-danger"
              onClick={() => {
                cancelCommitment(p, profileId);
                setConfirm(false);
                toast({ tone: 'neutral', title: `Compromisso cancelado · ${lot.id}`, description: 'Sem custos. Nenhuma transferência tinha sido pedida.' });
                onCancelled();
              }}
            >
              Cancelar compromisso
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          A fatia de {phys.primary} sai do lote e o lote volta a {pct(Math.max(0, now - p.amount / lot.funding.goal), 1)} financiado. O teu nível de conhecimento e as missões cumpridas não mudam: nunca dependeram do montante.
        </p>
      </Dialog>
    </div>
  );
}
