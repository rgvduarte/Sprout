import { useId, useRef, useState, type ReactNode, type KeyboardEvent } from 'react';
import { cn } from '../../lib/cn';

export interface TabItem<V extends string = string> {
  value: V;
  label: ReactNode;
  /** conteúdo do painel */
  content: ReactNode;
  disabled?: boolean;
  /** contagem opcional mostrada à direita do rótulo */
  count?: number;
}

export interface TabsProps<V extends string> {
  items: TabItem<V>[];
  /** controlado */
  value?: V;
  defaultValue?: V;
  onChange?: (v: V) => void;
  label: string;
  className?: string;
  /** só a barra (sem painéis) */
  listOnly?: boolean;
}

/** Separadores com setas, Home/End e painéis ligados por aria-controls. */
export function Tabs<V extends string>({ items, value, defaultValue, onChange, label, className, listOnly }: TabsProps<V>) {
  const [inner, setInner] = useState<V>(defaultValue ?? items[0]?.value);
  const current = value ?? inner;
  const uid = useId().replace(/:/g, '');
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (v: V) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    const enabled = items.map((t, idx) => (t.disabled ? -1 : idx)).filter((x) => x >= 0);
    const pos = enabled.indexOf(i);
    let next: number | undefined;
    if (e.key === 'ArrowRight') next = enabled[(pos + 1) % enabled.length];
    if (e.key === 'ArrowLeft') next = enabled[(pos - 1 + enabled.length) % enabled.length];
    if (e.key === 'Home') next = enabled[0];
    if (e.key === 'End') next = enabled[enabled.length - 1];
    if (next !== undefined) {
      e.preventDefault();
      refs.current[next]?.focus();
      select(items[next].value);
    }
  };

  return (
    <div className={cn('min-w-0', className)}>
      <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        <div role="tablist" aria-label={label} className="flex min-w-max gap-1 border-b border-border">
          {items.map((t, i) => {
            const active = t.value === current;
            return (
              <button
                key={t.value}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                id={`${uid}-tab-${t.value}`}
                role="tab"
                type="button"
                aria-selected={active}
                aria-controls={listOnly ? undefined : `${uid}-panel-${t.value}`}
                tabIndex={active ? 0 : -1}
                disabled={t.disabled}
                onClick={() => select(t.value)}
                onKeyDown={(e) => onKey(e, i)}
                className={cn(
                  'relative -mb-px inline-flex h-11 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-[0.9375rem] font-medium transition-colors duration-150',
                  active ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {t.label}
                {t.count !== undefined && <span className="rounded-xs bg-surface-2 px-1.5 font-mono text-xs leading-5 text-muted tnum">{t.count}</span>}
              </button>
            );
          })}
        </div>
      </div>
      {!listOnly &&
        items.map((t) => (
          <div key={t.value} id={`${uid}-panel-${t.value}`} role="tabpanel" aria-labelledby={`${uid}-tab-${t.value}`} hidden={t.value !== current} tabIndex={0} className="pt-5 focus-visible:outline-offset-4">
            {t.value === current && t.content}
          </div>
        ))}
    </div>
  );
}
