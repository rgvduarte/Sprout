import { useState } from 'react';
import { Check, Download, FileText, Package } from 'lucide-react';
import { getRegion, RESERVE_SHARE } from '../../data';
import type { QualityAnalysis } from '../../data';
import { CampaignFeed, HarvestBand, JourneyTrack } from '../../components/game';
import { Button, Drawer, KeyValue, RiskNote, StatusPill, Tabs } from '../../components/ui';
import { useCampaignEvents, useData, useGame, useToast, type PositionView } from '../../state';
import { cn } from '../../lib/cn';
import { date as fmtDate, eur, num, pct } from '../../lib/format';
import { analysisReport, contractSummary, downloadText, fileDate } from './docs';
import { ExitTerms } from './ExitTerms';
import { decimalsOf, physicalShare, plannedSettlement, playbookFor, positionState, windowOf } from './positions';

/* =====================================================================
   Gaveta da posição: rastreabilidade, análises, documentos, prazos e saída
   e o diário do lote. Preserva o contexto da carteira (sem modal).
   ===================================================================== */

type TabId = 'rastreabilidade' | 'analises' | 'documentos' | 'prazos' | 'diario';

function AnalysisBlock({ a }: { a: QualityAnalysis }) {
  return (
    <section className="min-w-0 border-b border-border pb-5 last:border-b-0 last:pb-0" aria-label={`Boletim ${a.reportId}`}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill label={a.category} tone={a.params.every((x) => x.pass) ? 'ok' : 'warn'} />
        <span className="font-mono text-sm text-muted tnum">{a.reportId}</span>
      </div>
      <p className="mt-1.5 text-sm text-muted">
        {a.lab} · <span className="font-mono tnum">{fmtDate(a.date)}</span>
      </p>
      <div className="-mx-1 mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label={`Parâmetros do boletim ${a.reportId}`}>
        <table className="w-full min-w-[360px] border-collapse text-sm">
          <caption className="sr-only">Parâmetros analisados e limites legais</caption>
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th scope="col" className="px-1 py-2 font-medium">
                Parâmetro
              </th>
              <th scope="col" className="px-1 py-2 text-right font-medium">
                Valor
              </th>
              <th scope="col" className="px-1 py-2 text-right font-medium">
                Limite
              </th>
            </tr>
          </thead>
          <tbody>
            {a.params.map((x) => (
              <tr key={x.id} className="border-b border-border last:border-b-0">
                <td className="px-1 py-2 text-fg">{x.label}</td>
                <td className="px-1 py-2 text-right font-mono text-fg tnum">
                  {num(x.value, decimalsOf(x.value, x.limit))}
                  {x.unit ? <span className="text-muted"> {x.unit}</span> : null}
                </td>
                <td className={cn('px-1 py-2 text-right font-mono tnum', x.pass ? 'text-muted' : 'text-crit-ink')}>
                  {x.limitLabel}
                  {!x.pass && <span className="sr-only"> (fora do limite)</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {a.panel && (
        <p className="mt-3 text-sm text-muted">
          Painel de prova: frutado <span className="font-mono text-fg tnum">{num(a.panel.medianaFrutado, 1)}</span>, defeito <span className="font-mono text-fg tnum">{num(a.panel.medianaDefeito, 1)}</span> · {a.panel.atributos.join(', ').toLowerCase()}.
        </p>
      )}
      {a.note && <p className="mt-1 text-sm text-fg">{a.note}</p>}
      <p className="mt-2 text-sm text-muted">Referência legal: {a.reference}</p>
    </section>
  );
}

function DocRow({ title, meta, onDownload }: { title: string; meta: string; onDownload: () => void }) {
  return (
    <li className="flex min-w-0 items-center gap-3 border-b border-border py-2.5 last:border-b-0">
      <FileText aria-hidden className="size-5 shrink-0 text-muted" strokeWidth={1.5} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-fg">{title}</span>
        <span className="block font-mono text-xs text-muted tnum">{meta}</span>
      </span>
      <Button variant="ghost" size="sm" onClick={onDownload} iconLeft={<Download aria-hidden className="size-4" strokeWidth={1.75} />} aria-label={`Descarregar ${title}`}>
        .txt
      </Button>
    </li>
  );
}

export function PositionDrawer({ p, onClose }: { p: PositionView | null; onClose: () => void }) {
  const open = Boolean(p);
  return (
    <Drawer open={open} onClose={onClose} width="lg" title={p ? `${p.lot.id} · ${p.producer.nome}` : ''} description={p ? `${p.lot.title} · campanha ${p.lot.campanha}` : undefined}>
      {p && <DrawerBody p={p} />}
    </Drawer>
  );
}

function DrawerBody({ p }: { p: PositionView }) {
  const lot = p.lot;
  const game = useGame();
  const { investor } = useData();
  const events = useCampaignEvents();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('rastreabilidade');
  const st = positionState(p);
  const share = physicalShare(p);
  const region = getRegion(lot.regionId);
  const w = windowOf(lot);
  const settle = plannedSettlement(lot);
  const pb = playbookFor(lot);
  const lotEvents = events.filter((e) => e.lotId === lot.id);
  const requested = game.sampleRequest(lot.id);
  const noStock = lot.stock <= 0;

  const onTab = (v: TabId) => {
    setTab(v);
    if (v === 'analises' && lot.analyses.length) game.markAnalysisRead(lot.id);
  };

  const download = (name: string, text: string) => {
    const ok = downloadText(name, text);
    toast(ok ? { tone: 'neutral', title: 'Documento descarregado', description: name } : { tone: 'crit', title: 'Não foi possível descarregar', description: 'O browser bloqueou a transferência. Tenta noutra janela.' });
  };

  const requestSample = () => {
    const what = lot.world === 'agua' ? 'Garrafa de 1,5 L' : lot.world === 'cafe' ? 'Amostra de 350 g de café verde' : 'Frasco de 250 ml';
    game.requestReward({ rewardId: 'amostra', lotId: lot.id, option: 'morada', detail: `${what} do ${lot.id} · morada registada`, status: 'Pedido registado · envio em até 10 dias úteis' });
    toast({ tone: 'accent', title: `Amostra do ${lot.id} pedida`, description: `${what} do lote, com o boletim de análises impresso. Envio para a morada registada em até 10 dias úteis.` });
  };

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusPill label={st.label} tone={st.tone} />
        <span className="text-sm text-muted">
          <span className="font-mono text-fg tnum">{eur(p.amount)}</span> · {share.primary} {share.secondary}
        </span>
      </div>
      <Tabs<TabId>
        label="Detalhes da posição"
        value={tab}
        onChange={onTab}
        items={[
          {
            value: 'rastreabilidade',
            label: 'Rastreabilidade',
            content: (
              <div className="space-y-6">
                <KeyValue
                  dense
                  items={[
                    { label: 'Produtor', value: p.producer.nome, hint: `${p.producer.localidade} · ${region?.nome ?? ''}` },
                    { label: 'Mercadoria', value: lot.product },
                    { label: 'Armazenagem', value: lot.storage.local, hint: `${num(lot.storage.containers)} × ${/^[A-Z]{2,}/.test(lot.storage.container) ? lot.storage.container : lot.storage.container.charAt(0).toLowerCase() + lot.storage.container.slice(1)}` },
                    { label: 'Comprador', value: lot.buyer ? `${lot.buyer.segment} · ${lot.buyer.descricao}` : 'Por contratar' },
                    { label: 'Certificações do produtor', value: p.producer.certifications.join(', ') || '—' },
                    { label: 'A tua parte', value: `${share.primary} · ${pct(share.shareOfLot, 1)} do lote`, mono: true },
                  ]}
                />
                <div>
                  <h3 className="mb-3 text-[1rem]">Jornada física</h3>
                  <JourneyTrack lot={lot} orientation="vertical" />
                </div>
                <div className="rounded-sm bg-surface-2 px-4 py-3">
                  <p className="flex items-center gap-2 text-sm font-medium text-fg">
                    <Package aria-hidden className="size-4 text-muted" strokeWidth={1.75} />
                    Amostra do lote
                  </p>
                  <p className="mt-1 text-sm text-muted">Todos os co-financiadores podem pedir uma amostra, qualquer que seja o montante. É participação, não tamanho.</p>
                  {requested ? (
                    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-ok-ink">
                      <Check aria-hidden className="size-4" strokeWidth={2} /> Pedida a {fmtDate(requested.at)} · {requested.status}.
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <Button variant="secondary" size="sm" onClick={requestSample} disabled={noStock} aria-describedby={noStock ? `nosample-${lot.id}` : undefined}>
                        Pedir amostra
                      </Button>
                      {noStock && (
                        <span id={`nosample-${lot.id}`} className="text-sm text-muted">
                          Lote já expedido: não há stock para amostras.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            value: 'analises',
            label: 'Análises',
            count: lot.analyses.length,
            content: lot.analyses.length ? (
              <div className="space-y-5">
                {lot.analyses.map((a) => (
                  <AnalysisBlock key={a.id} a={a} />
                ))}
              </div>
            ) : (
              <p className="text-muted">Ainda sem boletim publicado para este lote.</p>
            ),
          },
          {
            value: 'documentos',
            label: 'Documentos',
            content: (
              <div>
                <ul>
                  <DocRow title="Resumo das condições do contrato" meta={`${lot.id} · ${fmtDate(p.committedAt)}`} onDownload={() => download(`Sprout_condicoes_${lot.id}.txt`, contractSummary(investor, p))} />
                  {lot.analyses.map((a) => (
                    <DocRow key={a.id} title={`Boletim de análises ${a.reportId}`} meta={`${a.lab.split(' · ')[0]} · ${fmtDate(a.date)}`} onDownload={() => download(`Sprout_boletim_${a.reportId}_${fileDate(a.date)}.txt`, analysisReport(lot, a))} />
                  ))}
                </ul>
                <p className="mt-3 text-sm text-muted">Os extratos mensais da carteira inteira estão na secção Extratos e documentos. Ficheiros de texto gerados a partir dos dados de demonstração.</p>
              </div>
            ),
          },
          {
            value: 'prazos',
            label: 'Prazos e saída',
            content: (
              <div className="space-y-6">
                <div>
                  <HarvestBand
                    world={lot.world}
                    start={w.start}
                    months={lot.settlement.windowMonths}
                    extensionMonths={w.extEnd ? 6 : 0}
                    markers={settle ? [{ date: settle, label: 'Liquidação prevista' }] : []}
                  />
                </div>
                <ExitTerms lot={lot} />
                <div>
                  <h3 className="text-[1rem]">O que protege este lote</h3>
                  <ul className="mt-2 space-y-2 text-sm text-muted">
                    <li>
                      <span className="font-medium text-fg">{lot.hedge.label}.</span> {lot.hedge.note}
                      {lot.hedge.trigger && <> Gatilho: {lot.hedge.trigger}</>}
                    </li>
                    <li>
                      <span className="font-medium text-fg">Reserva de primeira perda.</span> {pct(RESERVE_SHARE, 0)} da margem bruta do lote fica retida pela Sprout para absorver perdas antes do capital dos co-financiadores. Pode não chegar.
                    </li>
                    {pb && (
                      <li>
                        <span className="font-medium text-fg">Playbook de refunding: {pb.title}.</span> {pb.steps.length} passos, do alerta da Tesouraria à proposta de extensão ou nova ronda.
                      </li>
                    )}
                  </ul>
                </div>
                <RiskNote />
              </div>
            ),
          },
          {
            value: 'diario',
            label: 'Diário',
            count: lotEvents.length,
            content: <CampaignFeed events={lotEvents} limit={20} linkLots={false} emptyText="Ainda sem acontecimentos registados para este lote." />,
          },
        ]}
      />
    </div>
  );
}
