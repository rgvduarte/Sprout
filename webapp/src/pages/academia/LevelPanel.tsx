import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { KnowledgeLevelBadge } from '../../components/game';
import { Meter } from '../../components/ui';
import { TOTAL_KNOWLEDGE_POINTS } from '../../data';
import { useGame } from '../../state';
import { cn } from '../../lib/cn';
import { num } from '../../lib/format';
import { LEVEL_PERKS } from './content';
import { pointsBreakdown } from './points';
import { Terraces } from './Terraces';

/** Nível, pontos de conhecimento e o que o próximo nível desbloqueia. */
export function LevelPanel() {
  const game = useGame();
  const reduce = useReducedMotion();
  const { points, level, nextLevel, levelProgress, pointsToNext } = game;
  const sources = pointsBreakdown(game);

  // último ganho de pontos nesta visita (para o mostrar ao lado da barra)
  const prev = useRef(points);
  const [gain, setGain] = useState<{ value: number; key: number } | null>(null);
  useEffect(() => {
    const diff = points - prev.current;
    prev.current = points;
    if (diff > 0) setGain({ value: diff, key: Date.now() });
    if (diff < 0) setGain(null);
  }, [points]);

  return (
    <section id="nivel" aria-labelledby="nivel-title" className="grid scroll-mt-20 items-start gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <Terraces points={points} className="order-2 lg:order-1" />
      <div className="order-1 min-w-0 lg:order-2">
        <h2 id="nivel-title" className="sr-only">
          O teu nível de conhecimento
        </h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <KnowledgeLevelBadge level={level} />
          <p className="text-sm text-muted">
            <span className="font-mono text-base text-fg tnum">{num(points)}</span> de <span className="font-mono tnum">{num(TOTAL_KNOWLEDGE_POINTS)}</span> pontos de conhecimento
          </p>
        </div>

        {nextLevel ? (
          <div className="mt-5">
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-muted">
                {level.nome} → {nextLevel.nome}
              </span>
              <span className="flex items-baseline gap-2">
                <AnimatePresence>
                  {gain && (
                    <motion.span
                      key={gain.key}
                      className="rounded-xs bg-accent-soft px-1.5 font-mono text-accent tnum"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      +{gain.value}
                      <span className="sr-only"> pontos agora</span>
                    </motion.span>
                  )}
                </AnimatePresence>
                <span className="font-mono text-fg tnum">
                  {num(points - level.minPoints)} de {num(nextLevel.minPoints - level.minPoints)}
                </span>
              </span>
            </div>
            <Meter value={levelProgress} label={`Pontos até ${nextLevel.nome}`} showLabel={false} />
            <p className="mt-3 text-[0.9375rem] text-fg">
              Faltam <span className="font-mono tnum">{num(pointsToNext)}</span> pontos para <strong className="font-semibold">{nextLevel.nome}</strong>: {LEVEL_PERKS[nextLevel.id].short}.
            </p>
          </div>
        ) : (
          <p className="mt-5 text-[0.9375rem] text-fg">Chegaste ao último nível. {LEVEL_PERKS[level.id].short.replace(/^./, (c) => c.toUpperCase())} já estão disponíveis.</p>
        )}

        <dl className="mt-6 divide-y divide-border border-y border-border">
          {sources.map((s) => (
            <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 py-2">
              <dt className="min-w-0 text-sm">
                <span className="text-fg">{s.label}</span> <span className="text-muted">· {s.detail}</span>
              </dt>
              <dd className={cn('font-mono text-sm tnum', s.earned > 0 ? 'text-fg' : 'text-muted')}>
                {num(s.earned)} <span className="text-muted">/ {num(s.max)}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-muted">Os pontos vêm só de aprender e verificar. Não dependem do montante investido, não se trocam e não dão melhores condições em nenhum lote.</p>
      </div>
    </section>
  );
}
