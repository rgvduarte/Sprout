import { useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, CircleAlert, Info } from 'lucide-react';
import { ILLUSTRATIVE_LABEL, KYC_QUEUE, type Lot } from '../../data';
import { Badge, ButtonLink, Page, PageHeader, Tabs, type TabItem } from '../../components/ui';
import { useData } from '../../state';
import { daysBetween, TODAY, TODAY_DATE } from '../../lib/clock';
import { cn } from '../../lib/cn';
import { dateTime, eur, kg, num, pct, plural } from '../../lib/format';
import { capital, kpi, OPEN_KYC, KYC_SLA_DAYS } from './metrics';
import { useBastidores, lastDecision, type BastidoresState } from './store';
import { useVisitorCase, kycStatusAfter } from './useCases';
import { FRAMEWORKS } from './content';
import { payouts, payoutStatus } from './treasury';
import PilotoTab from './PilotoTab';
import RiscoTab from './RiscoTab';
import TesourariaTab from './TesourariaTab';
import ComplianceTab from './ComplianceTab';
import MotorTab from './MotorTab';
import RevisaoTab from './RevisaoTab';

/* =====================================================================
   /bastidores · Equipa Sprout. Modo Operate: denso e sóbrio. Aqui vive
   a seriedade financeira do documento-fonte: piloto, risco, tesouraria,
   compliance e o motor que mantém a gamificação longe do dinheiro.
   ===================================================================== */

export type SectionId = 'piloto' | 'risco' | 'tesouraria' | 'compliance' | 'motor' | 'revisao';
const SECTIONS: SectionId[] = ['piloto', 'risco', 'tesouraria', 'compliance', 'motor', 'revisao'];
const isSection = (v: string | null): v is SectionId => SECTIONS.includes(v as SectionId);

interface Attention {
  id: string;
  tone: 'warn' | 'info';
  text: string;
  section: SectionId;
  action: string;
}

function attentionItems(lots: Lot[], st: BastidoresState, openKyc: number, oldestKycDays: number): Attention[] {
  const out: Attention[] = [];
  if (!st.recon) out.push({ id: 'recon', tone: 'warn', text: 'Reconciliação de 13/10 por executar. O SLA fecha às 20:00.', section: 'tesouraria', action: 'Reconciliar' });
  if (openKyc > 0)
    out.push({
      id: 'kyc',
      tone: oldestKycDays > KYC_SLA_DAYS ? 'warn' : 'info',
      text: `${plural(openKyc, 'caso KYC/KYB por decidir', 'casos KYC/KYB por decidir')}${oldestKycDays > KYC_SLA_DAYS ? `; o mais antigo tem ${oldestKycDays} dias (prazo: ${KYC_SLA_DAYS}).` : '.'}`,
      section: 'compliance',
      action: 'Decidir',
    });
  const pending = payouts(lots).filter((p) => payoutStatus(p, st).id === 'por-aprovar');
  if (pending.length)
    out.push({ id: 'payouts', tone: 'info', text: `${plural(pending.length, 'pagamento pronto a aprovar', 'pagamentos prontos a aprovar')}: ${pending.map((p) => p.lotId).join(', ')}.`, section: 'tesouraria', action: 'Aprovar' });
  const fr = kpi('fill-rate');
  const cap = capital(lots);
  if (cap.gap > 0)
    out.push({
      id: 'funding',
      tone: fr.value < fr.target ? 'warn' : 'info',
      text: `Financiamento dos lotes da campanha a ${pct(fr.value, 0)} (alvo ${pct(fr.target, 0)}); ${eur(cap.gap)} por financiar em ${plural(cap.openLots.length, 'lote aberto', 'lotes abertos')}.`,
      section: 'piloto',
      action: 'Ver lotes',
    });
  const ext = lots.find((l) => l.status === 'em-extensao');
  if (ext) out.push({ id: 'ext', tone: 'info', text: `${ext.id} em extensão: ${kg(ext.stock)} por vender, coberto a preço fixo.`, section: 'risco', action: 'Ver risco' });
  out.push({ id: 'legal', tone: 'info', text: `${plural(FRAMEWORKS.length, 'enquadramento', 'enquadramentos')} do produto pendentes de parecer jurídico.`, section: 'compliance', action: 'Ver pré-check' });
  return out;
}

export default function BastidoresPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('sec');
  const section: SectionId = isSection(raw) ? raw : 'piloto';
  const { lots } = useData();
  const st = useBastidores();
  const visitorCase = useVisitorCase();

  const { openKyc, oldest } = useMemo(() => {
    const cases = [...KYC_QUEUE, ...(visitorCase ? [visitorCase] : [])];
    const open = cases.filter((c) => OPEN_KYC.includes(kycStatusAfter(c, lastDecision(st, c.id))));
    const oldestDays = open.reduce((m, c) => Math.max(m, daysBetween(c.submittedAt, TODAY_DATE)), 0);
    return { openKyc: open.length, oldest: oldestDays };
  }, [st, visitorCase]);

  const items = attentionItems(lots, st, openKyc, oldest);
  const tabsRef = useRef<HTMLDivElement>(null);
  const select = (s: SectionId) => setParams(s === 'piloto' ? {} : { sec: s });
  const jump = (s: SectionId) => {
    select(s);
    requestAnimationFrame(() => tabsRef.current?.scrollIntoView({ block: 'start' }));
  };

  const tabs: TabItem<SectionId>[] = [
    { value: 'piloto', label: 'Piloto', content: <PilotoTab /> },
    { value: 'risco', label: 'Risco', content: <RiscoTab /> },
    { value: 'tesouraria', label: 'Tesouraria', content: <TesourariaTab />, count: st.recon ? undefined : 1 },
    { value: 'compliance', label: 'Compliance', content: <ComplianceTab />, count: openKyc || undefined },
    { value: 'motor', label: 'Motor de missões', content: <MotorTab /> },
    { value: 'revisao', label: 'Revisão da gamificação', content: <RevisaoTab /> },
  ];

  return (
    <Page>
      <PageHeader
        title="Bastidores"
        description="O piloto fechado visto por dentro: operação, risco, tesouraria e compliance, com os mesmos números que os investidores veem. O piloto só começa em fevereiro de 2027: os lotes, os indicadores e os movimentos passados são histórico ilustrativo."
        meta={
          <>
            <Badge tone="accent">Piloto fechado · azeite + água em cesto</Badge>
            <Badge tone="warn">{ILLUSTRATIVE_LABEL}</Badge>
            <Badge tone="neutral">Só equipa Sprout</Badge>
            <span className="font-mono text-sm text-muted tnum">Dados de {dateTime(TODAY)}</span>
          </>
        }
        actions={
          <ButtonLink to="/plano" variant="secondary" iconRight={<ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />}>
            Plano de execução
          </ButtonLink>
        }
      />

      <section aria-labelledby="atencao-t" className="mb-8 rounded-md border border-border bg-surface">
        <h2 id="atencao-t" className="border-b border-border px-4 py-3 text-[1.0625rem] sm:px-5">
          Pede atenção hoje <span className="font-mono text-sm font-normal text-muted tnum">· {num(items.length)}</span>
        </h2>
        <ul className="grid divide-y divide-border lg:grid-cols-2 lg:divide-y-0">
          {items.map((it, i) => (
            <li key={it.id} className={cn('flex min-w-0 items-start gap-3 px-4 py-2.5 sm:px-5', 'lg:border-border', i >= 2 && 'lg:border-t', i % 2 === 1 && 'lg:border-l')}>
              {it.tone === 'warn' ? (
                <CircleAlert aria-label="Atenção" className="mt-1 size-4 shrink-0 text-warn-ink" strokeWidth={1.75} />
              ) : (
                <Info aria-label="Informação" className="mt-1 size-4 shrink-0 text-info-ink" strokeWidth={1.75} />
              )}
              <p className="min-w-0 flex-1 text-[0.9375rem] leading-snug text-fg">{it.text}</p>
              <button
                type="button"
                onClick={() => jump(it.section)}
                className="-my-1 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-sm px-2 text-sm font-medium text-accent hover:bg-surface-2"
              >
                {it.action}
                <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div ref={tabsRef} className="scroll-mt-20">
        <Tabs<SectionId> label="Áreas dos bastidores" items={tabs} value={section} onChange={select} />
      </div>
    </Page>
  );
}
