import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Monitor, Sun, Moon, FlaskConical, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/cn';
import { CAMPAIGN } from '../lib/clock';
import { Drawer, IconButton, SegmentedControl, Select, Skeleton } from '../components/ui';
import { CommodityGlyph } from '../components/ui/Commodity';
import { ROLES, ROLE_LABEL, THEME_LABEL, useData, useGame, useRole, useTheme, type Role, type ThemePref } from '../state';
import { NAV_GROUPS, navFor, routeTitle } from './routes';

/* =====================================================================
   Moldura da aplicação: rail verde-oliva à esquerda (gaveta < 900 px),
   barra superior com aviso de demonstração, estação, "Ver como" e tema.
   ===================================================================== */

export const FOOTER_DISCLAIMER =
  'Ambiente de demonstração. Dados fictícios. Nada nesta plataforma constitui oferta pública, recomendação de investimento ou promessa de rentabilidade. Simulações usam dinheiro fictício.';

/** Marca: rebento geométrico + "Sprout". */
export function BrandMark({ onRail, className }: { onRail?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" aria-hidden className="size-7 shrink-0">
        <rect width="32" height="32" rx="6" fill={onRail ? 'var(--rail-fg)' : 'var(--accent)'} />
        <path d="M16 27V14" stroke={onRail ? 'var(--rail)' : 'var(--accent-fg)'} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M16 16.5c0-5.2 3.4-8.6 9-9.2 0 5.6-3.5 9.2-9 9.2z" fill={onRail ? 'var(--rail)' : 'var(--accent-fg)'} />
        <path d="M16 20c0-4.2-2.9-7.2-8-7.8 0 4.7 3 7.8 8 7.8z" fill={onRail ? 'var(--rail)' : 'var(--accent-fg)'} />
      </svg>
      <span className={cn('font-display text-[1.3125rem] font-bold tracking-[-0.01em]', onRail ? 'text-rail-fg' : 'text-fg')}>Sprout</span>
    </span>
  );
}

/* ------------------------------------------------------------ rail */

function RailNav({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = useRole();
  const items = navFor(role);
  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => {
        const groupItems = items.filter((i) => i.group === group);
        if (!groupItems.length) return null;
        return (
          <div key={group}>
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-rail-muted">{group}</p>
            <ul className="flex flex-col gap-0.5">
              {groupItems.map((item) => {
                const Icon = item.icon!;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group flex min-h-11 items-center gap-3 rounded-sm px-3 text-[0.9375rem] no-underline transition-colors duration-150',
                          isActive ? 'bg-rail-active font-semibold text-rail-fg' : 'text-rail-muted hover:bg-rail-active hover:text-rail-fg',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon aria-hidden className={cn('size-[18px] shrink-0', isActive ? 'text-rail-fg' : 'text-rail-muted group-hover:text-rail-fg')} strokeWidth={1.75} />
                          <span className="truncate">{item.label}</span>
                          {isActive && <span aria-hidden className="ml-auto size-1.5 rounded-full bg-rail-fg" />}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function RailIdentity() {
  const { role } = useRole();
  const { investor } = useData();
  const game = useGame();
  return (
    <div className="rounded-sm border border-rail-border p-3">
      <p className="text-xs text-rail-muted">{ROLE_LABEL[role]}</p>
      <p className="mt-0.5 text-sm font-medium leading-snug text-rail-fg">{role === 'equipa' ? 'Vista interna da equipa' : investor.nome}</p>
      {role !== 'equipa' && (
        <div className="mt-2 flex items-center gap-2 text-xs text-rail-muted">
          <span className="inline-flex items-center rounded-xs bg-rail-fg px-1.5 py-0.5 font-medium text-rail">{game.level.nome}</span>
          <span className="font-mono tnum">{game.points} pts</span>
        </div>
      )}
      {role === 'visitante' && game.onboarding.status !== 'aprovado' && (
        <Link to="/onboarding" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-rail-fg underline underline-offset-[0.2em]">
          Pedir acesso ao piloto
        </Link>
      )}
    </div>
  );
}

function Rail() {
  return (
    <aside className="on-rail sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-6 overflow-y-auto bg-rail px-3 py-5 rail:flex">
      <Link to="/" className="px-3 no-underline" aria-label="Sprout, início">
        <BrandMark onRail />
      </Link>
      <p className="-mt-3 px-3 text-xs text-rail-muted">Piloto fechado · azeite e água</p>
      <RailNav />
      <div className="mt-auto">
        <RailIdentity />
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------ barra superior */

const THEME_ICONS: Record<ThemePref, ReactNode> = {
  system: <Monitor aria-hidden className="size-4" strokeWidth={1.75} />,
  light: <Sun aria-hidden className="size-4" strokeWidth={1.75} />,
  dark: <Moon aria-hidden className="size-4" strokeWidth={1.75} />,
};

export function ThemeToggle({ onRail, showLabels }: { onRail?: boolean; showLabels?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <SegmentedControl<ThemePref>
      label="Tema"
      value={theme}
      onChange={setTheme}
      onRail={onRail}
      size="md"
      options={(['system', 'light', 'dark'] as ThemePref[]).map((t) => ({
        value: t,
        icon: THEME_ICONS[t],
        label: showLabels ? THEME_LABEL[t] : <span className="sr-only">{THEME_LABEL[t]}</span>,
        ariaLabel: THEME_LABEL[t],
      }))}
    />
  );
}

export function RoleSwitcher({ compact }: { compact?: boolean }) {
  const { role, setRole } = useRole();
  return (
    <label className="flex min-w-0 items-center gap-2">
      <span className={cn('shrink-0 text-sm text-muted', compact && 'sr-only')}>Ver como</span>
      <Select value={role} onChange={(e) => setRole(e.target.value as Role)} className={cn('h-10 text-sm', compact ? 'w-[150px]' : 'w-[190px]')} aria-label="Ver como">
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </Select>
    </label>
  );
}

export function DemoBadge({ short }: { short?: boolean }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-xs border border-[color-mix(in_oklab,var(--warn)_35%,var(--border))] bg-[color-mix(in_oklab,var(--warn)_12%,var(--surface))] px-2 text-[0.8125rem] font-medium text-warn-ink">
      <FlaskConical aria-hidden className="size-3.5" strokeWidth={1.75} />
      {short ? 'Demonstração · dados fictícios' : 'Ambiente de demonstração · dados fictícios'}
    </span>
  );
}

export function SeasonPill() {
  return (
    <Link
      to="/mercados/azeite"
      className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-xs border border-[color-mix(in_oklab,var(--c-azeite)_35%,var(--border))] bg-[color-mix(in_oklab,var(--c-azeite)_14%,var(--surface))] px-2 text-[0.8125rem] font-medium text-azeite-ink no-underline hover:underline"
      title="A campanha do azeite: colheita de outubro a janeiro, vendas até setembro"
    >
      <CommodityGlyph world="azeite" className="size-3.5" />
      {CAMPAIGN.label} · {CAMPAIGN.phaseLabel}
    </Link>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg">
      <div className="flex min-h-14 items-center gap-2 px-4 sm:px-6 lg:px-8">
        <IconButton label="Abrir navegação" icon={<Menu className="size-5" strokeWidth={1.75} />} onClick={onMenu} className="-ml-2 rail:hidden" />
        <Link to="/" className="no-underline rail:hidden" aria-label="Sprout, início">
          <BrandMark />
        </Link>
        <div className="hidden min-w-0 items-center gap-2 md:flex">
          <DemoBadge />
          <SeasonPill />
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <RoleSwitcher />
          </div>
          <div className="sm:hidden">
            <RoleSwitcher compact />
          </div>
          <div className="hidden rail:block">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

/** No telemóvel o aviso de demonstração e a estação ficam por baixo da barra (sem ocupar a zona fixa). */
function MobileContextRow() {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5 md:hidden">
      <DemoBadge short />
      <SeasonPill />
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-6 sm:px-6 lg:px-8">
      <p className="measure text-sm text-muted">{FOOTER_DISCLAIMER}</p>
      <p className="mt-2 text-xs text-muted">Sprout é um nome de trabalho. Hoje é 13/10/2026 neste ambiente.</p>
    </footer>
  );
}

/* ------------------------------------------------------------ carregamento */

export function PageFallback() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pt-8 sm:px-6 lg:px-8" aria-busy="true">
      <Skeleton className="h-9 w-2/3 max-w-[420px]" label="A carregar o ecrã" />
      <Skeleton className="mt-3 h-4 w-full max-w-[560px]" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ moldura */

function useDocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const t = routeTitle(pathname);
    document.title = t ? `${t} · Sprout Investimento Agro` : 'Sprout Investimento Agro';
  }, [pathname]);
}

export function AppShell({ children, layout }: { children: ReactNode; layout: 'app' | 'immersive' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  useDocumentTitle();
  useEffect(() => setMenuOpen(false), [pathname]);

  const skip = (
    <a href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus(); }} className="sr-only z-[70] rounded-sm bg-accent px-3 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
      Saltar para o conteúdo
    </a>
  );

  if (layout === 'immersive') {
    return (
      <div className="flex min-h-dvh flex-col">
        {skip}
        <header className="z-20 border-b border-border bg-bg">
          <div className="mx-auto flex min-h-14 max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6">
            <Link to="/" className="no-underline" aria-label="Sprout, início">
              <BrandMark />
            </Link>
            <span className="hidden lg:inline-flex">
              <DemoBadge />
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Link to="/" className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-medium text-fg no-underline hover:underline">
                <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} />
                Plataforma
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main id="conteudo" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          <Suspense fallback={<PageFallback />}>{children}</Suspense>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      {skip}
      <Rail />
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Navegação" side="left" width="sm" tone="rail" hideHeader>
        <div className="flex min-h-full flex-col gap-6 pb-2">
          <BrandMark onRail className="px-3" />
          <RailNav onNavigate={() => setMenuOpen(false)} />
          <div className="flex flex-col gap-3 px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-rail-muted">Tema</p>
            <ThemeToggle onRail showLabels />
          </div>
          <div className="mt-auto">
            <RailIdentity />
          </div>
        </div>
      </Drawer>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMenuOpen(true)} />
        <MobileContextRow />
        <main id="conteudo" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          <Suspense fallback={<PageFallback />}>{children}</Suspense>
        </main>
        <Footer />
      </div>
    </div>
  );
}
