import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, CalendarRange } from 'lucide-react';
import { LevelGlyph, OriginSeal, Reveal, TileMap, TileMapLegend } from '../../components/game';
import { ButtonLink, SimulationLabel } from '../../components/ui';
import { CommodityGlyph } from '../../components/ui/Commodity';
import { getProducersByRegion, getRegion, LEVELS, SEALS, SIM_EVENTS, SIM_RULES, WORLDS } from '../../data';
import { useData, useGame } from '../../state';
import { eur, num, tidyText } from '../../lib/format';
import { cn } from '../../lib/cn';
import { ChapterHead, Frame } from './parts';

/* =====================================================================
   5 · O jogo. Uma cena composta num só tabuleiro: o mapa das origens (a
   funcionar contra o estado do jogo), um selo de origem, os níveis de
   conhecimento e o simulador. Por baixo, a regra que separa jogo e dinheiro.
   ===================================================================== */

const EXAMPLE_SEAL = SEALS.find((s) => s.id === 'seal-ribeira-2627')!;

/** Três cartas possíveis do baralho do simulador, em meses de exemplo. */
const DECK_EXAMPLE = [
  { id: 'procura-forte', month: 5 },
  { id: 'choque-preco', month: 9 },
  { id: 'atraso-vendas', month: 13 },
].map((e) => ({ ...e, event: SIM_EVENTS.find((x) => x.id === e.id)! }));

const PLAYS = [
  'Missões de diligência por lote: ler o boletim de análises, abrir os fatores de risco.',
  'Mini-jogos com conteúdo real: painel de prova do azeite, rótulos de água, da cereja à chávena.',
  'Selos e cartas de origem, por produtor e campanha. Não se transferem nem se vendem.',
  'Simulador com dinheiro fictício, onde se ganha e se perde, e uma liga opcional e pseudónima.',
];
const NEVER = [
  'Pontos, níveis ou recompensas ligados ao montante investido.',
  'Rankings de investidores ou comparação de rentabilidades.',
  'Sequências, confetes ou celebrações de ganhos.',
  'Contagens decrescentes, escassez ou empurrões para investir mais.',
  'Promessas de rentabilidade.',
];

export function GameSection() {
  const { regionStates, seals } = useData();
  const game = useGame();
  const { visitRegion } = game;
  const [regionId, setRegionId] = useState('tras-os-montes');
  const region = getRegion(regionId)!;
  const producers = getProducersByRegion(regionId);
  const sealProducer = seals.find((s) => s.def.id === EXAMPLE_SEAL.id)!;
  const earnedCount = seals.filter((s) => s.earned).length;

  const select = (id: string) => {
    setRegionId(id);
    visitRegion(id);
  };

  return (
    <section id="jogo" data-chapter="O jogo" aria-labelledby="apr-jogo" className="scroll-mt-12 py-16 sm:py-24">
      <Frame>
        <ChapterHead
          id="apr-jogo"
          title="O jogo"
          lead="Cada mercado é um mundo, cada campanha uma estação e cada lote uma missão física. Sobe-se de nível a aprender e a fazer diligência; o retorno e o risco só se jogam no simulador, com dinheiro fictício."
        />

        <Reveal className="mt-10">
          <div className="grid min-w-0 overflow-hidden rounded-md border border-border bg-surface lg:grid-cols-[minmax(0,5fr)_minmax(0,3.4fr)_minmax(0,3.6fr)]">
            {/* mundos e origens */}
            <div className="min-w-0 p-5 sm:p-6">
              <h3 className="text-[1.1875rem]">Mundos e origens</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">Uma região acende quando estudas a origem e fica cheia quando financias um lote de lá. Toca numa região.</p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {WORLDS.map((w) => (
                  <li key={w.id}>
                    <Link to={`/mercados/${w.id}`} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-fg underline decoration-border underline-offset-[0.2em] hover:decoration-fg">
                      <CommodityGlyph world={w.id} className={cn('size-4', w.id === 'azeite' ? 'text-azeite-ink' : w.id === 'agua' ? 'text-agua-ink' : 'text-cafe-ink')} />
                      {w.nome}
                      {w.faseLabel && <span className="font-normal text-muted">· {w.faseLabel.replace('Fase 2 · ', '')}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              <TileMap map="pt" states={regionStates} selectedId={regionId} onSelect={select} className="mt-3 max-w-[440px]" title="Mapa das origens em Portugal (azeite e água)" />
              <TileMapLegend className="mt-2" />
              <div className="mt-4 border-t border-border pt-3 text-sm" aria-live="polite">
                <p className="font-semibold text-fg">
                  {region.nome}
                  <span className="font-normal text-muted"> · {regionStates[regionId] === 'participated' ? 'participado' : regionStates[regionId] === 'learned' ? 'aprendido' : 'por explorar'}</span>
                </p>
                <p className="mt-0.5 leading-relaxed text-muted">{region.description}</p>
                <p className="mt-1 text-muted">{producers.length ? `No piloto: ${producers.map((p) => p.nome).join(', ')}.` : 'Sem produtores no piloto.'}</p>
              </div>
            </div>

            {/* selo e níveis */}
            <div className="min-w-0 border-t border-border p-5 sm:p-6 lg:border-l lg:border-t-0">
              <h3 className="text-[1.1875rem]">Selos e níveis</h3>
              <div className="mt-3 flex items-center gap-4">
                <OriginSeal seal={EXAMPLE_SEAL} producer={sealProducer.producer} region={sealProducer.region} state="earned" size={104} className="shrink-0" />
                <p className="min-w-0 text-sm leading-relaxed text-muted">
                  Um selo de lacre por produtor e campanha. Este, do {sealProducer.producer.nome}, ganha-se com um compromisso no lote ou com {EXAMPLE_SEAL.questIds.length} missões de diligência.
                </p>
              </div>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 text-sm text-muted">
                <span>
                  No teu caderno: <span className="font-medium text-fg tnum">{earnedCount}</span> de <span className="tnum">{seals.length}</span> selos.
                </span>
                <Link to="/caderno" className="inline-flex min-h-11 items-center font-medium text-accent underline underline-offset-[0.2em]">
                  Abrir o caderno
                </Link>
              </p>
              <ol className="mt-3 flex flex-col border-t border-border" aria-label="Níveis de conhecimento">
                {LEVELS.map((l) => {
                  const current = game.level.id === l.id;
                  return (
                    <li key={l.id} className={cn('flex items-start gap-3 border-b border-border px-2 py-2.5', current && 'bg-accent-soft')} aria-current={current ? 'step' : undefined}>
                      <LevelGlyph level={l.id} className={cn('mt-0.5', current ? 'text-accent' : 'text-muted')} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-medium text-fg">{l.nome}</span>
                          <span className="font-mono text-xs text-muted tnum">{num(l.minPoints)} pts</span>
                        </span>
                        <span className="block text-[13px] leading-snug text-muted">{current ? `O teu nível: ${num(game.points)} pontos.` : l.description}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-3 text-sm leading-relaxed text-muted">Cada nível abre conhecimento e acesso: relatório técnico, prova guiada, visita ao lagar. Nunca preço, comissão ou prioridade.</p>
            </div>

            {/* simulador */}
            <div className="min-w-0 border-t border-border p-5 sm:p-6 lg:border-l lg:border-t-0">
              <h3 className="text-[1.1875rem]">Simulador de campanha</h3>
              <SimulationLabel className="mt-2" />
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Distribuis {eur(SIM_RULES.budget)} fictícios por lotes e jogas {SIM_RULES.months} meses. O baralho traz choques de preço, colheitas fracas, atrasos e procura forte; a cobertura, a reserva de primeira perda, a extensão e o refunding mudam o desfecho, que pode ser perda.
              </p>
              <DeckStrip />
              <p className="mt-4 text-sm leading-relaxed text-muted">A liga de campanha é opcional e pseudónima, e ordena pela pontuação de gestão: resultado face à maior queda, cobertura, diversificação e debrief. Não ganha quem arrisca mais.</p>
              <ButtonLink to="/academia/simulador" variant="secondary" className="mt-4" iconLeft={<CalendarRange aria-hidden className="size-4" strokeWidth={1.75} />}>
                Jogar uma campanha
              </ButtonLink>
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid min-w-0 gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <p className="font-display text-[clamp(1.5rem,1.1rem+1.2vw,2.125rem)] font-bold leading-[1.12] tracking-[-0.015em] text-fg">O jogo está no conhecimento e na colheita; o dinheiro é tratado com seriedade.</p>
          <div className="grid min-w-0 gap-8 sm:grid-cols-2">
            <RuleList title="Conta para o jogo" items={PLAYS} kind="yes" />
            <RuleList title="Nunca, com dinheiro real" items={NEVER} kind="no" />
          </div>
        </div>
      </Frame>
    </section>
  );
}

function RuleList({ title, items, kind }: { title: string; items: string[]; kind: 'yes' | 'no' }) {
  const Icon = kind === 'yes' ? Check : X;
  return (
    <div className="min-w-0">
      <h3 className="text-base">{title}</h3>
      <ul className="mt-3 flex flex-col gap-2.5">
        {items.map((it) => (
          <li key={it} className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-fg">
            <Icon aria-hidden className={cn('mt-[0.3em] size-4 shrink-0', kind === 'yes' ? 'text-accent' : 'text-crit-ink')} strokeWidth={2} />
            <span className="min-w-0">{tidyText(it)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Faixa de 18 meses com três cartas possíveis do baralho. */
function DeckStrip() {
  const months = Array.from({ length: SIM_RULES.months }, (_, i) => i + 1);
  return (
    <figure className="mt-4 min-w-0">
      <div className="grid grid-cols-[repeat(18,minmax(0,1fr))] gap-[2px]" aria-hidden>
        {months.map((m) => {
          const ev = DECK_EXAMPLE.find((e) => e.month === m);
          return (
            <div
              key={m}
              className={cn('h-6 rounded-[2px]', ev ? (ev.event.tone === 'adverso' ? 'bg-[color-mix(in_oklab,var(--fg)_62%,var(--surface))]' : 'bg-[color-mix(in_oklab,var(--accent)_70%,var(--surface))]') : 'bg-surface-2')}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-muted tnum" aria-hidden>
        <span>mês 1</span>
        <span>mês {SIM_RULES.months}</span>
      </div>
      <figcaption className="mt-2">
        <ul className="flex flex-col gap-1 text-[13px]">
          {DECK_EXAMPLE.map((e) => (
            <li key={e.id} className="flex items-baseline gap-2">
              <span className="w-12 shrink-0 font-mono text-muted tnum">mês {e.month}</span>
              <span className="text-fg">{e.event.title}</span>
              <span className="text-muted">· {e.event.tone === 'adverso' ? 'adverso' : 'favorável'}</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
