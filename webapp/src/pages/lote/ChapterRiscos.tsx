import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, Gamepad2 } from 'lucide-react';
import { getMarketSeries, ILLUSTRATIVE_LABEL, priceUnit, QUESTS, RESERVE_POOL, RESERVE_RULE } from '../../data';
import type { RiskFactor } from '../../data/types';
import { EASE_OUT } from '../../components/game';
import { Badge, Button, ButtonLink, TextLink } from '../../components/ui';
import { cn } from '../../lib/cn';
import { date as fmtDate, eur, kg, num, pct, tidyText } from '../../lib/format';
import { useGame, useRole } from '../../state';
import { isAgentLot, marginSplit, priceDecimals, simLotFor } from './model';
import { playedLotCard } from '../inicio/missions';
import { ChapterHeading, CheckMark, useChapterNo, useDwell, useJourney, Wrap } from './shared';

/* =====================================================================
   Capítulo 5 · Riscos. Cada fator tem de ser aberto e confirmado ("Li e
   compreendi"); o compromisso só desbloqueia com todos lidos. Ao lado: a
   cobertura deste lote (o que cobre e o que não cobre) e a reserva de
   primeira perda.
   ===================================================================== */

const SEVERITY: Record<RiskFactor['severity'], { label: string; tone: 'warn' | 'neutral' }> = {
  alta: { label: 'Severidade alta', tone: 'warn' },
  media: { label: 'Severidade média', tone: 'neutral' },
  baixa: { label: 'Severidade baixa', tone: 'neutral' },
};

function RiskItem({ r, idx, open, read, onToggle, onRead, btnRef }: { r: RiskFactor; idx: number; open: boolean; read: boolean; onToggle: () => void; onRead: () => void; btnRef: (el: HTMLButtonElement | null) => void }) {
  const reduce = useReducedMotion();
  const sev = SEVERITY[r.severity];
  const pid = `risco-${r.id}`;
  return (
    <li className="border-b border-border">
      <h3 className="text-base">
        <button
          ref={btnRef}
          type="button"
          aria-expanded={open}
          aria-controls={`${pid}-painel`}
          id={`${pid}-botao`}
          onClick={onToggle}
          className="flex min-h-14 w-full items-center gap-3 py-3 text-left font-sans font-semibold text-fg transition-colors duration-150 hover:text-world-ink"
        >
          <CheckMark done={read} size={22} />
          <span className="min-w-0 flex-1">
            <span className="mr-2 text-sm font-medium text-muted tnum">{idx + 1}.</span>
            {r.title}
            <span className="sr-only">{read ? ' · lido' : ' · por ler'}</span>
          </span>
          <span className="hidden shrink-0 sm:inline-flex">
            <Badge tone={sev.tone}>{sev.label}</Badge>
          </span>
          <ChevronDown aria-hidden className={cn('size-5 shrink-0 text-muted transition-transform duration-200', open && 'rotate-180')} strokeWidth={1.75} />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${pid}-painel`}
            role="region"
            aria-labelledby={`${pid}-botao`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="pb-4 pl-[34px]"
          >
            <p className="max-w-[62ch] text-fg">{r.body}</p>
            <p className="max-w-[62ch] mt-2 text-sm text-muted">
              <span className="font-semibold text-fg">Como é mitigado: </span>
              {r.mitigation}
            </p>
            <p className="mt-1 text-sm text-muted sm:hidden">{sev.label}.</p>
            <div className="mt-3">
              {read ? (
                <p className="text-sm font-medium text-ok-ink">Lido e compreendido.</p>
              ) : (
                <Button variant="primary" size="sm" onClick={onRead}>
                  Li e compreendi
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function Hedge() {
  const { lot } = useJourney();
  const game = useGame();
  const ref = useRef<HTMLDivElement>(null);
  const h = lot.hedge;
  const unit = priceUnit(lot);
  const fwdPrice = h.note.match(/a (\d+,\d+)\s€\/kg/)?.[1];
  const series = getMarketSeries(lot.world).monthly.map((p) => p.value);
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const swing = (hi - lo) / ((hi + lo) / 2) / 2;
  const fired = useRef(false);
  const canQuest = lot.world === 'azeite';
  const done = useCallback(() => {
    if (!canQuest || fired.current || game.isQuestDone('q-cobertura')) return;
    fired.current = true;
    game.completeQuest('q-cobertura');
  }, [canQuest, game]);
  useDwell(ref, canQuest, done, 1800);

  const covered: string[] = [];
  const notCovered: string[] = [];
  if (h.instrument === 'forward' || h.instrument === 'indexacao') {
    covered.push(`Preço de ${pct(h.coverage, 0)} do volume (${kg(lot.quantity * h.coverage)})${fwdPrice ? `, vendido a prazo a ${fwdPrice} €/kg` : ', com preço fixado na venda a prazo'}.`);
    if (h.trigger) covered.push(h.trigger);
    notCovered.push('O preço da parte indexada: se o índice de origem cair, a referência do canal e o preço de venda acompanham.');
    notCovered.push('Desclassificação do azeite: tratada pelo playbook de qualidade e pela cláusula de ajuste com o produtor.');
    notCovered.push('Atraso nas vendas e o custo de armazenagem de uma extensão.');
    notCovered.push('Incumprimento do comprador acima do limite do seguro de crédito.');
  } else if (h.instrument === 'ice-kc') {
    covered.push(`${pct(h.coverage, 0)} do volume com venda de futuros KC e cobertura cambial EUR/USD.`);
    notCovered.push('O diferencial físico sobre o KC e a qualidade na chegada.');
    notCovered.push('Atrasos de embarque.');
  } else if (isAgentLot(lot)) {
    notCovered.push('Neste cesto a Sprout é agente: o engarrafador vende e fatura, e o preço, o stock e o crédito ao comprador ficam do lado dele. Não há capital de cofinanciadores a cobrir.');
    notCovered.push(`No índice ilustrativo, a referência da água variou ±${pct(swing, 1)} em 24 meses: muda a comissão da Sprout, não um capital investido.`);
  } else {
    notCovered.push(`Preço: não há cobertura. No índice ilustrativo, a referência da água variou ±${pct(swing, 1)} em 24 meses.`);
    notCovered.push('Atraso nas vendas num verão fraco: gerido com contratos anuais de fornecimento.');
    notCovered.push('Custos de transporte acima do previsto, se não estiverem fixados no contrato do comprador.');
  }

  return (
    <div ref={ref} id="cobertura" className="scroll-mt-32">
      <h3 className="text-[1.1875rem]">Cobertura de preço deste lote</h3>
      <p className="mt-1 text-[0.9375rem] font-medium text-fg">{h.label}</p>
      {h.coverage > 0 && (
        <div className="mt-3">
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-xs" role="img" aria-label={`${pct(h.coverage, 0)} do volume coberto, ${pct(1 - h.coverage, 0)} sem preço fixado`}>
            <span className="h-full rounded-l-xs bg-world" style={{ width: `${h.coverage * 100}%` }} />
            <span className="h-full flex-1 rounded-r-xs bg-[color-mix(in_oklab,var(--world)_18%,var(--surface-2))]" />
          </div>
          <div className="mt-1.5 flex justify-between gap-3 text-sm text-muted">
            <span>
              <span className="font-mono text-fg tnum">{pct(h.coverage, 0)}</span> coberto
            </span>
            <span>
              <span className="font-mono text-fg tnum">{pct(1 - h.coverage, 0)}</span> {h.instrument === 'ice-kc' ? 'descoberto' : 'indexado ao índice de origem'}
            </span>
          </div>
        </div>
      )}
      <dl className="mt-3 grid gap-2 text-sm">
        {h.counterparty && (
          <div>
            <dt className="inline text-muted">Contraparte: </dt>
            <dd className="inline text-fg">{h.counterparty}</dd>
          </div>
        )}
        <div>
          <dt className="inline text-muted">Custo: </dt>
          <dd className="inline text-fg">{h.costPct > 0 ? `${pct(h.costPct, 1)} do montante financiado, já incluído no custo do lote (${unit === 'kg' ? '€/kg' : '€/L'})` : 'sem custo de cobertura'}</dd>
        </div>
      </dl>
      {covered.length > 0 && (
        <>
          <p className="mt-3 text-sm font-semibold text-fg">O que está coberto</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted marker:text-world-ink">
            {covered.map((c) => (
              <li key={c}>{tidyText(c)}</li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-3 text-sm font-semibold text-fg">O que não está coberto</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted marker:text-muted">
        {notCovered.map((c) => (
          <li key={c}>{tidyText(c)}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A reserva comum de primeira perda: uma só regra (RESERVE_RULE) e o saldo de
 * hoje (RESERVE_POOL, histórico ilustrativo). Absorve perdas antes dos
 * cofinanciadores enquanto tiver saldo; pode esgotar-se.
 */
function Reserve() {
  const { lot } = useJourney();
  const split = marginSplit(lot);
  const d = priceDecimals(lot);
  const unit = priceUnit(lot);
  const e = lot.economics;
  const parts = [
    { label: 'Cofinanciadores', v: split.investors, share: e.investorShare, cls: 'bg-world' },
    { label: 'Operação Sprout', v: split.operation, share: 1 - e.investorShare - e.reserveShare, cls: 'bg-[color-mix(in_oklab,var(--world)_42%,var(--surface))]' },
    { label: 'Reserva comum de primeira perda', v: split.reserve, share: e.reserveShare, cls: 'bg-[color-mix(in_oklab,var(--fg)_55%,var(--surface))]' },
  ];
  const used = RESERVE_POOL.entries.find((x) => x.amount < 0);
  return (
    <div>
      <h3 className="text-[1.1875rem]">Reserva de primeira perda</h3>
      <p className="mt-1 text-sm text-muted">
        Da margem bruta deste lote (<span className="font-mono text-fg tnum">{num(split.perUnit, d)} €/{unit}</span>), {pct(e.reserveShare, 0)} vai para a reserva. {RESERVE_RULE.text} Não é uma garantia.
      </p>
      <div className="mt-3 flex h-3 gap-0.5" role="img" aria-label={parts.map((p) => `${p.label} ${pct(p.share, 0)}`).join(', ')}>
        {parts.map((p, i) => (
          <span key={p.label} className={cn('h-full', p.cls, i === 0 && 'rounded-l-xs', i === parts.length - 1 && 'rounded-r-xs')} style={{ width: `${p.share * 100}%` }} />
        ))}
      </div>
      <ul className="mt-2 grid gap-1 text-sm">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <span aria-hidden className={cn('size-2.5 shrink-0 rounded-[2px]', p.cls)} />
            <span className="text-muted">{p.label}</span>
            <span className="ml-auto whitespace-nowrap font-mono text-fg tnum">
              {num(p.v, d)} €/{unit} · {pct(p.share, 0)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted">
        Saldo da reserva hoje: <span className="font-mono text-fg tnum">{eur(RESERVE_POOL.balance)}</span>
        {used && (
          <>
            {' '}
            (o {used.lotId} usou <span className="font-mono tnum">{eur(-used.amount)}</span> a {fmtDate(used.date)} e esgotou-a)
          </>
        )}
        . {RESERVE_POOL.next.note} A reserva reduz a perda; não a impede. <span className="whitespace-nowrap">{ILLUSTRATIVE_LABEL}.</span>
      </p>
    </div>
  );
}

export function ChapterRiscos({ label }: { label: string }) {
  const { lot, goTo } = useJourney();
  const no = useChapterNo('riscos');
  const game = useGame();
  const { isTeam, isVisitor } = useRole();
  const read = game.riskRead(lot.id);
  const factors = lot.riskFactors;
  const isRead = (id: string) => read.includes(id);
  const count = factors.filter((r) => isRead(r.id)).length;
  const [openId, setOpenId] = useState<string | null>(() => factors.find((r) => !read.includes(r.id))?.id ?? null);
  const btns = useRef<Record<string, HTMLButtonElement | null>>({});
  // depois do último fator lido, o foco passa para a ação seguinte (não cai para o corpo da página)
  const doneRef = useRef<HTMLDivElement>(null);
  const simId = simLotFor(lot);
  // a mesma regra do Início e da Origem: conta uma campanha jogada com a carta deste lote
  const simDone = playedLotCard(game, lot);
  const simQuest = QUESTS.find((q) => q.criteria.type === 'sim-complete');
  const simPoints = simQuest && !game.isQuestDone(simQuest.id) ? simQuest.points : 0;
  const agent = isAgentLot(lot);
  const all = count === factors.length;

  const markRead = (r: RiskFactor) => {
    game.markRiskRead(lot.id, r.id);
    const after = [...read, r.id];
    const next = factors.find((f) => !after.includes(f.id));
    setOpenId(next?.id ?? null);
    if (next) window.setTimeout(() => btns.current[next.id]?.focus(), 30);
    else
      window.setTimeout(() => {
        const target = doneRef.current?.querySelector<HTMLElement>('button, a') ?? doneRef.current;
        target?.focus();
      }, 30);
  };

  return (
    <section id="riscos" data-chapter={label} aria-labelledby="riscos-titulo" className="scroll-mt-6 border-b border-border bg-surface py-14 sm:py-20">
      <Wrap>
        <ChapterHeading
          id="riscos"
          n={no}
          title="Riscos"
          lead={`Abre cada fator e confirma que o leste. ${lot.status === 'aberto' ? 'O compromisso só desbloqueia com todos lidos.' : 'Ler os fatores conta para a tua diligência, mesmo sem compromisso.'}`}
        />
        <div className="mt-8 grid min-w-0 gap-x-12 gap-y-10 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <p className="text-[1.0625rem] text-fg" aria-live="polite">
                <span className="font-display text-[1.75rem] font-semibold leading-none tnum">
                  {count}/{factors.length}
                </span>{' '}
                fatores de risco lidos
              </p>
              <div className="flex gap-1" aria-hidden>
                {factors.map((r) => (
                  <span key={r.id} className={cn('h-2 w-7 rounded-xs transition-colors duration-300', isRead(r.id) ? 'bg-accent' : 'bg-[color-mix(in_oklab,var(--accent)_14%,var(--surface-2))]')} />
                ))}
              </div>
            </div>
            <ul className="mt-4 border-t border-border">
              {factors.map((r, i) => (
                <RiskItem
                  key={r.id}
                  r={r}
                  idx={i}
                  open={openId === r.id}
                  read={isRead(r.id)}
                  onToggle={() => setOpenId((o) => (o === r.id ? null : r.id))}
                  onRead={() => markRead(r)}
                  btnRef={(el) => {
                    btns.current[r.id] = el;
                  }}
                />
              ))}
            </ul>
            {all && (
              <div ref={doneRef} tabIndex={-1} className="mt-5 flex flex-wrap items-center gap-3 outline-none">
                <p className="text-[0.9375rem] text-fg">
                  {lot.status !== 'aberto'
                    ? 'Leste todos os fatores de risco deste lote.'
                    : isVisitor
                      ? 'Leste todos os fatores. Para comprometer capital falta o registo e a verificação.'
                      : 'Leste todos os fatores. O compromisso está desbloqueado.'}
                </p>
                {lot.status === 'aberto' && (
                  <Button variant="secondary" size="sm" onClick={() => goTo('compromisso')}>
                    Ir para o compromisso
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-10 lg:col-span-5">
            <Hedge />
            {!agent && <Reserve />}
            <div>
              <h3 className="text-[1.1875rem]">{lot.status === 'aberto' ? 'Joga esta campanha antes de decidir' : 'Joga esta campanha no simulador'}</h3>
              <p className="mt-1 text-sm text-muted">
                O simulador usa os parâmetros deste lote com dinheiro fictício: choques de preço, colheita fraca, vendas atrasadas, extensão e refunding. Há campanhas que acabam em perda.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <ButtonLink to={`/academia/simulador${simId ? `?lote=${simId}` : ''}`} variant="secondary" iconLeft={<Gamepad2 aria-hidden className="size-4" strokeWidth={1.75} />}>
                  Joga esta campanha no simulador
                </ButtonLink>
                <span className="inline-flex items-center gap-2 text-sm text-muted">
                  <CheckMark done={simDone} size={18} />
                  {simDone ? 'Campanha jogada com este lote' : simPoints > 0 ? `+${simPoints} pts de conhecimento` : 'Os pontos do simulador já estão contados'}
                </span>
              </div>
            </div>
            {isTeam && (
              <p className="text-sm text-muted">
                Equipa: os gatilhos de cobertura e o playbook deste lote estão em <TextLink to="/bastidores">Bastidores</TextLink>.
              </p>
            )}
          </div>
        </div>
      </Wrap>
    </section>
  );
}
