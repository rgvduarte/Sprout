import { ArrowRight } from 'lucide-react';
import { HarvestBand } from '../../components/game';
import { ButtonLink, SimulationLabel } from '../../components/ui';
import { QUESTS, SIM_COMPLETE_POINTS } from '../../data';
import { useGame } from '../../state';
import { TODAY_DATE } from '../../lib/clock';

/** Ligação ao Simulador de campanha: o único sítio onde retorno e risco se jogam, com dinheiro fictício. */
export function SimuladorBand() {
  const game = useGame();
  const runs = game.simRuns.length;
  const quest = QUESTS.find((q) => q.criteria.type === 'sim-complete');
  const firstPoints = (quest?.points ?? 0) + SIM_COMPLETE_POINTS;
  return (
    <div className="grid min-w-0 items-start gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="min-w-0">
        <p className="measure text-[1.0625rem] text-fg">
          Distribui um orçamento fictício por lotes e joga 18 meses, mês a mês ou de uma vez: choques de preço, colheitas fracas, atrasos nas vendas, quebras de qualidade. Vês o que mudam a cobertura, a reserva de primeira perda, a extensão e o refunding. O balanço final pode ser uma perda.
        </p>
        <p className="mt-3 max-w-[62ch] text-[0.9375rem] text-muted">
          O Regulamento (UE) 2020/1503, das plataformas europeias de crowdfunding, obriga a fazer a investidores não sofisticados um teste de conhecimentos e a pedir-lhes uma simulação da capacidade de suportar perdas, calculada como 10 % do património líquido. O piloto só aceita investidores qualificados e o simulador não substitui esse cálculo: é uma recomendação, no mesmo espírito, antes do primeiro compromisso.
        </p>
        <SimulationLabel className="mt-4" />
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ButtonLink to="/academia/simulador" variant="primary" iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
            {runs ? 'Jogar outra campanha' : 'Abrir o simulador'}
          </ButtonLink>
          <p className="text-sm text-muted">
            {runs ? (
              <>
                <span className="font-mono text-fg tnum">{runs}</span> {runs === 1 ? 'campanha jogada' : 'campanhas jogadas'} · pontos do simulador já ganhos
              </>
            ) : (
              <>
                A primeira campanha completa vale <span className="font-mono text-fg tnum">{firstPoints}</span> pontos de conhecimento
              </>
            )}
          </p>
        </div>
      </div>
      <figure className="min-w-0 pt-6">
        <HarvestBand world="azeite" start={TODAY_DATE} months={18} extensionMonths={6} />
        <figcaption className="mt-3 text-sm text-muted">Uma campanha no simulador começa hoje e corre 18 meses sobre o calendário do olival, com a extensão possível de 6 meses.</figcaption>
      </figure>
    </div>
  );
}
