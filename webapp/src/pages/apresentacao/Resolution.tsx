import { Link } from 'react-router-dom';
import { ArrowRight, CalendarRange } from 'lucide-react';
import { ButtonLink } from '../../components/ui';
import { tidyText } from '../../lib/format';
import { Frame } from './parts';

/* =====================================================================
   7 · Resolução. Acesso por convite, as duas ações e o aviso completo,
   numa faixa no verde-oliva do rail.
   ===================================================================== */

const STEPS = [
  { title: 'Pedido de acesso', body: 'Dados da pessoa ou da empresa e um contacto. Cerca de dois minutos.' },
  { title: 'Verificação KYC/KYB', body: 'Identidade, beneficiário efetivo, origem dos fundos e classificação como investidor qualificado.' },
  { title: 'Teste de adequação', body: 'Perguntas curtas sobre prazo, liquidez e a possibilidade de perda.' },
  { title: 'Convite e primeiro lote', body: 'Com o convite, escolhes um lote aberto. Cada compromisso tem 4 dias de reflexão, em que podes cancelar sem custos.' },
];

export function Resolution() {
  return (
    <section id="acesso" data-chapter="Acesso" aria-labelledby="apr-acesso" className="on-rail bg-rail text-rail-fg">
      <Frame className="py-16 sm:py-24">
        <div className="grid min-w-0 gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <div className="min-w-0">
            <h2 id="apr-acesso" className="text-[clamp(2rem,1.3rem+2.2vw,3.25rem)] leading-[1.04] tracking-[-0.02em] text-rail-fg">
              Acesso por convite
            </h2>
            <p className="measure mt-4 text-lg leading-relaxed text-rail-fg">
              O piloto abre a uma coorte pequena de investidores qualificados, com lotes de azeite e de água da campanha 2026/27. O café entra na Fase 2, em 2027.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/onboarding"
                className="relative inline-flex h-12 select-none items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-rail-fg px-5 text-base font-medium text-rail no-underline transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--rail-fg)_86%,var(--rail))] hover:no-underline motion-safe:active:translate-y-px"
              >
                Pedir acesso
                <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
              </Link>
              <ButtonLink to="/academia/simulador" variant="on-rail" size="lg" iconLeft={<CalendarRange aria-hidden className="size-4" strokeWidth={1.75} />}>
                Jogar uma campanha
              </ButtonLink>
            </div>
            <p className="measure mt-6 text-[0.9375rem] leading-relaxed text-rail-muted">
              Ainda não és investidor qualificado? O piloto não está aberto a retalho. Os mundos, a Academia e o Simulador estão abertos a qualquer visitante, sem registo.
            </p>
          </div>
          <div className="min-w-0">
            <h3 className="text-[1.1875rem] text-rail-fg">Como se entra</h3>
            <ol className="mt-4 flex flex-col">
              {STEPS.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 border-t border-rail-border py-4">
                  <span className="font-mono text-sm text-rail-muted tnum">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-rail-fg">{s.title}</span>
                    <span className="mt-0.5 block text-[0.9375rem] leading-relaxed text-rail-muted">{tidyText(s.body)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div role="note" className="mt-14 border-t border-rail-border pt-6">
          <p className="max-w-[60ch] text-sm leading-relaxed text-rail-muted">
            <strong className="font-semibold text-rail-fg">Comunicação informativa.</strong> Não constitui oferta pública, recomendação de investimento nem promessa de rentabilidade. Acesso restrito a investidores qualificados.{' '}
            <strong className="font-semibold text-rail-fg">Capital em risco:</strong> pode perder parte ou a totalidade do montante financiado e não há mercado secundário antes da liquidação. Ambiente de demonstração: produtores, lotes e números são fictícios.
          </p>
        </div>
      </Frame>
    </section>
  );
}
