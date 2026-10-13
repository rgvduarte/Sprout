import { Component, type ErrorInfo, type ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Falha de um ecrã não derruba a aplicação: mostra o problema e a saída. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro no ecrã:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto flex max-w-[640px] flex-col items-start gap-4 px-4 py-16 sm:px-6" role="alert">
        <span aria-hidden className="inline-flex size-11 items-center justify-center rounded-sm border border-border bg-surface text-crit-ink">
          <TriangleAlert className="size-5" strokeWidth={1.75} />
        </span>
        <h1 className="text-[1.75rem]">Este ecrã não abriu</h1>
        <p className="text-muted">Houve um erro ao desenhar esta página. Os teus dados de demonstração continuam intactos. Tenta de novo ou volta ao início.</p>
        <p className="font-mono text-sm text-muted">{this.state.error.message}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => this.setState({ error: null })} className="inline-flex h-11 items-center rounded-sm bg-accent px-4 font-medium text-accent-fg">
            Tentar de novo
          </button>
          <a href="#/" onClick={() => this.setState({ error: null })} className="inline-flex h-11 items-center rounded-sm border border-border bg-surface px-4 font-medium text-fg no-underline">
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }
}
