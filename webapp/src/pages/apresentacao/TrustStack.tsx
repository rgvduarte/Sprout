import { motion, useTransform, type MotionValue } from 'motion/react';
import { Chapter } from '../../components/game';
import { useIsDesktop } from '../../lib/useMediaQuery';
import { cn } from '../../lib/cn';
import { tidyText } from '../../lib/format';
import { RECON } from './model';
import { ChapterHead, Frame, useStep } from './parts';

/* =====================================================================
   6 · Arquitetura de confiança. Oito camadas em placas axonométricas que
   assentam umas sobre as outras com o scroll, da mercadoria física ao
   piloto fechado. A lista à esquerda tem todo o conteúdo em repouso.
   ===================================================================== */

interface Layer {
  id: string;
  name: string;
  short: string;
  detail: string;
  tone: 'world' | 'neutral' | 'accent';
}

const LAYERS: Layer[] = [
  { id: 'mercadoria', name: 'Mercadoria física', short: 'Mercadoria física', tone: 'world', detail: 'Cada lote existe antes do dinheiro: IBC e paletes selados com o número do lote, seguro de mercadoria e inventário mensal com fotografia.' },
  { id: 'contratos', name: 'Contratos-padrão', short: 'Contratos-padrão', tone: 'neutral', detail: 'Entre produtor e Sprout e entre Sprout e investidor: janela de 18 meses, extensão condicionada e cláusulas de força maior.' },
  { id: 'cobertura', name: 'Cobertura e reserva', short: 'Cobertura e reserva', tone: 'neutral', detail: 'Venda a prazo e indexação no azeite, com gatilhos e contrapartes definidos; reserva de primeira perda e playbook de refunding por lote.' },
  { id: 'psp', name: 'PSP ou IME licenciada na UE', short: 'PSP/IME licenciada na UE', tone: 'neutral', detail: 'Os pagamentos passam por uma instituição de pagamento ou de moeda eletrónica licenciada na UE. Só SEPA: sem numerário nem cripto.' },
  { id: 'segregadas', name: 'Contas segregadas', short: 'Contas segregadas', tone: 'neutral', detail: 'O dinheiro dos co-financiadores fica numa conta segregada no PSP, fora do balanço da Sprout.' },
  {
    id: 'reconciliacao',
    name: 'Reconciliação diária',
    short: 'Reconciliação diária',
    tone: 'neutral',
    detail: `Saldo do PSP contra a contabilidade interna, todos os dias. Nos últimos ${RECON.days} dias: ${RECON.resolved} diferenças resolvidas no dia seguinte e ${RECON.open} em aberto.`,
  },
  { id: 'kyc', name: 'KYC/AML', short: 'KYC/AML', tone: 'neutral', detail: 'Identidade, beneficiário efetivo e origem dos fundos verificados antes de qualquer compromisso.' },
  { id: 'piloto', name: 'Piloto fechado', short: 'Piloto fechado', tone: 'accent', detail: 'Coorte de azeite e água, só investidores qualificados e por convite. O retalho fica de fora, com explicação.' },
];

const START = 0.06;
const STEP = 0.095;
const toCount = (v: number) => Math.max(0, Math.min(LAYERS.length, Math.floor((v - START) / STEP + 0.6)));

export function TrustChapter({ tall }: { tall: boolean }) {
  return (
    <Chapter id="confianca" label="Confiança" heightVh={230} static={!tall} stickyClassName="pt-14 pb-4">
      {(progress, rich) => <TrustScene progress={progress} rich={rich} />}
    </Chapter>
  );
}

function TrustScene({ progress, rich }: { progress: MotionValue<number>; rich: boolean }) {
  const count = useStep(progress, toCount);
  const placed = rich ? count : LAYERS.length;
  const active = rich ? placed - 1 : -1;
  const wide = useIsDesktop();
  return (
    <Frame>
      <div className="grid min-w-0 items-center gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <div className="min-w-0">
          <ChapterHead title="Arquitetura de confiança" lead="O jogo só funciona se o dinheiro estiver protegido por baixo. Oito camadas, da mercadoria ao acesso." />
          <ol className="mt-7 flex flex-col gap-2.5" aria-label="Camadas, da base para o topo">
            {LAYERS.map((l, i) => (
              <li key={l.id} className={cn('grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2 text-[0.9375rem] leading-snug transition-colors duration-200', i < placed ? 'text-fg' : 'text-muted')}>
                <span className="pt-px font-mono text-xs text-muted tnum">{i + 1}</span>
                <span className="min-w-0">
                  <span className={cn('font-semibold', i === active && 'underline decoration-accent decoration-2 underline-offset-[0.25em]')}>{l.name}</span>
                  <span className="text-muted"> · {tidyText(l.detail)}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <Stack progress={progress} labels={wide} active={active} />
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------ placas */

const A = 180;
const T = 16;
const PITCH = 25;
const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;
const Z_TOP = (LAYERS.length - 1) * PITCH + T;

function Stack({ progress, labels, active }: { progress: MotionValue<number>; labels: boolean; active: number }) {
  const ox = A * COS + 14;
  const oy = Z_TOP + 26;
  const width = labels ? ox + A * COS + 214 : ox * 2;
  const height = oy + A * SIN * 2 + 12;
  const p = (x: number, y: number, z: number) => [ox + (x - y) * COS, oy + (x + y) * SIN - z] as const;
  return (
    <svg viewBox={`0 0 ${width.toFixed(0)} ${height.toFixed(0)}`} className={cn('block h-auto w-full', labels ? 'max-w-[540px]' : 'mx-auto max-w-[320px]')} role="img" aria-label={`Pilha de ${LAYERS.length} camadas, da base para o topo: ${LAYERS.map((l) => l.name).join(', ')}.`}>
      {/* lugar da pilha: contorno de cada placa por assentar */}
      {LAYERS.map((l, i) => {
        const z1 = i * PITCH + T;
        const top = [p(0, 0, z1), p(A, 0, z1), p(A, A, z1), p(0, A, z1)];
        return <polygon key={`g-${l.id}`} points={top.map((q) => q.join(',')).join(' ')} fill="none" stroke="var(--border)" strokeWidth="1" />;
      })}
      {LAYERS.map((l, i) => (
        <Slab key={l.id} layer={l} index={i} progress={progress} p={p} labels={labels} active={i === active} labelX={ox + A * COS + 18} />
      ))}
    </svg>
  );
}

const FILL: Record<Layer['tone'], string> = {
  world: 'color-mix(in oklab, var(--c-azeite) 55%, var(--surface))',
  neutral: 'var(--surface)',
  accent: 'color-mix(in oklab, var(--accent) 78%, var(--surface))',
};

function Slab({ layer, index, progress, p, labels, active, labelX }: { layer: Layer; index: number; progress: MotionValue<number>; p: (x: number, y: number, z: number) => readonly [number, number]; labels: boolean; active: boolean; labelX: number }) {
  const r0 = START + index * STEP;
  const y = useTransform(progress, [r0 - 0.04, r0 + 0.08], [-46, 0]);
  const opacity = useTransform(progress, [r0 - 0.04, r0 + 0.04], [0, 1]);
  const z0 = index * PITCH;
  const z1 = z0 + T;
  const pts = (arr: (readonly [number, number])[]) => arr.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
  const top = [p(0, 0, z1), p(A, 0, z1), p(A, A, z1), p(0, A, z1)];
  const left = [p(0, A, z1), p(A, A, z1), p(A, A, z0), p(0, A, z0)];
  const right = [p(A, 0, z1), p(A, A, z1), p(A, A, z0), p(A, 0, z0)];
  const base = FILL[layer.tone];
  const line = 'color-mix(in oklab, var(--fg) 50%, var(--surface))';
  const anchor = p(A, 0, z0 + T / 2);
  return (
    <motion.g style={{ y, opacity }}>
      <polygon points={pts(left)} fill={`color-mix(in oklab, ${base} 86%, var(--fg))`} stroke={line} strokeWidth="1" strokeLinejoin="round" />
      <polygon points={pts(right)} fill={`color-mix(in oklab, ${base} 74%, var(--fg))`} stroke={line} strokeWidth="1" strokeLinejoin="round" />
      <polygon points={pts(top)} fill={base} stroke={active ? 'var(--accent)' : line} strokeWidth={active ? 2 : 1} strokeLinejoin="round" />
      {labels && (
        <g>
          <line x1={anchor[0] + 4} y1={anchor[1]} x2={labelX - 6} y2={anchor[1]} stroke="var(--border)" strokeWidth="1" />
          <text x={labelX} y={anchor[1] + 4.5} fontSize="13.5" fontFamily="var(--font-sans)" fontWeight={active ? 650 : 450} fill={active ? 'var(--fg)' : 'var(--muted)'}>
            {layer.short}
          </text>
        </g>
      )}
    </motion.g>
  );
}
