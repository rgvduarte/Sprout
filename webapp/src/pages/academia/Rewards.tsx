import { useMemo, useState, type ReactNode } from 'react';
import { ClipboardList, Coffee, Droplets, Factory, Lock, Package, ScrollText, Video } from 'lucide-react';
import { Button, Drawer, RadioGroup, Select, Field, SegmentedControl } from '../../components/ui';
import { LEVELS, getQuest } from '../../data';
import type { LevelId, RewardRequest } from '../../data/types';
import { useData, useGame, useToast, type GameView, type PositionView } from '../../state';
import { now } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { date as fmtDate, num } from '../../lib/format';
import { LEVEL_PERKS, REWARDS, type RewardDef, type RewardId } from './content';
import { certificateSvg } from './certificate';

/* =====================================================================
   Recompensas da colheita: em espécie, de produto e de conhecimento.
   Desbloqueiam por nível, missões ou participação num lote (qualquer
   montante). Nada em dinheiro, nada proporcional ao montante.
   ===================================================================== */

const ICONS: Record<RewardId, ReactNode> = {
  amostra: <Package className="size-5" strokeWidth={1.75} />,
  certificado: <ScrollText className="size-5" strokeWidth={1.75} />,
  'prova-online': <Video className="size-5" strokeWidth={1.75} />,
  relatorio: <ClipboardList className="size-5" strokeWidth={1.75} />,
  'visita-lagar': <Factory className="size-5" strokeWidth={1.75} />,
  'visita-nascente': <Droplets className="size-5" strokeWidth={1.75} />,
  'prova-cafe': <Coffee className="size-5" strokeWidth={1.75} />,
};

const levelOf = (id: LevelId) => LEVELS.find((l) => l.id === id)!;

function unlockState(r: RewardDef, game: GameView, sampleLots: PositionView[]) {
  const missing: string[] = [];
  if (r.unlock.level) {
    const l = levelOf(r.unlock.level);
    if (game.points < l.minPoints) missing.push(`Nível ${l.nome}: faltam ${num(l.minPoints - game.points)} pontos`);
  }
  for (const qid of r.unlock.quests ?? []) {
    if (!game.isQuestDone(qid)) missing.push(`Missão «${getQuest(qid)?.title}»`);
  }
  if (r.unlock.participation && sampleLots.length === 0) missing.push('Cofinanciar um lote de azeite ou de água, com qualquer montante');
  return { unlocked: missing.length === 0, missing };
}

export function Rewards() {
  const game = useGame();
  const data = useData();
  const [drawer, setDrawer] = useState<{ id: RewardId; n: number; open: boolean } | null>(null);
  const openReward = (id: RewardId) => setDrawer((d) => ({ id, n: (d?.n ?? 0) + 1, open: true }));

  const participating = useMemo(() => data.positions.filter((p) => p.status !== 'liquidado' && p.lot.world !== 'cafe'), [data.positions]);
  const requestsFor = (id: RewardId) => game.rewardRequests.filter((r) => r.rewardId === id);
  const openDef = drawer ? REWARDS.find((r) => r.id === drawer.id) : undefined;

  return (
    <div className="grid min-w-0 items-start gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <ul className="min-w-0 divide-y divide-border border-y border-border">
        {REWARDS.map((r) => {
          const st = unlockState(r, game, participating);
          const reqs = requestsFor(r.id);
          const issued = r.kind === 'certificado' && reqs.length > 0;
          const sampleLeft = r.kind === 'amostra' ? participating.filter((p) => !reqs.some((q) => q.lotId === p.lotId)).length : 1;
          const exhausted = r.kind === 'amostra' && st.unlocked && sampleLeft === 0;
          return (
            <li key={r.id} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
              <span aria-hidden className={cn('mt-0.5', st.unlocked ? 'text-accent' : 'text-muted')}>
                {ICONS[r.id]}
              </span>
              <div className="min-w-0">
                <p className={cn('font-medium leading-snug', st.unlocked ? 'text-fg' : 'text-muted')}>{r.title}</p>
                <p className="mt-0.5 text-sm text-muted">{r.what}</p>
                <p className="mt-1.5 flex items-start gap-1.5 text-sm">
                  {!st.unlocked && <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0 text-muted" strokeWidth={1.75} />}
                  <span className={st.unlocked ? 'text-accent' : 'text-muted'}>
                    {st.unlocked ? `Desbloqueado · ${r.unlockText}` : `Falta: ${st.missing.join(' · ')}`}
                  </span>
                </p>
                {reqs.length > 0 && (
                  <p className="mt-1 text-sm text-muted">
                    {reqs.map((q) => `${q.detail} · ${q.status}`).join(' | ')}
                  </p>
                )}
              </div>
              <div className="col-start-2 mt-3 sm:col-start-3 sm:row-start-1 sm:mt-0">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!st.unlocked || exhausted}
                  onClick={() => openReward(r.id)}
                  className="disabled:border-transparent disabled:bg-surface-2"
                  iconLeft={!st.unlocked ? <Lock aria-hidden className="size-3.5" strokeWidth={1.75} /> : undefined}
                >
                  {issued ? 'Ver certificado' : exhausted ? 'Amostras pedidas' : r.action}
                  {!st.unlocked && <span className="sr-only"> · bloqueado</span>}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="flex min-w-0 flex-col gap-6" aria-label="Pedidos e regras do catálogo">
        <section aria-labelledby="pedidos-title">
          <h3 id="pedidos-title" className="text-[1.0625rem]">
            Os teus pedidos
          </h3>
          {game.rewardRequests.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Ainda não pediste nada. As recompensas desbloqueadas têm o botão ativo.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {game.rewardRequests.map((q) => (
                <RequestRow key={q.id} q={q} />
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="regras-title" className="rounded-sm bg-surface-2 px-4 py-3.5">
          <h3 id="regras-title" className="text-base">
            Regras do catálogo
          </h3>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-sm text-fg marker:text-muted">
            <li>Só em espécie: produto, acesso e conhecimento. Nunca dinheiro, bónus ou descontos em comissões.</li>
            <li>Nenhuma recompensa depende do montante investido. Quem cofinancia um lote pode pedir a amostra, seja qual for o valor.</li>
            <li>Nenhum nível dá melhores preços nem prioridade na alocação de lotes.</li>
            <li>As recompensas são pessoais: não se transferem, não se vendem, não se trocam.</li>
          </ul>
        </section>
      </section>

      <section aria-labelledby="niveis-title" className="min-w-0 lg:col-span-2">
        <h3 id="niveis-title" className="text-[1.0625rem]">
          O que cada nível desbloqueia
        </h3>
        <ol className="mt-3 divide-y divide-border border-y border-border">
          {LEVELS.map((l) => {
            const reached = game.points >= l.minPoints;
            const mine = l.id === game.level.id;
            return (
              <li key={l.id} className="grid min-w-0 gap-x-6 gap-y-1 py-3 sm:grid-cols-[200px_minmax(0,1fr)]">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className={cn('font-medium', reached ? 'text-fg' : 'text-muted')}>{l.nome}</span>
                  <span className="font-mono text-sm text-muted tnum">{num(l.minPoints)} pts</span>
                  {mine && <span className="rounded-xs bg-accent-soft px-1.5 text-xs font-medium leading-5 text-accent">o teu nível</span>}
                </div>
                <ul className={cn('flex flex-col gap-0.5 text-[0.9375rem]', reached ? 'text-fg' : 'text-muted')}>
                  {LEVEL_PERKS[l.id].unlocks.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </section>

      {openDef && drawer && <RequestDrawer key={drawer.n} def={openDef} open={drawer.open} onClose={() => setDrawer((d) => (d ? { ...d, open: false } : d))} participating={participating} />}
    </div>
  );
}

function RequestRow({ q }: { q: RewardRequest }) {
  const def = REWARDS.find((r) => r.id === q.rewardId)!;
  return (
    <li className="py-2.5">
      <p className="text-sm font-medium text-fg">{def.title}</p>
      <p className="text-sm text-muted">{q.detail}</p>
      <p className="text-sm text-muted">
        <span className="font-mono tnum">{fmtDate(q.at)}</span> · {q.status}
      </p>
    </li>
  );
}

/* ------------------------------------------------------------ pedido */

function RequestDrawer({ def, open, onClose, participating }: { def: RewardDef; open: boolean; onClose: () => void; participating: PositionView[] }) {
  const game = useGame();
  const data = useData();
  const { toast } = useToast();
  const reqs = game.rewardRequests.filter((r) => r.rewardId === def.id);

  const sampleLots = participating.filter((p) => !reqs.some((q) => q.lotId === p.lotId));
  const reportLots = data.lots.filter((l) => ['aberto', 'financiado', 'em-extensao'].includes(l.status) && l.world !== 'cafe');

  const [slot, setSlot] = useState<string | undefined>(def.slots?.[0]?.id);
  const [place, setPlace] = useState<string | undefined>(def.places?.[0]?.id);
  const [lot, setLot] = useState<string | undefined>(def.kind === 'amostra' ? sampleLots[0]?.lotId : def.kind === 'relatorio' ? reportLots[0]?.id : undefined);
  const [people, setPeople] = useState<'1' | '2'>('1');

  const issued = def.kind === 'certificado' && reqs.length > 0;
  const today = now().toISOString();

  const submit = () => {
    const slotLabel = def.slots?.find((s) => s.id === slot)?.label;
    const placeLabel = def.places?.find((p) => p.id === place)?.label;
    let detail = def.title;
    let status = 'Pedido registado';
    if (def.kind === 'certificado') {
      detail = `Nível ${game.level.nome} · ${num(game.points)} pontos`;
      status = 'Emitido';
    } else if (def.kind === 'amostra') {
      const pos = sampleLots.find((p) => p.lotId === lot);
      detail = `${pos?.lot.world === 'agua' ? 'Garrafa' : 'Frasco de 250 ml'} do ${lot} · ${placeLabel?.toLowerCase()}`;
      status = 'Pedido registado · envio em até 10 dias úteis';
    } else if (def.kind === 'relatorio') {
      detail = `Relatório técnico do ${lot}`;
      status = 'Pedido registado · segue por email em até 2 dias úteis';
    } else if (def.kind === 'sessao') {
      detail = slotLabel ?? def.title;
      status = 'Inscrição registada';
    } else if (def.kind === 'visita') {
      detail = `${placeLabel} · ${slotLabel} · ${people === '1' ? '1 pessoa' : '2 pessoas'}`;
      status = 'Pedido registado · a equipa confirma por email';
    }
    game.requestReward({ rewardId: def.id, at: today, detail, status, lotId: lot, option: def.kind === 'amostra' ? place : def.kind === 'sessao' ? slot : undefined });
    toast({ tone: 'accent', title: def.kind === 'certificado' ? 'Certificado emitido' : 'Pedido registado', description: `${def.title}: ${detail}.` });
    if (def.kind !== 'certificado') onClose();
  };

  const name = data.investor.nome;
  const certDate = today;
  const firstIssued = issued ? reqs[reqs.length - 1].at : undefined;
  const svg = def.kind === 'certificado' ? certificateSvg({ name, level: game.level.nome, points: game.points, date: fmtDate(certDate) }) : '';
  const download = () => {
    const blob = new Blob([certificateSvg({ name, level: game.level.nome, points: game.points, date: fmtDate(certDate), standalone: true })], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certificado-provador-sprout.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const canSubmit = def.kind === 'amostra' ? Boolean(lot) : def.kind === 'relatorio' ? Boolean(lot) : true;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={def.title}
      description={def.what}
      width={def.kind === 'certificado' ? 'lg' : 'md'}
      footer={
        <div className="flex flex-wrap items-center gap-3">
          {def.kind === 'certificado' && issued ? (
            <Button onClick={download}>Descarregar certificado (SVG)</Button>
          ) : (
            <Button onClick={submit} disabled={!canSubmit}>
              {def.kind === 'certificado' ? 'Emitir certificado' : def.kind === 'sessao' ? 'Confirmar inscrição' : def.kind === 'visita' ? 'Pedir a visita' : def.kind === 'relatorio' ? 'Pedir o relatório' : 'Pedir a amostra'}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            {issued ? 'Fechar' : 'Cancelar'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {def.kind === 'certificado' && (
          <>
            <div className="overflow-hidden rounded-sm border border-border" role="img" aria-label={`Certificado de ${game.level.nome} atribuído a ${name}, ${num(game.points)} pontos de conhecimento, ${fmtDate(certDate)}.`} dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="text-sm text-muted">{firstIssued ? `Emitido pela primeira vez a ${fmtDate(firstIssued)}. Esta versão leva os teus pontos e a data de hoje.` : 'Atesta os conteúdos concluídos na Academia. Não é uma certificação profissional nem uma qualificação de investidor.'}</p>
          </>
        )}

        {def.kind === 'amostra' && (
          <>
            <RadioGroup
              legend="De que lote?"
              name="amostra-lote"
              value={lot}
              onChange={setLot}
              options={sampleLots.map((p) => ({ value: p.lotId, label: `${p.lotId} · ${p.producer.nome}`, description: p.lot.product }))}
              hint="Uma amostra por lote, para qualquer cofinanciador."
            />
            <RadioGroup legend="Entrega" name="amostra-entrega" value={place} onChange={setPlace} options={(def.places ?? []).map((p) => ({ value: p.id, label: p.label }))} />
          </>
        )}

        {def.kind === 'relatorio' && (
          <Field label="Lote" hint="Boletins integrais, atas do painel e inventário fotográfico.">
            {({ id, describedBy }) => (
              <Select id={id} aria-describedby={describedBy} value={lot} onChange={(e) => setLot(e.target.value)}>
                {reportLots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id} · {l.product}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

        {def.kind === 'sessao' && <RadioGroup legend="Sessão" name={`${def.id}-sessao`} value={slot} onChange={setSlot} options={(def.slots ?? []).map((s) => ({ value: s.id, label: s.label }))} />}

        {def.kind === 'visita' && (
          <>
            {(def.places?.length ?? 0) > 1 ? (
              <RadioGroup legend="Onde" name={`${def.id}-local`} value={place} onChange={setPlace} options={(def.places ?? []).map((p) => ({ value: p.id, label: p.label }))} />
            ) : (
              <p className="text-[0.9375rem] text-fg">{def.places?.[0]?.label}</p>
            )}
            <RadioGroup legend="Data" name={`${def.id}-data`} value={slot} onChange={setSlot} options={(def.slots ?? []).map((s) => ({ value: s.id, label: s.label }))} />
            <div>
              <p className="mb-1.5 text-sm font-medium text-fg">Pessoas</p>
              <SegmentedControl<'1' | '2'>
                label="Número de pessoas"
                value={people}
                onChange={setPeople}
                options={[
                  { value: '1', label: '1 pessoa' },
                  { value: '2', label: '2 pessoas' },
                ]}
              />
            </div>
          </>
        )}

        {!issued && <p className="text-sm text-muted">{def.after}</p>}
        {reqs.length > 0 && def.kind !== 'certificado' && (
          <div>
            <p className="text-sm font-medium text-fg">Já pediste</p>
            <ul className="mt-1 text-sm text-muted">
              {reqs.map((q) => (
                <li key={q.id}>
                  {fmtDate(q.at)} · {q.detail} · {q.status}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Drawer>
  );
}
