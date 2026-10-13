import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Ban, Check, CircleCheck, CircleX, Play } from 'lucide-react';
import { getQuest, QUESTS, TOTAL_KNOWLEDGE_POINTS, type Quest } from '../../data';
import { Badge, Button, Card, CardHeader, DataTable, Field, Select, StatusPill, type Column } from '../../components/ui';
import { useFeed, useGame, useRole } from '../../state';
import { GameContext } from '../../state/AppProvider';
import { TODAY, useNow } from '../../lib/clock';
import { num, plural, relative } from '../../lib/format';
import { BLOCKED_TRIGGERS, ENGINE_TRIGGERS, questsFor, triggerForQuest, type EngineTrigger } from './content';
import { actions, useBastidores } from './store';

/* =====================================================================
   Motor de missões: gatilho → regra → missão → recompensa. Só eventos de
   conhecimento, diligência e colheita física entram; eventos de dinheiro
   são recusados no primeiro passo, com o motivo.
   ===================================================================== */

const LOT_TRIGGERS = ['analise-lida', 'risco-lido'];
const PROBE_LOTS = ['AZ-2026-021', 'AG-2026-007'];

function matchQuests(triggerId: string, lotId?: string): Quest[] {
  const t = ENGINE_TRIGGERS.find((x) => x.id === triggerId);
  if (!t) return [];
  return questsFor(t).filter((q) => !LOT_TRIGGERS.includes(triggerId) || q.lotId === lotId);
}

const PIPELINE = [
  { title: 'Evento', body: 'Chega do produto: leitura, simulação, telemetria. Os eventos de dinheiro param aqui.' },
  { title: 'Regra', body: 'O critério de cada missão é avaliado no navegador, em menos de 1 segundo.' },
  { title: 'Missão', body: 'A barra de progresso enche e o Caderno regista a data.' },
  { title: 'Recompensa', body: 'Pontos de conhecimento, nível e selos por diligência. Nunca dinheiro nem vantagens financeiras.' },
];

export default function MotorTab() {
  const st = useBastidores();
  const game = useGame();
  const { roleLabel } = useRole();
  const ctx = useContext(GameContext);
  const feed = useFeed();
  const clock = useNow(15_000);
  const [triggerId, setTriggerId] = useState('analise-lida');
  const [lotId, setLotId] = useState(PROBE_LOTS[0]);
  const [last, setLast] = useState<string | null>(null);

  const blocked = BLOCKED_TRIGGERS.find((b) => b.id === triggerId);
  const allowed = ENGINE_TRIGGERS.find((t) => t.id === triggerId);
  const probe = st.probes.find((p) => p.id === last);

  const evaluate = () => {
    const t0 = performance.now();
    const accepted = !BLOCKED_TRIGGERS.some((b) => b.id === triggerId);
    const quests = accepted ? matchQuests(triggerId, lotId) : [];
    const ms = performance.now() - t0;
    setLast(actions.probe({ triggerId, lotId: LOT_TRIGGERS.includes(triggerId) ? lotId : undefined, accepted, questIds: quests.map((q) => q.id), ms }));
  };

  const triggerCols: Column<EngineTrigger>[] = [
    {
      key: 'gatilho',
      header: 'Gatilho',
      minWidth: 200,
      render: (t) => (
        <div>
          <div className="font-medium text-fg">{t.label}</div>
          <div className="text-xs text-muted">{t.source}</div>
        </div>
      ),
    },
    {
      key: 'missoes',
      header: 'Missões ligadas',
      minWidth: 280,
      render: (t) => {
        const qs = questsFor(t);
        return qs.length ? (
          <ul className="space-y-0.5">
            {qs.map((q) => (
              <li key={q.id} className="flex items-baseline gap-1.5">
                {game.isQuestDone(q.id) ? <Check aria-label="cumprida" className="size-3.5 shrink-0 text-ok-ink" strokeWidth={2.25} /> : <span aria-hidden className="inline-block size-3.5 shrink-0" />}
                <span>{q.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-muted">{t.effect}</span>
        );
      },
    },
    { key: 'pontos', header: 'Pontos', align: 'right', mono: true, sortValue: (t) => questsFor(t).reduce((s, q) => s + q.points, 0), render: (t) => num(questsFor(t).reduce((s, q) => s + q.points, 0)) },
    { key: 'estado', header: 'Estado', render: () => <StatusPill tone="ok" label="Ativo" /> },
  ];

  /* registo da sessão: missões cumpridas nos dois perfis, eventos ao vivo e ensaios */
  type LogEntry = { id: string; at: string; kind: 'missao' | 'diario' | 'ensaio'; title: string; detail: string; ok: boolean };
  const log: LogEntry[] = [];
  if (ctx) {
    (['demo', 'visitante'] as const).forEach((pid) => {
      ctx.state.profiles[pid].questsCompleted
        .filter((q) => new Date(q.at).getTime() >= TODAY.getTime())
        .forEach((q) => {
          const quest = getQuest(q.id);
          if (!quest) return;
          log.push({ id: `${pid}-${q.id}`, at: q.at, kind: 'missao', title: `Missão cumprida: ${quest.title}`, detail: `${triggerForQuest(quest)?.label ?? 'Gatilho'} · +${quest.points} pontos · perfil ${pid === 'demo' ? 'investidora de demonstração' : 'Visitante'}`, ok: true });
        });
    });
  }
  feed.events.slice(0, 8).forEach((e) => log.push({ id: e.id, at: e.at, kind: 'diario', title: e.title, detail: 'Marco do lote · informativo, sem missão com pontos', ok: true }));
  st.probes.forEach((p) => {
    const t = ENGINE_TRIGGERS.find((x) => x.id === p.triggerId) ?? BLOCKED_TRIGGERS.find((x) => x.id === p.triggerId);
    log.push({
      id: p.id,
      at: p.at,
      kind: 'ensaio',
      title: `Ensaio: ${t?.label ?? p.triggerId}${p.lotId ? ` · ${p.lotId}` : ''}`,
      detail: p.accepted ? `Aceite · ${plural(p.questIds.length, 'missão afetada', 'missões afetadas')} · ${p.ms < 1 ? '< 1 ms' : `${num(p.ms, 1)} ms`}` : 'Recusado no passo 1: evento de dinheiro',
      ok: p.accepted,
    });
  });
  log.sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="pipeline-t">
        <h2 id="pipeline-t" className="text-[1.375rem] leading-tight">
          Do evento à recompensa
        </h2>
        <p className="measure mt-1 text-muted">
          {plural(QUESTS.length, 'missão ativa', 'missões ativas')} · {num(TOTAL_KNOWLEDGE_POINTS)} pontos de conhecimento possíveis · {plural(BLOCKED_TRIGGERS.length, 'tipo de evento bloqueado', 'tipos de evento bloqueados')} · nenhum gatilho ligado a dinheiro.
        </p>
        <ol className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((p, i) => (
            <li key={p.title} className="border-t-2 border-accent pt-3">
              <p className="flex items-center gap-2 font-semibold text-fg">
                <span className="font-mono text-sm text-muted tnum">{i + 1}</span>
                {p.title}
                {i < PIPELINE.length - 1 && <ArrowRight aria-hidden className="ml-auto hidden size-4 text-muted lg:block" strokeWidth={1.75} />}
              </p>
              <p className="mt-1 text-sm text-muted">{p.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="permitidos-t">
        <div className="mb-4">
          <h2 id="permitidos-t" className="text-[1.375rem] leading-tight">
            Gatilhos configurados
          </h2>
          <p className="measure mt-1 text-muted">As missões marcadas já estão cumpridas no perfil que estás a usar ({roleLabel}).</p>
        </div>
        <DataTable columns={triggerCols} rows={ENGINE_TRIGGERS} getRowId={(t) => t.id} caption="Gatilhos permitidos do motor de missões" dense={false} />
      </section>

      <Card>
        <CardHeader title="Gatilhos bloqueados" description="Tipos de evento que o motor recusa sempre, com o motivo. Não há configuração que os ligue." />
        <ul className="divide-y divide-border">
          {BLOCKED_TRIGGERS.map((b) => (
            <li key={b.id} className="grid gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0 md:grid-cols-[16rem_minmax(0,1fr)_auto] md:items-baseline">
              <p className="flex items-start gap-2 font-medium text-fg">
                <Ban aria-hidden className="mt-0.5 size-4 shrink-0 text-crit-ink" strokeWidth={1.75} />
                {b.label}
              </p>
              <p className="text-sm text-muted">
                {b.reason} <span className="text-fg">Exemplo recusado: {b.example}.</span>
              </p>
              <StatusPill tone="crit" label="Bloqueado" className="justify-self-start" />
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card>
          <CardHeader title="Ensaio de um evento" description="Envia um evento ao motor e vê o que acontece. É um ensaio: não altera o perfil nem dá pontos." />
          <div className="flex flex-col gap-4">
            <Field label="Tipo de evento">
              {({ id }) => (
                <Select id={id} value={triggerId} onChange={(e) => setTriggerId(e.target.value)}>
                  <optgroup label="Permitidos">
                    {ENGINE_TRIGGERS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Bloqueados">
                    {BLOCKED_TRIGGERS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </optgroup>
                </Select>
              )}
            </Field>
            {LOT_TRIGGERS.includes(triggerId) && (
              <Field label="Lote">
                {({ id }) => (
                  <Select id={id} value={lotId} onChange={(e) => setLotId(e.target.value)}>
                    {PROBE_LOTS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
            <p className="text-sm text-muted">Exemplo: {blocked?.example ?? allowed?.example}</p>
            <div>
              <Button onClick={evaluate} iconLeft={<Play aria-hidden className="size-4" strokeWidth={1.75} />}>
                Avaliar evento
              </Button>
            </div>
          </div>
          <div aria-live="polite" className="mt-5 border-t border-border pt-4">
            {probe ? (
              probe.accepted ? (
                <div>
                  <p className="flex items-center gap-2 font-medium text-fg">
                    <CircleCheck aria-hidden className="size-4 text-ok-ink" strokeWidth={1.75} />
                    Aceite em {probe.ms < 1 ? 'menos de 1 ms' : `${num(probe.ms, 1)} ms`}
                  </p>
                  {probe.questIds.length ? (
                    <ul className="mt-2 space-y-1 text-sm">
                      {probe.questIds.map((qid) => {
                        const q = getQuest(qid)!;
                        const done = game.isQuestDone(qid);
                        return (
                          <li key={qid} className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-fg">{q.title}</span>
                            <span className="text-muted">{done ? '· já cumprida neste perfil' : `· daria +${q.points} pontos`}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-muted">{ENGINE_TRIGGERS.find((t) => t.id === probe.triggerId)?.effect ?? 'Nenhuma missão ligada a este evento.'}</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="flex items-center gap-2 font-medium text-fg">
                    <CircleX aria-hidden className="size-4 text-crit-ink" strokeWidth={1.75} />
                    Recusado no passo 1
                  </p>
                  <p className="mt-1 text-sm text-muted">{BLOCKED_TRIGGERS.find((b) => b.id === probe.triggerId)?.reason} Nenhuma missão, nenhum ponto, nenhum aviso ao utilizador.</p>
                </div>
              )
            ) : (
              <p className="text-sm text-muted">Ainda sem ensaios nesta sessão.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Registo do motor" description="Missões cumpridas nesta sessão, eventos do Diário e ensaios, mais recentes primeiro." />
          {log.length ? (
            <ol className="divide-y divide-border">
              {log.slice(0, 12).map((e) => (
                <li key={e.id} className="flex items-start gap-3 py-2.5 first:pt-0">
                  <Badge tone={e.kind === 'missao' ? 'accent' : e.kind === 'ensaio' ? (e.ok ? 'info' : 'crit') : 'neutral'} className="mt-0.5 w-16 justify-center">
                    {e.kind === 'missao' ? 'Missão' : e.kind === 'ensaio' ? 'Ensaio' : 'Diário'}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem] leading-snug text-fg">{e.title}</p>
                    <p className="text-xs text-muted">
                      {e.detail} · <time dateTime={e.at} className="font-mono tnum">{relative(e.at, clock)}</time>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-sm text-muted">
              <p>Ainda nada nesta sessão. O Diário entra aqui a cada leitura de telemetria{feed.paused ? ' (agora em pausa)' : ''}.</p>
              <p className="mt-2">
                Para ver uma missão a cumprir-se, abre o{' '}
                <Link to="/lote/AZ-2026-021#analises" className="text-accent underline underline-offset-[0.2em]">
                  boletim de análises do AZ-2026-021
                </Link>
                .
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
