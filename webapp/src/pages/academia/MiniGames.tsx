import { useRef, type KeyboardEvent } from 'react';
import { Check } from 'lucide-react';
import { getMiniGame, getWorld, QUESTS } from '../../data';
import type { MiniGameId } from '../../data/types';
import { useGame } from '../../state';
import { cn } from '../../lib/cn';
import { miniGamePointsFor } from './points';
import { GAME_IDS } from './content';
import { CerejaArt, PainelArt, RotuloArt } from './games/art';
import { CerejaChavena } from './games/CerejaChavena';
import { LeORotulo } from './games/LeORotulo';
import { PainelProva } from './games/PainelProva';

/* =====================================================================
   Os três mini-jogos, cada um com a sua identidade desenhada (ouro de
   azeite, azul de nascente, castanho de café). Os jogos ficam montados
   ao mudar de separador: o progresso de uma partida não se perde.
   ===================================================================== */

const ART: Record<MiniGameId, typeof PainelArt> = { 'painel-prova': PainelArt, 'le-o-rotulo': RotuloArt, 'cereja-chavena': CerejaArt };

const RULES: Record<MiniGameId, string> = {
  'painel-prova': 'Primeiro associa nove descrições aos atributos e defeitos da folha de prova oficial. Depois classifica seis amostras com o boletim e o painel: virgem extra, virgem ou lampante. Conta cada amostra certa.',
  'le-o-rotulo': 'Cinco rótulos de água. Em cada um, a classe pela mineralização total e uma pergunta sobre o que o rótulo pode ou tem de dizer. Conta o rótulo com as duas respostas certas.',
  'cereja-chavena': 'Seis respostas em três rondas: a ordem das etapas da cereja à prova, o efeito de cada processo na chávena e no custo, e a leitura de uma folha de prova SCA.',
};

export function MiniGames({ active, onSelect }: { active: MiniGameId; onSelect: (id: MiniGameId) => void }) {
  const game = useGame();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent, i: number) => {
    let next: number | undefined;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % GAME_IDS.length;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + GAME_IDS.length) % GAME_IDS.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = GAME_IDS.length - 1;
    if (next === undefined) return;
    e.preventDefault();
    tabs.current[next]?.focus();
    onSelect(GAME_IDS[next]);
  };

  return (
    <div className="min-w-0">
      <div role="tablist" aria-label="Mini-jogos" className="grid gap-2 md:grid-cols-3">
        {GAME_IDS.map((id, i) => {
          const meta = getMiniGame(id);
          const world = getWorld(meta.world);
          const best = game.miniGameBest(id);
          const pts = miniGamePointsFor(id, best);
          const Art = ART[id];
          const selected = id === active;
          return (
            <button
              key={id}
              id={id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${id}-jogo`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(id)}
              onKeyDown={(e) => onKey(e, i)}
              data-world={meta.world}
              className={cn(
                'grid min-w-0 scroll-mt-24 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md border px-3 py-3 text-left transition-[background-color,border-color] duration-200',
                selected ? 'border-world-ink bg-world-soft' : 'border-border bg-surface hover:border-world-line hover:bg-world-soft',
              )}
            >
              <Art className="size-14" />
              <span className="min-w-0">
                <span className="block font-display text-[1.125rem] font-semibold leading-tight text-fg">{meta.title}</span>
                <span className="mt-0.5 block text-sm text-world-ink">
                  {world.nome}
                  {world.faseLabel ? ` · ${world.faseLabel}` : ''}
                </span>
                <span className="mt-1 flex items-center gap-1.5 font-mono text-xs text-muted tnum">
                  {best ? (
                    <>
                      <Check aria-hidden className="size-3.5 text-accent" strokeWidth={2.5} />
                      melhor {best}/{meta.maxScore} · {pts}/{meta.maxPoints} pts
                    </>
                  ) : (
                    `por jogar · até ${meta.maxPoints} pts`
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {GAME_IDS.map((id) => {
        const meta = getMiniGame(id);
        const Art = ART[id];
        const quest = QUESTS.find((q) => q.criteria.type === 'minigame' && q.criteria.gameId === id);
        const questDone = quest ? game.isQuestDone(quest.id) : false;
        return (
          <div key={id} id={`${id}-jogo`} role="tabpanel" aria-labelledby={id} hidden={id !== active} data-world={meta.world} className="mt-4 min-w-0">
            <div className="flex min-w-0 flex-wrap items-start gap-x-5 gap-y-3 rounded-md bg-world-soft px-4 py-4 sm:px-5">
              <Art className="hidden size-20 shrink-0 sm:block" />
              <div className="min-w-0 flex-1">
                <h3 className="text-[1.375rem] text-fg">{meta.title}</h3>
                <p className="mt-1 max-w-[60ch] text-[0.9375rem] text-fg">{RULES[id]}</p>
                {quest && (
                  <p className="mt-2 text-sm text-world-ink">
                    Missão: {quest.title} · <span className="font-mono tnum">+{quest.points} pts</span> · {questDone ? 'cumprida' : `precisa de ${quest.criteria.type === 'minigame' ? quest.criteria.minScore : ''} certas`}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 min-w-0">
              {id === 'painel-prova' && <PainelProva />}
              {id === 'le-o-rotulo' && <LeORotulo />}
              {id === 'cereja-chavena' && <CerejaChavena />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
