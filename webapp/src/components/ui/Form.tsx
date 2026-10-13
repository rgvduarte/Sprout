import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/cn';

const controlBase =
  'w-full min-w-0 rounded-sm border border-border bg-surface px-3 text-base text-fg transition-[border-color,box-shadow] duration-150 ' +
  'hover:border-[color-mix(in_oklab,var(--fg)_30%,var(--border))] focus:outline-none focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_22%,transparent)] ' +
  'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted aria-[invalid=true]:border-crit';

/* ------------------------------------------------------------ Field */

export interface FieldProps {
  label: ReactNode;
  /** id do controlo; se omitido, gera um estável */
  id?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  className?: string;
}

/** Rótulo + controlo + ajuda + erro, com ids estáveis e aria-describedby. */
export function Field({ label, id, hint, error, required, children, className }: FieldProps) {
  const auto = useId();
  const cid = id ?? `f${auto.replace(/:/g, '')}`;
  const hintId = hint ? `${cid}-hint` : undefined;
  const errId = error ? `${cid}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={cid} className="mb-1.5 block text-sm font-medium text-fg">
        {label}
        {required && <span className="text-muted"> (obrigatório)</span>}
      </label>
      {children({ id: cid, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="mt-1.5 text-sm text-crit-ink" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Input */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** sufixo visual (p.ex. "€", "kg") */
  suffix?: ReactNode;
  prefix?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, suffix, prefix, invalid, ...rest }, ref) {
  if (!suffix && !prefix) return <input ref={ref} aria-invalid={invalid || undefined} className={cn(controlBase, 'h-11', className)} {...rest} />;
  return (
    <div className="relative flex min-w-0 items-center">
      {prefix && <span className="pointer-events-none absolute left-3 text-muted">{prefix}</span>}
      <input ref={ref} aria-invalid={invalid || undefined} className={cn(controlBase, 'h-11', prefix && 'pl-8', suffix && 'pr-12', className)} {...rest} />
      {suffix && <span className="pointer-events-none absolute right-3 font-mono text-sm text-muted">{suffix}</span>}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea({ className, invalid, ...rest }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(controlBase, 'min-h-28 py-2.5 leading-relaxed', className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(function Select({ className, invalid, children, ...rest }, ref) {
  return (
    <div className="relative min-w-0">
      <select ref={ref} aria-invalid={invalid || undefined} className={cn(controlBase, 'h-11 appearance-none pr-9', className)} {...rest}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" strokeWidth={1.75} />
    </div>
  );
});

/* ------------------------------------------------------------ Checkbox / Radio */

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, description, className, id, ...rest }, ref) {
  const auto = useId();
  const cid = id ?? `c${auto.replace(/:/g, '')}`;
  return (
    <div className={cn('flex min-h-11 items-start gap-3 py-1.5', className)}>
      <span className="relative mt-0.5 inline-flex size-5 shrink-0">
        <input
          ref={ref}
          id={cid}
          type="checkbox"
          className="peer size-5 cursor-pointer appearance-none rounded-xs border border-[color-mix(in_oklab,var(--fg)_35%,var(--border))] bg-surface transition-colors checked:border-accent checked:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          aria-describedby={description ? `${cid}-d` : undefined}
          {...rest}
        />
        <Check aria-hidden className="pointer-events-none absolute inset-0.5 size-4 text-accent-fg opacity-0 peer-checked:opacity-100" strokeWidth={2.5} />
      </span>
      <label htmlFor={cid} className="min-w-0 cursor-pointer">
        <span className="block text-fg">{label}</span>
        {description && (
          <span id={`${cid}-d`} className="mt-0.5 block text-sm text-muted">
            {description}
          </span>
        )}
      </label>
    </div>
  );
});

export interface RadioOption<V extends string> {
  value: V;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

/** Grupo de rádio com legenda (fieldset). */
export function RadioGroup<V extends string>({ legend, name, value, onChange, options, className, hint }: { legend: ReactNode; name: string; value: V | undefined; onChange: (v: V) => void; options: RadioOption<V>[]; className?: string; hint?: ReactNode }) {
  const auto = useId();
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="mb-1.5 text-sm font-medium text-fg">{legend}</legend>
      {hint && <p className="mb-2 text-sm text-muted">{hint}</p>}
      <div className="flex flex-col gap-1">
        {options.map((o) => {
          const rid = `r${auto.replace(/:/g, '')}-${o.value}`;
          return (
            <div key={o.value} className="flex min-h-11 items-start gap-3 py-1.5">
              <input
                id={rid}
                type="radio"
                name={name}
                value={o.value}
                checked={value === o.value}
                disabled={o.disabled}
                onChange={() => onChange(o.value)}
                className="mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded-full border border-[color-mix(in_oklab,var(--fg)_35%,var(--border))] bg-surface transition-[border-width,border-color] checked:border-[6px] checked:border-accent disabled:cursor-not-allowed disabled:opacity-60"
              />
              <label htmlFor={rid} className="min-w-0 cursor-pointer">
                <span className="block text-fg">{o.label}</span>
                {o.description && <span className="mt-0.5 block text-sm text-muted">{o.description}</span>}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ------------------------------------------------------------ Slider */

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  /** texto acessível do valor atual */
  valueText?: string;
}

export function Slider({ value, onChange, min, max, step = 1, valueText, className, ...rest }: SliderProps) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-valuetext={valueText}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn('h-11 w-full min-w-0 cursor-pointer appearance-none bg-transparent', 'sprout-range', className)}
      style={{ ['--pct' as string]: `${pct}%` }}
      {...rest}
    />
  );
}

/* ------------------------------------------------------------ SegmentedControl */

export interface SegmentOption<V extends string> {
  value: V;
  label: ReactNode;
  icon?: ReactNode;
  /** rótulo acessível quando só há ícone */
  ariaLabel?: string;
}

/** Escolha exclusiva compacta (radiogroup), p.ex. filtros e tema. */
export function SegmentedControl<V extends string>({ label, value, onChange, options, className, size = 'md', onRail }: { label: string; value: V; onChange: (v: V) => void; options: SegmentOption<V>[]; className?: string; size?: 'sm' | 'md'; onRail?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex max-w-full items-center gap-0.5 rounded-sm border p-0.5', onRail ? 'border-rail-border' : 'border-border bg-surface', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.ariaLabel}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              const i = options.findIndex((x) => x.value === value);
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                onChange(options[(i + 1) % options.length].value);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                onChange(options[(i - 1 + options.length) % options.length].value);
              }
            }}
            tabIndex={active ? 0 : -1}
            className={cn(
              'relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xs px-3 text-sm font-medium transition-colors duration-150',
              size === 'md' ? 'h-10 min-w-10' : 'h-8 min-w-8 after:absolute after:-inset-1.5 after:content-[""]',
              onRail
                ? active
                  ? 'bg-rail-fg text-rail'
                  : 'text-rail-muted hover:bg-rail-active hover:text-rail-fg'
                : active
                  ? 'bg-accent text-accent-fg'
                  : 'text-muted hover:bg-surface-2 hover:text-fg',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
