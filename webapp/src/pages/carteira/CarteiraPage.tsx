import { useState } from 'react';
import { ArrowRight, Download } from 'lucide-react';
import { getProducer } from '../../data';
import { LotGauge } from '../../components/game';
import { Badge, Button, ButtonLink, Card, DataTable, KeyValue, Page, PageHeader, RiskNote, Section, StatusPill } from '../../components/ui';
import type { Column } from '../../components/ui';
import { useData, useGame, useRole, useToast, type PositionView } from '../../state';
import { TODAY_DATE } from '../../lib/clock';
import { date as fmtDate, eur, num, pct } from '../../lib/format';
import { Diversification } from './Diversification';
import { Documents } from './Documents';
import { downloadText, monthLabel, monthlyStatement, statementIssueDate, statementMonths } from './docs';
import { ExitTerms } from './ExitTerms';
import { Footprint } from './Footprint';
import { PositionCard } from './PositionCard';
import { PositionDrawer } from './PositionDrawer';
import { byNextDate, plannedSettlement, positionState, windowOf } from './positions';
import { SettlementCalendar } from './SettlementCalendar';

/* =====================================================================
   Carteira: os lotes do investidor como missões físicas, o calendário de
   liquidação, a diversificação e os documentos. Factos sóbrios, nota de
   capital em risco, nenhum placar.
   ===================================================================== */

function nextStatementLabel() {
  const [y, m] = TODAY_DATE.split('-').map(Number);
  const ym = `${y}-${String(m).padStart(2, '0')}`;
  return { date: statementIssueDate(ym), month: monthLabel(ym) };
}

export default function CarteiraPage() {
  const { isVisitor, isTeam } = useRole();
  const game = useGame();
  const data = useData();
  const { toast } = useToast();
  const [openId, setOpenId] = useState<string | null>(null);

  const approved = game.onboarding.status === 'aprovado';
  if (!approved) return <CarteiraLocked status={game.onboarding.status} visitor={isVisitor} />;

  const positions = data.positions;
  const active = positions.filter((p) => p.status !== 'liquidado').sort(byNextDate);
  if (!active.length) return <CarteiraEmpty />;

  const financed = active.filter((p) => p.status === 'ativo').reduce((s, p) => s + p.amount, 0);
  const pending = active.filter((p) => p.status === 'aguarda-transferencia').reduce((s, p) => s + p.amount, 0);
  const producers = new Set(active.map((p) => p.producer.id)).size;
  const bySettle = active
    .map((p) => ({ p, at: plannedSettlement(p.lot) }))
    .filter((x): x is { p: PositionView; at: string } => Boolean(x.at))
    .sort((a, b) => a.at.localeCompare(b.at));
  const nextSettle = bySettle[0];
  const months = statementMonths(positions);
  const lastMonth = months[0];
  const nextStmt = nextStatementLabel();
  const openPos = positions.find((p) => p.id === openId) ?? null;

  const downloadLast = () => {
    if (!lastMonth) return;
    const ok = downloadText(`Sprout_extrato_${lastMonth}.txt`, monthlyStatement(data.investor, positions, lastMonth));
    toast(ok ? { tone: 'neutral', title: 'Extrato descarregado', description: `Extrato de ${monthLabel(lastMonth)}` } : { tone: 'crit', title: 'Não foi possível descarregar', description: 'O browser bloqueou a transferência. Tenta noutra janela.' });
  };

  const settleColumns: Column<{ p: PositionView; at: string }>[] = [
    { key: 'lote', header: 'Lote', render: (r) => r.p.lot.id, mono: true, sortValue: (r) => r.p.lot.id },
    { key: 'prod', header: 'Produtor', render: (r) => r.p.producer.nome, sortValue: (r) => r.p.producer.nome, minWidth: 170 },
    { key: 'estado', header: 'Estado', render: (r) => <StatusPill label={positionState(r.p).label} tone={positionState(r.p).tone} />, minWidth: 200 },
    { key: 'liq', header: 'Liquidação prevista', render: (r) => fmtDate(r.at), mono: true, sortValue: (r) => r.at, align: 'right' },
    { key: 'fim', header: 'Fim da janela', render: (r) => fmtDate(windowOf(r.p.lot).extEnd ?? windowOf(r.p.lot).end), mono: true, sortValue: (r) => windowOf(r.p.lot).end, align: 'right' },
    { key: 'mont', header: 'Montante financiado', render: (r) => eur(r.p.amount), mono: true, sortValue: (r) => r.p.amount, align: 'right' },
  ];

  const pilotHistory = data.lots.filter((l) => l.status === 'liquidado' || l.status === 'em-extensao').sort((a, b) => (a.settlement.settledAt ?? '9').localeCompare(b.settlement.settledAt ?? '9'));

  return (
    <Page>
      <PageHeader
        title="Carteira"
        description="Os lotes que financias, onde está a mercadoria, quando se prevê liquidar e os documentos de cada um."
        meta={
          <>
            <StatusPill label={data.investor.classe === 'profissional' ? 'Investidor profissional' : 'Investidor qualificado'} tone="accent" />
            {data.investor.since && (
              <span className="text-sm text-muted">
                KYB aprovado a <span className="font-mono tnum">{fmtDate(data.investor.since)}</span>
              </span>
            )}
            {isTeam && <Badge tone="info">Vista da equipa sobre a carteira de demonstração</Badge>}
          </>
        }
        actions={
          lastMonth && (
            <Button variant="secondary" onClick={downloadLast} iconLeft={<Download aria-hidden className="size-4" strokeWidth={1.75} />}>
              Extrato de {monthLabel(lastMonth).replace(/ de \d{4}$/, '')}
            </Button>
          )
        }
      />

      <Footprint
        positions={active}
        aside={
          <div className="min-w-0">
            <h2 className="sr-only">Resumo</h2>
            <KeyValue
              columns={1}
              items={[
                {
                  label: 'Montante financiado',
                  value: <span className="font-mono tnum">{eur(financed)}</span>,
                  hint: pending ? `+ ${eur(pending)} a aguardar transferência` : `${num(active.length)} lotes · ${num(producers)} produtores`,
                },
                ...(pending ? [{ label: 'Lotes', value: `${num(active.length)} lotes · ${num(producers)} produtores` }] : []),
                ...(nextSettle
                  ? [
                      {
                        label: 'Próxima liquidação prevista',
                        value: <span className="font-mono tnum">{fmtDate(nextSettle.at)}</span>,
                        hint: `${nextSettle.p.lot.id} · ${positionState(nextSettle.p).label.toLowerCase()}`,
                      },
                    ]
                  : []),
                { label: 'Próximo extrato', value: <span className="font-mono tnum">{fmtDate(nextStmt.date)}</span>, hint: `extrato de ${nextStmt.month}; inventário físico de cada lote todos os meses` },
              ]}
            />
            <RiskNote compact className="mt-5" />
          </div>
        }
      />

      <Section id="lotes" title="Os teus lotes" description="Cada lote é uma missão física, com datas. Os números são factos do lote, não um placar.">
        <div className="space-y-4">
          {active.map((p) => (
            <PositionCard key={p.id} p={p} onOpen={(x) => setOpenId(x.id)} />
          ))}
        </div>
      </Section>

      <Section id="calendario" title="Calendário de liquidação" description="As janelas de 18 meses sobre o ano agrícola de cada mundo. Toca numa linha para abrir o lote.">
        <Card padding="md" className="min-w-0">
          <SettlementCalendar positions={active} onOpen={(p) => setOpenId(p.id)} />
          <div className="mt-8">
            <h3 className="mb-2 text-[1.0625rem]">Próximas liquidações</h3>
            <DataTable columns={settleColumns} rows={bySettle} getRowId={(r) => r.p.id} caption="Próximas liquidações previstas" initialSort={{ key: 'liq', dir: 'asc' }} framed={false} onRowClick={(r) => setOpenId(r.p.id)} />
          </div>
          <div className="mt-8 border-t border-border pt-5">
            <h3 className="text-[1.0625rem]">Como terminaram os lotes do piloto</h3>
            <p className="mt-0.5 text-sm text-muted">Resultado efetivo de cada lote liquidado, em fração do capital. Resultados passados não garantem resultados futuros.</p>
            <ul className="mt-3 divide-y divide-border">
              {pilotHistory.map((l) => {
                const prod = getProducer(l.producerId);
                return (
                  <li key={l.id} className="grid gap-x-4 gap-y-0.5 py-2.5 text-sm sm:grid-cols-[7.5rem_minmax(0,1fr)_auto]">
                    <span className="font-mono text-fg tnum">{l.id}</span>
                    <span className="min-w-0 text-muted">
                      {prod?.nome} · campanha {l.campanha}
                      {l.status === 'em-extensao' && l.settlement.extendedTo ? ` · em extensão até ${fmtDate(l.settlement.extendedTo)}` : ''}
                      {l.settlement.settledResult !== undefined && l.settlement.settledResult < 0 && (
                        <span className="block text-fg">{l.milestones.find((m) => m.stage === 'liquidado')?.note}</span>
                      )}
                    </span>
                    <span className="font-mono text-fg tnum sm:text-right">
                      {l.settlement.settledResult !== undefined ? `${pct(l.settlement.settledResult, 1, { sign: true })} · ${fmtDate(l.settlement.settledAt!)}` : 'por liquidar'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      </Section>

      <div className="mt-10 grid min-w-0 gap-x-6 gap-y-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Section id="diversificacao" title="Diversificação" description="Quanto do montante financiado depende de cada produtor, lote ou mercadoria." className="!mt-0 min-w-0">
          <Card padding="md">
            <Diversification positions={active} />
          </Card>
        </Section>
        <Section id="saida" title="Regras de saída" description="O que acontece ao teu capital, em linguagem simples." className="!mt-0 min-w-0">
          <Card padding="md">
            <ExitTerms />
          </Card>
        </Section>
      </div>

      <div className="mt-10 grid min-w-0 gap-x-6 gap-y-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Section id="documentos" title="Extratos e documentos" description={`Extrato mensal no dia 5; resumo das condições de cada lote. Gerados a partir dos dados de demonstração.`} className="!mt-0 min-w-0">
          <Card padding="md">
            <Documents investor={data.investor} positions={positions} />
          </Card>
        </Section>
        <Section id="elegibilidade" title="Elegibilidade" className="!mt-0 min-w-0">
          <Card padding="md">
            <KeyValue
              columns={1}
              dense
              items={[
                { label: 'Titular', value: data.investor.nome, hint: data.investor.tipo === 'pessoa-coletiva' ? 'Pessoa coletiva' : 'Pessoa singular' },
                { label: 'Classificação', value: data.investor.classe === 'profissional' ? 'Investidor profissional' : 'Investidor qualificado', hint: 'O piloto está fechado a investidores qualificados.' },
                { label: 'Verificação', value: data.investor.kyc === 'aprovado' ? `KYB aprovado${data.investor.since ? ` a ${fmtDate(data.investor.since)}` : ''}` : 'Em curso' },
                { label: 'Documentos na ficha', value: game.onboarding.documentos.length ? game.onboarding.documentos.join(', ') : '—' },
                { label: 'Pagamentos', value: 'Só transferências SEPA identificadas, de e para a conta segregada num PSP licenciado na UE. Sem numerário.' },
              ]}
            />
          </Card>
        </Section>
      </div>

      <RiskNote className="mt-10 max-w-[80ch]" />

      <PositionDrawer p={openPos} onClose={() => setOpenId(null)} />
    </Page>
  );
}

/* ------------------------------------------------------------ sem acesso / vazia */

function CarteiraLocked({ status, visitor }: { status: string; visitor: boolean }) {
  const blocked = status === 'bloqueado';
  const statusText: Record<string, string> = {
    'nao-iniciado': 'Registo por iniciar',
    'em-curso': 'Registo a meio',
    'em-analise': 'Documentação em análise',
    bloqueado: 'Fora do piloto: investidor não qualificado',
  };
  return (
    <Page>
      <PageHeader title="Carteira" description="Aqui vais ver os lotes que financiares: a mercadoria, a jornada, as datas de liquidação e os documentos." />
      <Card padding="lg" className="grid min-w-0 items-center gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex items-end justify-center gap-6" aria-hidden>
          <LotGauge kind="ibc" size="md" value={0} label="IBC vazio" className="w-[120px]" />
          <LotGauge kind="pallet" size="md" value={0} label="Palete vazia" className="w-[104px]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted">
            {visitor ? 'Estás a ver como Visitante' : 'Estado'} · <span className="font-medium text-fg">{statusText[status] ?? 'Registo por concluir'}</span>
          </p>
          <h2 className="mt-2 text-[1.5rem] leading-tight">{blocked ? 'O piloto está fechado a investidores qualificados' : 'A tua carteira começa depois da verificação'}</h2>
          <p className="measure mt-2 text-muted">
            {blocked
              ? 'A tua classificação não permite comprometer capital nesta fase. Podes continuar a explorar os mundos, as jornadas dos lotes e jogar campanhas no simulador com dinheiro fictício.'
              : 'Antes de qualquer compromisso: registo, KYC/KYB e avaliação de adequação. Enquanto isso podes explorar todos os lotes e jogar campanhas com dinheiro fictício, incluindo as que acabam em perda.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {!blocked && (
              <ButtonLink to="/onboarding" variant="primary" iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
                {status === 'nao-iniciado' ? 'Pedir acesso ao piloto' : 'Continuar o registo'}
              </ButtonLink>
            )}
            <ButtonLink to="/academia/simulador" variant="secondary">
              Jogar uma campanha
            </ButtonLink>
            <ButtonLink to="/mercados" variant="ghost">
              Explorar os lotes
            </ButtonLink>
          </div>
        </div>
      </Card>
      <Section id="saida" title="Regras de saída, antes de tudo" description="O que acontece ao capital num lote do piloto, em linguagem simples.">
        <Card padding="md" className="max-w-[860px]">
          <ExitTerms />
        </Card>
      </Section>
      <RiskNote className="mt-8 max-w-[80ch]" />
    </Page>
  );
}

function CarteiraEmpty() {
  return (
    <Page>
      <PageHeader title="Carteira" description="Os lotes que financias, onde está a mercadoria, quando se prevê liquidar e os documentos de cada um." />
      <Card padding="lg" className="flex flex-wrap items-center gap-8">
        <LotGauge kind="ibc" size="md" value={0} label="IBC vazio" className="w-[120px]" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.5rem] leading-tight">Ainda não financias nenhum lote</h2>
          <p className="measure mt-2 text-muted">Quando fizeres um compromisso, o lote aparece aqui com a sua mercadoria, a jornada e o período de reflexão de 4 dias. Antes disso, lê os fatores de risco do lote e joga uma campanha no simulador.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink to="/mercados" variant="secondary">
              Ver os lotes abertos
            </ButtonLink>
            <ButtonLink to="/academia/simulador" variant="ghost">
              Jogar uma campanha
            </ButtonLink>
          </div>
        </div>
      </Card>
      <Section id="saida" title="Regras de saída" description="O que acontece ao capital num lote do piloto, em linguagem simples.">
        <Card padding="md" className="max-w-[860px]">
          <ExitTerms />
        </Card>
      </Section>
      <RiskNote className="mt-8 max-w-[80ch]" />
    </Page>
  );
}
