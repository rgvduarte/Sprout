import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { fundedFraction, getQuest, isInvestable } from '../../data';
import type { Lot, Quest } from '../../data/types';
import { Drawer, KeyValue, Meter, RiskNote, StatusPill } from '../../components/ui';
import { LotGauge, OriginSeal, QuestList } from '../../components/game';
import { useData, useGame, type SealView } from '../../state';
import { date as fmtDate, monthYear, pct } from '../../lib/format';
import { lotQuantityLabel } from '../../lib/physical';
import type { CampaignDef } from './model';

/* =====================================================================
   Detalhe de um selo: a história do produtor, os lotes da origem nessa
   campanha e, se ainda não foi ganho, as duas maneiras de o ganhar.
   Sem montantes: o selo regista participação ou diligência, não dimensão.
   ===================================================================== */

/** O que o medidor do lote mostra, por estado. */
export function gaugeFor(lot: Lot): { value: number; caption: string } {
  if (lot.status === 'aberto') return { value: fundedFraction(lot), caption: `Financiamento ${pct(fundedFraction(lot), 0)}` };
  if (lot.status === 'liquidado') return { value: 0, caption: 'Vendido e liquidado' };
  if (lot.status === 'fase-2') return { value: 0, caption: 'Pré-visualização' };
  const v = lot.quantity ? lot.stock / lot.quantity : 0;
  return { value: v, caption: lot.status === 'em-preparacao' ? `Em enchimento · ${pct(v, 0)}` : `Por vender · ${pct(v, 0)}` };
}

function LotRow({ lot }: { lot: Lot }) {
  const g = gaugeFor(lot);
  return (
    <li className="flex min-w-0 items-center gap-3 py-3">
      <LotGauge kind={lot.world} value={g.value} size="xs" label={`${lot.id}: ${g.caption}`} valueText={g.caption} />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm text-fg tnum">{lot.id}</p>
        <p className="truncate text-[0.9375rem] text-fg">{lot.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <StatusPill status={lot.status} />
          <span className="font-mono tnum">{lotQuantityLabel(lot)}</span>
          <span>· {g.caption}</span>
        </p>
      </div>
      <Link to={`/lote/${lot.id}`} className="inline-flex min-h-11 shrink-0 items-center gap-1 px-1 text-sm font-medium text-accent hover:underline" aria-label={`Abrir o lote ${lot.id}`}>
        Abrir
        <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
      </Link>
    </li>
  );
}

export function SealDrawer({ seal, campaign, onClose }: { seal: SealView | null; campaign: CampaignDef | null; onClose: () => void }) {
  const { lots } = useData();
  const game = useGame();
  const open = Boolean(seal && campaign);
  const s = seal;
  const lotsHere = s ? lots.filter((l) => l.producerId === s.def.producerId && l.campanha === s.def.campanha) : [];
  const quests = s ? (s.def.questIds.map((id) => getQuest(id)).filter(Boolean) as Quest[]) : [];
  const questsDone = quests.filter((q) => game.isQuestDone(q.id)).length;
  const openLots = lotsHere.filter(isInvestable);
  const canCommit = s?.def.earnable !== 'diligencia';
  const canDiligence = s?.def.earnable !== 'compromisso' && quests.length > 0;
  const closed = campaign?.state === 'concluida';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={s?.producer.nome ?? ''}
      description={s ? `Selo de origem · ${s.region.nome} · ${s.def.world === 'cafe' ? 'safra' : 'campanha'} ${s.def.campanha}` : undefined}
      width="md"
    >
      {s && campaign && (
        <div className="flex flex-col gap-7">
          <div className="flex items-center gap-4">
            <OriginSeal seal={s.def} producer={s.producer} region={s.region} state={s.earned ? 'earned' : 'locked'} size={120} earnedBy={s.earned?.by} earnedAt={s.earned?.at} />
            <div className="min-w-0">
              {s.earned ? (
                <>
                  <p className="font-medium text-seal-ink">Ganho a {fmtDate(s.earned.at)}</p>
                  <p className="mt-1 text-sm text-muted">
                    {s.earned.by === 'compromisso'
                      ? `Por compromisso: co-financias ${s.earned.lotId ?? 'um lote desta origem'}.`
                      : `Por diligência: cumpriste as ${quests.length} missões desta origem.`}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-fg">{closed ? 'Já não se pode ganhar' : 'Por ganhar'}</p>
                  <p className="mt-1 text-sm text-muted">
                    {closed
                      ? 'A campanha terminou.'
                      : s.def.earnable === 'ambos'
                        ? 'Com um compromisso num lote desta origem ou com as missões de diligência.'
                        : s.def.earnable === 'diligencia'
                          ? 'Só com as missões de diligência desta origem.'
                          : 'Com um compromisso num lote desta origem.'}
                  </p>
                </>
              )}
            </div>
          </div>

          <section aria-labelledby="sd-origem">
            <h3 id="sd-origem" className="text-[1.0625rem]">
              A origem
            </h3>
            <p className="mt-1.5 text-[0.9375rem] text-fg">{s.producer.story}</p>
            <KeyValue
              dense
              className="mt-4"
              items={[
                { label: 'Localidade', value: `${s.producer.localidade} · ${s.region.nome}` },
                { label: s.def.world === 'agua' ? 'Água' : 'Variedades', value: s.producer.variedades.join(', ') },
                { label: 'Certificações', value: s.producer.certifications.join(', ') },
                { label: 'Capacidade', value: s.producer.capacidade },
                { label: 'Na Sprout desde', value: monthYear(`${s.producer.since}-15`) },
              ]}
            />
          </section>

          <section aria-labelledby="sd-lotes">
            <h3 id="sd-lotes" className="text-[1.0625rem]">
              Lotes desta origem em {s.def.campanha}
            </h3>
            {lotsHere.length ? (
              <ul className="mt-1 divide-y divide-border">
                {lotsHere.map((l) => (
                  <LotRow key={l.id} lot={l} />
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-muted">Ainda sem lotes desta origem nesta campanha.</p>
            )}
          </section>

          {!s.earned && !closed && (
            <section aria-labelledby="sd-como" className="flex flex-col gap-5">
              <h3 id="sd-como" className="text-[1.0625rem]">
                Como se ganha
              </h3>
              {canDiligence && (
                <div>
                  <p className="font-medium text-fg">Por diligência</p>
                  <Meter className="mt-2" value={quests.length ? questsDone / quests.length : 0} label="Missões desta origem" valueLabel={`${questsDone} de ${quests.length}`} />
                  <QuestList quests={quests} isDone={game.isQuestDone} completedAt={game.questCompletedAt} compact className="mt-1" />
                </div>
              )}
              {canCommit && (
                <div>
                  <p className="font-medium text-fg">Por compromisso</p>
                  <p className="mt-1 text-sm text-muted">
                    {openLots.length
                      ? `Um compromisso num lote aberto desta origem: ${openLots.map((l) => l.id).join(', ')}. O selo regista a participação, não a dimensão.`
                      : `Nenhum lote desta origem está aberto agora${lotsHere.some((l) => l.status === 'em-preparacao') ? '; há um em preparação' : ''}.`}
                  </p>
                  {openLots.length > 0 && <RiskNote compact className="mt-2" />}
                </div>
              )}
              <p className="text-sm text-muted">
                Os selos não dão pontos, níveis, prioridade nem vantagens financeiras. Não comprometas capital para completar o caderno: cada lote tem riscos próprios, que se leem um a um antes de decidir.
              </p>
            </section>
          )}
        </div>
      )}
    </Drawer>
  );
}
