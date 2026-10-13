import { ArrowRight, CalendarRange } from 'lucide-react';
import { ButtonLink } from '../../components/ui';
import { DemoBadge } from '../../app/AppShell';
import { useData } from '../../state';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { cn } from '../../lib/cn';
import { tidyText } from '../../lib/format';
import { LABEL_BASE_Y, LABEL_COLUMNS, LS_H, OliveLandscape } from './OliveLandscape';
import { FOCUS_PRODUCER_ID } from './model';
import { Frame } from './parts';

/* =====================================================================
   1 · A colheita. Primeiro ecrã completo: o título, a tese com os números
   do documento-fonte, as duas ações e o olival desenhado com etiquetas.
   ===================================================================== */

const LABELS = [
  { title: 'Compra direta ao lagar', detail: 'Azeite a granel, sem embalador pelo meio: o lagar recebe mais cedo.' },
  { title: 'IBC de 1 000 kg, selados', detail: 'Cada lote tem número, análise e uma janela de 18 meses.' },
  { title: 'Comprador B2B', detail: 'Paga 10–15 % abaixo da referência de mercado.' },
].map((l) => ({ title: tidyText(l.title), detail: tidyText(l.detail) }));

const SUBHEAD = tidyText(
  'A Sprout compra azeite e água diretamente a lagares e nascentes, sem intermediários pelo meio, e vende a distribuição, HoReCa e retalho 10–15 % abaixo da referência de mercado. Investidores qualificados financiam lotes concretos, em janelas de 18 meses, e seguem cada quilo do depósito à liquidação.',
);

const ILLUSTRATION = 'Ilustração: olival em filas num monte, o lagar com quatro depósitos de inox, IBC de 1 000 kg numa palete e um camião a sair para o comprador.';

export function Hook() {
  const wide = useMediaQuery('(min-width: 1100px)', true);
  const { telemetry } = useData();
  const deposits = (telemetry[FOCUS_PRODUCER_ID] ?? []).map((u) => ({ id: u.id, fraction: u.capacity ? u.level / u.capacity : 0 }));

  return (
    <section id="colheita" data-chapter="A colheita" aria-labelledby="apr-titulo" className="relative isolate overflow-hidden" style={wide ? { minHeight: 'max(640px, calc(100dvh - 101px))' } : undefined}>
      <Frame className={cn('relative z-10', wide ? 'pb-[calc(12vw+0.5rem)] pt-[clamp(2.5rem,6.5vh,4.5rem)]' : 'pb-10 pt-10 sm:pt-14')}>
        <div className={wide ? 'max-w-[min(38rem,52vw)]' : 'max-w-[42rem]'}>
          <h1 id="apr-titulo" className="text-[clamp(2.5rem,1.35rem+3.9vw,4.75rem)] leading-[1.02] tracking-[-0.03em]">
            Uma parte da colheita, não um ecrã de cotações.
          </h1>
          <p className="mt-6 text-[1.125rem] leading-relaxed text-[color-mix(in_oklab,var(--fg)_86%,var(--bg))] sm:text-[1.1875rem]">
            {SUBHEAD}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink to="/onboarding" variant="primary" size="lg" iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
              Pedir acesso
            </ButtonLink>
            <ButtonLink to="/academia/simulador" variant="secondary" size="lg" iconLeft={<CalendarRange aria-hidden className="size-4" strokeWidth={1.75} />}>
              Jogar uma campanha
            </ButtonLink>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
            <span>Piloto fechado, por convite · azeite e água · café na Fase 2, em 2027</span>
            <span className="lg:hidden">
              <DemoBadge short />
            </span>
          </div>
        </div>
      </Frame>

      {wide ? (
        <div className="absolute inset-x-0 bottom-0 z-0">
          <p className="sr-only">{ILLUSTRATION}</p>
          <OliveLandscape deposits={deposits}>
            {LABELS.map((l, i) => {
              const left = LABEL_COLUMNS[i];
              const next = LABEL_COLUMNS[i + 1] ?? 1;
              return (
                <div
                  key={l.title}
                  className="absolute pl-3 text-sm leading-snug"
                  style={{ left: `${left * 100}%`, bottom: `${(1 - LABEL_BASE_Y / LS_H) * 100}%`, width: `calc(${(next - left) * 100}% - ${i === LABELS.length - 1 ? 28 : 14}px)` }}
                >
                  <p className="font-semibold text-fg">{l.title}</p>
                  <p className="mt-0.5 text-muted">{l.detail}</p>
                </div>
              );
            })}
          </OliveLandscape>
        </div>
      ) : (
        <div>
          <p className="sr-only">{ILLUSTRATION}</p>
          <OliveLandscape deposits={deposits} crop leaders={false} />
          <Frame className="border-t border-border py-6">
            <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
              {LABELS.map((l) => (
                <li key={l.title} className="text-[0.9375rem] leading-snug">
                  <p className="font-semibold text-fg">{l.title}</p>
                  <p className="mt-0.5 text-muted">{l.detail}</p>
                </li>
              ))}
            </ul>
          </Frame>
        </div>
      )}
    </section>
  );
}
