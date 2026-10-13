import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Radio } from 'lucide-react';
import { Badge, Meter } from '../../components/ui';
import { CommodityGlyph } from '../../components/ui/Commodity';
import { useToast } from '../../state';
import { cn } from '../../lib/cn';
import { num } from '../../lib/format';
import { MISSION_KIND_LABEL, type Mission } from './missions';

/** Missões já anunciadas como cumpridas nesta sessão (em memória, como a loja do jogo). */
const announced = new Set<string>();

function MissionItem({ mission }: { mission: Mission }) {
  const complete = mission.done >= mission.total;
  return (
    <li className="min-w-0 py-4 first:pt-0 last:pb-0" data-world={mission.world}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <Badge tone={mission.kind === 'campanha' ? 'azeite' : mission.kind === 'acesso' ? 'info' : 'accent'} icon={mission.live ? <Radio aria-hidden className="size-3.5" strokeWidth={1.75} /> : undefined}>
          {MISSION_KIND_LABEL[mission.kind]}
        </Badge>
        {mission.world && <CommodityGlyph world={mission.world} className="size-4 text-world-ink" />}
      </div>
      <div className="mt-2 flex min-w-0 items-baseline justify-between gap-3">
        <h3 className="min-w-0 text-[1.0625rem] leading-snug">{mission.title}</h3>
        <span className="shrink-0 font-mono text-sm text-fg tnum">{mission.valueText}</span>
      </div>
      {mission.context && <p className="mt-0.5 text-sm text-muted">{mission.context}</p>}
      <Meter className="mt-3" value={mission.total ? mission.done / mission.total : 0} label={`Progresso: ${mission.title}`} valueLabel={mission.valueText} showLabel={false} tone={complete ? 'ok' : 'accent'} size="sm" />
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {mission.steps.map((s) => (
          <li key={s.id} className="min-w-0">
            {s.done ? (
              <span className="inline-flex min-h-8 items-center gap-1.5 text-sm text-muted">
                <Check aria-hidden className="size-4 text-ok-ink" strokeWidth={2} />
                <span className="line-through decoration-[color-mix(in_oklab,var(--muted)_60%,transparent)]">{s.label}</span>
                <span className="sr-only"> · feito</span>
              </span>
            ) : (
              <Link to={s.href} className="inline-flex min-h-8 items-center gap-1.5 text-sm text-fg underline decoration-border underline-offset-[0.2em] hover:decoration-accent">
                <span aria-hidden className="inline-block size-3.5 shrink-0 rounded-full border-[1.5px] border-[color-mix(in_oklab,var(--fg)_35%,var(--border))]" />
                {s.label}
                {s.count && (
                  <span className="font-mono text-muted tnum">
                    {num(s.count[0])}/{num(s.count[1])}
                  </span>
                )}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {mission.reward && (
        <p className="mt-2 text-sm text-muted">
          <span className="font-medium text-fg">{mission.rewardLabel ?? 'Ganhas'}: </span>
          {mission.reward}
        </p>
      )}
    </li>
  );
}

export function MissionList({ missions, limit = 4, className }: { missions: Mission[]; limit?: number; className?: string }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const active = missions.filter((m) => m.done < m.total);
  const completed = missions.filter((m) => m.done >= m.total);
  const shown = expanded ? active : active.slice(0, limit);

  // aviso calmo quando uma missão viva fica cumprida (em < 1 s depois do evento)
  const first = useRef(true);
  useEffect(() => {
    for (const m of completed) {
      if (announced.has(m.id)) continue;
      announced.add(m.id);
      if (!first.current && m.live) toast({ tone: 'accent', title: `Missão cumprida: ${m.title}`, description: 'Acompanhaste as primeiras leituras dos depósitos desta campanha.' });
    }
    first.current = false;
  }, [completed, toast]);

  return (
    <div className={cn('min-w-0', className)}>
      {shown.length === 0 ? (
        <p className="text-muted">Sem missões por fazer. Novas missões chegam com cada lote e com a campanha.</p>
      ) : (
        <ul className="divide-y divide-border">
          {shown.map((m) => (
            <MissionItem key={m.id} mission={m} />
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm text-muted">
        <span>
          {completed.length > 0 ? `${completed.length} ${completed.length === 1 ? 'missão cumprida' : 'missões cumpridas'} nesta sessão` : 'Nenhuma missão cumprida ainda nesta sessão'}
          {' · '}
          as missões dão pontos de conhecimento, nunca dinheiro
        </span>
        {active.length > limit && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="inline-flex min-h-11 items-center gap-1 font-medium text-accent hover:underline" aria-expanded={expanded}>
            {expanded ? 'Mostrar menos' : `Mostrar mais ${active.length - limit}`}
            <ArrowRight aria-hidden className={cn('size-4 transition-transform duration-200', expanded && '-rotate-90')} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
}
