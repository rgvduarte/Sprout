import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Check } from 'lucide-react';
import { PRODUCT_DIRECTIVE, SOURCE_DOC } from '../../data';
import { SegmentedControl } from '../../components/ui';
import { cn } from '../../lib/cn';
import { ADOPTED, REJECTED, type Pattern } from './content';

/* =====================================================================
   Revisão da gamificação: cada padrão das referências dos fundadores,
   adotado (e como foi adaptado aos mercados da Sprout) ou rejeitado (e
   porquê). Leitura densa, uma linha por padrão.
   ===================================================================== */

type Filter = 'todos' | 'adotados' | 'rejeitados';

function PatternRow({ p, kind }: { p: Pattern; kind: 'adotado' | 'rejeitado' }) {
  const adopted = kind === 'adotado';
  return (
    <li className="grid gap-x-8 gap-y-3 border-t border-border py-5 lg:grid-cols-[15rem_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <h3 className="flex items-start gap-2 text-[1.0625rem] leading-snug">
          {adopted ? <Check aria-label="Adotado" className="mt-0.5 size-4 shrink-0 text-ok-ink" strokeWidth={2.25} /> : <Ban aria-label="Rejeitado" className="mt-0.5 size-4 shrink-0 text-crit-ink" strokeWidth={1.75} />}
          {p.name}
        </h3>
        <p className="mt-1 pl-6 text-sm text-muted">{p.refs}</p>
      </div>
      <dl className="min-w-0 space-y-2 text-[0.9375rem]">
        <div>
          <dt className="text-sm text-muted">Na referência</dt>
          <dd className="text-fg">{p.original}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">{adopted ? 'Na Sprout' : 'O que fazemos em vez disso'}</dt>
          <dd className="text-fg">{p.sprout}</dd>
        </div>
      </dl>
      <dl className="min-w-0 space-y-2 text-[0.9375rem]">
        <div>
          <dt className="text-sm text-muted">{adopted ? 'Porque é seguro' : 'Porque foi rejeitado'}</dt>
          <dd className="text-fg">{p.why}</dd>
        </div>
        {p.where && (
          <div>
            <dt className="text-sm text-muted">Onde está</dt>
            <dd className="flex flex-wrap gap-x-4">
              {p.where.map((w) => (
                <Link key={w.href} to={w.href} className="inline-flex min-h-11 items-center font-medium text-accent underline decoration-[color-mix(in_oklab,var(--accent)_40%,transparent)] underline-offset-[0.2em] hover:decoration-accent">
                  {w.label}
                </Link>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </li>
  );
}

export default function RevisaoTab() {
  const [filter, setFilter] = useState<Filter>('todos');
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="diretriz-t" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <h2 id="diretriz-t" className="text-[1.375rem] leading-tight">
            A linha que mantém o jogo legal
          </h2>
          <p className="measure mt-2 text-muted">
            Os fundadores pediram uma app de investimento com sensação de jogo. A diretriz aprovada a 13/10 continua em vigor: o jogo vive no conhecimento, na colheita física e num simulador com dinheiro fictício; os retornos reais nunca são jogados.
          </p>
          <p className="mt-2 text-sm text-muted">
            Fonte: <span className="text-fg">{SOURCE_DOC.title}</span>, decisão de produto.
          </p>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="border-t-2 border-ok pt-3">
            <dt className="flex items-center gap-2 font-semibold text-fg">
              <Check aria-hidden className="size-4 text-ok-ink" strokeWidth={2.25} />
              UX permitida
            </dt>
            <dd className="mt-1 text-[0.9375rem] text-fg">{PRODUCT_DIRECTIVE.permitida}</dd>
          </div>
          <div className="border-t-2 border-crit pt-3">
            <dt className="flex items-center gap-2 font-semibold text-fg">
              <Ban aria-hidden className="size-4 text-crit-ink" strokeWidth={1.75} />
              Proibição estrita
            </dt>
            <dd className="mt-1 text-[0.9375rem] text-fg">{PRODUCT_DIRECTIVE.proibida}</dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">
          <span className="font-mono text-fg tnum">{ADOPTED.length}</span> padrões adotados e adaptados, <span className="font-mono text-fg tnum">{REJECTED.length}</span> rejeitados.
        </p>
        <SegmentedControl<Filter>
          label="Padrões a mostrar"
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'adotados', label: 'Adotados' },
            { value: 'rejeitados', label: 'Rejeitados' },
          ]}
        />
      </div>

      {filter !== 'rejeitados' && (
        <section aria-labelledby="adotados-t">
          <h2 id="adotados-t" className="text-[1.25rem] leading-tight">
            Adotados, adaptados aos mercados da Sprout
          </h2>
          <ul className="mt-3">
            {ADOPTED.map((p) => (
              <PatternRow key={p.id} p={p} kind="adotado" />
            ))}
          </ul>
        </section>
      )}

      {filter !== 'adotados' && (
        <section aria-labelledby="rejeitados-t" className={cn(filter === 'todos' && 'mt-4')}>
          <h2 id="rejeitados-t" className="text-[1.25rem] leading-tight">
            Rejeitados
          </h2>
          <ul className="mt-3">
            {REJECTED.map((p) => (
              <PatternRow key={p.id} p={p} kind="rejeitado" />
            ))}
          </ul>
        </section>
      )}

      <p className="max-w-[60ch] text-sm text-muted">
        Referências indicadas pelos fundadores: Smartico e Solitics (gamificação de trading), PlayEstates (play-to-earn imobiliário), Coral (app de imobiliário gamificada da Z1), Nasdaq, CFA Institute e Ontario Securities Commission (estudos sobre gamificação no investimento), Fundrise, Arrived e RealtyMogul (crowdfunding imobiliário).
      </p>
    </div>
  );
}
