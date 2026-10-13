import { useMemo, useState } from 'react';
import { motion, Reorder, useDragControls, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowRight, ArrowUp, Check, GripVertical, X } from 'lucide-react';
import { Button, IconButton } from '../../../components/ui';
import { COFFEE_PROCESSES, COFFEE_SAMPLES, COFFEE_STEPS, isSpecialty, scaLabel } from '../../../data';
import type { CoffeeProcess, CoffeeSample, CoffeeStep } from '../../../data/types';
import { createRng } from '../../../lib/prng';
import { cn } from '../../../lib/cn';
import { num } from '../../../lib/format';
import { COFFEE_EFFECTS, SCA_QUESTION, SCA_SHEET, SCA_SHEET_DEFECTS } from '../content';
import { CoffeeStepGlyph } from './art';
import { Choice, EASE, ResultPanel, shuffle, Verdict, useFinishGame, type FinishResult } from './kit';

/* =====================================================================
   Da cereja à chávena (café, Fase 2). Seis respostas em três rondas:
   1) ordenar as etapas; 2) ligar cada processo ao seu efeito na chávena
   e no custo (3); 3) ler uma folha de prova SCA e a classificação do
   grão verde (2). Café de especialidade: 80+ pontos e defeitos dentro
   das regras.
   ===================================================================== */

type Round = 'ordem' | 'processos' | 'sca';

const ROUNDS: { id: Round; label: string }[] = [
  { id: 'ordem', label: 'Ordena as etapas' },
  { id: 'processos', label: 'Processos' },
  { id: 'sca', label: 'Folha SCA' },
];

export function CerejaChavena() {
  const [round, setRound] = useState(0);
  return <CafeGame key={round} round={round} onReplay={() => setRound((r) => r + 1)} />;
}

function CafeGame({ round, onReplay }: { round: number; onReplay: () => void }) {
  const [stage, setStage] = useState<Round>('ordem');
  const [scores, setScores] = useState<{ ordem?: number; processos?: number; sca?: number }>({});
  const [result, setResult] = useState<FinishResult | null>(null);
  const finish = useFinishGame('cereja-chavena');
  const soFar = (scores.ordem ?? 0) + (scores.processos ?? 0) + (scores.sca ?? 0);

  const end = (sca: number) => {
    setScores((s) => ({ ...s, sca }));
    setResult(finish((scores.ordem ?? 0) + (scores.processos ?? 0) + sca));
  };

  if (result) {
    return (
      <ResultPanel result={result} title="Respostas certas" onReplay={onReplay}>
        <dl className="grid max-w-[520px] grid-cols-[minmax(0,1fr)_auto] gap-x-6 border-y border-border text-sm">
          {[
            ['Ordem das etapas', scores.ordem ?? 0, 1],
            ['Processos e efeitos', scores.processos ?? 0, 3],
            ['Folha SCA e grão verde', scores.sca ?? 0, 2],
          ].map(([label, v, max]) => (
            <div key={label as string} className="col-span-2 grid grid-cols-subgrid border-b border-border py-2 last:border-b-0">
              <dt className="text-fg">{label}</dt>
              <dd className="font-mono text-fg tnum">
                {v} / {max}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 max-w-[68ch] text-sm text-muted">O café é Fase 2 e só abre depois de um go/no-go próprio. Até lá podes explorar as origens e jogar; não há lotes de café para financiar.</p>
      </ResultPanel>
    );
  }

  return (
    <div className="min-w-0">
      <ol className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" aria-label="Rondas">
        {ROUNDS.map((r, i) => {
          const doneR = scores[r.id] !== undefined;
          return (
            <li key={r.id} aria-current={stage === r.id ? 'step' : undefined} className={cn('inline-flex items-center gap-2', stage === r.id ? 'font-medium text-fg' : 'text-muted')}>
              <span className={cn('inline-flex size-6 items-center justify-center rounded-full border font-mono text-xs tnum', stage === r.id ? 'border-world-ink bg-world-soft text-world-ink' : doneR ? 'border-transparent bg-surface-2 text-fg' : 'border-border')}>
                {doneR ? <Check aria-hidden className="size-3.5" strokeWidth={2.5} /> : i + 1}
              </span>
              {r.label}
            </li>
          );
        })}
        <li className="ml-auto font-mono text-muted tnum">{soFar} certas até agora</li>
      </ol>
      {stage === 'ordem' && (
        <OrderRound
          seed={round}
          onDone={(s) => {
            setScores((x) => ({ ...x, ordem: s }));
            setStage('processos');
          }}
        />
      )}
      {stage === 'processos' && (
        <ProcessRound
          seed={round}
          onDone={(s) => {
            setScores((x) => ({ ...x, processos: s }));
            setStage('sca');
          }}
        />
      )}
      {stage === 'sca' && <ScaRound onDone={end} />}
    </div>
  );
}

/* ------------------------------------------------------------ ronda 1 */

function OrderRound({ seed, onDone }: { seed: number; onDone: (score: number) => void }) {
  const initial = useMemo(() => {
    const s = shuffle(COFFEE_STEPS, createRng(`cafe-ordem-${seed}`));
    // nunca começar já ordenado
    return s.every((x, i) => x.order === i + 1) ? [...s.slice(1), s[0]] : s;
  }, [seed]);
  const [items, setItems] = useState<CoffeeStep[]>(initial);
  const [checked, setChecked] = useState<null | boolean>(null);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };
  const check = () => setChecked(items.every((x, i) => x.order === i + 1));
  const locked = checked !== null;
  const sorted = items.every((x, i) => x.order === i + 1);

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <p className="mb-3 font-medium text-fg">Põe as seis etapas pela ordem em que acontecem, da árvore à prova.</p>
        <Reorder.Group axis="y" values={items} onReorder={locked ? () => undefined : setItems} className="flex flex-col gap-2" as="ol">
          {items.map((step, i) => (
            <StepItem key={step.id} step={step} index={i} total={items.length} locked={locked} onMove={move} />
          ))}
        </Reorder.Group>
      </div>
      <div className="min-w-0">
        {!locked ? (
          <>
            <p className="text-sm text-muted">Arrasta pela pega ou usa as setas. Quando estiveres seguro, verifica: conta uma resposta, só à primeira.</p>
            <Button className="mt-4" onClick={check}>
              Verificar a ordem
            </Button>
          </>
        ) : (
          <>
            <Verdict ok={Boolean(checked)} title={checked ? 'Ordem certa.' : 'A ordem não está certa.'}>
              {checked ? 'Cada etapa decide a seguinte: a secagem até 10–12 % de humidade é o que deixa o grão viajar meses numa saca sem ganhar bolor.' : 'Os números à esquerda mostram a posição certa de cada etapa. Vê a explicação de cada uma.'}
            </Verdict>
            <div className="mt-4 flex flex-wrap gap-3">
              {!sorted && (
                <Button variant="secondary" onClick={() => setItems([...items].sort((a, b) => a.order - b.order))}>
                  Pôr na ordem certa
                </Button>
              )}
              <Button onClick={() => onDone(checked ? 1 : 0)} iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
                Ronda seguinte: processos
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StepItem({ step, index, total, locked, onMove }: { step: CoffeeStep; index: number; total: number; locked: boolean; onMove: (i: number, d: -1 | 1) => void }) {
  const controls = useDragControls();
  const right = step.order === index + 1;
  return (
    <Reorder.Item
      value={step}
      dragListener={false}
      dragControls={controls}
      as="li"
      className={cn(
        'relative flex min-w-0 items-start gap-2 rounded-sm border bg-surface py-2 pl-1 pr-2',
        !locked && 'border-border',
        locked && right && 'border-[color-mix(in_oklab,var(--ok)_45%,var(--border))]',
        locked && !right && 'border-[color-mix(in_oklab,var(--crit)_35%,var(--border))]',
      )}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        disabled={locked}
        onPointerDown={(e) => !locked && controls.start(e)}
        className={cn('flex h-11 w-7 shrink-0 touch-none items-center justify-center rounded-xs text-muted', !locked && 'cursor-grab hover:bg-surface-2 active:cursor-grabbing')}
      >
        <GripVertical className="size-4" strokeWidth={1.75} />
      </button>
      <span className={cn('mt-2.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-xs tnum', !locked ? 'bg-surface-2 text-muted' : right ? 'bg-[color-mix(in_oklab,var(--ok)_16%,var(--surface))] text-ok-ink' : 'bg-[color-mix(in_oklab,var(--crit)_10%,var(--surface))] text-crit-ink')}>
        {locked ? step.order : index + 1}
      </span>
      <CoffeeStepGlyph step={step.id} className="mt-2.5 text-cafe-ink" />
      <div className="min-w-0 flex-1 py-2">
        <p className="font-medium leading-snug text-fg">
          {step.nome}
          {locked && <span className="sr-only">{right ? ' · posição certa' : ` · devia ser a etapa ${step.order}`}</span>}
        </p>
        {locked && <p className="mt-0.5 text-sm text-muted">{step.descricao}</p>}
      </div>
      {!locked && (
        <span className="flex shrink-0 items-center">
          <IconButton size="sm" label={`Subir «${step.nome}»`} icon={<ArrowUp className="size-4" strokeWidth={1.75} />} onClick={() => onMove(index, -1)} disabled={index === 0} />
          <IconButton size="sm" label={`Descer «${step.nome}»`} icon={<ArrowDown className="size-4" strokeWidth={1.75} />} onClick={() => onMove(index, 1)} disabled={index === total - 1} />
        </span>
      )}
    </Reorder.Item>
  );
}

/* ------------------------------------------------------------ ronda 2 */

function ProcessRound({ seed, onDone }: { seed: number; onDone: (score: number) => void }) {
  const effects = useMemo(() => {
    const s = shuffle(COFFEE_EFFECTS, createRng(`cafe-proc-${seed}`));
    // a ordem dos cartões nunca coincide com a dos botões (lavado, natural, honey)
    return s.every((e, i) => e.process === COFFEE_PROCESSES[i].id) ? [s[1], s[2], s[0]] : s;
  }, [seed]);
  const [picks, setPicks] = useState<Record<string, CoffeeProcess['id']>>({});
  const [checked, setChecked] = useState(false);
  const all = effects.every((e) => picks[e.id]);
  const score = effects.filter((e) => picks[e.id] === e.process).length;

  return (
    <div className="min-w-0">
      <p className="mb-4 font-medium text-fg">Três cafés, três processos. Que processo deu cada resultado?</p>
      <ol className="grid gap-4 lg:grid-cols-3">
        {effects.map((e, i) => {
          const proc = COFFEE_PROCESSES.find((p) => p.id === e.process)!;
          const ok = picks[e.id] === e.process;
          return (
            <li key={e.id} className={cn('flex min-w-0 flex-col rounded-md border bg-surface p-4', !checked ? 'border-border' : ok ? 'border-[color-mix(in_oklab,var(--ok)_45%,var(--border))]' : 'border-[color-mix(in_oklab,var(--crit)_35%,var(--border))]')}>
              <p className="font-mono text-sm text-muted tnum">Café {i + 1}</p>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-fg">{e.text}</p>
              <div role="radiogroup" aria-label={`Processo do café ${i + 1}`} className="mt-auto flex flex-wrap gap-1.5 pt-4">
                {COFFEE_PROCESSES.map((p) => {
                  const sel = picks[e.id] === p.id;
                  const state = !checked ? (sel ? 'sel' : 'idle') : sel ? (ok ? 'right' : 'wrong') : p.id === e.process ? 'missed' : 'dim';
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      disabled={checked}
                      onClick={() => setPicks((x) => ({ ...x, [e.id]: p.id }))}
                      className={cn(
                        'inline-flex min-h-11 items-center gap-1.5 rounded-sm border px-3 text-[0.9375rem] font-medium transition-colors duration-150',
                        state === 'idle' && 'border-border text-fg hover:border-world-line hover:bg-world-soft',
                        state === 'sel' && 'border-world-ink bg-world-soft text-world-ink',
                        state === 'right' && 'border-transparent bg-[color-mix(in_oklab,var(--ok)_14%,var(--surface))] text-ok-ink',
                        state === 'wrong' && 'border-[color-mix(in_oklab,var(--crit)_40%,var(--border))] text-crit-ink line-through decoration-1',
                        state === 'missed' && 'border-dashed border-[color-mix(in_oklab,var(--ok)_50%,var(--border))] text-ok-ink',
                        state === 'dim' && 'border-border text-muted',
                      )}
                    >
                      {(state === 'right' || state === 'missed') && <Check aria-hidden className="size-4" strokeWidth={2.25} />}
                      {state === 'wrong' && <X aria-hidden className="size-4" strokeWidth={2.25} />}
                      {p.id === 'honey' ? 'Honey' : p.nome}
                    </button>
                  );
                })}
              </div>
              {checked && (
                <div className="mt-3 border-t border-border pt-3 text-sm">
                  <p className="font-medium text-fg">{proc.nome}</p>
                  <p className="mt-0.5 text-muted">{proc.descricao}</p>
                  <p className="mt-1.5 text-muted">{proc.passos.join(' → ')}</p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!checked ? (
          <>
            <Button onClick={() => setChecked(true)} disabled={!all}>
              Verificar
            </Button>
            {!all && <p className="text-sm text-muted">Escolhe um processo para cada café.</p>}
          </>
        ) : (
          <>
            <p className="text-[0.9375rem] text-fg" role="status">
              <span className="font-mono tnum">{score}</span> de 3 certos.
            </p>
            <Button onClick={() => onDone(score)} iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
              Ronda seguinte: folha SCA
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ ronda 3 */

function ScaRound({ onDone }: { onDone: (score: number) => void }) {
  const reduce = useReducedMotion();
  const [sheetPick, setSheetPick] = useState<number | null>(null);
  const [marked, setMarked] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState(false);
  const total = SCA_SHEET.reduce((s, r) => s + r.score, 0) - SCA_SHEET_DEFECTS;
  const sheetOk = sheetPick === SCA_QUESTION.correct;
  const gradeOk = COFFEE_SAMPLES.every((c) => Boolean(marked[c.id]) === isSpecialty(c));

  return (
    <div className="grid min-w-0 gap-x-10 gap-y-8 xl:grid-cols-2">
      {/* folha de prova */}
      <section aria-labelledby="sca-folha" className="min-w-0">
        <h4 id="sca-folha" className="text-base">
          Folha de prova · Amostra 2, Alta Mogiana, natural
        </h4>
        <table className="mt-3 w-full border-collapse text-sm">
          <caption className="sr-only">Pontuações por atributo da folha de prova SCA</caption>
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th scope="col" className="py-1.5 pr-3 font-medium">Atributo</th>
              <th scope="col" className="py-1.5 pr-3 font-medium">Escala</th>
              <th scope="col" className="py-1.5 text-right font-medium">Nota</th>
            </tr>
          </thead>
          <tbody>
            {SCA_SHEET.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <th scope="row" className="py-1.5 pr-3 text-left font-normal text-fg">{r.label}</th>
                <td className="py-1.5 pr-3 font-mono text-muted tnum">{r.scale}</td>
                <td className="py-1.5 text-right font-mono text-fg tnum">{num(r.score, 2)}</td>
              </tr>
            ))}
            <tr className="border-b border-border">
              <th scope="row" className="py-1.5 pr-3 text-left font-normal text-fg">Defeitos (desconto)</th>
              <td className="py-1.5 pr-3 font-mono text-muted tnum">−2 / −4 por chávena</td>
              <td className="py-1.5 text-right font-mono text-fg tnum">{num(SCA_SHEET_DEFECTS, 0)}</td>
            </tr>
            <tr>
              <th scope="row" className="py-2 pr-3 text-left font-semibold text-fg">Pontuação final</th>
              <td className="py-2 pr-3" />
              <td className="py-2 text-right font-mono font-semibold text-fg tnum">
                {sheetPick === null ? (
                  '?'
                ) : (
                  <motion.span initial={reduce ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                    {num(total, 2)}
                  </motion.span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
        <fieldset className="mt-4">
          <legend className="mb-2 font-medium text-fg">{SCA_QUESTION.prompt}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SCA_QUESTION.options.map((o, i) => (
              <Choice key={i} state={sheetPick === null ? 'idle' : i === sheetPick ? (sheetOk ? 'right' : 'wrong') : i === SCA_QUESTION.correct ? 'missed' : 'dim'} disabled={sheetPick !== null} onClick={() => setSheetPick(i)}>
                {o}
              </Choice>
            ))}
          </div>
        </fieldset>
        {sheetPick !== null && (
          <Verdict className="mt-4" ok={sheetOk} title={sheetOk ? 'Certo.' : 'Não é essa.'}>
            {SCA_QUESTION.explanation}
          </Verdict>
        )}
      </section>

      {/* classificação do grão verde */}
      <section aria-labelledby="sca-verde" className="min-w-0">
        <h4 id="sca-verde" className="text-base">
          Classificação do grão verde · 350 g por amostra
        </h4>
        <p className="mt-1 text-sm text-muted">Especialidade: nenhum defeito de categoria 1, até 5 defeitos completos de categoria 2 e 80 pontos ou mais na prova. Marca as amostras que passam.</p>
        <div className="-mx-4 mt-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <caption className="sr-only">Amostras de café verde: humidade, defeitos e pontuação</caption>
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th scope="col" className="py-1.5 pr-2 font-medium">Especialidade?</th>
                <th scope="col" className="py-1.5 pr-2 font-medium">Amostra</th>
                <th scope="col" className="whitespace-nowrap py-1.5 pr-2 text-right font-medium">Humid.</th>
                <th scope="col" className="whitespace-nowrap py-1.5 pr-2 text-right font-medium">Cat. 1</th>
                <th scope="col" className="whitespace-nowrap py-1.5 pr-2 text-right font-medium">Cat. 2</th>
                <th scope="col" className="py-1.5 text-right font-medium">SCA</th>
              </tr>
            </thead>
            <tbody>
              {COFFEE_SAMPLES.map((c) => (
                <GradeRow key={c.id} c={c} marked={Boolean(marked[c.id])} checked={checked} onToggle={() => setMarked((m) => ({ ...m, [c.id]: !m[c.id] }))} />
              ))}
            </tbody>
          </table>
        </div>
        {checked && (
          <Verdict className="mt-4" ok={gradeOk} title={gradeOk ? 'Classificação certa.' : 'A classificação tem erros.'}>
            Só as amostras 1, 2 e 3 cumprem as três regras. A 4 tem 2 defeitos de categoria 1, 9 completos de categoria 2 e 78,5 pontos; a 5 é um robusta comercial com 1 defeito de categoria 1 e 12 de categoria 2. A humidade de 10–12 % conta para armazenar e transportar; aqui não decide a classificação.
          </Verdict>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3 xl:col-span-2">
        {!checked ? (
          <>
            <Button onClick={() => setChecked(true)} disabled={sheetPick === null}>
              Verificar a classificação
            </Button>
            {sheetPick === null && <p className="text-sm text-muted">Responde primeiro à pergunta da folha de prova.</p>}
          </>
        ) : (
          <Button onClick={() => onDone((sheetOk ? 1 : 0) + (gradeOk ? 1 : 0))} iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
            Ver o resultado
          </Button>
        )}
      </div>
    </div>
  );
}

function GradeRow({ c, marked, checked, onToggle }: { c: CoffeeSample; marked: boolean; checked: boolean; onToggle: () => void }) {
  const spec = isSpecialty(c);
  const ok = marked === spec;
  const id = `sca-${c.id}`;
  return (
    <tr className={cn('border-b border-border transition-colors duration-200 last:border-b-0', checked && !ok && 'bg-[color-mix(in_oklab,var(--crit)_7%,var(--surface))]')}>
      <td className="py-1.5 pr-2">
        <label htmlFor={id} className="inline-flex min-h-11 cursor-pointer items-center gap-2">
          <input id={id} type="checkbox" checked={marked} disabled={checked} onChange={onToggle} className="size-5 cursor-pointer disabled:cursor-default" />
          {checked && (ok ? <Check aria-hidden className="size-4 text-ok-ink" strokeWidth={2.5} /> : <X aria-hidden className="size-4 text-crit-ink" strokeWidth={2.5} />)}
          <span className="sr-only">
            Marcar {c.label} como especialidade{checked ? (spec ? ' · é especialidade' : ' · não é especialidade') : ''}
          </span>
        </label>
      </td>
      <td className="py-1.5 pr-2">
        <span className="block text-fg">{c.label}</span>
        <span className="block text-xs text-muted">
          {c.origem} · {c.processo === 'honey' ? 'honey' : c.processo}
        </span>
      </td>
      <td className="whitespace-nowrap py-1.5 pr-2 text-right font-mono text-fg tnum">{num(c.humidade, 1)}&nbsp;%</td>
      <td className={cn('py-1.5 pr-2 text-right font-mono tnum', checked && c.defeitosCat1 > 0 ? 'font-semibold text-crit-ink' : 'text-fg')}>{c.defeitosCat1}</td>
      <td className={cn('py-1.5 pr-2 text-right font-mono tnum', checked && c.defeitosCompletosCat2 > 5 ? 'font-semibold text-crit-ink' : 'text-fg')}>{c.defeitosCompletosCat2}</td>
      <td className={cn('py-1.5 text-right font-mono tnum', checked && c.pontuacao < 80 ? 'font-semibold text-crit-ink' : 'text-fg')}>
        {num(c.pontuacao, 2)}
        {checked && <span className="block font-sans text-xs text-muted">{scaLabel(c.pontuacao)}</span>}
      </td>
    </tr>
  );
}
