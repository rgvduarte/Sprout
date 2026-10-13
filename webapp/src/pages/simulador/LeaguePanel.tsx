import { useMemo } from 'react';
import { Check, Shuffle } from 'lucide-react';
import type { SimRunResult } from '../../data/types';
import { Button, DataTable, type Column } from '../../components/ui';
import { cn } from '../../lib/cn';
import { num, pct } from '../../lib/format';
import { managementScore, SCORE_RULES } from './engine';
import { cohortEntries, rankEntries, type LeagueEntry } from './league';
import { replayResult } from './runs';
import { PSEUDONYMS } from './store';
import { fpct, Switch } from './parts';

export interface LeagueProps {
  optIn: boolean;
  pseudonym: string;
  runs: SimRunResult[];
  onOptIn: (v: boolean) => void;
  onNextPseudonym: () => void;
}

/** Liga de campanha: opcional, com pseudónimo, só com dinheiro fictício, ordenada pela gestão. */
export function LeaguePanel({ optIn, pseudonym, runs, onOptIn, onNextPseudonym }: LeagueProps) {
  const mine = useMemo<LeagueEntry | null>(() => {
    if (!optIn || !runs.length) return null;
    const scored = runs.map((r) => {
      const run = replayResult(r);
      const f = run.final!;
      return { r, f, score: managementScore({ allocations: r.allocations, result: f.result, drawdown: f.maxDrawdown, debriefRead: true }) };
    });
    const best = scored.sort((a, b) => b.score.total - a.score.total || a.f.maxDrawdown - b.f.maxDrawdown)[0];
    return { id: 'tu', pseudonym, style: 'A tua melhor gestão da época', seed: best.r.seed, you: true, invested: best.r.invested, result: best.f.result, drawdown: best.f.maxDrawdown, score: best.score, runs: runs.length };
  }, [optIn, runs, pseudonym]);

  const ranked = useMemo(() => rankEntries([...cohortEntries(), ...(mine ? [mine] : [])]), [mine]);
  const rankOf = (e: LeagueEntry) => ranked.indexOf(e) + 1;
  const topReturn = [...ranked].sort((a, b) => b.result - a.result)[0];
  const leader = ranked[0];

  const columns: Column<LeagueEntry>[] = [
    { key: 'pos', header: '#', mono: true, align: 'right', render: (e) => `${rankOf(e)}.º` },
    {
      key: 'nome',
      header: 'Gestor',
      minWidth: 250,
      render: (e) => (
        <span className="flex flex-col">
          <span className="font-medium text-fg">
            {e.pseudonym}
            {e.you && <span className="ml-1.5 text-sm font-semibold text-accent">· tu</span>}
          </span>
          <span className="text-muted">{e.you ? `${e.style} (${e.runs} ${e.runs === 1 ? 'campanha' : 'campanhas'})` : e.style}</span>
        </span>
      ),
    },
    { key: 'pont', header: 'Pontuação', mono: true, align: 'right', render: (e) => <span className="text-[0.9375rem] font-semibold text-fg">{e.score.total}</span> },
    { key: 'rr', header: 'Risco-retorno', mono: true, align: 'right', render: (e) => num(e.score.riskReturn, 0) },
    { key: 'cov', header: 'Cobertura', mono: true, align: 'right', render: (e) => num(e.score.coverage, 0) },
    { key: 'div', header: 'Diversificação', mono: true, align: 'right', render: (e) => num(e.score.diversification, 0) },
    { key: 'deb', header: 'Balanço', align: 'center', render: (e) => (e.score.debrief ? (
          <span className="inline-flex items-center justify-center">
            <Check aria-hidden className="size-4 text-fg" strokeWidth={2} />
            <span className="sr-only">lido</span>
          </span>
        ) : (
          <span className="text-muted">não lido</span>
        )) },
    { key: 'res', header: 'Resultado', mono: true, align: 'right', render: (e) => fpct(e.result) },
    { key: 'dd', header: 'Queda máxima', mono: true, align: 'right', render: (e) => pct(-e.drawdown, 1) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="min-w-0">
        <p className="measure text-[0.9375rem] text-fg">
          Uma liga da coorte do piloto para a campanha 2026/27. É opcional, usa pseudónimos e só conta campanhas com dinheiro fictício. Ordena pela <strong className="font-semibold">pontuação de gestão</strong>, não pelo resultado: ganha quem gere o risco, não quem arrisca mais.
        </p>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <Switch
            id="liga-adesao"
            checked={optIn}
            onChange={onOptIn}
            label={optIn ? `Estás na liga como «${pseudonym}»` : 'Entrar na liga com pseudónimo'}
            description={optIn ? 'Entra a tua melhor pontuação de gestão da época. Ninguém vê o teu nome nem o teu dinheiro real.' : `Vais aparecer como «${pseudonym}». Podes sair quando quiseres.`}
          />
          <Button variant="ghost" size="sm" iconLeft={<Shuffle aria-hidden className="size-4" strokeWidth={1.75} />} onClick={onNextPseudonym}>
            Outro pseudónimo
          </Button>
        </div>
        {optIn && !mine && <p className="mt-2 text-sm text-muted">Ainda sem campanhas completas: a tua melhor pontuação entra na liga quando abrires um balanço.</p>}

        {topReturn && leader && topReturn !== leader && (
          <p className="measure mt-5 border-t border-border pt-4 text-[0.9375rem] text-fg">
            <strong className="font-semibold">O melhor gestor não é o maior resultado.</strong> «{topReturn.pseudonym}» teve {fpct(topReturn.result)}, o maior da liga, e está em {rankOf(topReturn)}.º: chegou a cair {pct(topReturn.drawdown, 1)} a meio da campanha
            {topReturn.score.coverageShare === 0 ? ' e não usou cobertura' : ''}
            {!topReturn.score.debrief ? ', nem leu o balanço' : ''}. «{leader.pseudonym}» lidera com {fpct(leader.result)} e uma queda máxima de {pct(leader.drawdown, 1)}.
          </p>
        )}

      </div>
      <aside className="min-w-0 rounded-md border border-border bg-surface p-4 sm:p-5" aria-labelledby="formula-title">
        <h3 id="formula-title" className="text-[1.0625rem]">
          Como se calcula a pontuação
        </h3>
        <p className="mt-1 text-sm text-muted">De 0 a 100, pela melhor campanha de cada gestor na época.</p>
        <dl className="mt-4 flex flex-col gap-3.5 text-sm">
          <FormulaRow term="Risco-retorno" max={SCORE_RULES.riskReturnMax}>
            Resultado menos {num(SCORE_RULES.drawdownWeight, 1)} × a queda máxima a meio da campanha. {pct(SCORE_RULES.floor, 0)} ou pior vale 0; {pct(SCORE_RULES.ceiling, 0, { sign: true })} ou melhor vale {SCORE_RULES.riskReturnMax}.
          </FormulaRow>
          <FormulaRow term="Cobertura" max={SCORE_RULES.coverageMax}>
            Parte do montante em preço volátil (azeite, café) que tinha cobertura. Sem lotes voláteis, conta por inteiro.
          </FormulaRow>
          <FormulaRow term="Diversificação" max={SCORE_RULES.diversificationMax}>
            Até {SCORE_RULES.diversificationMax / 2} pela repartição entre lotes (nenhum dominante) e {SCORE_RULES.diversificationMax / 2} por teres pelo menos dois mercados.
          </FormulaRow>
          <FormulaRow term="Balanço lido" max={SCORE_RULES.debriefPoints}>
            Abrir e ler o balanço da campanha.
          </FormulaRow>
        </dl>
        <p className="mt-4 border-t border-border pt-3 text-sm text-muted">
          A liga existe só no simulador. Com dinheiro real não há rankings, comparações nem pontos: a carteira mostra os teus lotes e mais nada.
        </p>
      </aside>
      </div>
        <div className="min-w-0">
          <DataTable
            columns={columns}
            rows={ranked}
            getRowId={(e) => e.id}
            caption={`Liga de campanha 2026/27: ${ranked.length} gestores, ordenados pela pontuação de gestão (dinheiro fictício)`}
            rowClassName={(e) => (e.you ? 'bg-accent-soft' : undefined)}
            maxHeight={620}
          />
        </div>
    </div>
  );
}

function FormulaRow({ term, max, children }: { term: string; max: number; children: React.ReactNode }) {
  return (
    <div>
      <dt className="flex items-baseline justify-between gap-3 font-medium text-fg">
        {term}
        <span className={cn('font-mono text-muted tnum')}>até {max}</span>
      </dt>
      <dd className="mt-0.5 text-muted">{children}</dd>
    </div>
  );
}

export const pseudonymFor = (index: number) => PSEUDONYMS[((index % PSEUDONYMS.length) + PSEUDONYMS.length) % PSEUDONYMS.length];
