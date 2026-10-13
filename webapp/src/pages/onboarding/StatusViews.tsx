import { useState } from 'react';
import { Check, FileText } from 'lucide-react';
import { Button, ButtonLink, Card, CardHeader, Disclaimer, Field, Input, KeyValue, StatusPill, Timeline, type TimelineItem } from '../../components/ui';
import type { InvestorClass } from '../../data/types';
import { useRole, useToast, type ProfileId } from '../../state';
import { addMonths, now, toDate } from '../../lib/clock';
import { date as fmtDate, dateTime, monthYear } from '../../lib/format';
import { cn } from '../../lib/cn';
import { STEPS, useDraft } from './draft';
import { LearningGoalPanel } from './LearningGoal';
import { useLearningGoal } from './learningGoal';
import { caseLabel } from './kycCase';
import { formatCertidao, validateCertidao } from './validation';

/* =====================================================================
   Estados do registo depois da submissão: em análise, concluído e
   bloqueado (lista de interesse). Linguagem calma, sem pressa nem dinheiro.
   ===================================================================== */

export interface CaseView {
  id: string;
  nome: string;
  tipo: 'pessoa-coletiva' | 'pessoa-singular';
  classe: InvestorClass;
  /** como chegou à qualificação */
  rota: string;
  pais: string;
  submittedAt: string;
  decidedAt?: string;
  documentos: { name: string; note: string }[];
  pep: boolean;
  risco: 'baixo' | 'elevado';
}

export const CLASSE_LABEL: Record<InvestorClass, string> = {
  profissional: 'Investidor profissional',
  qualificado: 'Investidor qualificado',
  'nao-qualificado': 'Investidor não qualificado',
};

/** Soma dias úteis (seg.–sex.), sem feriados. */
export function addBusinessDays(iso: string, days: number): string {
  const d = toDate(iso.slice(0, 10));
  let left = days;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------ missões de registo */

export function RegistrationMissions({ submitted, profileId, className }: { submitted: boolean; profileId: ProfileId; className?: string }) {
  const [goal] = useLearningGoal(profileId);
  const items = [...STEPS.map((s) => ({ id: s.id, label: s.title, done: submitted })), { id: 'objetivo', label: 'Objetivo de aprendizagem', done: Boolean(goal) }];
  const done = items.filter((i) => i.done).length;
  return (
    <section aria-labelledby="ob-missions" className={cn('min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="ob-missions" className="text-[1.0625rem]">
          Missões de registo
        </h2>
        <p className="font-mono text-sm text-muted tnum">
          {done} de {items.length}
        </p>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden>
        {items.map((i) => (
          <span key={i.id} className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', i.done ? 'bg-accent' : 'bg-[color-mix(in_oklab,var(--accent)_14%,var(--surface-2))]')} />
        ))}
      </div>
      <ol className="mt-3 flex flex-col">
        {items.map((i, n) => (
          <li key={i.id} className="flex min-h-9 items-center gap-2.5 text-[0.9375rem]">
            <span
              aria-hidden
              className={cn(
                'inline-flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] tnum',
                i.done ? 'border-accent bg-accent text-accent-fg' : 'border-[color-mix(in_oklab,var(--fg)_30%,var(--border))] text-muted',
              )}
            >
              {i.done ? <Check className="size-3" strokeWidth={3} /> : n + 1}
            </span>
            <span className={i.done ? 'text-muted' : 'text-fg'}>{i.label}</span>
            <span className="sr-only">{i.done ? ', cumprida' : ', por fazer'}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------ em análise */

export function ReviewView({ c, profileId, onApprove, onRestart }: { c: CaseView; profileId: ProfileId; onApprove: () => void; onRestart: () => void }) {
  const due = addBusinessDays(c.submittedAt, c.pep ? 5 : 2);
  const items: TimelineItem[] = [
    { id: 'sub', state: 'done', date: dateTime(c.submittedAt), title: 'Registo submetido e assinado', body: `Processo ${caseLabel(c.id)} · ${c.documentos.length} documentos` },
    {
      id: 'listas',
      state: 'done',
      date: dateTime(c.submittedAt),
      title: 'Listas de sanções e pessoas politicamente expostas',
      body: c.pep ? 'Declaração PEP: abrimos diligência reforçada (origem do património e aprovação de um responsável).' : 'Sem correspondências nas listas consolidadas da UE e da ONU. Verificação automática.',
    },
    {
      id: 'docs',
      state: 'current',
      title: c.tipo === 'pessoa-coletiva' ? 'Verificação da certidão permanente, do RCBE e dos documentos' : 'Verificação da identidade, da morada e do IBAN',
      body: 'A equipa compara cada documento com os dados que escreveste. Se faltar alguma coisa, pedimos aqui e por email.',
    },
    { id: 'decisao', state: 'upcoming', date: `até ${fmtDate(due)}`, title: 'Decisão da equipa de compliance', body: `Prazo de referência: ${c.pep ? '5' : '2'} dias úteis.` },
    { id: 'conta', state: 'upcoming', title: 'Conta segregada ativa', body: 'Recebes a referência para transferências SEPA para a conta segregada no prestador de pagamentos licenciado na UE.' },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <Card padding="lg">
          <CardHeader
            title={`Processo ${caseLabel(c.id)}`}
            description={`${c.nome} · ${c.tipo === 'pessoa-coletiva' ? 'pessoa coletiva' : 'pessoa singular'} · ${c.rota.toLowerCase()}`}
            actions={<StatusPill tone="warn" label="Em análise" />}
          />
          <Timeline items={items} />
          <p className="max-w-[60ch] mt-6 border-t border-border pt-4 text-sm text-muted">
            Depois da aprovação, cada compromisso faz-se por transferência SEPA a partir da conta que indicaste. Não aceitamos numerário, e o dinheiro fica numa conta segregada, conciliada todos os dias.
          </p>
        </Card>
        <aside className="flex min-w-0 flex-col gap-6" aria-label="Missões de registo e demonstração">
          <Card>
            <RegistrationMissions submitted profileId={profileId} />
          </Card>
          <Card>
            <h2 className="text-[1.0625rem]">Demonstração</h2>
            <p className="mt-1 text-sm text-muted">Na operação real, a decisão é da equipa de compliance, em Bastidores. Aqui podes simulá-la para veres o resto do percurso.</p>
            <div className="mt-4 flex flex-col items-start gap-2">
              <Button variant="secondary" onClick={onApprove}>
                Simular a aprovação
              </Button>
              <Button variant="ghost" size="sm" onClick={onRestart}>
                Recomeçar o registo de exemplo
              </Button>
            </div>
          </Card>
        </aside>
      </div>
      <LearningGoalPanel profileId={profileId} className="lg:max-w-[calc(100%-340px-1.5rem)]" />
    </div>
  );
}

/* ------------------------------------------------------------ concluído */

function CertidaoUpdate({ profileId }: { profileId: ProfileId }) {
  const [draft, update] = useDraft(profileId);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const submit = () => {
    const e = validateCertidao(value);
    setError(e);
    if (e) return;
    update({ certidao: formatCertidao(value), certidaoAtualizada: now().toISOString() });
    setValue('');
    toast({ tone: 'ok', title: 'Código da certidão permanente atualizado', description: 'A equipa de compliance confirma a nova certidão no próximo dia útil.' });
  };
  return (
    <form
      className="mt-3 flex flex-wrap items-start gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Field id="ob-certidao-nova" label="Novo código da certidão" error={error ?? undefined} className="w-full max-w-[16rem]" hint={draft.certidaoAtualizada ? `Último código: ${draft.certidao}` : undefined}>
        {({ id, describedBy, invalid }) => (
          <Input id={id} aria-describedby={describedBy} invalid={invalid} inputMode="numeric" placeholder="0000-0000-0000" maxLength={14} value={value} onChange={(e) => setValue(formatCertidao(e.target.value))} />
        )}
      </Field>
      <Button type="submit" variant="secondary" className="sm:mt-7">
        Atualizar código
      </Button>
    </form>
  );
}

export function ApprovedView({ c, profileId, onRestart }: { c: CaseView; profileId: ProfileId; onRestart?: () => void }) {
  const { role, setRole, isTeam } = useRole();
  const [draft] = useDraft(profileId);
  const decided = c.decidedAt ?? c.submittedAt;
  const review = addMonths(decided.slice(0, 10), c.risco === 'baixo' ? 24 : 12);
  const certValidUntil = draft.certidaoAtualizada ? addMonths(draft.certidaoAtualizada.slice(0, 10), 12) : addMonths(c.submittedAt.slice(0, 10), 12);
  const items: TimelineItem[] = [
    { id: 'sub', state: 'done', date: fmtDate(c.submittedAt), title: 'Registo submetido e assinado', body: `Processo ${caseLabel(c.id)}` },
    { id: 'listas', state: 'done', date: fmtDate(c.submittedAt), title: 'Listas de sanções e pessoas politicamente expostas', body: 'Sem correspondências nas listas consolidadas da UE e da ONU.' },
    {
      id: 'docs',
      state: 'done',
      date: fmtDate(c.decidedAt && addBusinessDays(c.submittedAt, 2) < decided.slice(0, 10) ? addBusinessDays(c.submittedAt, 2) : decided),
      title: c.tipo === 'pessoa-coletiva' ? 'Certidão permanente, RCBE e documentos verificados' : 'Identidade, morada e IBAN verificados',
    },
    { id: 'decisao', state: 'done', date: fmtDate(decided), title: `Aprovado · ${CLASSE_LABEL[c.classe].toLowerCase()}`, body: c.rota },
    { id: 'conta', state: 'done', date: fmtDate(decided), title: 'Conta segregada ativa', body: 'Referência de transferência SEPA emitida. Sem numerário; conciliação diária.' },
    { id: 'revisao', state: 'upcoming', date: monthYear(review), title: 'Revisão periódica do KYC', body: `A cada ${c.risco === 'baixo' ? '24' : '12'} meses para clientes de risco ${c.risco}. Pedimos só o que tiver mudado.` },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <Card padding="lg">
            <CardHeader title={c.nome} description={`Aprovado a ${fmtDate(decided)} · processo ${caseLabel(c.id)}`} actions={<StatusPill tone="ok" label="Conta ativa" />} />
            <KeyValue
              columns={2}
              items={[
                { label: 'Tipo', value: c.tipo === 'pessoa-coletiva' ? 'Pessoa coletiva' : 'Pessoa singular' },
                { label: 'Classificação', value: CLASSE_LABEL[c.classe], hint: c.rota },
                { label: 'Residência fiscal', value: c.pais },
                { label: 'Risco do cliente', value: c.risco === 'baixo' ? 'Baixo' : 'Elevado (diligência reforçada)' },
              ]}
            />
            <h3 className="mt-8 text-[1.0625rem]">Estado do processo</h3>
            <Timeline items={items} className="mt-4" />
          </Card>
        </div>

        <aside className="flex min-w-0 flex-col gap-6" aria-label="Aprendizagem e percurso">
          <LearningGoalPanel profileId={profileId} />
          <Card>
            <h2 className="text-[1.0625rem]">{role === 'visitante' ? 'Demonstração' : 'Ver o percurso de registo'}</h2>
            {role === 'visitante' ? (
              <>
                <p className="mt-1 text-sm text-muted">A conta deste registo de exemplo está ativa nesta sessão. Cada compromisso continua a exigir a leitura dos fatores de risco do lote.</p>
                <div className="mt-4 flex flex-col items-start gap-2">
                  <ButtonLink to="/mercados" variant="secondary">
                    Explorar os mercados
                  </ButtonLink>
                  {onRestart && (
                    <Button variant="ghost" size="sm" onClick={onRestart}>
                      Recomeçar o registo de exemplo
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-muted">Como Visitante vês os seis passos do registo preenchidos com um exemplo fictício, incluindo o bloqueio de quem não é investidor qualificado.</p>
                <div className="mt-4 flex flex-col items-start gap-2">
                  <Button variant="secondary" onClick={() => setRole('visitante')}>
                    Ver como Visitante
                  </Button>
                  {isTeam && (
                    <ButtonLink to="/bastidores" variant="ghost" size="sm">
                      Processos KYC em Bastidores
                    </ButtonLink>
                  )}
                </div>
              </>
            )}
          </Card>
        </aside>
      </div>

      {/* os documentos ficam por baixo da primeira linha, para as duas colunas abrirem equilibradas */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card padding="lg">
          <CardHeader title="Documentos em ficheiro" description="O que a equipa de compliance verificou. Atualiza o que mudar; o resto fica para a revisão periódica." />
          <ul className="divide-y divide-border">
            {c.documentos.map((doc) => {
              const isCert = doc.name === 'Certidão permanente';
              return (
                <li key={doc.name} className="flex min-w-0 items-start gap-3 py-3 first:pt-0">
                  <FileText aria-hidden className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-fg">{doc.name}</p>
                    <p className="text-sm text-muted">
                      {isCert ? (draft.certidaoAtualizada ? `Código atualizado a ${fmtDate(draft.certidaoAtualizada)}; válida até ${fmtDate(certValidUntil)}.` : `Válida até ${fmtDate(certValidUntil)}. Atualiza o código quando renovares a subscrição.`) : doc.note}
                    </p>
                    {isCert && <CertidaoUpdate profileId={profileId} />}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ bloqueado */

export function BlockedView({ c, profileId, onReview, since }: { c: { nome: string; reason?: string }; profileId: ProfileId; onReview: () => void; since?: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <Card padding="lg">
        <h2 className="text-[1.375rem] leading-tight">No piloto, o acesso está limitado a investidores qualificados</h2>
        <p className="measure mt-3 text-fg">
          Não te podemos abrir conta nesta fase. Não é um juízo sobre ti: é a regra do piloto fechado, que escolhemos para controlar a verificação de clientes, os pagamentos e a liquidez antes de abrir a mais
          pessoas.
        </p>
        <p className="measure mt-3 text-muted">
          {c.nome} está na lista de interesse{since ? ` desde ${fmtDate(since)}` : ''}. Avisamos pelo email que indicaste quando o acesso abrir a mais investidores. Não há data marcada, e não guardamos os
          documentos de quem não abriu conta.
        </p>
        <h3 className="mt-7 text-[1.0625rem]">O que continua aberto, sem registo</h3>
        <ul className="mt-2 flex flex-col divide-y divide-border">
          {[
            { to: '/academia', t: 'Academia', d: 'Módulos, missões de conhecimento e os mini-jogos dos três mundos.' },
            { to: '/academia/simulador', t: 'Simulador de campanha', d: 'Joga 18 meses com dinheiro fictício, incluindo campanhas com perda.' },
            { to: '/mercados', t: 'Mercados', d: 'O Olival, A Nascente e A Plantação, com as jornadas dos lotes.' },
          ].map((x) => (
            <li key={x.to} className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
              <div className="min-w-0">
                <p className="font-medium text-fg">{x.t}</p>
                <p className="text-sm text-muted">{x.d}</p>
              </div>
              <ButtonLink to={x.to} variant="secondary" size="sm">
                Abrir
              </ButtonLink>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-border pt-4">
          <Button variant="ghost" onClick={onReview}>
            Rever as respostas de qualificação
          </Button>
        </div>
      </Card>
      <aside className="flex min-w-0 flex-col gap-6" aria-label="Aprendizagem">
        <LearningGoalPanel profileId={profileId} />
        <Disclaimer kind="regulatorio" boxed title="Porque é fechado">
          Na fase 1, a Sprout é um mercado fechado: coorte de azeite e água, investidores qualificados e contratos padronizados, com compliance desde o primeiro dia. Abrir a mais investidores depende de provar o risco e a tesouraria no piloto.
        </Disclaimer>
      </aside>
    </div>
  );
}
