import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet-danger' | 'on-rail';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Classes partilhadas por Button e ButtonLink. Alvos de toque ≥ 44 px:
 * o tamanho sm (36 px visuais) estende a área de toque com um pseudo-elemento.
 */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra?: string) {
  return cn(
    'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium',
    'transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out',
    'disabled:cursor-not-allowed aria-disabled:cursor-not-allowed',
    'motion-safe:active:translate-y-px',
    size === 'sm' && 'h-9 px-3 text-sm after:absolute after:-inset-x-0 after:-inset-y-1 after:content-[""]',
    size === 'md' && 'h-11 px-4 text-[0.9375rem]',
    size === 'lg' && 'h-12 px-5 text-base',
    variant === 'primary' && 'bg-accent text-accent-fg hover:bg-[color-mix(in_oklab,var(--accent)_88%,var(--fg))] disabled:bg-surface-2 disabled:text-muted aria-disabled:bg-surface-2 aria-disabled:text-muted',
    variant === 'secondary' && 'border border-border bg-surface text-fg hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--border))] hover:bg-surface-2 disabled:text-muted aria-disabled:text-muted',
    variant === 'ghost' && 'text-fg hover:bg-surface-2 disabled:text-muted aria-disabled:text-muted',
    variant === 'quiet-danger' && 'border border-border bg-surface text-crit-ink hover:bg-[color-mix(in_oklab,var(--crit)_8%,var(--surface))] disabled:text-muted',
    variant === 'on-rail' && 'border border-rail-border text-rail-fg hover:bg-rail-active',
    extra,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, iconLeft, iconRight, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <LoaderCircle aria-hidden className="size-4 animate-spin" strokeWidth={1.75} /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
});

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

/** Link com aspeto de botão (navegação interna). */
export function ButtonLink({ variant = 'secondary', size = 'md', iconLeft, iconRight, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, cn('no-underline hover:no-underline', className))} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** obrigatório: nome acessível */
  label: string;
  icon: ReactNode;
  variant?: 'ghost' | 'secondary' | 'on-rail';
  size?: 'sm' | 'md';
}

/** Botão só com ícone, 44 × 44 (sm: 36 visuais com área de toque de 44). */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'ghost', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-sm transition-colors duration-150',
        size === 'md' ? 'size-11' : 'size-9 after:absolute after:-inset-1 after:content-[""]',
        variant === 'ghost' && 'text-fg hover:bg-surface-2',
        variant === 'secondary' && 'border border-border bg-surface text-fg hover:bg-surface-2',
        variant === 'on-rail' && 'text-rail-fg hover:bg-rail-active',
        'disabled:cursor-not-allowed disabled:text-muted',
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
});

/** Link de texto sublinhado, com offset do sistema. */
export function TextLink({ className, ...rest }: LinkProps) {
  return <Link className={cn('font-medium text-accent underline decoration-[color-mix(in_oklab,var(--accent)_45%,transparent)] underline-offset-[0.2em] hover:decoration-accent', className)} {...rest} />;
}
