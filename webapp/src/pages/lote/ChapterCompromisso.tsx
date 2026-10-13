import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { fundedFraction, maxCommit, getWorld } from '../../data';
import type { WorldId } from '../../data/types';
import { CountUp, HoldToConfirm, LotGauge } from '../../components/game';
import { ButtonLink, Checkbox, Field, Input, Slider, TextLink } from '../../components/ui';
import { now } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { date as fmtDate, eur, num, pct } from '../../lib/format';
import { physicalForAmount } from '../../lib/physical';
import { useData, useGame, useRole, useToast } from '../../state';
import { CommitDone, type CommitMoment } from './CommitDone';
import { positionKey } from './ledger';
import { concentrationAfter, containersFor, priceDecimals, reflectionEnd } from './model';
import { ChapterHeading, CheckMark, CHROME_H, useJourney, Wrap } from './shared';

/* =====================================================================
   Capítulo 6 · Compromisso (dinheiro real). Montante traduzido em
   mercadoria, condições, efeito na diversificação, elegibilidade, a
   declaração explícita e a confirmação por pressão contínua.
   ===================================================================== */

const WORLD_FILL: Record<WorldId, string> = { azeite: 'var(--c-azeite)', agua: 'var(--c-agua)', cafe: 'var(--c-cafe)' };

function Diversification({ amount }: { amount: number }) {
  const { lot, ctx } = useJourney();
  const data = useData();
  const c = concentrationAfter(data.positions, lot, amount, ctx.producer.nome);
  return (
    <div>
      <h3 className="text-[1.0625rem]">Efeito na tua diversificação</h3>
      <p className="mt-1 text-sm text-muted">
        Montante financiado em lotes ativos depois deste compromisso: <span className="font-mono text-fg tnum">{eur(c.totalAfter)}</span>
      </p>
      <div className="mt-3 flex h-3 gap-0.5" role="img" aria-label={c.byWorld.map((w) => `${getWorld(w.world).commodity}: ${pct(w.amount / c.totalAfter, 0)}`).join(', ')}>
        {c.byWorld.map((w, i) => (
          <span key={w.world} className={cn('h-full', i === 0 && 'rounded-l-xs', i === c.byWorld.length - 1 && 'rounded-r-xs')} style={{ width: `${(w.amount / c.totalAfter) * 100}%`, background: WORLD_FILL[w.world] }} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {c.byWorld.map((w) => (
          <li key={w.world} className="inline-flex items-center gap-2">
            <span aria-hidden className="size-2.5 rounded-[2px]" style={{ background: WORLD_FILL[w.world] }} />
            <span className="text-muted">{getWorld(w.world).commodity}</span>
            <span className="font-mono text-fg tnum">
              {eur(w.amount)} · {pct(w.amount / c.totalAfter, 0)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-muted">
        {ctx.producer.nome}: <span className="font-mono text-fg tnum">{pct(c.producerShare, 0)}</span> · este lote: <span className="font-mono text-fg tnum">{pct(c.lotShare, 0)}</span>
      </p>
      {c.notes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {c.notes.map((n) => (
            <li key={n.text} className={cn('rounded-sm px-3 py-2 text-sm', n.tone === 'warn' ? 'bg-[color-mix(in_oklab,var(--warn)_12%,var(--surface))] text-fg' : 'bg-surface-2 text-fg')}>
              {n.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Terms({ amount }: { amount: number }) {
  const { lot, win } = useJourney();
  const e = lot.economics;
  const d = priceDecimals(lot);
  const today = now().toISOString();
  const rows: { label: string; value: string }[] = [
    { label: 'Montante financiado', value: `${eur(amount)}. Paga a compra ao produtor e os custos do lote até à venda.` },
    { label: 'Liquidação prevista', value: `Até ${fmtDate(win.end)} (mês ${win.months} da janela), quando o lote estiver vendido e os compradores tiverem pago. Pode ser antes.` },
    { label: 'Resultado no cenário base', value: `${pct(e.expectedRange[0], 1, { sign: true })} a ${pct(e.expectedRange[1], 1, { sign: true })} do capital no fim do ciclo, se o lote vender ao preço previsto. Não é garantido e pode haver perda.` },
    { label: 'Extensão condicionada', value: `Uma vez, até ${lot.extension.maxMonths} meses, só se no mês ${win.months} a referência estiver 15 % ou mais abaixo da entrada ou faltar vender mais de 30 % do stock. Aviso com 30 dias.` },
    { label: 'Custos e comissões', value: `Sem comissão de entrada nem de saída. Os custos do lote (${num(e.costsPerUnit, d)} €/${lot.world === 'agua' ? 'L' : 'kg'}) já estão no preço financiado. Da margem bruta, ${pct(e.investorShare, 0)} vai para os co-financiadores, ${pct(1 - e.investorShare - e.reserveShare, 0)} para a operação e ${pct(e.reserveShare, 0)} para a reserva.` },
    { label: 'Saída antes do fim', value: 'Não há mercado secundário no piloto: o capital fica comprometido até à liquidação.' },
    { label: 'Período de reflexão', value: `Podes cancelar sem custos durante 4 dias (até ${fmtDate(reflectionEnd(today))}).` },
    { label: 'Informação', value: 'Relatório de inventário mensal, extrato trimestral e uma única liquidação no fim (capital e resultado).' },
  ];
  return (
    <dl className="divide-y divide-border border-y border-border">
      {rows.map((r) => (
        <div key={r.label} className="grid gap-1 py-2.5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
          <dt className="text-sm font-medium text-fg">{r.label}</dt>
          <dd className="text-sm text-muted">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function CommitForm({ onCommitted }: { onCommitted: (m: CommitMoment) => void }) {
  const { lot, ctx, goTo } = useJourney();
  const game = useGame();
  const data = useData();
  const { isVisitor } = useRole();
  const { toast } = useToast();
  const max = maxCommit(lot);
  const min = Math.min(lot.funding.minTicket, max);
  const step = lot.world === 'agua' ? 250 : 500;
  const [amount, setAmount] = useState(min);
  const [text, setText] = useState(num(min));
  const [ack, setAck] = useState(false);
  const valid = amount >= min && amount <= max && max > 0;
  const shown = Math.max(min, Math.min(max, amount || 0));
  const phys = physicalForAmount(lot, shown);
  const funded = fundedFraction(lot);
  const after = Math.min(1, funded + shown / lot.funding.goal);
  const read = game.riskRead(lot.id).filter((id) => lot.riskFactors.some((r) => r.id === id)).length;
  const total = lot.riskFactors.length;
  const approved = game.onboarding.status === 'aprovado';
  const qualified = approved && (data.investor.classe === 'qualificado' || data.investor.classe === 'profissional');
  const blocked = game.commitBlock === 'bloqueado';

  const checks = [
    {
      id: 'classe',
      label: 'Investidor qualificado',
      done: qualified,
      detail: qualified ? data.investor.nome : blocked ? 'O piloto está fechado a investidores qualificados' : 'Por confirmar no registo',
    },
    {
      id: 'kyc',
      label: 'Verificação KYC/KYB aprovada',
      done: approved,
      detail: approved ? `Aprovada a ${fmtDate(game.onboarding.updatedAt ?? '2025-11-27')}` : game.onboarding.status === 'em-analise' ? 'Em análise pela equipa de compliance' : 'Por fazer',
    },
    { id: 'analise', label: 'Boletim de análises lido', done: game.hasReadAnalysis(lot.id), detail: 'Capítulo 2', go: 'colheita' },
    { id: 'riscos', label: `Fatores de risco lidos (${read}/${total})`, done: read >= total, detail: 'Capítulo 5', go: 'riscos' },
    { id: 'montante', label: `Montante entre ${eur(min)} e ${eur(max)}`, done: valid, detail: valid ? eur(amount) : 'Ajusta o montante' },
  ];
  const firstMissing = checks.find((c) => !c.done);
  const store = valid ? game.checkCommit(lot.id, amount) : undefined;
  const reason = firstMissing
    ? firstMissing.id === 'riscos'
      ? `Faltam ler ${total - read} de ${total} fatores de risco.`
      : firstMissing.id === 'analise'
        ? 'Falta ler o boletim de análises do lote.'
        : firstMissing.id === 'montante'
          ? `O montante tem de estar entre ${eur(min)} e ${eur(max)}.`
          : 'Para comprometer capital é preciso concluir o registo e a verificação.'
    : !ack
      ? 'Falta confirmar a declaração de risco.'
      : store && !store.ok
        ? store.message
        : undefined;
  const ready = !reason;

  const setFromText = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 7);
    setText(raw);
    setAmount(digits ? Number(digits) : 0);
  };

  const confirm = () => {
    const prevFunded = fundedFraction(lot);
    const r = game.commitToLot(lot.id, amount);
    if (!r.ok) {
      toast({ tone: 'warn', title: 'Compromisso não registado', description: r.message });
      return;
    }
    toast({ tone: 'neutral', title: `Compromisso registado · ${lot.id}`, description: `${eur(amount)} · podes cancelar sem custos até ${fmtDate(reflectionEnd(r.position.committedAt))}.` });
    onCommitted({ position: r.position, prevFunded, sealId: r.sealId, firstSeal: r.firstSealForOrigin, fresh: true });
  };

  return (
    <div className="grid min-w-0 gap-x-12 gap-y-10 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-7">
        {/* montante e tradução física */}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:items-end">
          <Field
            label="Montante a comprometer"
            hint={`Entre ${eur(min)} e ${eur(max)}`}
            error={!valid && text.trim() !== '' ? (amount < min ? `O mínimo neste lote é ${eur(min)}.` : `O máximo neste lote é ${eur(max)}.`) : undefined}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                inputMode="numeric"
                autoComplete="off"
                suffix="€"
                value={text}
                onChange={(ev) => setFromText(ev.target.value)}
                onBlur={() => valid && setText(num(amount))}
                className="font-mono text-[1.125rem] tnum"
              />
            )}
          </Field>
          <div className="min-w-0 pb-6">
            <Slider
              aria-label="Montante a comprometer"
              min={min}
              max={max}
              step={step}
              value={shown}
              valueText={eur(shown)}
              onChange={(v) => {
                setAmount(v);
                setText(num(v));
              }}
              disabled={max <= 0}
            />
            <div className="flex justify-between font-mono text-xs text-muted tnum">
              <span>{eur(min)}</span>
              <span>{eur(max)}</span>
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-4 rounded-sm bg-world-soft px-4 py-3" aria-live="polite">
          <LotGauge
            kind={lot.world}
            value={funded}
            highlight={valid ? [funded, after] : undefined}
            size="sm"
            label={`Pré-visualização do lote ${lot.id} com o teu compromisso`}
            valueText={`${pct(funded, 1)} financiado; com o teu compromisso ${pct(after, 1)}`}
            className="shrink-0 lg:hidden"
          />
          <div className="min-w-0">
          <p className="text-[1.0625rem] text-fg">
            Financia{' '}
            <strong className="font-mono font-semibold tnum">
              <CountUp value={phys.units} format={(n) => (lot.world === 'azeite' ? `${num(n)} kg` : lot.world === 'agua' ? `${num(n, 1)} paletes` : `${num(n, 1)} sacas`)} />
            </strong>{' '}
            {lot.world === 'azeite' ? 'de azeite' : lot.world === 'agua' ? 'de água' : 'de café verde'} {phys.secondary}
          </p>
          <p className="mt-0.5 text-sm text-world-ink">
            {lot.world === 'azeite' && `${containersFor(lot, phys.base)} · `}
            {pct(phys.shareOfLot, 1)} do lote · liquidado com o lote inteiro
          </p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-2 text-[1.0625rem]">Condições</h3>
          <Terms amount={shown} />
        </div>

        <div className="mt-8">
          <Diversification amount={shown} />
        </div>

        {/* elegibilidade e confirmação */}
        <div className="mt-8 border-t border-border pt-6">
          <h3 className="text-[1.0625rem]">Antes de confirmar</h3>
          <ul className="mt-3 space-y-1">
            {checks.map((c) => (
              <li key={c.id} className="flex min-h-11 items-center gap-3">
                <CheckMark done={c.done} />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] font-medium text-fg">
                    {c.label}
                    <span className="sr-only">{c.done ? ' · feito' : ' · por fazer'}</span>
                  </p>
                  <p className="text-sm text-muted">{c.detail}</p>
                </div>
                {!c.done && c.go && (
                  <button type="button" onClick={() => goTo(c.go!)} className="inline-flex min-h-11 shrink-0 items-center gap-1 px-1 text-sm font-medium text-accent hover:underline">
                    {c.id === 'riscos' ? 'Ler os fatores' : 'Ler o boletim'}
                    <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
                  </button>
                )}
                {!c.done && c.id === 'kyc' && !blocked && (
                  <TextLink to="/onboarding" className="min-h-11 shrink-0 content-center text-sm">
                    Fazer o registo
                  </TextLink>
                )}
              </li>
            ))}
          </ul>

          {game.canCommit ? (
            <>
              <Checkbox
                className="mt-4"
                checked={ack}
                onChange={(ev) => setAck(ev.target.checked)}
                label={`Li a ficha do lote ${lot.id}, os fatores de risco e a nota de capital em risco. Percebo que posso perder parte ou a totalidade de ${eur(shown)} e que não há mercado secundário.`}
              />
              <HoldToConfirm
                className="mt-4"
                label={`Mantém premido para comprometer ${eur(shown)}`}
                confirmedLabel="Compromisso confirmado"
                confirmText={`Confirmo o compromisso de ${eur(shown)} no lote ${lot.id}.`}
                disabled={!ready}
                disabledReason={reason}
                onConfirm={confirm}
              />
            </>
          ) : blocked ? (
            <div className="mt-4 rounded-sm bg-surface-2 px-4 py-3">
              <p className="font-medium text-fg">O piloto está fechado a investidores qualificados.</p>
              <p className="mt-1 text-sm text-muted">
                É uma restrição da fase 1, não uma avaliação de ti. Podes continuar a explorar os mundos, jogar na Academia e simular campanhas com dinheiro fictício.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ButtonLink to="/academia" variant="secondary">
                  Ir para a Academia
                </ButtonLink>
                <ButtonLink to="/academia/simulador" variant="secondary">
                  Abrir o simulador
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-sm bg-surface-2 px-4 py-3">
              <p className="font-medium text-fg">{isVisitor ? 'Estás a ver como Visitante.' : 'Falta concluir o registo.'}</p>
              <p className="mt-1 text-sm text-muted">Para comprometer capital é preciso registo, verificação KYC/KYB e a confirmação de investidor qualificado. A diligência que fizeres aqui fica guardada.</p>
              <ButtonLink to="/onboarding" variant="primary" className="mt-3">
                Começar o registo
              </ButtonLink>
            </div>
          )}
        </div>
      </div>

      {/* pré-visualização da fatia no depósito */}
      <div className="hidden min-w-0 lg:col-span-5 lg:block">
        <div className="lg:sticky" style={{ top: CHROME_H + 24 }}>
          <div className="flex items-end gap-5 lg:flex-col lg:items-start">
            <LotGauge
              kind={lot.world}
              value={funded}
              highlight={valid ? [funded, after] : undefined}
              size="lg"
              label={`Pré-visualização do lote ${lot.id} com o teu compromisso`}
              valueText={`${pct(funded, 1)} financiado; com o teu compromisso ${pct(after, 1)}`}
              className="w-[132px] shrink-0 sm:w-[180px] lg:w-[240px] [&_svg]:h-auto [&_svg]:w-full"
            />
            <div className="min-w-0">
              <p className="font-display text-[1.1875rem] font-semibold leading-tight text-fg">A tua fatia</p>
              <p className="mt-1 text-sm text-muted">
                Tracejado no {ctx.copy.containerSingular === 'IBC' ? 'depósito' : ctx.copy.containerPlural}: <span className="font-mono text-fg tnum">{pct(phys.shareOfLot, 1)}</span> do lote ({phys.primary})
              </p>
              <p className="text-sm text-muted">
                Financiado hoje <span className="font-mono text-fg tnum">{pct(funded, 1)}</span> · com o teu compromisso <span className="font-mono text-fg tnum">{pct(after, 1)}</span>
              </p>
              <p className="mt-3 text-sm text-muted">
                <span className="font-mono text-fg tnum">{num(lot.funding.coFinancers)}</span> co-financiadores. Todos podem pedir amostra do lote, seja qual for o montante.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChapterCompromisso({ label }: { label: string }) {
  const { lot, positions } = useJourney();
  const [moment, setMoment] = useState<CommitMoment | null>(null);
  const session = positions.filter((p) => p.session);
  const latest = session[session.length - 1];
  const live = moment && positions.some((p) => positionKey(p) === positionKey(moment.position)) ? moment : null;
  const shown: CommitMoment | null = live ?? (latest ? { position: latest, prevFunded: fundedFraction(lot), firstSeal: false, fresh: false } : null);

  return (
    <section id="compromisso" data-chapter={label} aria-labelledby="compromisso-titulo" className="scroll-mt-6 py-14 sm:py-20">
      <Wrap>
        <ChapterHeading
          id="compromisso"
          n={6}
          title="Compromisso"
          lead={
            shown
              ? 'O lacre fecha o ritual. A partir daqui é calma: reflexão, transferência e acompanhamento.'
              : 'Escolhe o montante e vê-o em mercadoria. Lê as condições, confirma a declaração e mantém premido para comprometer.'
          }
        />
        <div className="mt-8">{shown ? <CommitDone moment={shown} onCancelled={() => setMoment(null)} /> : <CommitForm onCommitted={setMoment} />}</div>
      </Wrap>
    </section>
  );
}

