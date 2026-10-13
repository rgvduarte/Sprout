import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  House,
  Map,
  WalletCards,
  GraduationCap,
  CalendarRange,
  NotebookTabs,
  UserCheck,
  Presentation,
  ServerCog,
  ListChecks,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '../state';

/* =====================================================================
   Rotas. Cada página é carregada à parte (React.lazy) a partir do seu ficheiro.
   ===================================================================== */

export type NavGroup = 'Investir' | 'Jogo' | 'Conta' | 'Sprout';

export interface RouteDef {
  path: string;
  label: string;
  icon?: LucideIcon;
  group?: NavGroup;
  /** papéis com acesso (omisso: todos) */
  roles?: Role[];
  /** 'immersive': sem rail, largura total (páginas-história) */
  layout: 'app' | 'immersive';
  component: LazyExoticComponent<ComponentType>;
  /** aparece no rail */
  nav: boolean;
  /** NavLink com correspondência exata */
  end?: boolean;
}

const InicioPage = lazy(() => import('../pages/inicio/InicioPage'));
const CarteiraPage = lazy(() => import('../pages/carteira/CarteiraPage'));
const MercadosPage = lazy(() => import('../pages/mercados/MercadosPage'));
const MundoPage = lazy(() => import('../pages/mercados/MundoPage'));
const LotePage = lazy(() => import('../pages/lote/LotePage'));
const AcademiaPage = lazy(() => import('../pages/academia/AcademiaPage'));
const SimuladorPage = lazy(() => import('../pages/simulador/SimuladorPage'));
const CadernoPage = lazy(() => import('../pages/caderno/CadernoPage'));
const OnboardingPage = lazy(() => import('../pages/onboarding/OnboardingPage'));
const ApresentacaoPage = lazy(() => import('../pages/apresentacao/ApresentacaoPage'));
const BastidoresPage = lazy(() => import('../pages/bastidores/BastidoresPage'));
const PlanoPage = lazy(() => import('../pages/plano/PlanoPage'));

export const ROUTES: RouteDef[] = [
  { path: '/', label: 'Início', icon: House, group: 'Investir', layout: 'app', component: InicioPage, nav: true, end: true },
  { path: '/mercados', label: 'Mercados', icon: Map, group: 'Investir', layout: 'app', component: MercadosPage, nav: true },
  { path: '/mercados/:mundo', label: 'Mundo', layout: 'app', component: MundoPage, nav: false },
  { path: '/carteira', label: 'Carteira', icon: WalletCards, group: 'Investir', layout: 'app', component: CarteiraPage, nav: true, end: true },
  { path: '/lote/:loteId', label: 'Lote', layout: 'app', component: LotePage, nav: false },
  { path: '/academia', label: 'Academia', icon: GraduationCap, group: 'Jogo', layout: 'app', component: AcademiaPage, nav: true, end: true },
  { path: '/academia/simulador', label: 'Simulador', icon: CalendarRange, group: 'Jogo', layout: 'app', component: SimuladorPage, nav: true, end: true },
  { path: '/caderno', label: 'Caderno de colheita', icon: NotebookTabs, group: 'Jogo', layout: 'app', component: CadernoPage, nav: true, end: true },
  { path: '/onboarding', label: 'Onboarding', icon: UserCheck, group: 'Conta', layout: 'app', component: OnboardingPage, nav: true, end: true },
  { path: '/apresentacao', label: 'Apresentação', icon: Presentation, group: 'Sprout', layout: 'immersive', component: ApresentacaoPage, nav: true, end: true },
  { path: '/bastidores', label: 'Bastidores', icon: ServerCog, group: 'Sprout', roles: ['equipa'], layout: 'app', component: BastidoresPage, nav: true, end: true },
  { path: '/plano', label: 'Plano', icon: ListChecks, group: 'Sprout', roles: ['equipa'], layout: 'app', component: PlanoPage, nav: true, end: true },
];

export const NAV_GROUPS: NavGroup[] = ['Investir', 'Jogo', 'Conta', 'Sprout'];

/** Itens do rail visíveis para um papel. */
export function navFor(role: Role): RouteDef[] {
  return ROUTES.filter((r) => r.nav && (!r.roles || r.roles.includes(role)));
}

/** Rótulo do papel ou da rota para títulos de documento. */
export function routeTitle(pathname: string): string | undefined {
  if (pathname === '/') return 'Início';
  if (pathname.startsWith('/lote/')) return `Lote ${decodeURIComponent(pathname.split('/')[2] ?? '')}`;
  if (pathname.startsWith('/mercados/')) {
    const m = pathname.split('/')[2];
    return m === 'azeite' ? 'O Olival' : m === 'agua' ? 'A Nascente' : m === 'cafe' ? 'A Plantação' : 'Mercados';
  }
  return ROUTES.find((r) => r.path === pathname)?.label;
}
