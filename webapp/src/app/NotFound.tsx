import { Compass } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ButtonLink } from '../components/ui';

/** 404: caminho sem ecrã. */
export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div className="mx-auto flex max-w-[640px] flex-col items-start gap-4 px-4 py-16 sm:px-6">
      <span aria-hidden className="inline-flex size-11 items-center justify-center rounded-sm border border-border bg-surface text-muted">
        <Compass className="size-5" strokeWidth={1.75} />
      </span>
      <h1 className="text-[1.75rem]">Este caminho não leva a nenhum lote</h1>
      <p className="text-muted">
        Não existe nenhum ecrã em <span className="font-mono text-fg">{pathname}</span>. Se vieste de uma ligação antiga, o lote pode ter mudado de número.
      </p>
      <div className="flex flex-wrap gap-2">
        <ButtonLink to="/" variant="primary">
          Voltar ao início
        </ButtonLink>
        <ButtonLink to="/mercados">Ver os mercados</ButtonLink>
      </div>
    </div>
  );
}
