import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, ChevronDown, Clock, X } from 'lucide-react';
import { Badge, Button, CommodityGlyph } from '../../components/ui';
import { MODULES } from '../../data';
import type { KnowledgeModule, WorldId } from '../../data/types';
import { useGame, useToast } from '../../state';
import { cn } from '../../lib/cn';

/* =====================================================================
   Percurso do investidor informado: módulos curtos, cada um com uma
   verificação de 2 perguntas. Abrem no próprio percurso.
   ===================================================================== */

const GROUPS: { id: WorldId | 'geral'; title: string; note?: string }[] = [
  { id: 'geral', title: 'Fundamentos' },
  { id: 'azeite', title: 'O Olival' },
  { id: 'agua', title: 'A Nascente' },
  { id: 'cafe', title: 'A Plantação', note: 'Fase 2 · abre em 2027. Os módulos já contam pontos.' },
];

export function ModulesPath({ openId, onToggle }: { openId: string | null; onToggle: (id: string | null) => void }) {
  const game = useGame();
  const done = MODULES.filter((m) => game.isModuleDone(m.id)).length;
  return (
    <div className="min-w-0">
      <p className="mb-5 text-sm text-muted">
        <span className="font-mono text-fg tnum">{done}</span> de <span className="font-mono tnum">{MODULES.length}</span> módulos concluídos. Cada um leva 5 a 8 minutos e termina com duas perguntas.
      </p>
      <div className="grid items-start gap-x-10 gap-y-8 xl:grid-cols-2">
        {COLUMNS.map((col) => (
          <div key={col.join('-')} className="flex min-w-0 flex-col gap-8">
            {col.map((gid) => {
              const g = GROUPS.find((x) => x.id === gid)!;
              const list = MODULES.filter((m) => m.world === g.id);
              return (
            <section key={g.id} aria-labelledby={`percurso-${g.id}`} className="min-w-0" data-world={g.id === 'geral' ? undefined : g.id}>
              <div className="flex items-center gap-2 border-b border-border pb-2">
                {g.id !== 'geral' && <CommodityGlyph world={g.id} className="size-[18px] text-world-ink" />}
                <h3 id={`percurso-${g.id}`} className="text-[1.0625rem]">
                  {g.title}
                </h3>
              </div>
              {g.note && <p className="mt-2 text-sm text-muted">{g.note}</p>}
              <ol className="divide-y divide-border">
                {list.map((m) => (
                  <ModuleRow key={m.id} module={m} open={openId === m.id} onToggle={() => onToggle(openId === m.id ? null : m.id)} />
                ))}
              </ol>
            </section>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Duas colunas equilibradas em ecrãs largos; uma só, pela mesma ordem, no telemóvel. */
const COLUMNS: (WorldId | 'geral')[][] = [
  ['geral', 'cafe'],
  ['azeite', 'agua'],
];

function ModuleRow({ module: m, open, onToggle }: { module: KnowledgeModule; open: boolean; onToggle: () => void }) {
  const game = useGame();
  const reduce = useReducedMotion();
  const done = game.isModuleDone(m.id);
  const panelId = `${m.id}-painel`;
  return (
    <li id={m.id} className="min-w-0 scroll-mt-20">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="group grid min-h-11 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 py-3.5 text-left"
      >
        <span
          aria-hidden
          className={cn('mt-0.5 inline-flex size-6 items-center justify-center rounded-full border-2', done ? 'border-accent bg-accent text-accent-fg' : 'border-[color-mix(in_oklab,var(--fg)_28%,var(--border))]')}
        >
          {done && <Check className="size-3.5" strokeWidth={3} />}
        </span>
        <span className="min-w-0">
          <span className="block font-medium leading-snug text-fg group-hover:underline group-hover:decoration-[color-mix(in_oklab,var(--accent)_45%,transparent)] group-hover:underline-offset-[0.2em]">{m.title}</span>
          <span className="mt-0.5 block text-sm text-muted">{m.summary}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden className="size-3.5" strokeWidth={1.75} />
              <span className="font-mono tnum">{m.minutes} min</span>
            </span>
            <span className="font-mono tnum text-fg">+{m.points} pts</span>
            {done && <span>concluído</span>}
          </span>
        </span>
        <ChevronDown aria-hidden className={cn('mt-1 size-5 text-muted transition-transform duration-200 ease-out', open && 'rotate-180')} strokeWidth={1.75} />
      </button>
      {open && (
        <motion.div
          id={panelId}
          className="pb-6 pl-9"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <ModuleBody module={m} done={done} onClose={onToggle} />
        </motion.div>
      )}
    </li>
  );
}

interface QState {
  tried: number[];
  solved: boolean;
}

function ModuleBody({ module: m, done, onClose }: { module: KnowledgeModule; done: boolean; onClose: () => void }) {
  const game = useGame();
  const { toast } = useToast();
  const [qs, setQs] = useState<Record<string, QState>>(() => (done ? Object.fromEntries(m.quiz.map((q) => [q.id, { tried: [], solved: true }])) : {}));
  const allSolved = m.quiz.every((q) => qs[q.id]?.solved);
  const firstTry = m.quiz.filter((q) => qs[q.id]?.solved && qs[q.id].tried.length === 0).length;

  const pick = (qid: string, i: number, correct: number) => {
    setQs((s) => {
      const cur = s[qid] ?? { tried: [], solved: false };
      if (cur.solved || cur.tried.includes(i)) return s;
      return { ...s, [qid]: i === correct ? { ...cur, solved: true } : { ...cur, tried: [...cur.tried, i] } };
    });
  };

  const complete = () => {
    if (done || !allSolved) return;
    game.completeModule(m.id, firstTry);
    toast({ tone: 'accent', title: `Módulo concluído: ${m.title}`, description: `+${m.points} pontos de conhecimento · ${firstTry} de ${m.quiz.length} certas à primeira.` });
  };

  return (
    <div className="grid gap-x-8 gap-y-6">
      <div className="measure min-w-0">
        {m.sections.map((s) => (
          <div key={s.heading} className="mt-5 first:mt-0">
            <h4 className="text-[1.0625rem]">{s.heading}</h4>
            {s.body.map((p, i) => (
              <p key={i} className="mt-2 text-[0.9875rem] leading-relaxed text-fg">
                {p}
              </p>
            ))}
          </div>
        ))}
      </div>
      <div className="min-w-0 border-t border-border pt-5">
        <h4 className="text-[1.0625rem]">Verificação</h4>
        <p className="mt-1 text-sm text-muted">{done ? 'Já concluíste este módulo. As respostas certas estão marcadas.' : 'Responde às duas perguntas. Se errares, relê o texto e tenta outra opção.'}</p>
        <div className="mt-4 flex flex-col gap-5">
          {m.quiz.map((q, qi) => {
            const st = qs[q.id] ?? { tried: [], solved: false };
            return (
              <fieldset key={q.id} className="min-w-0">
                <legend className="font-medium text-fg">
                  <span className="font-mono text-muted tnum">{qi + 1}.</span> {q.prompt}
                </legend>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {q.options.map((o, i) => {
                    const isRight = st.solved && i === q.correct;
                    const isWrong = st.tried.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={st.solved || isWrong}
                        onClick={() => pick(q.id, i, q.correct)}
                        aria-pressed={isRight || isWrong}
                        className={cn(
                          'flex min-h-11 items-start gap-2 rounded-sm border px-3 py-2 text-left text-[0.9375rem] transition-[background-color,border-color,color] duration-150',
                          isRight && 'border-[color-mix(in_oklab,var(--ok)_45%,var(--border))] bg-[color-mix(in_oklab,var(--ok)_12%,var(--surface))] text-fg',
                          isWrong && 'cursor-not-allowed border-[color-mix(in_oklab,var(--crit)_35%,var(--border))] bg-[color-mix(in_oklab,var(--crit)_7%,var(--surface))] text-muted line-through decoration-1',
                          !isRight && !isWrong && 'border-border bg-surface text-fg enabled:hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--border))] enabled:hover:bg-surface-2 disabled:text-muted',
                        )}
                      >
                        {isRight && <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-ok-ink" strokeWidth={2.25} />}
                        {isWrong && <X aria-hidden className="mt-0.5 size-4 shrink-0 text-crit-ink" strokeWidth={2.25} />}
                        <span>
                          {o}
                          {isRight && <span className="sr-only"> · certa</span>}
                          {isWrong && <span className="sr-only"> · errada</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div aria-live="polite">
                  {st.solved && <p className="mt-2 text-sm text-ok-ink">{q.explanation}</p>}
                  {!st.solved && st.tried.length > 0 && <p className="mt-2 text-sm text-crit-ink">Não é esta. Relê o texto e tenta outra opção.</p>}
                </div>
              </fieldset>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {done ? (
            <Badge tone="ok" dot>
              Módulo concluído
            </Badge>
          ) : (
            <Button onClick={complete} disabled={!allSolved}>
              Concluir módulo · +{m.points} pts
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          {!done && !allSolved && <p className="text-sm text-muted">Responde certo às duas perguntas para concluir.</p>}
        </div>
      </div>
    </div>
  );
}
