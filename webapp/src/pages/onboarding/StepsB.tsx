import { useState, type ReactNode } from 'react';
import { Check, CircleAlert, CircleCheck, FileText, Plus, Trash2 } from 'lucide-react';
import { Button, ButtonLink, Checkbox, Drawer, Field, IconButton, Input, RadioGroup, Select, Textarea, TextLink } from '../../components/ui';
import { date as fmtDate } from '../../lib/format';
import { TODAY_DATE } from '../../lib/clock';
import { cn } from '../../lib/cn';
import {
  CRITERIOS_GRANDE,
  CRITERIOS_PEDIDO,
  docSlotsFor,
  displayName,
  EXP1,
  EXP2,
  FIN1,
  FIN2,
  FIN3,
  isColetiva,
  ORIGEM_FUNDOS,
  paisLabel,
  QUIZ,
  quizCorrect,
  ROTA_LABEL,
  signatoryName,
  ENTIDADES,
  CARGOS,
  type Draft,
  type Rota,
  type UboRow,
} from './draft';
import { TF } from './fields';
import { Appear, exampleField, FieldGroup, FileDrop, Lbl, type StepProps } from './parts';
import { formatNif } from './validation';

/* ------------------------------------------------------------ 4 · Beneficiário efetivo e declarações */

const UBO_TIPOS: { value: UboRow['tipo']; label: string }[] = [
  { value: 'direta', label: 'Participação direta' },
  { value: 'indireta', label: 'Participação indireta' },
  { value: 'controlo', label: 'Controlo por outros meios' },
];

function UboEditor(p: StepProps) {
  const { d, set, err, isEx } = p;
  const rows = d.ubos;
  const patchRow = (id: string, patch: Partial<UboRow>) => set((x) => ({ ubos: x.ubos.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const sum = rows.reduce((s, r) => s + (r.tipo === 'controlo' ? 0 : Number(r.pct.replace(',', '.')) || 0), 0);
  return (
    <FieldGroup
      title="Beneficiários efetivos"
      description="Quem, em última instância, detém mais de 25 % do capital ou dos direitos de voto, ou controla a entidade por outros meios. Confirmamos no Registo Central do Beneficiário Efetivo (RCBE)."
    >
      <div data-field="ubos" className="flex flex-col gap-4">
        {rows.map((r, i) => (
          <div key={r.id} className="grid min-w-0 gap-4 border-b border-border pb-4 last:border-b-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.1fr)_6.5rem_auto] sm:items-start">
            <Field id={`ob-ubo-${r.id}-nome`} label={<Lbl ex={isEx('ubos')}>{`Nome · beneficiário ${i + 1}`}</Lbl>} error={err('ubos') ? err(`ubo-${r.id}-nome`) ?? undefined : undefined}>
              {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} className={isEx('ubos') ? exampleField : undefined} value={r.nome} onChange={(e) => patchRow(r.id, { nome: e.target.value })} onBlur={() => p.touch('ubos')} />}
            </Field>
            <Field id={`ob-ubo-${r.id}-nif`} label="NIF" error={err('ubos') ? err(`ubo-${r.id}-nif`) ?? undefined : undefined}>
              {({ id, describedBy, invalid }) => (
                <Input id={id} aria-describedby={describedBy} invalid={invalid} className={isEx('ubos') ? exampleField : undefined} inputMode="numeric" maxLength={11} value={r.nif} onChange={(e) => patchRow(r.id, { nif: formatNif(e.target.value) })} onBlur={() => p.touch('ubos')} />
              )}
            </Field>
            <Field id={`ob-ubo-${r.id}-tipo`} label="Natureza">
              {({ id }) => (
                <Select id={id} className={isEx('ubos') ? exampleField : undefined} value={r.tipo} onChange={(e) => patchRow(r.id, { tipo: e.target.value as UboRow['tipo'], pct: e.target.value === 'controlo' ? '' : r.pct })}>
                  {UBO_TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field id={`ob-ubo-${r.id}-pct`} label="Participação" error={err('ubos') ? err(`ubo-${r.id}-pct`) ?? undefined : undefined}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  inputMode="decimal"
                  suffix="%"
                  className={isEx('ubos') && r.tipo !== 'controlo' ? exampleField : undefined}
                  disabled={r.tipo === 'controlo'}
                  placeholder={r.tipo === 'controlo' ? 'n.a.' : undefined}
                  value={r.pct}
                  onChange={(e) => patchRow(r.id, { pct: e.target.value.replace(/[^\d,.]/g, '').slice(0, 5) })}
                  onBlur={() => p.touch('ubos')}
                />
              )}
            </Field>
            <div className="flex sm:pt-7">
              <IconButton
                label={`Remover beneficiário ${i + 1}`}
                icon={<Trash2 className="size-4" strokeWidth={1.75} />}
                disabled={rows.length === 1}
                title={rows.length === 1 ? 'É preciso pelo menos um beneficiário efetivo' : `Remover beneficiário ${i + 1}`}
                onClick={() => set((x) => ({ ubos: x.ubos.filter((u) => u.id !== r.id) }))}
              />
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Plus aria-hidden className="size-4" strokeWidth={1.75} />}
            disabled={rows.length >= 4}
            title={rows.length >= 4 ? 'No máximo 4 beneficiários: com mais de 25 % cada, não cabem mais' : undefined}
            onClick={() => set((x) => ({ ubos: [...x.ubos, { id: `u${Date.now().toString(36)}`, nome: '', nif: '', pct: '', tipo: 'direta' }] }))}
          >
            Acrescentar beneficiário
          </Button>
          <p className="text-sm text-muted">
            Participações declaradas: <span className={cn('font-mono tnum', sum > 100 ? 'text-crit-ink' : 'text-fg')}>{String(Math.round(sum * 100) / 100).replace('.', ',')} %</span>
          </p>
        </div>
        {err('ubos') && (
          <p className="text-sm text-crit-ink" role="alert">
            {err('ubos')}
          </p>
        )}
      </div>
    </FieldGroup>
  );
}

export function StepBeneficiario(p: StepProps) {
  const { d, set, err, isEx } = p;
  const col = isColetiva(d);
  return (
    <div className="flex flex-col gap-9">
      {col ? (
        <UboEditor {...p} />
      ) : (
        <div data-field="contaPropria" className="max-w-[68ch]">
          <RadioGroup
            legend={<Lbl ex={isEx('contaPropria')}>Investes por conta própria?</Lbl>}
            hint="Ou seja, o dinheiro é teu e és tu quem decide e beneficia do investimento."
            name="ob-conta-propria"
            value={d.contaPropria || undefined}
            onChange={(v) => {
              set({ contaPropria: v });
              p.touch('contaPropria');
            }}
            options={[
              { value: 'sim', label: 'Sim, por conta própria' },
              { value: 'nao', label: 'Não, por conta de outra pessoa ou entidade' },
            ]}
          />
          {err('contaPropria') && (
            <p className="mt-1 text-sm text-crit-ink" role="alert">
              {err('contaPropria')}
            </p>
          )}
        </div>
      )}

      <div data-field="pep" className="max-w-[68ch]">
        <RadioGroup
          legend={<Lbl ex={isEx('pep')}>Pessoa politicamente exposta</Lbl>}
          hint={
            col
              ? 'Nos últimos 12 meses, o representante ou algum beneficiário efetivo exerceu um cargo público de relevo (governo, parlamento, tribunais superiores, banco central, empresas públicas, organizações internacionais), ou é familiar próximo ou pessoa estreitamente associada de quem o exerce?'
              : 'Nos últimos 12 meses, exerceste um cargo público de relevo (governo, parlamento, tribunais superiores, banco central, empresas públicas, organizações internacionais), ou és familiar próximo ou pessoa estreitamente associada de quem o exerce?'
          }
          name="ob-pep"
          value={d.pep || undefined}
          onChange={(v) => {
            set({ pep: v });
            p.touch('pep');
          }}
          options={[
            { value: 'nao', label: 'Não' },
            { value: 'proprio', label: col ? 'Sim, o representante ou um beneficiário efetivo' : 'Sim, eu' },
            { value: 'familiar', label: 'Sim, familiar próximo ou pessoa estreitamente associada' },
          ]}
        />
        {err('pep') && (
          <p className="mt-1 text-sm text-crit-ink" role="alert">
            {err('pep')}
          </p>
        )}
        {d.pep && d.pep !== 'nao' && (
          <Appear className="mt-4 flex flex-col gap-3">
            <Field id="ob-pepDetalhe" label="Cargo, país e período, ou relação com a pessoa exposta" error={err('pepDetalhe')}>
              {({ id, describedBy, invalid }) => (
                <Textarea id={id} aria-describedby={describedBy} invalid={invalid} value={d.pepDetalhe} onChange={(e) => set({ pepDetalhe: e.target.value })} onBlur={() => p.touch('pepDetalhe')} />
              )}
            </Field>
            <p className="max-w-[60ch] flex items-start gap-2 text-sm text-muted">
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warn-ink" strokeWidth={1.75} />
              Não impede o registo. Obriga a diligência reforçada: pedimos a origem do património e a aprovação de um responsável de compliance, o que acrescenta cerca de 3 dias úteis à análise.
            </p>
          </Appear>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="ob-origemFundos" label={<Lbl ex={isEx('origemFundos')}>Origem principal dos fundos</Lbl>} error={err('origemFundos')} hint="De onde vem o dinheiro que vais transferir para a conta segregada.">
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              className={isEx('origemFundos') ? exampleField : undefined}
              value={d.origemFundos}
              onChange={(e) => {
                set({ origemFundos: e.target.value });
                p.touch('origemFundos');
              }}
            >
              <option value="" disabled>
                Escolhe…
              </option>
              {ORIGEM_FUNDOS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div data-field="sancoes">
        <Checkbox
          id="ob-sancoes"
          checked={d.sancoes}
          onChange={(e) => {
            set({ sancoes: e.target.checked });
            p.touch('sancoes');
          }}
          label={
            <Lbl ex={isEx('sancoes')}>
              {col
                ? 'Declaro que nem a entidade, nem o representante, nem os beneficiários efetivos estão sujeitos a medidas restritivas da UE ou da ONU.'
                : 'Declaro que não estou sujeito a medidas restritivas da UE ou da ONU.'}
            </Lbl>
          }
          description="Além desta declaração, cruzamos os nomes com as listas consolidadas de sanções da UE e da ONU antes de abrir conta."
        />
        {err('sancoes') && (
          <p className="text-sm text-crit-ink" role="alert">
            {err('sancoes')}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ 5 · Adequação e qualificação */

function QuizQuestion({ q, value, onAnswer, error }: { q: (typeof QUIZ)[number]; value: number | undefined; onAnswer: (i: number) => void; error?: string }) {
  const answered = value !== undefined;
  const right = value === q.correct;
  return (
    <div data-field={q.id} className="min-w-0 max-w-[68ch]">
      <RadioGroup
        legend={<span className="text-[0.9375rem]">{q.prompt}</span>}
        name={`ob-${q.id}`}
        value={answered ? String(value) : undefined}
        onChange={(v) => onAnswer(Number(v))}
        options={q.options.map((o, i) => ({
          value: String(i),
          disabled: answered && i !== value,
          label: (
            <span className={cn('inline-flex items-start gap-1.5', answered && i === q.correct && 'font-medium')}>
              {o}
              {answered && i === q.correct && (
                <>
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-ok-ink" strokeWidth={2.25} />
                  <span className="sr-only"> (resposta certa)</span>
                </>
              )}
            </span>
          ),
        }))}
      />
      {error && !answered && (
        <p className="mt-1 text-sm text-crit-ink" role="alert">
          {error}
        </p>
      )}
      {answered && (
        <Appear className="mt-2 pl-8">
          <p className={cn('max-w-[60ch] text-sm', right ? 'text-ok-ink' : 'text-warn-ink')}>
            <span className="font-semibold">{right ? 'Certo. ' : 'Não é bem assim. '}</span>
            <span className="text-fg">{q.explanation}</span>
          </p>
        </Appear>
      )}
    </div>
  );
}

function ChoiceGroup({ k, legend, options, p, hint }: { k: 'exp1' | 'exp2' | 'fin1' | 'fin2' | 'fin3'; legend: string; options: readonly string[] | readonly { value: string; label: string }[]; p: StepProps; hint?: string }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div data-field={k}>
      <RadioGroup
        legend={<Lbl ex={p.isEx(k)}>{legend}</Lbl>}
        hint={hint}
        name={`ob-${k}`}
        value={p.d[k] || undefined}
        onChange={(v) => {
          p.set({ [k]: v } as Partial<Draft>);
          p.touch(k);
        }}
        options={opts}
      />
      {p.err(k) && (
        <p className="mt-1 text-sm text-crit-ink" role="alert">
          {p.err(k)}
        </p>
      )}
    </div>
  );
}

export function StepAdequacao(p: StepProps & { blockPanel: ReactNode }) {
  const { d, set, err, isEx } = p;
  const col = isColetiva(d);
  const rotas: Rota[] = col ? ['regulada', 'grande', 'pedido', 'nenhuma'] : ['pedido', 'nenhuma'];
  const criterios = d.rota === 'grande' ? CRITERIOS_GRANDE : CRITERIOS_PEDIDO;
  const answeredAll = QUIZ.every((q) => d.quiz[q.id] !== undefined);
  const correct = quizCorrect(d);
  const toggleCriterio = (v: string, on: boolean) => {
    set((x) => ({ criterios: on ? [...new Set([...x.criterios, v])] : x.criterios.filter((c) => c !== v) }));
    p.touch('criterios');
  };
  return (
    <div className="flex flex-col gap-10">
      <FieldGroup
        title="Conhecimento do produto"
        description="Três perguntas para confirmarmos que o produto ficou claro. Não há nota nem reprovação: depois de responderes, mostramos a explicação. A resposta fica registada."
      >
        <div className="flex flex-col gap-6">
          {QUIZ.map((q) => (
            <QuizQuestion
              key={q.id}
              q={q}
              value={d.quiz[q.id]}
              error={err(q.id)}
              onAnswer={(i) => {
                set((x) => ({ quiz: { ...x.quiz, [q.id]: i } }));
                p.touch(q.id);
              }}
            />
          ))}
          {answeredAll && correct < 2 && (
            <Appear>
              <p className="max-w-[60ch] flex items-start gap-2 text-sm text-fg">
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warn-ink" strokeWidth={1.75} />
                <span>
                  {correct} de 3 certas. Não impede o registo, mas recomendamos os módulos{' '}
                  <TextLink to="/academia#m-ciclo-18m">O ciclo de 18 meses</TextLink> e{' '}
                  <TextLink to="/academia#m-cobertura-azeite">Cobertura de preço no azeite</TextLink>{' '}
                  antes do primeiro compromisso. A equipa de compliance vê esta nota.
                </span>
              </p>
            </Appear>
          )}
        </div>
      </FieldGroup>

      <FieldGroup title="Experiência e situação financeira" description={col ? 'Respostas sobre a entidade e sobre quem decide os investimentos por ela.' : undefined}>
        <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
          <ChoiceGroup k="exp1" p={p} legend="Nos últimos 3 anos, investiste em ativos sem mercado secundário?" hint="Capital de risco, crowdfunding, financiamento de stock ou de faturas." options={EXP1} />
          <ChoiceGroup k="exp2" p={p} legend="Que experiência tens com mercadorias?" options={EXP2} />
          <ChoiceGroup k="fin1" p={p} legend={col ? 'Ativos financeiros da entidade' : 'Património financeiro'} hint="Depósitos e instrumentos financeiros, sem imóveis." options={FIN1} />
          <div className="min-w-0">
            <ChoiceGroup k="fin2" p={p} legend="Que parte desse património pensas afetar a lotes do piloto?" options={FIN2} />
            {d.fin2 === 'Mais de 25 %' && (
              <Appear className="mt-2">
                <p className="flex items-start gap-2 text-sm text-fg">
                  <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warn-ink" strokeWidth={1.75} />
                  Mais de um quarto do património em ativos sem liquidez concentra o risco. Não é motivo de recusa; considera afetar menos, ou repartir por lotes de produtores e mundos diferentes.
                </p>
              </Appear>
            )}
          </div>
          <div className="lg:col-span-2">
            <ChoiceGroup k="fin3" p={p} legend="Se perderes todo o montante que afetares, consegues suportar essa perda?" options={FIN3} />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup
        title="Qualificação"
        description={
          col
            ? 'O piloto é fechado a investidores qualificados: clientes profissionais na aceção da DMIF II (Anexo II), de origem ou a pedido. Escolhe o caso que se aplica à entidade.'
            : 'O piloto é fechado a investidores qualificados. Uma pessoa singular só entra se pedir para ser tratada como investidor profissional e cumprir 2 de 3 critérios (DMIF II, Anexo II, secção II).'
        }
      >
        <div data-field="rota">
          <RadioGroup<Rota>
            legend={<Lbl ex={isEx('rota')}>{col ? 'A entidade é' : 'Pedes para ser tratado como'}</Lbl>}
            name="ob-rota"
            value={d.rota || undefined}
            onChange={(v) => {
              set({ rota: v, criterios: v === d.rota ? d.criterios : v === 'pedido' && d.example ? d.criterios : [] });
              p.touch('rota');
            }}
            options={rotas.map((r) => ({
              value: r,
              label: col ? ROTA_LABEL[r] : r === 'pedido' ? 'Investidor profissional, a pedido (2 de 3 critérios)' : 'Nenhuma destas: não cumpro 2 dos 3 critérios',
              description:
                r === 'regulada'
                  ? 'Instituição de crédito, empresa de investimento, seguradora, organismo de investimento coletivo ou sociedade gestora, fundo de pensões.'
                  : r === 'grande'
                    ? 'Cumpre 2 de 3: balanço total ≥ 20 M€, volume de negócios ≥ 40 M€, fundos próprios ≥ 2 M€.'
                    : r === 'pedido'
                      ? 'Pedido escrito, com evidência de 2 dos 3 critérios da DMIF II.'
                      : undefined,
            }))}
          />
          {err('rota') && (
            <p className="mt-1 text-sm text-crit-ink" role="alert">
              {err('rota')}
            </p>
          )}
        </div>

        {d.rota === 'regulada' && (
          <Appear className="mt-5 max-w-[26rem]">
            <TF k="registoSupervisao" label="N.º de registo na autoridade de supervisão" p={p} hint="Banco de Portugal, CMVM, ASF ou autoridade equivalente na UE." />
          </Appear>
        )}

        {(d.rota === 'grande' || d.rota === 'pedido') && (
          <Appear className="mt-5 flex flex-col gap-5">
            <fieldset data-field="criterios" className="min-w-0 pl-8">
              <legend className="sr-only">Critérios cumpridos</legend>
              <p className="text-sm font-medium text-fg">
                Critérios que cumpres <span className="font-mono text-muted tnum">({d.criterios.length} de 3 · são precisos 2)</span>
                <span className="sr-only">. Assinala os que se aplicam.</span>
              </p>
              {criterios.map((c) => (
                <Checkbox key={c.value} checked={d.criterios.includes(c.value)} onChange={(e) => toggleCriterio(c.value, e.target.checked)} label={c.label} />
              ))}
              {err('criterios') && (
                <p className="text-sm text-crit-ink" role="alert">
                  {err('criterios')}
                </p>
              )}
              {d.criterios.length === 1 && (
                <p className="mt-1 text-sm text-muted">Só com 1 critério a lei não permite tratar-te como investidor profissional. Nesse caso escolhe «Nenhuma destas» para veres as alternativas.</p>
              )}
            </fieldset>
            <FileDrop
              id="ob-doc-evidencia"
              label={d.rota === 'grande' ? 'Evidência: últimas contas aprovadas ou IES' : 'Evidência dos critérios'}
              hint={d.rota === 'grande' ? 'Balanço e demonstração de resultados do último exercício.' : 'Extratos da carteira, registo de operações ou declaração do empregador.'}
              required
                  file={d.docs.evidencia}
              error={err('doc-evidencia')}
              onFile={(f) => {
                set((x) => ({ docs: { ...x.docs, evidencia: f } }));
                p.touch('doc-evidencia');
              }}
              onRemove={() =>
                set((x) => {
                  const docs = { ...x.docs };
                  delete docs.evidencia;
                  return { docs };
                })
              }
            />
            {d.rota === 'pedido' && (
              <div data-field="pedidoEscrito">
                <Checkbox
                  checked={d.pedidoEscrito}
                  onChange={(e) => {
                    set({ pedidoEscrito: e.target.checked });
                    p.touch('pedidoEscrito');
                  }}
                  label={<Lbl ex={isEx('pedidoEscrito')}>Peço para ser tratado como investidor profissional.</Lbl>}
                  description="Percebo que, como investidor profissional, tenho menos proteções do que um investidor não profissional, por exemplo na informação que recebo e na avaliação de adequação de cada operação."
                />
                {err('pedidoEscrito') && (
                  <p className="text-sm text-crit-ink" role="alert">
                    {err('pedidoEscrito')}
                  </p>
                )}
              </div>
            )}
          </Appear>
        )}
      </FieldGroup>

      {p.blockPanel}
    </div>
  );
}

/* ------------------------------------------------------------ 6 · Revisão e assinatura */

type DocTopic = 'termos' | 'riscos' | 'privacidade';

function maskIban(iban: string) {
  const s = iban.replace(/\s+/g, '');
  if (s.length < 10) return iban;
  return `${s.slice(0, 4)} •••• •••• ${s.slice(-5, -1)} ${s.slice(-1)}`;
}

function ReviewBlock({ title, step, goTo, items }: { title: string; step: number; goTo: (i: number) => void; items: { k: string; v: ReactNode }[] }) {
  return (
    <section className="min-w-0 border-b border-border py-4 first:pt-0 last:border-b-0" aria-label={title}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-[1.0625rem]">{title}</h3>
        <Button variant="ghost" size="sm" onClick={() => goTo(step)} aria-label={`Editar: ${title}`}>
          Editar
        </Button>
      </div>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[12rem_minmax(0,1fr)]">
        {items.map((it) => (
          <div key={it.k} className="contents">
            <dt className="text-sm text-muted">{it.k}</dt>
            <dd className="min-w-0 text-[0.9375rem] text-fg">{it.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function StepRevisao(p: StepProps) {
  const { d, set, err, goTo } = p;
  const [doc, setDoc] = useState<DocTopic | null>(null);
  const col = isColetiva(d);
  const docs = [...docSlotsFor(d).filter((s) => d.docs[s.slot]).map((s) => s.label), ...(d.docs.evidencia ? ['Evidência de qualificação'] : [])];
  const sig = signatoryName(d);
  const sigOk = !p.raw('assinatura');
  return (
    <div className="flex flex-col gap-9">
      <div>
        <ReviewBlock
          title="Perfil"
          step={0}
          goTo={goTo}
          items={[
            { k: 'Tipo', v: col ? `Pessoa coletiva · ${ENTIDADES.find((e) => e.value === d.entidade)?.label ?? ''}` : 'Pessoa singular' },
            { k: 'Residência fiscal', v: paisLabel(d.pais) },
          ]}
        />
        <ReviewBlock
          title="Dados"
          step={1}
          goTo={goTo}
          items={[
            { k: col ? 'Denominação' : 'Nome', v: displayName(d) },
            { k: col ? 'NIPC' : 'NIF', v: <span className="font-mono tnum">{col ? d.nipc : d.nif}</span> },
            { k: col ? 'Sede' : 'Morada', v: `${d.morada}, ${d.codigoPostal} ${d.localidade}` },
            ...(col ? [{ k: 'Representante', v: `${d.repNome} · ${CARGOS.find((c) => c.value === d.repCargo)?.label ?? ''}` }] : []),
            { k: 'Contacto', v: `${d.email} · ${d.telefone}` },
            { k: 'IBAN de origem', v: <span className="font-mono tnum">{maskIban(d.iban)}</span> },
          ]}
        />
        <ReviewBlock
          title="Documentos"
          step={2}
          goTo={goTo}
          items={[
            ...(col ? [{ k: 'Certidão permanente', v: <span className="font-mono tnum">{d.certidao}</span> }] : []),
            {
              k: 'Ficheiros',
              v: (
                <ul className="flex flex-col gap-1">
                  {docs.map((x) => (
                    <li key={x} className="flex items-start gap-1.5">
                      <FileText aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.75} />
                      {x}
                    </li>
                  ))}
                </ul>
              ),
            },
          ]}
        />
        <ReviewBlock
          title="Beneficiário efetivo e declarações"
          step={3}
          goTo={goTo}
          items={[
            col
              ? { k: 'Beneficiários', v: d.ubos.map((u) => `${u.nome} (${u.tipo === 'controlo' ? 'controlo' : `${u.pct} %`})`).join(' · ') }
              : { k: 'Por conta própria', v: d.contaPropria === 'sim' ? 'Sim' : 'Não' },
            { k: 'Pessoa politicamente exposta', v: d.pep === 'nao' ? 'Não' : d.pep === 'proprio' ? 'Sim (diligência reforçada)' : 'Sim, familiar ou associado (diligência reforçada)' },
            { k: 'Origem dos fundos', v: d.origemFundos },
            { k: 'Sanções', v: 'Declaração assinada' },
          ]}
        />
        <ReviewBlock
          title="Adequação e qualificação"
          step={4}
          goTo={goTo}
          items={[
            { k: 'Conhecimento do produto', v: `${quizCorrect(d)} de 3 respostas certas` },
            { k: 'Qualificação', v: d.rota ? ROTA_LABEL[d.rota] : '' },
            { k: 'Critérios', v: d.rota === 'regulada' ? `Registo n.º ${d.registoSupervisao}` : `${d.criterios.length} de 3` },
          ]}
        />
      </div>

      <FieldGroup title="Termos e consentimentos" description="Os três primeiros são obrigatórios. Os opcionais ficam desligados até os ligares, e podes retirá-los quando quiseres.">
        <div className="flex flex-col">
          <div data-field="consentTermos" className="flex flex-wrap items-start justify-between gap-x-3">
            <Checkbox className="min-w-0 flex-1" checked={d.consentTermos} onChange={(e) => set({ consentTermos: e.target.checked })} label="Li e aceito os termos do piloto." />
            <Button variant="ghost" size="sm" onClick={() => setDoc('termos')}>
              Ler os termos
            </Button>
          </div>
          {err('consentTermos') && <p className="pl-8 text-sm text-crit-ink">{err('consentTermos')}</p>}
          <div data-field="consentRiscos" className="flex flex-wrap items-start justify-between gap-x-3">
            <Checkbox className="min-w-0 flex-1" checked={d.consentRiscos} onChange={(e) => set({ consentRiscos: e.target.checked })} label="Li a informação sobre riscos, incluindo a possibilidade de perder parte ou todo o capital." />
            <Button variant="ghost" size="sm" onClick={() => setDoc('riscos')}>
              Ler os riscos
            </Button>
          </div>
          {err('consentRiscos') && <p className="pl-8 text-sm text-crit-ink">{err('consentRiscos')}</p>}
          <div data-field="consentVeracidade">
            <Checkbox
              checked={d.consentVeracidade}
              onChange={(e) => set({ consentVeracidade: e.target.checked })}
              label="Declaro que a informação é verdadeira e completa, e comunico qualquer alteração."
              description="É uma obrigação legal de quem abre conta (Lei n.º 83/2017, de prevenção do branqueamento de capitais)."
            />
          </div>
          {err('consentVeracidade') && <p className="pl-8 text-sm text-crit-ink">{err('consentVeracidade')}</p>}
          <div className="mt-3 border-t border-border pt-3">
            <Checkbox checked={d.optDiario} onChange={(e) => set({ optDiario: e.target.checked })} label="Opcional: receber o resumo semanal do Diário de campanha por email." />
            <Checkbox checked={d.optVisitas} onChange={(e) => set({ optVisitas: e.target.checked })} label="Opcional: ser convidado para provas e visitas a produtores." />
          </div>
          <div className="mt-1 flex">
            <Button variant="ghost" size="sm" onClick={() => setDoc('privacidade')}>
              Como tratamos os teus dados
            </Button>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Assinatura" description="Na operação real assinas com Chave Móvel Digital ou com assinatura eletrónica qualificada. Nesta demonstração, escreve o nome para assinar.">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-start">
          <Field
            id="ob-assinatura"
            label={col ? `Nome do representante legal (${sig || 'passo 2'})` : `O teu nome completo (${sig || 'passo 2'})`}
            required
            error={err('assinatura')}
            hint={sigOk && d.assinatura ? undefined : 'Igual ao nome do passo 2, sem distinção de maiúsculas.'}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                autoComplete="off"
                value={d.assinatura}
                onChange={(e) => set({ assinatura: e.target.value })}
                onBlur={() => p.touch('assinatura')}
                className={cn('font-display text-lg', sigOk && d.assinatura && 'border-ok')}
                style={{ fontStretch: '87.5%' }}
              />
            )}
          </Field>
          <div className="min-w-0">
            <p className="mb-1.5 text-sm font-medium text-fg">Data</p>
            <p className="flex h-11 items-center font-mono text-fg tnum">{fmtDate(TODAY_DATE)}</p>
          </div>
        </div>
        {sigOk && d.assinatura && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ok-ink">
            <CircleCheck aria-hidden className="size-4" strokeWidth={1.75} />
            Assinatura corresponde ao nome do passo 2.
          </p>
        )}
      </FieldGroup>

      <PilotDocs topic={doc} onClose={() => setDoc(null)} onTopic={setDoc} />
    </div>
  );
}

/* ------------------------------------------------------------ documentos do piloto */

const DOCS: Record<DocTopic, { title: string; intro: string; items: { h: string; b: string }[] }> = {
  termos: {
    title: 'Termos do piloto',
    intro: 'Resumo dos contratos padrão Plataforma ↔ Investidor. A versão integral é entregue com a aprovação da conta.',
    items: [
      { h: 'O que financias', b: 'A compra de um lote físico a um produtor e os custos até à venda: análises, armazenagem, seguro, logística e cobertura de preço quando existe.' },
      { h: 'Janela de liquidação', b: '18 meses a contar do fecho do financiamento do lote. Se as vendas travarem, uma extensão condicionada, uma vez, até 6 meses. Cada lote tem um playbook de refunding para os casos previstos.' },
      { h: 'Pagamentos', b: 'Só por transferência SEPA de uma conta em teu nome para uma conta segregada num prestador de serviços de pagamento ou instituição de moeda eletrónica licenciado na UE. Sem numerário. Reconciliação diária entre o saldo do prestador e o registo da Sprout.' },
      { h: 'Período de reflexão', b: 'Podes cancelar um compromisso sem custos durante 4 dias depois de o fazeres. É uma política da Sprout, ao estilo do período de reflexão do Reg. (UE) 2020/1503.' },
      { h: 'Liquidez', b: 'No piloto não há mercado secundário: o capital fica no lote até à liquidação.' },
      { h: 'Informação', b: 'Extrato mensal no dia 5, extrato do lote a cada etapa da jornada (análise, depósito, venda, expedição) e relatório final na liquidação.' },
      { h: 'Força maior', b: 'Os contratos com produtores e compradores têm cláusulas de força maior. Um evento de força maior pode alongar a janela além da extensão.' },
    ],
  },
  riscos: {
    title: 'Informação sobre riscos',
    intro: 'Os riscos que podem reduzir a liquidação de um lote. Cada lote tem os seus fatores de risco, que tens de ler antes de comprometer capital.',
    items: [
      { h: 'Preço', b: 'A referência de mercado pode cair durante a janela. A cobertura (venda a prazo e indexação no azeite) fixa só parte do volume. A água não tem cobertura.' },
      { h: 'Prazo', b: 'As vendas podem atrasar. Uma extensão alonga a janela e tem custos de armazenagem.' },
      { h: 'Qualidade', b: 'Um lote pode perder categoria, por exemplo um azeite virgem extra que passa a virgem, e vender-se com desconto.' },
      { h: 'Contraparte', b: 'O produtor, o armazém ou o comprador podem falhar. Os contratos e o seguro reduzem, mas não eliminam, este risco.' },
      { h: 'Liquidez', b: 'Sem mercado secundário, não podes sair antes da liquidação.' },
      { h: 'Perda de capital', b: 'A reserva de primeira perda absorve as primeiras perdas até ao seu limite. Para lá disso, podes perder parte ou a totalidade do capital. Nada nesta plataforma é garantia de rentabilidade.' },
    ],
  },
  privacidade: {
    title: 'Como tratamos os teus dados',
    intro: 'Pedimos só o que a lei e o contrato exigem. O que é opcional fica desligado até o ligares.',
    items: [
      { h: 'Para que servem', b: 'Identificar e verificar quem investe (obrigação legal, Lei n.º 83/2017), executar o contrato e cumprir obrigações fiscais. As comunicações opcionais dependem do teu consentimento.' },
      { h: 'Quem os vê', b: 'A equipa de compliance da Sprout, o fornecedor de verificação de identidade e o prestador de pagamentos, só no que cada um precisa.' },
      { h: 'Quanto tempo', b: 'Documentos de identificação e registos de operações: 7 anos depois do fim da relação, como exige a lei. Consentimentos opcionais: até os retirares.' },
      { h: 'Os teus direitos', b: 'Acesso, retificação, apagamento quando não haja obrigação legal de conservar, portabilidade e oposição. Podes apresentar queixa à CNPD.' },
    ],
  },
};

function PilotDocs({ topic, onClose, onTopic }: { topic: DocTopic | null; onClose: () => void; onTopic: (t: DocTopic) => void }) {
  const doc = topic ? DOCS[topic] : null;
  return (
    <Drawer
      open={Boolean(topic)}
      onClose={onClose}
      title={doc?.title ?? ''}
      description={doc?.intro}
      width="md"
      footer={
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DOCS) as DocTopic[])
            .filter((t) => t !== topic)
            .map((t) => (
              <Button key={t} variant="secondary" size="sm" onClick={() => onTopic(t)}>
                {DOCS[t].title}
              </Button>
            ))}
        </div>
      }
    >
      {doc && (
        <dl className="flex flex-col gap-4">
          {doc.items.map((it) => (
            <div key={it.h}>
              <dt className="font-medium text-fg">{it.h}</dt>
              <dd className="mt-0.5 text-[0.9375rem] text-muted">{it.b}</dd>
            </div>
          ))}
        </dl>
      )}
    </Drawer>
  );
}

/* ------------------------------------------------------------ painéis de bloqueio */

export function BlockPanel({ reason, onWaitlist, onChange }: { reason: 'retail' | 'perda'; onWaitlist: () => void; onChange: () => void }) {
  return (
    <Appear>
      <section aria-labelledby="ob-block-title" className="border-t border-border pt-7">
        <h3 id="ob-block-title" className="text-[1.25rem]">
          {reason === 'retail' ? 'No piloto, o acesso está limitado a investidores qualificados' : 'Os lotes podem perder parte ou todo o capital'}
        </h3>
        <p className="measure mt-2 text-fg">
          {reason === 'retail'
            ? 'Com estas respostas não te podemos abrir conta nesta fase. Não é um juízo sobre ti: é a regra do piloto fechado, que escolhemos para controlar a verificação de clientes, os pagamentos e a liquidez antes de abrir a mais pessoas.'
            : 'Disseste que não consegues suportar a perda do montante que afetares. Nesse caso a Sprout não é adequada para ti agora, e não te abrimos conta.'}
        </p>
        <p className="measure mt-3 text-muted">Tudo o que é aprender continua aberto, sem registo: a Academia, o Simulador de campanha com dinheiro fictício (que inclui campanhas com perda) e as jornadas dos lotes nos três mundos.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {reason === 'retail' ? (
            <Button variant="primary" onClick={onWaitlist}>
              Avisar-me quando o acesso abrir
            </Button>
          ) : (
            <Button variant="primary" onClick={onChange}>
              Rever a resposta
            </Button>
          )}
          <ButtonLink to="/academia" variant="secondary">
            Ir para a Academia
          </ButtonLink>
          <ButtonLink to="/academia/simulador" variant="secondary">
            Jogar o Simulador
          </ButtonLink>
        </div>
      </section>
    </Appear>
  );
}
