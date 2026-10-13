import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ChartFrame,
  ChartTooltipContent,
  Checkbox,
  CommodityChip,
  DataTable,
  Dialog,
  Disclaimer,
  Drawer,
  Field,
  Input,
  KeyValue,
  Meter,
  Page,
  PageHeader,
  RadioGroup,
  RiskNote,
  Section,
  Select,
  SimulationLabel,
  Slider,
  StatTile,
  StatusPill,
  Tabs,
} from '../../components/ui';
import {
  CampaignFeed,
  CountUp,
  DrawPath,
  HarvestBand,
  HoldToConfirm,
  JourneyTrack,
  KnowledgeLevelBadge,
  LevelProgress,
  LotGauge,
  OriginSeal,
  QuestList,
  SeasonTrack,
  TileMap,
  TileMapLegend,
  WaxSealStamp,
} from '../../components/game';
import { fundedFraction, getMarketSeries, QUESTS } from '../../data';
import { eur, kg, MONTHS_SHORT, price } from '../../lib/format';
import { physicalForAmount } from '../../lib/physical';
import { useTokens } from '../../lib/useTokens';
import { useData, useFeed, useGame, useToast } from '../../state';

/* Montra temporária do kit (verificação da fundação). */
export default function AcademiaPage() {
  const data = useData();
  const game = useGame();
  const feed = useFeed();
  const tokens = useTokens();
  const { toast } = useToast();
  const [stamped, setStamped] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [amount, setAmount] = useState(5000);
  const [region, setRegion] = useState<string | undefined>('tras-os-montes');
  const [radio, setRadio] = useState<'a' | 'b'>('a');
  const az21 = data.getLot('AZ-2026-021')!;
  const az14 = data.getLot('AZ-2026-014')!;
  const az17 = data.getLot('AZ-2025-017')!;
  const ag7 = data.getLot('AG-2026-007')!;
  const cf1 = data.getLot('CF-2027-001')!;
  const f = fundedFraction(az21);
  const add = amount / az21.funding.goal;
  const phys = physicalForAmount(az21, amount);
  const series = getMarketSeries('azeite').monthly.map((p) => ({ t: p.t, value: p.value }));
  const seal = data.seals.find((s) => s.def.id === 'seal-ribeira-2627')!;
  const earned = data.earnedSeals;

  return (
    <Page>
      <PageHeader
        title="Academia"
        description="Montra temporária do kit de jogo para verificar a fundação."
        meta={
          <>
            <KnowledgeLevelBadge level={game.level} size="sm" />
            <CommodityChip world="azeite" />
            <CommodityChip world="agua" label="world" />
            <CommodityChip world="cafe" />
            <StatusPill status={az21.status} />
            <StatusPill status={az17.status} />
            <StatusPill status={cf1.status} />
          </>
        }
      />

      <Section title="Medidores físicos" id="gauges">
        <Card>
          <div className="flex flex-wrap items-end gap-8">
            <LotGauge kind="ibc" value={f} highlight={[f, f + add]} size="lg" label={`Financiamento do ${az21.id}`} caption={`${az21.id} · ${Math.round(f * 100)} %`} />
            <LotGauge kind="pallet" value={fundedFraction(ag7)} size="md" label={`Financiamento do ${ag7.id}`} caption={ag7.id} />
            <LotGauge kind="sacks" value={0.45} size="md" label="Sacas" caption="CF-2027-001 (pré-visualização)" />
            <LotGauge kind="ibc" value={1} size="sm" label="Stock" caption="sm" />
            <LotGauge kind="pallet" value={0.3} size="sm" label="Stock" caption="sm" />
            <LotGauge kind="sacks" value={0.7} size="xs" label="Stock" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <Field label="Montante a financiar" hint={`${phys.primary} · ${phys.secondary}`}>
                {({ id, describedBy }) => <Slider id={id} aria-describedby={describedBy} min={5000} max={25000} step={500} value={amount} onChange={setAmount} valueText={eur(amount)} />}
              </Field>
              <p className="mt-2 font-mono text-sm tnum">{eur(amount)} → <CountUp value={phys.base} format={(n) => kg(n)} /></p>
            </div>
            <KeyValue
              items={[
                { label: 'Preço de entrada (tudo incluído)', value: price(az21.economics.fundingPrice, 'kg'), mono: true },
                { label: 'Referência de mercado', value: price(az21.economics.refPrice, 'kg'), mono: true },
                { label: 'Montante financiado', value: `${eur(az21.funding.raised)} de ${eur(az21.funding.goal)}`, mono: true },
                { label: 'Co-financiadores', value: az21.funding.coFinancers, mono: true },
              ]}
            />
          </div>
          <RiskNote className="mt-4" />
        </Card>
      </Section>

      <Section title="Calendário agrícola" id="calendario">
        <Card className="flex flex-col gap-8">
          <SeasonTrack world="azeite" />
          <SeasonTrack world="agua" />
          <HarvestBand world="azeite" start={az14.settlement.start!} markers={[{ date: '2026-11-02', label: 'Início das vendas' }]} />
          <HarvestBand world="azeite" start={az17.settlement.start!} extensionMonths={6} today="2026-10-13" />
        </Card>
      </Section>

      <Section title="Mapas" id="mapas">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Portugal · azeite" description={region ? `Selecionado: ${region}` : 'Nenhuma região'} />
            <TileMap map="pt" world="azeite" states={data.regionStates} selectedId={region} onSelect={setRegion} />
            <TileMapLegend world="azeite" className="mt-3" />
          </Card>
          <Card>
            <CardHeader title="Origens de café" />
            <TileMap map="cafe" world="cafe" states={data.regionStates} onSelect={(r) => toast({ title: `Região ${r}` })} />
            <TileMap map="pt" world="agua" states={data.regionStates} className="mt-4" />
          </Card>
        </div>
      </Section>

      <Section title="Jornada" id="jornada">
        <Card className="flex flex-col gap-8">
          <JourneyTrack lot={az21} />
          <JourneyTrack lot={az14} compact />
        </Card>
      </Section>

      <Section title="Selos e ritual" id="selos">
        <Card>
          <div className="flex flex-wrap items-start gap-6">
            {earned.map((s) => (
              <OriginSeal key={s.def.id} seal={s.def} producer={s.producer} region={s.region} state="earned" earnedBy={s.earned?.by} earnedAt={s.earned?.at} showCaption />
            ))}
            <OriginSeal seal={seal.def} producer={seal.producer} region={seal.region} state="locked" showCaption />
            <WaxSealStamp seal={seal.def} producer={seal.producer} region={seal.region} stamped={stamped} showCaption />
          </div>
          <div className="mt-6 flex flex-wrap items-start gap-6">
            <HoldToConfirm label={`Mantém premido para confirmar ${eur(amount)}`} onConfirm={() => setStamped(true)} confirmText={`Confirmo o compromisso de ${eur(amount)} no lote ${az21.id}.`} />
            <HoldToConfirm label="Desativado" onConfirm={() => undefined} disabled disabledReason="Faltam ler 2 de 6 fatores de risco." />
          </div>
        </Card>
      </Section>

      <Section title="Conhecimento" id="conhecimento">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <LevelProgress points={game.points} />
          </Card>
          <Card>
            <CardHeader title="Missões" />
            <QuestList quests={QUESTS.slice(0, 6)} isDone={game.isQuestDone} completedAt={game.questCompletedAt} />
          </Card>
        </div>
      </Section>

      <Section title="Diário e gráfico" id="diario">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Diário de campanha" />
            <CampaignFeed events={data.events} live={{ paused: feed.paused, reason: feed.pauseReason }} limit={6} />
          </Card>
          <Card>
            <ChartFrame
              title="Referência do azeite virgem extra"
              description="€/kg, 24 meses. Índice ilustrativo, dados fictícios."
              height={240}
              table={{ caption: 'Referência mensal', rows: series, getRowId: (r) => r.t, columns: [{ key: 't', header: 'Mês', render: (r) => r.t }, { key: 'v', header: '€/kg', align: 'right', mono: true, render: (r) => r.value.toFixed(2).replace('.', ','), sortValue: (r) => r.value }] }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={tokens.chartGrid} vertical={false} />
                  <XAxis dataKey="t" tickFormatter={(t: string) => MONTHS_SHORT[Number(t.slice(5)) - 1]} tick={{ fill: tokens.chartAxis, fontSize: 12 }} axisLine={{ stroke: tokens.chartGrid }} tickLine={false} interval={2} />
                  <YAxis width={40} tick={{ fill: tokens.chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} domain={[4, 8]} />
                  <RTooltip content={<ChartTooltipContent valueFormatter={(v) => price(v, 'kg')} />} />
                  <Line type="monotone" dataKey="value" name="Referência" stroke={tokens.seriesAzeite} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>
            <svg viewBox="0 0 200 40" className="mt-4 h-10 w-full text-accent" aria-hidden>
              <DrawPath d="M2 30 C40 10, 80 36, 120 18 S180 8, 198 12" />
            </svg>
          </Card>
        </div>
      </Section>

      <Section title="Controlos" id="controlos">
        <Card>
          <Tabs
            label="Exemplo"
            items={[
              { value: 'a', label: 'Formulário', content: (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome da sociedade" hint="Como consta na certidão permanente.">{({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} placeholder="Ex.: Quinta do Vale, Lda." />}</Field>
                  <Field label="País" error="Escolhe um país da UE.">{({ id, describedBy, invalid }) => <Select id={id} aria-describedby={describedBy} invalid={invalid}><option>Portugal</option><option>Espanha</option></Select>}</Field>
                  <Checkbox label="Li a nota de capital em risco" description="Obrigatório para continuar." />
                  <RadioGroup legend="Tipo" name="tipo" value={radio} onChange={setRadio} options={[{ value: 'a', label: 'Pessoa coletiva' }, { value: 'b', label: 'Pessoa singular' }]} />
                </div>
              ) },
              { value: 'b', label: 'Tabela', count: data.positions.length, content: (
                <DataTable
                  framed={false}
                  caption="Posições"
                  rows={data.positions}
                  getRowId={(p) => p.id}
                  initialSort={{ key: 'amount', dir: 'desc' }}
                  columns={[
                    { key: 'lot', header: 'Lote', mono: true, render: (p) => p.lotId, sortValue: (p) => p.lotId },
                    { key: 'prod', header: 'Produtor', render: (p) => p.producer.nome, minWidth: 180 },
                    { key: 'amount', header: 'Montante financiado', align: 'right', mono: true, render: (p) => eur(p.amount), sortValue: (p) => p.amount },
                    { key: 'st', header: 'Estado', render: (p) => <StatusPill status={p.lot.status} /> },
                  ]}
                />
              ) },
              { value: 'c', label: 'Indicadores', content: (
                <div className="grid gap-6 sm:grid-cols-3">
                  <StatTile label="Montante financiado" value={eur(data.totalFinanced)} sub="4 lotes ativos" />
                  <Meter label="AZ-2026-021" value={f} tone="azeite" />
                  <Meter label="AG-2026-007" value={fundedFraction(ag7)} tone="agua" />
                </div>
              ) },
            ]}
          />
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => setDrawer(true)}>Abrir gaveta</Button>
            <Button variant="secondary" onClick={() => setDialog(true)}>Abrir diálogo</Button>
            <Button variant="ghost" onClick={() => toast({ title: 'Aviso de teste', description: 'Fecha sozinho.', tone: 'info' })}>Aviso</Button>
            <Button variant="secondary" size="sm">Pequeno</Button>
            <Button loading>A guardar</Button>
            <Button disabled>Desativado</Button>
            <Badge tone="seal">Selo</Badge>
            <Badge tone="warn" dot>Atenção</Badge>
            <Badge tone="crit" dot>Crítico</Badge>
            <Badge tone="ok" dot>Conciliado</Badge>
          </div>
          <Disclaimer className="mt-4" kind="simulacao" title="Simulação">Os números desta secção usam dinheiro fictício.</Disclaimer>
          <SimulationLabel className="mt-3" />
        </Card>
      </Section>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Gaveta" description="Tarefa com contexto preservado." footer={<Button onClick={() => setDrawer(false)}>Fechar</Button>}>
        <p>Conteúdo da gaveta.</p>
      </Drawer>
      <Dialog open={dialog} onClose={() => setDialog(false)} title="Diálogo" description="Só para decisões com foco protegido." footer={<Button onClick={() => setDialog(false)}>Entendido</Button>} />
    </Page>
  );
}
