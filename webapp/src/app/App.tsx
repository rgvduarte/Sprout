import { HashRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useRole } from '../state';
import { NoAccess } from '../components/ui';
import { AppShell } from './AppShell';
import { ErrorBoundary } from './ErrorBoundary';
import NotFound from './NotFound';
import { ROUTES, type RouteDef } from './routes';
import { ScrollToTop } from './ScrollToTop';

/** Guarda de papel: sem acesso mostra NoAccess com botão para mudar de papel. */
export function RoleGate({ route }: { route: RouteDef }) {
  const { role } = useRole();
  if (route.roles && !route.roles.includes(role)) return <NoAccess allowed={route.roles} />;
  const Page = route.component;
  return <Page />;
}

function Screens() {
  const location = useLocation();
  const current = ROUTES.find((r) => {
    if (r.path === location.pathname) return true;
    const re = new RegExp(`^${r.path.replace(/:[^/]+/g, '[^/]+')}$`);
    return re.test(location.pathname);
  });
  return (
    <AppShell layout={current?.layout ?? 'app'}>
      <ErrorBoundary key={location.pathname}>
        <Routes>
          {ROUTES.map((r) => (
            <Route key={r.path} path={r.path} element={<RoleGate route={r} />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </AppShell>
  );
}

export function App() {
  const Router = import.meta.env.MODE === 'artifact' ? MemoryRouter : HashRouter;
  return (
    <Router>
      <AppProvider>
        <ScrollToTop />
        <Screens />
      </AppProvider>
    </Router>
  );
}
