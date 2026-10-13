import { useLocation } from 'react-router-dom';
import { LotGauge } from '../components/game';
import { ButtonLink } from '../components/ui';

/** 404: caminho sem ecrã. Um IBC vazio no lugar do lote que não existe. */
export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div className="mx-auto grid max-w-[880px] min-w-0 items-center gap-x-12 gap-y-8 px-4 py-16 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-6">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] sm:text-[2.125rem]">Este caminho não leva a nenhum lote</h1>
        <p className="measure mt-3 text-muted">
          Não existe nenhum ecrã em <span className="break-all font-mono text-fg">{pathname}</span>. Se vieste de uma ligação antiga, o lote pode ter mudado de número.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <ButtonLink to="/" variant="primary">
            Voltar ao início
          </ButtonLink>
          <ButtonLink to="/mercados">Ver os mercados</ButtonLink>
        </div>
      </div>
      <LotGauge kind="ibc" value={0} size="md" label="IBC vazio: nenhum lote neste endereço" className="justify-self-start sm:justify-self-end" />
    </div>
  );
}
