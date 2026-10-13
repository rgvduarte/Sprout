import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { ArrowUpRight, BookOpen, CalendarRange, CircleCheck, Puzzle } from 'lucide-react';
import { Button, TextLink } from '../../components/ui';
import { LevelGlyph, OriginSeal, QuestList, WaxSealStamp, DUR, EASE_OUT, useRichMotion } from '../../components/game';
import type { SealView } from '../../state';
import { useGame } from '../../state';
import { hashString } from '../../lib/prng';
import { useNow } from '../../lib/clock';
import { date as fmtDate, dateShort, lisbonParts, num, relative } from '../../lib/format';
import { cn } from '../../lib/cn';
import { CampaignStrip } from './CampaignStrip';
import { CAMPAIGNS, QUESTS_BY_WORLD, type CampaignDef, type CampaignId, type KMilestone, type Note } from './model';

/* =====================================================================
   O caderno: separadores por campanha e uma página dupla (selos à
   esquerda, notas e marcos à direita). Virar de campanha é o momento
   focal desta superfície: a página nova revela-se a partir da lombada.
   ===================================================================== */

/* ------------------------------------------------------------ separadores */

export function CampaignTabs({ current, onSelect, counts }: { current: CampaignId; onSelect: (id: CampaignId) => void; counts: Record<CampaignId, { earned: number; total: number }> }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const target = e.key === 'Home' ? 0 : e.key === 'End' ? CAMPAIGNS.length - 1 : d ? (i + d + CAMPAIGNS.length) % CAMPAIGNS.length : -1;
    if (target < 0) return;
    e.preventDefault();
    const id = CAMPAIGNS[target].id;
    refs.current[id]?.focus();
    onSelect(id);
  };
  return (
    <div role="tablist" aria-label="Campanhas do caderno" className="relative z-10 flex min-w-0 gap-1 pl-2 sm:pl-4">
      {CAMPAIGNS.map((c, i) => {
        const active = c.id === current;
        const k = counts[c.id];
        return (
          <button
            key={c.id}
            ref={(el) => {
              refs.current[c.id] = el;
            }}
            id={`caderno-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls="caderno-pagina"
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(c.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              '-mb-px flex min-h-11 min-w-0 flex-col items-start rounded-t-md border px-3 py-1.5 text-left transition-colors duration-150 sm:px-4',
              active ? 'border-border border-b-surface bg-surface text-fg' : 'border-transparent bg-surface-2 text-muted hover:text-fg',
            )}
          >
            <span className="font-display text-[0.9375rem] font-semibold leading-tight" style={{ fontStretch: '87.5%' }}>
              <span className="hidden sm:inline">{c.label}</span>
              <span className="sm:hidden">{c.short}</span>
            </span>
            <span className="text-xs leading-tight">
              {c.stateLabel}
              <span className="hidden sm:inline">
                {' · '}
                <span className="font-mono tnum">
                  {k.earned}/{k.total}
                </span>{' '}
                {k.total === 1 ? 'selo' : 'selos'}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ página dupla com virar de página */

/**
 * Virar de página: a página nova revela-se a partir da aresta (recorte com
 * clip-path) enquanto a anterior fica por baixo; uma aresta de folha acompanha
 * o recorte. Abaixo de 900 px ou com movimento reduzido, troca com um
 * esvanecimento curto.
 */
export function Spread({ campaign, dir, render }: { campaign: CampaignId; dir: number; render: (id: CampaignId) => ReactNode }) {
  const rich = useRichMotion();
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(campaign);
  const [prev, setPrev] = useState<CampaignId | null>(null);
  if (campaign !== shown) {
    // estado derivado: a página que estava passa a ser a de baixo
    setPrev(rich ? shown : null);
    setShown(campaign);
  }
  const progress = useMotionValue(1);
  useEffect(() => {
    if (!prev) return;
    progress.set(0);
    const ctl = animate(progress, 1, { duration: DUR.focal + 0.1, ease: EASE_OUT, onComplete: () => setPrev(null) });
    return () => ctl.stop();
  }, [prev, shown, progress]);
  const clip = useTransform(progress, (v) => (dir >= 0 ? `inset(0% 0% 0% ${((1 - v) * 100).toFixed(2)}%)` : `inset(0% ${((1 - v) * 100).toFixed(2)}% 0% 0%)`));
  const edgeX = useTransform(progress, (v) => `${(dir >= 0 ? 1 - v : v) * 100}%`);
  const edgeOpacity = useTransform(progress, [0, 0.9, 1], [1, 1, 0]);
  const idx = CAMPAIGNS.findIndex((c) => c.id === shown);
  const frame = 'rounded-md border border-border bg-surface';

  return (
    <div id="caderno-pagina" role="tabpanel" aria-labelledby={`caderno-tab-${idx}`} className={cn('relative', prev && 'overflow-hidden rounded-md')}>
      {prev && (
        <div className={cn('absolute inset-x-0 top-0 z-[1]', frame)} aria-hidden inert>
          {render(prev)}
        </div>
      )}
      {rich ? (
        <motion.div className={cn('relative z-[2]', frame)} style={prev ? { clipPath: clip } : undefined}>
          {render(shown)}
        </motion.div>
      ) : (
        <motion.div
          key={shown}
          className={cn('relative z-[2]', frame)}
          initial={dir === 0 ? false : { opacity: 0, x: reduce ? 0 : dir * 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.24, ease: EASE_OUT }}
        >
          {render(shown)}
        </motion.div>
      )}
      {prev && (
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-[3]" style={{ x: edgeX, opacity: edgeOpacity }}>
          <span className="absolute inset-y-0 left-0 w-px bg-[color-mix(in_oklab,var(--fg)_30%,var(--border))] shadow-pop" />
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ marca de página completa */

function PageComplete({ earned, total }: { earned: number; total: number }) {
  return (
    <div className="shrink-0 rotate-[-3deg] border-[3px] border-double border-accent px-2.5 py-1 text-center text-accent" aria-label={`Página completa: ${earned} de ${total} selos`}>
      <span className="block font-display text-sm font-bold uppercase leading-tight tracking-[0.06em]" style={{ fontStretch: '87.5%' }}>
        Página completa
      </span>
      <span className="block font-mono text-[11px] leading-tight tnum">
        {earned} de {total} selos
      </span>
    </div>
  );
}

/* ------------------------------------------------------------ página dos selos */

function sealTilt(id: string) {
  return ((hashString(id) % 900) / 100 - 4.5).toFixed(1);
}

export function SealCaption({ s, c, questsDone }: { s: SealView; c: CampaignDef; questsDone: number }) {
  const total = s.def.questIds.length;
  let line: ReactNode;
  if (s.earned) line = <span className="text-seal-ink">{`Por ${s.earned.by === 'compromisso' ? 'compromisso' : 'diligência'} · ${fmtDate(s.earned.at)}`}</span>;
  else if (c.state === 'concluida') line = 'Campanha encerrada';
  else if (s.def.earnable === 'compromisso') line = 'Regista participação num lote';
  else
    line = (
      <>
        {s.def.earnable === 'ambos' ? 'Compromisso ou missões' : 'Missões de diligência'} ·{' '}
        <span className="font-mono tnum">
          {questsDone}/{total}
        </span>
      </>
    );
  return (
    <span className="block">
      <span className="block text-sm font-medium leading-tight text-fg">{s.producer.nome}</span>
      <span className="mt-0.5 block text-xs text-muted">{s.region.nome}</span>
      <span className="mt-1 block text-xs text-muted">{line}</span>
    </span>
  );
}

export function SealsPage({
  c,
  seals,
  onOpen,
  fresh,
  onStamped,
  questsDoneFor,
  children,
}: {
  c: CampaignDef;
  children?: ReactNode;
  seals: SealView[];
  onOpen: (s: SealView) => void;
  fresh: Set<string>;
  onStamped: (id: string) => void;
  questsDoneFor: (s: SealView) => number;
}) {
  const earned = seals.filter((s) => s.earned).length;
  const complete = seals.length > 0 && earned === seals.length;
  return (
    <section aria-labelledby={`selos-${c.short}`} className="flex min-w-0 flex-col p-5 sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-[12rem] flex-1">
          <h2 id={`selos-${c.short}`} className="text-[1.375rem] leading-tight">
            Selos de origem
          </h2>
          <p className="mt-1 text-sm text-muted">
            <span className="font-mono text-fg tnum">{earned}</span> de <span className="font-mono text-fg tnum">{seals.length}</span> {seals.length === 1 ? 'selo' : 'selos'} · {c.label}
          </p>
        </div>
        {complete && <PageComplete earned={earned} total={seals.length} />}
      </header>
      <ul className="mt-6 grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3">
        {seals.map((s) => (
          <li key={s.def.id} className="min-w-0">
            <SealButton s={s} c={c} onOpen={onOpen} fresh={fresh.has(s.def.id)} onStamped={onStamped} questsDone={questsDoneFor(s)} />
          </li>
        ))}
      </ul>
      {children}
      <p className="max-w-[60ch] mt-auto pt-8 text-sm text-muted">
        {c.state === 'concluida'
          ? 'Campanha encerrada a 30/09/2026. Os selos desta página já não se podem ganhar.'
          : c.state === 'fase-2'
            ? 'A Plantação abre em 2027. Este selo ganha-se só por diligência, com as missões da Academia sobre origens de café.'
            : 'Os selos registam origens que estudaste ou acompanhas. Não dão pontos, níveis nem vantagens financeiras: não comprometas capital para completar o caderno.'}
      </p>
      <p className="mt-3 font-mono text-xs text-muted tnum" aria-hidden>
        p. {c.folio[0]}
      </p>
    </section>
  );
}

function SealButton({ s, c, onOpen, fresh, onStamped, questsDone }: { s: SealView; c: CampaignDef; onOpen: (s: SealView) => void; fresh: boolean; onStamped: (id: string) => void; questsDone: number }) {
  const [stamped, setStamped] = useState(!fresh);
  useEffect(() => {
    if (!fresh) return;
    const t = window.setTimeout(() => setStamped(true), 450);
    return () => window.clearTimeout(t);
  }, [fresh]);
  const state = s.earned ? `ganho por ${s.earned.by === 'compromisso' ? 'compromisso' : 'diligência'} a ${fmtDate(s.earned.at)}` : 'por ganhar';
  return (
    <button
      type="button"
      onClick={() => onOpen(s)}
      aria-label={`${s.producer.nome}, ${s.region.nome}, ${s.def.campanha}: ${state}. Abrir o selo.`}
      aria-haspopup="dialog"
      className="group flex w-full min-w-0 flex-col items-center gap-2 rounded-md px-1.5 py-3 text-center transition-colors duration-150 hover:bg-surface-2"
    >
      <span className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5" style={s.earned && !fresh ? { transform: `rotate(${sealTilt(s.def.id)}deg)` } : undefined}>
        {fresh ? (
          <WaxSealStamp seal={s.def} producer={s.producer} region={s.region} stamped={stamped} onStamped={() => onStamped(s.def.id)} size={96} earnedBy={s.earned?.by} earnedAt={s.earned?.at} />
        ) : (
          <OriginSeal seal={s.def} producer={s.producer} region={s.region} state={s.earned ? 'earned' : 'locked'} size={96} earnedBy={s.earned?.by} earnedAt={s.earned?.at} />
        )}
      </span>
      <SealCaption s={s} c={c} questsDone={questsDone} />
    </button>
  );
}

/* ------------------------------------------------------------ marcos de conhecimento */

export function MilestonesBlock({ c, milestones }: { c: CampaignDef; milestones: KMilestone[] }) {
  const game = useGame();
  const [all, setAll] = useState(false);
  const cafeQuests = QUESTS_BY_WORLD('cafe');
  const list = all ? milestones : milestones.slice(0, 6);
  return (
    <div className="mt-8 min-w-0 border-t border-border pt-6">
        <h3 className="text-[1.0625rem]">{c.state === 'fase-2' ? 'Preparação para a Fase 2' : 'Marcos de conhecimento'}</h3>
        {c.state === 'fase-2' ? (
          <>
            <p className="mt-1 text-sm text-muted">O café ainda não é investível. O que se aprende agora conta para o nível e acende as origens no mapa.</p>
            <QuestList quests={cafeQuests} isDone={game.isQuestDone} completedAt={game.questCompletedAt} compact className="mt-2" />
          </>
        ) : milestones.length === 0 ? (
          <p className="mt-2 text-[0.9375rem] text-muted">
            {c.state === 'em-curso' ? (
              <>
                Ainda sem marcos nesta campanha.{' '}
                {game.nextLevel ? (
                  <>
                    O próximo é {game.nextLevel.nome}: faltam <span className="font-mono text-fg tnum">{num(game.pointsToNext)}</span> pontos de conhecimento.{' '}
                  </>
                ) : null}
                <TextLink to="/academia">Ver a Academia</TextLink>
              </>
            ) : (
              'Sem marcos de conhecimento nesta campanha.'
            )}
          </p>
        ) : (
          <ol className="mt-3 flex flex-col gap-2.5">
            {list.map((m) => {
              const Icon = m.kind === 'nivel' ? null : KIND_ICON[m.kind];
              return (
                <li key={m.id} className="flex min-w-0 items-start gap-3">
                  <span aria-hidden className={cn('mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full', m.kind === 'nivel' ? 'bg-accent text-accent-fg' : 'bg-accent-soft text-accent')}>
                    {Icon ? <Icon className="size-3.5" strokeWidth={1.75} /> : <LevelGlyph level={m.level!} className="size-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-[0.9375rem] leading-snug', m.kind === 'nivel' ? 'font-semibold text-fg' : 'text-fg')}>{m.title}</p>
                    <p className="text-xs text-muted">
                      <time dateTime={m.at} className="font-mono tnum">
                        {fmtDate(m.at)}
                      </time>
                      {m.points ? (
                        <>
                          {' · '}
                          <span className="font-mono tnum">+{m.points} pts</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      {c.state !== 'fase-2' && milestones.length > 6 && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAll((v) => !v)} aria-expanded={all}>
          {all ? 'Mostrar só os 6 mais recentes' : `Mostrar os ${milestones.length} marcos`}
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ página das notas */

const KIND_ICON = {
  modulo: BookOpen,
  missao: CircleCheck,
  minijogo: Puzzle,
  simulador: CalendarRange,
} as const;

function noteDate(at: string, nowD: Date) {
  const diff = nowD.getTime() - new Date(at).getTime();
  if (diff >= 0 && diff < 86_400_000 && at.includes('T')) return relative(at, nowD);
  return `${dateShort(at)} ${lisbonParts(at).year}`;
}

export function NotesPage({ c, notes, emptyNotes }: { c: CampaignDef; notes: Note[]; emptyNotes: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const nowD = useNow(30_000);
  const shown = expanded ? notes : notes.slice(0, 5);
  return (
    <section aria-labelledby={`notas-${c.short}`} className="flex min-w-0 flex-col p-5 sm:p-7">
      <h2 id={`notas-${c.short}`} className="text-[1.375rem] leading-tight">
        Notas de campanha
      </h2>
      <p className="mt-1 text-sm text-muted">Do Diário de campanha, só dos lotes e produtores que acompanhas.</p>
      <CampaignStrip c={c} notes={notes} className="mt-6" />

      {notes.length === 0 ? (
        <div className="measure mt-5 text-[0.9375rem] text-muted">{emptyNotes}</div>
      ) : (
        <>
          <ol className="mt-4 divide-y divide-border border-t border-border" aria-label={`Notas da ${c.label}`}>
            <AnimatePresence initial={false}>
              {shown.map((n) => (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  className="grid min-w-0 grid-cols-[5.75rem_minmax(0,1fr)] gap-x-3 py-2.5"
                  data-world={n.world}
                >
                  <time dateTime={n.at} className="pt-0.5 font-mono text-xs text-muted tnum">
                    {noteDate(n.at, nowD)}
                  </time>
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] leading-snug text-fg">{n.title}</p>
                    {n.detail && <p className="mt-0.5 text-sm text-muted">{n.detail}</p>}
                    {n.lotId && (
                      <Link to={`/lote/${n.lotId}`} className="mt-0.5 inline-flex min-h-8 items-center gap-1 font-mono text-xs text-accent hover:underline" aria-label={`Abrir o lote ${n.lotId}`}>
                        {n.lotId}
                        <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
                      </Link>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
          {notes.length > 5 && (
            <div className="mt-1">
              <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
                {expanded ? 'Mostrar só as 5 mais recentes' : `Mostrar as ${notes.length} notas`}
              </Button>
            </div>
          )}
        </>
      )}

      <p className="mt-auto pt-6 text-right font-mono text-xs text-muted tnum" aria-hidden>
        p. {c.folio[1]}
      </p>
    </section>
  );
}
