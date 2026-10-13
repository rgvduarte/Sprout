import type { InputHTMLAttributes, ReactNode } from 'react';
import { CircleCheck } from 'lucide-react';
import { Field, Input, Select } from '../../components/ui';
import type { Draft } from './draft';
import { Lbl, type StepProps } from './parts';

type StringKey = { [K in keyof Draft]: Draft[K] extends string ? K : never }[keyof Draft];

/** Campo de texto ligado ao rascunho: rótulo com «exemplo», erro depois de tocado, confirmação quando válido. */
export function TF({
  k,
  label,
  p,
  hint,
  okHint,
  format,
  required = true,
  className,
  ...rest
}: {
  k: StringKey;
  label: string;
  p: StepProps;
  hint?: ReactNode;
  /** texto quando o valor é válido (p.ex. «Algarismo de controlo confirmado») */
  okHint?: string;
  format?: (v: string) => string;
  required?: boolean;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'id' | 'className'>) {
  const value = p.d[k];
  const error = p.err(k);
  const valid = Boolean(okHint && value && !p.raw(k));
  return (
    <Field
      id={`ob-${k}`}
      label={<Lbl ex={p.isEx(k)}>{label}</Lbl>}
      required={required}
      error={error}
      hint={
        valid ? (
          <span className="inline-flex items-center gap-1.5 text-ok-ink">
            <CircleCheck aria-hidden className="size-4" strokeWidth={1.75} />
            {okHint}
          </span>
        ) : (
          hint
        )
      }
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          aria-describedby={describedBy}
          invalid={invalid}
          aria-required={required || undefined}
          value={value}
          onChange={(e) => p.set({ [k]: format ? format(e.target.value) : e.target.value } as Partial<Draft>)}
          onBlur={() => p.touch(k)}
          {...rest}
        />
      )}
    </Field>
  );
}

/** Lista de escolha ligada ao rascunho. */
export function SF({
  k,
  label,
  p,
  options,
  placeholder = 'Escolhe…',
  hint,
  className,
}: {
  k: StringKey;
  label: string;
  p: StepProps;
  options: readonly { value: string; label: string }[] | readonly string[];
  placeholder?: string;
  hint?: ReactNode;
  className?: string;
}) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <Field id={`ob-${k}`} label={<Lbl ex={p.isEx(k)}>{label}</Lbl>} required error={p.err(k)} hint={hint} className={className}>
      {({ id, describedBy, invalid }) => (
        <Select
          id={id}
          aria-describedby={describedBy}
          invalid={invalid}
          aria-required
          value={p.d[k]}
          onChange={(e) => {
            p.set({ [k]: e.target.value } as Partial<Draft>);
            p.touch(k);
          }}
          onBlur={() => p.touch(k)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}
