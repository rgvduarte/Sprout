import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, FileCheck2, FileUp, LoaderCircle, X } from 'lucide-react';
import { Button, IconButton } from '../../components/ui';
import { EASE_OUT } from '../../components/game';
import { cn } from '../../lib/cn';
import { now } from '../../lib/clock';
import type { Draft, DocFile } from './draft';
import { STEPS } from './draft';
import { fileSizeLabel, sniffFile } from './validation';

/* ------------------------------------------------------------ props comuns dos passos */

export interface StepProps {
  d: Draft;
  set: (patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void;
  /** erro visível do campo (depois de tocado ou de tentar continuar) */
  err: (key: string) => string | undefined;
  /** erro atual do campo, mesmo antes de tocado */
  raw: (key: string) => string | undefined;
  touch: (key: string) => void;
  /** o valor ainda é o do exemplo */
  isEx: (key: keyof Draft) => boolean;
  goTo: (step: number) => void;
}

/** Marca discreta ao lado do rótulo enquanto o valor é o do exemplo. */
export function ExampleTag({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="ml-2 rounded-xs bg-surface-2 px-1.5 py-0.5 align-[1px] text-xs font-medium text-neutral-ink">exemplo</span>;
}

/** Rótulo com a marca de exemplo. */
export function Lbl({ children, ex }: { children: ReactNode; ex?: boolean }) {
  return (
    <>
      {children}
      <ExampleTag show={Boolean(ex)} />
    </>
  );
}

/* ------------------------------------------------------------ barra de missões */

/**
 * A linha de missões do registo: um segmento por passo, que enche com os
 * campos válidos desse passo. Nunca fala de dinheiro.
 */
export function MissionBar({ fractions, current, counts }: { fractions: number[]; current: number; counts: { done: number; total: number } }) {
  const reduce = useReducedMotion();
  const remaining = fractions.filter((f) => f < 1).length;
  const overall = fractions.reduce((s, f) => s + f, 0) / fractions.length;
  const step = STEPS[current];
  const headline = remaining === 0 ? 'Tudo pronto para submeter' : remaining === 1 ? 'Falta 1 passo' : `Faltam ${remaining} passos`;
  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-display text-lg font-semibold leading-tight text-fg" aria-live="polite">
          {headline}
        </p>
        <p className="text-sm text-muted">
          Passo {current + 1} de {STEPS.length} · {step.label} ·{' '}
          <span className="font-mono text-fg tnum">
            {counts.done} de {counts.total}
          </span>{' '}
          {counts.total === 1 ? 'campo' : 'campos'}
        </p>
      </div>
      <div role="progressbar" aria-label="Progresso do registo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(overall * 100)} className="flex gap-1">
        {fractions.map((f, i) => (
          <div key={STEPS[i].id} className={cn('relative h-2 flex-1 overflow-hidden rounded-full', 'bg-[color-mix(in_oklab,var(--accent)_14%,var(--surface-2))]')}>
            <motion.div
              className="absolute inset-0 origin-left rounded-full bg-accent"
              initial={false}
              animate={{ scaleX: f }}
              transition={reduce ? { duration: 0 } : { duration: 0.32, ease: EASE_OUT }}
            />
            {i === current && <span aria-hidden className="absolute inset-0 rounded-full ring-1 ring-inset ring-[color-mix(in_oklab,var(--accent)_60%,transparent)]" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ resumo de erros */

export function ErrorSummary({ errors, labels }: { errors: Record<string, string>; labels: Record<string, string> }) {
  const keys = Object.keys(errors).filter((k) => !k.startsWith('ubo-') || k === 'ubos');
  if (!keys.length) return null;
  const focus = (key: string) => {
    const el =
      document.getElementById(`ob-${key}-btn`) ??
      document.querySelector<HTMLElement>(`[data-field="${key}"] input:not([type="file"]), [data-field="${key}"] select, [data-field="${key}"] button`) ??
      document.getElementById(`ob-${key}`);
    el?.focus();
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  return (
    <div role="alert" className="mb-5 rounded-sm border border-[color-mix(in_oklab,var(--crit)_30%,var(--border))] bg-[color-mix(in_oklab,var(--crit)_7%,var(--surface))] px-4 py-3">
      <p className="flex items-center gap-2 font-medium text-crit-ink">
        <AlertCircle aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
        {keys.length === 1 ? 'Falta corrigir 1 campo' : `Faltam corrigir ${keys.length} campos`}
      </p>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-0">
        {keys.map((k) => (
          <li key={k}>
            <button type="button" onClick={() => focus(k)} className="min-h-11 text-left text-sm text-crit-ink underline underline-offset-[0.2em] hover:decoration-2 sm:min-h-8">
              {labels[k] ?? k}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------ ficheiros */

export function FileDrop({
  id,
  label,
  hint,
  required,
  file,
  onFile,
  onRemove,
  error,
  ex,
}: {
  id: string;
  label: string;
  hint: string;
  required?: boolean;
  file?: DocFile;
  onFile: (f: DocFile) => void;
  onRemove: () => void;
  error?: string;
  ex?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [checking, setChecking] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const depth = useRef(0);

  const accept = async (f: File | undefined) => {
    if (!f) return;
    setChecking(true);
    setLocalError(null);
    const r = await sniffFile(f);
    setChecking(false);
    if (!r.ok || !r.kind) {
      setLocalError(r.message ?? 'Ficheiro não aceite.');
      return;
    }
    onFile({ name: f.name, size: f.size, kind: r.kind, addedAt: now().toISOString() });
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    depth.current = 0;
    setOver(false);
    void accept(e.dataTransfer.files?.[0]);
  };

  const shownError = localError ?? error;
  const descId = `${id}-d`;

  return (
    <div className="min-w-0" data-field={id.replace(/^ob-/, '')}>
      <p className="mb-1.5 text-sm font-medium text-fg">
        {label}
        {!required && <span className="text-muted"> (se aplicável)</span>}
        <ExampleTag show={Boolean(ex && file?.example)} />
      </p>
      <input
        ref={input}
        id={id}
        type="file"
        accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void accept(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {file ? (
        <div className="flex min-w-0 items-center gap-3 rounded-sm border border-border bg-surface px-3 py-2.5">
          <FileCheck2 aria-hidden className="size-5 shrink-0 text-ok-ink" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.9375rem] text-fg" title={file.name}>
              {file.name}
            </p>
            <p className="text-sm text-muted" id={descId}>
              <span className="font-mono tnum">
                {file.kind} · {fileSizeLabel(file.size)}
              </span>
              {' · '}
              {file.example ? 'ficheiro de exemplo, não existe no disco' : 'formato confirmado no teu browser'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => input.current?.click()} aria-label={`Substituir ${label.toLowerCase()}`}>
            Substituir
          </Button>
          <IconButton label={`Remover ${label.toLowerCase()}`} icon={<X className="size-4" strokeWidth={1.75} />} onClick={onRemove} />
        </div>
      ) : (
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            depth.current++;
            setOver(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => {
            depth.current = Math.max(0, depth.current - 1);
            if (depth.current === 0) setOver(false);
          }}
          onDrop={onDrop}
          className={cn(
            'flex min-w-0 flex-col items-start gap-3 rounded-sm border border-dashed px-4 py-4 transition-colors duration-150 sm:flex-row sm:items-center',
            over ? 'border-accent bg-accent-soft' : shownError ? 'border-crit bg-surface' : 'border-[color-mix(in_oklab,var(--fg)_28%,var(--border))] bg-surface',
          )}
        >
          <span aria-hidden className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-sm', over ? 'bg-surface text-accent' : 'bg-surface-2 text-muted')}>
            {checking ? <LoaderCircle className="size-5 animate-spin" strokeWidth={1.75} /> : <FileUp className="size-5" strokeWidth={1.75} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.9375rem] text-fg">{checking ? 'A confirmar o formato…' : over ? 'Larga para juntar' : 'Arrasta o ficheiro para aqui'}</p>
            <p className="text-sm text-muted" id={descId}>
              {hint} PDF, JPEG ou PNG, até 10 MB.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => input.current?.click()} disabled={checking} aria-describedby={descId} id={`${id}-btn`}>
            Escolher ficheiro
          </Button>
        </div>
      )}
      {shownError && (
        <p className="mt-1.5 text-sm text-crit-ink" role="alert">
          {shownError}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ cabeçalho de grupo de campos */

export function FieldGroup({ title, description, children, className }: { title: string; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cn('min-w-0 border-0 p-0', className)}>
      <legend className="mb-1 font-display text-[1.0625rem] font-semibold text-fg">{title}</legend>
      {description && <p className="measure mb-4 text-sm text-muted">{description}</p>}
      {!description && <div className="mb-3" />}
      {children}
    </fieldset>
  );
}

/** Animação curta de entrada para conteúdo que aparece por resposta (explicações). */
export function Appear({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: EASE_OUT }}>
      {children}
    </motion.div>
  );
}
