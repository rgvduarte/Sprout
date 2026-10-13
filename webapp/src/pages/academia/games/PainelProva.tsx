import { useMemo, useState, type DragEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, GripVertical, X } from 'lucide-react';
import { Button } from '../../../components/ui';
import { classifyOlive, OLIVE_ATTRIBUTES, OLIVE_CATEGORIES, OLIVE_SAMPLES } from '../../../data';
import type { OliveCategory, OliveSample, SensoryAttribute } from '../../../data/types';
import { createRng } from '../../../lib/prng';
import { cn } from '../../../lib/cn';
import { num } from '../../../lib/format';
import { OLIVE_EXPLAIN, OLIVE_PARAMS } from '../content';
import { PainelArt } from './art';
import { Choice, EASE, Pips, ResultPanel, shuffle, Verdict, useFinishGame, type FinishResult } from './kit';

/* =====================================================================
   Painel de prova (azeite). 1) Aprende os atributos e defeitos pelas
   descrições do método do COI. 2) Classifica seis amostras com o
   painel e a química, pelos limites do Reg. Delegado (UE) 2022/2104.
   ===================================================================== */

type Phase = 'aprender' | 'classificar' | 'resultado';

export function PainelProva() {
  const [round, setRound] = useState(0);
  return <PainelGame key={round} round={round} onReplay={() => setRound((r) => r + 1)} />;
}

function PainelGame({ round, onReplay }: { round: number; onReplay: () => void }) {
  const cards = useMemo(() => shuffle(OLIVE_ATTRIBUTES, createRng(`painel-atributos-${round}`)), [round]);
  const samples = useMemo(() => (round === 0 ? OLIVE_SAMPLES : shuffle(OLIVE_SAMPLES, createRng(`painel-amostras-${round}`))), [round]);
  const [phase, setPhase] = useState<Phase>(round === 0 ? 'aprender' : 'classificar');
  const [answers, setAnswers] = useState<Record<string, OliveCategory>>({});
  const [result, setResult] = useState<FinishResult | null>(null);
  const finish = useFinishGame('painel-prova');

  const end = () => {
    const score = samples.filter((s) => answers[s.id] === classifyOlive(s)).length;
    setResult(finish(score));
    setPhase('resultado');
  };

  return (
    <div className="min-w-0">
      <ol className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Fases do jogo">
        {(['aprender', 'classificar', 'resultado'] as Phase[]).map((p, i) => (
          <li key={p} aria-current={phase === p ? 'step' : undefined} className={cn('inline-flex items-center gap-2', phase === p ? 'font-medium text-fg' : 'text-muted')}>
            <span className={cn('inline-flex size-6 items-center justify-center rounded-full border font-mono text-xs tnum', phase === p ? 'border-world-ink bg-world-soft text-world-ink' : 'border-border')}>{i + 1}</span>
            {p === 'aprender' ? 'Atributos e defeitos' : p === 'classificar' ? 'Classifica 6 amostras' : 'Resultado'}
          </li>
        ))}
      </ol>
      {phase === 'aprender' && <LearnPhase cards={cards} onDone={() => setPhase('classificar')} />}
      {phase === 'classificar' && <ClassifyPhase samples={samples} answers={answers} onAnswer={(id, c) => setAnswers((a) => ({ ...a, [id]: c }))} onEnd={end} onBack={() => setPhase('aprender')} />}
      {phase === 'resultado' && result && (
        <ResultPanel result={result} title="Amostras bem classificadas" onReplay={onReplay}>
          <h4 className="mb-2 text-base">As seis amostras</h4>
          <ul className="divide-y divide-border border-y border-border">
            {samples.map((s) => {
              const right = classifyOlive(s);
              const ok = answers[s.id] === right;
              return (
                <li key={s.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 py-3">
                  <span aria-hidden className={cn('mt-0.5 inline-flex size-6 items-center justify-center rounded-full', ok ? 'bg-[color-mix(in_oklab,var(--ok)_16%,var(--surface))] text-ok-ink' : 'bg-[color-mix(in_oklab,var(--crit)_10%,var(--surface))] text-crit-ink')}>
                    {ok ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-fg">
                      {s.label} · {catLabel(right)}
                      {!ok && <span className="font-normal text-muted"> · respondeste {answers[s.id] ? catLabel(answers[s.id]) : 'nada'}</span>}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{OLIVE_EXPLAIN[s.id]}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </ResultPanel>
      )}
    </div>
  );
}

const catLabel = (c: OliveCategory) => OLIVE_CATEGORIES.find((x) => x.id === c)!.label;

/* ------------------------------------------------------------ fase 1 */

function LearnPhase({ cards, onDone }: { cards: SensoryAttribute[]; onDone: () => void }) {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [matched, setMatched] = useState<Record<string, boolean>>({});
  const [firstTry, setFirstTry] = useState(0);
  const [over, setOver] = useState(false);
  const card = cards[idx];
  const solved = Boolean(matched[card.id]);
  const last = idx === cards.length - 1;

  const pick = (attrId: string) => {
    if (solved || matched[attrId] || wrong.includes(attrId)) return;
    if (attrId === card.id) {
      setMatched((m) => ({ ...m, [attrId]: true }));
      if (wrong.length === 0) setFirstTry((n) => n + 1);
    } else setWrong((w) => [...w, attrId]);
  };
  const next = () => {
    setWrong([]);
    if (last) onDone();
    else setIdx((i) => i + 1);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const id = e.dataTransfer.getData('text/plain');
    if (id) pick(id);
  };

  const positives = OLIVE_ATTRIBUTES.filter((a) => a.tipo === 'positivo');
  const defects = OLIVE_ATTRIBUTES.filter((a) => a.tipo === 'defeito');

  return (
    <div className="grid min-w-0 gap-x-6 gap-y-5 [grid-template-areas:'card'_'chips'_'actions'] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:[grid-template-areas:'card_chips'_'actions_chips']">
      <div className="min-w-0 [grid-area:card]">
        <p className="text-sm text-muted">
          Descrição <span className="font-mono tnum text-fg">{idx + 1}</span> de <span className="font-mono tnum">{cards.length}</span> · à primeira: <span className="font-mono tnum text-fg">{firstTry}</span>
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!solved) setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          className={cn(
            'mt-2 min-h-[176px] rounded-md border bg-surface p-5 transition-colors duration-150',
            over ? 'border-dashed border-world-ink bg-world-soft' : solved ? 'border-world-line' : 'border-border',
          )}
        >
          <p className="text-sm text-muted">O provador escreve:</p>
          <motion.p key={card.id} className="mt-1 font-display text-[1.3125rem] font-semibold leading-snug text-fg" initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
            «{card.descricao.replace(/\.$/, '')}»
          </motion.p>
          <div aria-live="polite">
            {solved ? (
              <motion.div
                className="mt-4 border-t border-world-line pt-3"
                initial={reduce ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
                animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <p className="font-semibold text-world-ink">
                  {card.nome} · {card.tipo === 'positivo' ? 'atributo positivo' : 'defeito'}
                </p>
                {card.causa && <p className="mt-1 text-[0.9375rem] text-fg">Causa: {card.causa}</p>}
                {card.tipo === 'positivo' && <p className="mt-1 text-[0.9375rem] text-fg">Conta a favor: um virgem extra precisa de frutado acima de 0 e de nenhum defeito.</p>}
              </motion.div>
            ) : wrong.length > 0 ? (
              <p className="mt-4 text-sm text-crit-ink">Não é {OLIVE_ATTRIBUTES.find((a) => a.id === wrong[wrong.length - 1])?.nome.toLowerCase()}. Volta a ler e escolhe outro.</p>
            ) : (
              <p className="mt-4 text-sm text-muted">Escolhe o termo certo entre os atributos e os defeitos. Com rato, também o podes arrastar para aqui.</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-wrap items-start gap-3 [grid-area:actions]">
        <Button onClick={next} disabled={!solved} iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
          {last ? 'Passar às amostras' : 'Descrição seguinte'}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Já os conheço: ir às amostras
        </Button>
      </div>
      <div className="min-w-0 [grid-area:chips]">
        {[
          { title: 'Atributos positivos', list: positives },
          { title: 'Defeitos', list: defects },
        ].map((g) => (
          <fieldset key={g.title} className="mt-4 first:mt-0">
            <legend className="mb-2 text-sm font-medium text-fg">{g.title}</legend>
            <div className="flex flex-wrap gap-2">
              {g.list.map((a) => {
                const isMatched = Boolean(matched[a.id]);
                const isWrong = wrong.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    draggable={!isMatched && !solved}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', a.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onClick={() => pick(a.id)}
                    disabled={isMatched || isWrong || solved}
                    className={cn(
                      'inline-flex min-h-11 items-center gap-1.5 rounded-sm border px-3 text-[0.9375rem] transition-[background-color,border-color,color] duration-150',
                      isMatched && 'border-transparent bg-world-soft text-world-ink',
                      isWrong && 'border-[color-mix(in_oklab,var(--crit)_40%,var(--border))] text-muted line-through decoration-1',
                      !isMatched && !isWrong && 'border-border bg-surface text-fg enabled:cursor-grab enabled:hover:border-world-line enabled:hover:bg-world-soft disabled:text-muted',
                    )}
                  >
                    {isMatched ? <Check aria-hidden className="size-4" strokeWidth={2.25} /> : isWrong ? <X aria-hidden className="size-4 text-crit-ink" strokeWidth={2.25} /> : <GripVertical aria-hidden className="hidden size-4 text-muted sm:block" strokeWidth={1.75} />}
                    {a.nome}
                    {isMatched && <span className="sr-only"> · já associado</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
        <p className="mt-5 text-sm text-muted">Os nove termos são os da folha de prova oficial (método do COI). Um painel tem 8 a 12 provadores; conta a mediana das notas.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ fase 2 */

function ClassifyPhase({ samples, answers, onAnswer, onEnd, onBack }: { samples: OliveSample[]; answers: Record<string, OliveCategory>; onAnswer: (id: string, c: OliveCategory) => void; onEnd: () => void; onBack: () => void }) {
  const [idx, setIdx] = useState(() => {
    const first = samples.findIndex((s) => !answers[s.id]);
    return first === -1 ? 0 : first;
  });
  const s = samples[idx];
  const picked = answers[s.id];
  const right = classifyOlive(s);
  const revealed = Boolean(picked);
  const last = idx === samples.length - 1;
  const attrs = [...s.atributos, ...s.defeitos].map((id) => OLIVE_ATTRIBUTES.find((a) => a.id === id)!).filter(Boolean);

  return (
    <div className="min-w-0">
      <Pips
        label="Amostras"
        className="mb-5"
        items={samples.map((x, i) => ({
          id: x.id,
          label: x.id,
          state: answers[x.id] ? (answers[x.id] === classifyOlive(x) ? 'right' : 'wrong') : i === idx ? 'current' : 'todo',
        }))}
      />
      <div className="grid min-w-0 gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="flex items-center gap-4 lg:block">
            <PainelArt letter={s.id} className="size-24 shrink-0 lg:size-36" />
            <div className="min-w-0 lg:mt-3">
              <p className="font-display text-xl font-semibold text-fg">{s.label}</p>
              <p className="text-sm text-muted">{s.origem}</p>
            </div>
          </div>
          <figure className="mt-4">
            <blockquote className="font-display text-[1.0625rem] font-semibold leading-snug text-fg">«{s.notas.replace(/\.$/, '')}»</blockquote>
            <figcaption className="mt-1 text-sm text-muted">Notas do chefe de painel</figcaption>
          </figure>
        </div>
        <div className="min-w-0">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[440px] border-collapse text-sm">
              <caption className="sr-only">Boletim da {s.label}: valores e limites legais por categoria</caption>
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th scope="col" className="py-2 pr-3 font-medium">Parâmetro</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Valor</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Virgem extra</th>
                  <th scope="col" className="py-2 font-medium">Virgem</th>
                </tr>
              </thead>
              <tbody>
                {OLIVE_PARAMS.map((p, i) => {
                  const v = s[p.id];
                  return (
                    <tr key={p.id} className="border-b border-border last:border-b-0">
                      <th scope="row" className="py-2 pr-3 text-left font-normal text-fg">
                        {p.label}
                        {p.unit && <span className="block text-xs text-muted">{p.unit}</span>}
                      </th>
                      <td className="py-2 pr-3 text-right font-mono text-fg tnum">{num(v, p.decimals)}</td>
                      <LimitCell text={p.ve.text} ok={p.ve.ok(v)} revealed={revealed} delay={i * 0.05} />
                      <LimitCell text={p.v.text} ok={p.v.ok(v)} revealed={revealed} delay={i * 0.05 + 0.02} />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-muted">Lampante: acidez acima de 2,0 % ou mediana do defeito acima de 3,5. Basta falhar um limite para descer de categoria.</p>

          <fieldset className="mt-5">
            <legend className="mb-2 font-medium text-fg">Em que categoria fica esta amostra?</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {OLIVE_CATEGORIES.map((c) => (
                <Choice
                  key={c.id}
                  state={!revealed ? 'idle' : c.id === picked ? (picked === right ? 'right' : 'wrong') : c.id === right ? 'missed' : 'dim'}
                  disabled={revealed}
                  onClick={() => onAnswer(s.id, c.id)}
                  className="font-medium"
                >
                  {c.label}
                </Choice>
              ))}
            </div>
          </fieldset>
          {revealed && (
            <div className="mt-4">
              <Verdict ok={picked === right} title={picked === right ? `Certo: ${catLabel(right)}.` : `É ${catLabel(right).toLowerCase()}, não ${catLabel(picked).toLowerCase()}.`}>
                <p>{OLIVE_EXPLAIN[s.id]}</p>
                {attrs.length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-1.5">
                    {attrs.map((a) => (
                      <span key={a.id} className={cn('inline-flex h-7 items-center rounded-xs border px-2 text-sm', a.tipo === 'defeito' ? 'border-[color-mix(in_oklab,var(--crit)_30%,var(--border))] text-crit-ink' : 'border-world-line text-world-ink')}>
                        {a.tipo === 'defeito' ? 'Defeito: ' : ''}
                        {a.nome}
                      </span>
                    ))}
                  </p>
                )}
              </Verdict>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => (last ? onEnd() : setIdx((i) => i + 1))} iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
                  {last ? 'Ver o resultado' : `Amostra seguinte · ${samples[idx + 1].id}`}
                </Button>
              </div>
            </div>
          )}
          {!revealed && (
            <Button variant="ghost" className="mt-3" onClick={onBack}>
              Rever atributos e defeitos
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function LimitCell({ text, ok, revealed, delay }: { text: string; ok: boolean; revealed: boolean; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <td className={cn('py-2 pr-3 transition-colors duration-300', revealed && !ok && 'bg-[color-mix(in_oklab,var(--crit)_9%,var(--surface))]')}>
      <span className="inline-flex items-center gap-1.5 font-mono tnum text-muted">
        {revealed && (
          <motion.span initial={reduce ? false : { opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25, delay: reduce ? 0 : delay, ease: EASE }} className="inline-flex">
            {ok ? <Check aria-hidden className="size-3.5 text-ok-ink" strokeWidth={2.5} /> : <X aria-hidden className="size-3.5 text-crit-ink" strokeWidth={2.5} />}
          </motion.span>
        )}
        <span className={cn(revealed && (ok ? 'text-fg' : 'text-crit-ink'))}>{text}</span>
        {revealed && <span className="sr-only">{ok ? ' cumpre' : ' falha'}</span>}
      </span>
    </td>
  );
}
