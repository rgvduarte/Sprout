import { useEffect, useState, type MouseEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge, Page, PageHeader, Section } from '../../components/ui';
import { MODULES } from '../../data';
import type { MiniGameId } from '../../data/types';
import { useRole } from '../../state';
import { GAME_IDS } from './content';
import { LearningGoalPanel } from './LearningGoal';
import { LevelPanel } from './LevelPanel';
import { MiniGames } from './MiniGames';
import { MissionsHub } from './MissionsHub';
import { ModulesPath } from './ModulesPath';
import { Rewards } from './Rewards';
import { SimuladorBand } from './SimuladorBand';

/* =====================================================================
   Academia: o jogo do conhecimento. Nível e pontos (só de aprender e
   verificar), central de missões, mini-jogos com conteúdo real, o
   percurso de módulos, a ligação ao simulador e o catálogo de
   recompensas em espécie. Não há dinheiro nesta página.
   ===================================================================== */

const SECTIONS = [
  { id: 'nivel', label: 'Nível' },
  { id: 'missoes', label: 'Missões' },
  { id: 'mini-jogos', label: 'Mini-jogos' },
  { id: 'percurso', label: 'Percurso' },
  { id: 'simulador', label: 'Simulador' },
  { id: 'recompensas', label: 'Recompensas' },
];

const isGameId = (v: string): v is MiniGameId => (GAME_IDS as string[]).includes(v);

export default function AcademiaPage() {
  const { hash } = useLocation();
  const { isVisitor } = useRole();
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<MiniGameId>('painel-prova');

  // âncoras vindas das missões: /academia#le-o-rotulo abre o jogo, /academia#m-rails abre o módulo
  useEffect(() => {
    const id = decodeURIComponent(hash.replace(/^#/, ''));
    if (!id) return;
    if (isGameId(id)) setActiveGame(id);
    else if (MODULES.some((m) => m.id === id)) setOpenModule(id);
  }, [hash]);

  const jump = (id: string) => (e: MouseEvent) => {
    // a mesma âncora duas vezes não muda a rota: desce na mesma
    if (hash === `#${id}`) {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    }
  };

  return (
    <Page>
      <PageHeader
        title="Academia"
        description="Aprende como funciona cada lote antes de decidir. Os pontos vêm de módulos, missões de diligência e mini-jogos com conteúdo real; nunca do montante investido."
        meta={
          <>
            {isVisitor && (
              <Badge tone="info" dot>
                Visitante · o progresso conta nesta sessão
              </Badge>
            )}
            <nav aria-label="Nesta página" className="w-full">
              <ul className="flex flex-wrap gap-x-1 gap-y-1">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <Link
                      to={{ hash: s.id }}
                      onClick={jump(s.id)}
                      className="inline-flex min-h-11 items-center rounded-sm px-2.5 text-[0.9375rem] font-medium text-muted underline-offset-[0.2em] hover:bg-surface-2 hover:text-fg"
                    >
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </>
        }
      />

      <LevelPanel />

      <Section id="missoes" title="Missões de conhecimento" description="Pequenas tarefas de diligência. Cada uma tem um gatilho: o evento que a fecha no momento em que acontece." className="scroll-mt-20 pt-4">
        <div className="grid min-w-0 items-start gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <MissionsHub />
          <section className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-20" aria-label="Objetivo e regras das missões">
            <LearningGoalPanel />
            <div className="px-1 text-sm">
              <h3 className="text-base">Como disparam as missões</h3>
              <p className="mt-1.5 text-muted">
                Com eventos de conhecimento e diligência: concluir um módulo, abrir um boletim, ler o último fator de risco de um lote, jogar até ao fim. A barra enche no momento em que o evento acontece.
              </p>
              <p className="mt-1.5 text-fg">Nunca com depósitos, montantes ou volume investido.</p>
            </div>
          </section>
        </div>
      </Section>

      <Section id="mini-jogos" title="Mini-jogos" description="Três jogos com conteúdo real: limites legais do azeite, rótulos de água e a prova de café. Os pontos guardam o melhor resultado de cada um." className="scroll-mt-20 pt-4">
        <MiniGames active={activeGame} onSelect={setActiveGame} />
      </Section>

      <Section id="percurso" title="Percurso do investidor informado" description="Dez módulos curtos sobre os três mundos, o ciclo de 18 meses e o caminho do dinheiro. Abrem aqui mesmo." className="scroll-mt-20 pt-4">
        <ModulesPath openId={openModule} onToggle={setOpenModule} />
      </Section>

      <Section id="simulador" title="Simulador de campanha" className="scroll-mt-20 pt-4">
        <SimuladorBand />
      </Section>

      <Section id="recompensas" title="Recompensas da colheita" description="Produto, acesso e conhecimento, desbloqueados por nível, por missões ou por participares num lote. Nunca dinheiro, nunca proporcional ao montante." className="scroll-mt-20 pt-4">
        <Rewards />
      </Section>
    </Page>
  );
}
