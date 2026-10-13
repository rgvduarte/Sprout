import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { Chapter, EASE_OUT } from '../../components/game';
import { useIsDesktop } from '../../lib/useMediaQuery';
import { cn } from '../../lib/cn';
import { tidyText } from '../../lib/format';
import { CHAIN } from './model';
import { ChapterHead, Frame } from './parts';

/* =====================================================================
   6 · Arquitetura de confiança. Oito camadas em placas axonométricas, da
   mercadoria física ao piloto fechado. Capítulo estático: a lista tem todo
   o conteúdo e as placas assentam uma vez, ao entrar no ecrã (≤ 600 ms),
   sem scroll fixo. Com movimento reduzido aparecem já assentes.
   ===================================================================== */

interface Layer {
  id: string;
  name: string;
  short: string;
  detail: string;
  tone: 'world' | 'neutral' | 'accent';
}

const LAYERS: Layer[] = [
  { id: 'mercadoria', name: 'Mercadoria física', short: 'Mercadoria física', tone: 'world', detail: 'Cada lote existe antes do dinheiro: azeite já extraído e analisado, em IBC selados com o número do lote até ao embalamento, com seguro e inventário mensal com fotografia.' },
  { id: 'contratos', name: 'Contratos-padrão', short: 'Contratos-padrão', tone: 'neutral', detail: 'Entre produtor e Sprout e entre Sprout e investidor: liquidação esperada numa campanha, janela de 18 meses, extensão condicionada e cláusulas de força maior.' },
  {
    id: 'cobertura',
    name: 'Cobertura e reserva',
    short: 'Cobertura e reserva',
    tone: 'neutral',
    detail: `Vendas contratadas ou a prazo antes da compra, com gatilhos definidos. A reserva comum de primeira perda recebe ${Math.round(CHAIN.shares.reserve * 100)} % da margem de cada lote que liquida com ganho, até 5 % do capital em curso, e pode esgotar-se.`,
  },
  { id: 'psp', name: 'PSP ou IME licenciada na UE', short: 'PSP/IME licenciada na UE', tone: 'neutral', detail: 'Os pagamentos passam por uma instituição de pagamento ou de moeda eletrónica licenciada na UE. Só SEPA: sem numerário nem cripto.' },
  { id: 'segregadas', name: 'Contas segregadas', short: 'Contas segregadas', tone: 'neutral', detail: 'O dinheiro dos cofinanciadores fica numa conta segregada no PSP, fora do balanço da Sprout.' },
  {
    id: 'reconciliacao',
    name: 'Reconciliação diária',
    short: 'Reconciliação diária',
    tone: 'neutral',
    detail: 'Saldo do PSP contra o ledger interno, todos os dias: às 10h00 do dia seguinte não pode haver diferenças por explicar, e qualquer diferença na conta segregada bloqueia pagamentos.',
  },
  { id: 'kyc', name: 'KYC/AML', short: 'KYC/AML', tone: 'neutral', detail: 'Identidade, beneficiário efetivo e origem dos fundos verificados antes de qualquer compromisso.' },
  { id: 'piloto', name: 'Piloto fechado', short: 'Piloto fechado', tone: 'accent', detail: 'O piloto de 2027 usa capital próprio. Só depois do gate de 31/08/2027 abre a primeira série, a investidores qualificados. A água entra como cesto, sem financiamento. O retalho fica de fora, com explicação.' },
];

/** Assentamento ao entrar: 8 placas, 280 ms cada, 40 ms entre elas (termina aos 560 ms). */
const SLAB_DUR = 0.28;
const SLAB_STAGGER = 0.04;

export function TrustChapter() {
  return (
    <Chapter id="confianca" label="Confiança" static>
      <TrustScene />
    </Chapter>
  );
}

function TrustScene() {
  const wide = useIsDesktop();
  return (
    <Frame>
      <div className="grid min-w-0 items-center gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <div className="min-w-0">
          <ChapterHead title="Arquitetura de confiança" lead="O jogo só funciona se o dinheiro estiver protegido por baixo. Oito camadas, da mercadoria ao acesso." />
          <ol className="mt-7 flex flex-col gap-2.5" aria-label="Camadas, da base para o topo">
            {LAYERS.map((l, i) => (
              <li key={l.id} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2 text-[0.9375rem] leading-snug text-fg">
                <span className="pt-px font-mono text-xs text-muted tnum">{i + 1}</span>
                <span className="min-w-0">
                  <span className="font-semibold">{l.name}</span>
                  <span className="text-muted"> · {tidyText(l.detail)}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <Stack labels={wide} />
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

function Stack({ labels }: { labels: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();
  const animate = !reduce;
  const ox = A * COS + 14;
  const oy = Z_TOP + 26;
  const width = labels ? ox + A * COS + 214 : ox * 2;
  const height = oy + A * SIN * 2 + 12;
  const p = (x: number, y: number, z: number) => [ox + (x - y) * COS, oy + (x + y) * SIN - z] as const;
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width.toFixed(0)} ${height.toFixed(0)}`}
      className={cn('block h-auto w-full', labels ? 'max-w-[540px]' : 'mx-auto max-w-[320px]')}
      role="img"
      aria-label={`Pilha de ${LAYERS.length} camadas, da base para o topo: ${LAYERS.map((l) => l.name).join(', ')}.`}
    >
      {/* lugar da pilha: contorno de cada placa */}
      {LAYERS.map((l, i) => {
        const z1 = i * PITCH + T;
        const top = [p(0, 0, z1), p(A, 0, z1), p(A, A, z1), p(0, A, z1)];
        return <polygon key={`g-${l.id}`} points={top.map((q) => q.join(',')).join(' ')} fill="none" stroke="var(--border)" strokeWidth="1" />;
      })}
      {LAYERS.map((l, i) => (
        <Slab key={l.id} layer={l} index={i} p={p} labels={labels} labelX={ox + A * COS + 18} animate={animate} shown={inView || !animate} />
      ))}
    </svg>
  );
}

const FILL: Record<Layer['tone'], string> = {
  world: 'color-mix(in oklab, var(--c-azeite) 55%, var(--surface))',
  neutral: 'var(--surface)',
  accent: 'color-mix(in oklab, var(--accent) 78%, var(--surface))',
};

function Slab({ layer, index, p, labels, labelX, animate, shown }: { layer: Layer; index: number; p: (x: number, y: number, z: number) => readonly [number, number]; labels: boolean; labelX: number; animate: boolean; shown: boolean }) {
  const z0 = index * PITCH;
  const z1 = z0 + T;
  const pts = (arr: (readonly [number, number])[]) => arr.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
  const top = [p(0, 0, z1), p(A, 0, z1), p(A, A, z1), p(0, A, z1)];
  const left = [p(0, A, z1), p(A, A, z1), p(A, A, z0), p(0, A, z0)];
  const right = [p(A, 0, z1), p(A, A, z1), p(A, A, z0), p(A, 0, z0)];
  const base = FILL[layer.tone];
  const line = 'color-mix(in oklab, var(--fg) 50%, var(--surface))';
  const anchor = p(A, 0, z0 + T / 2);
  const top1 = index === LAYERS.length - 1;
  return (
    <motion.g
      initial={animate ? { opacity: 0, y: -28 } : false}
      animate={shown ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: SLAB_DUR, delay: index * SLAB_STAGGER, ease: EASE_OUT }}
    >
      <polygon points={pts(left)} fill={`color-mix(in oklab, ${base} 86%, var(--fg))`} stroke={line} strokeWidth="1" strokeLinejoin="round" />
      <polygon points={pts(right)} fill={`color-mix(in oklab, ${base} 74%, var(--fg))`} stroke={line} strokeWidth="1" strokeLinejoin="round" />
      <polygon points={pts(top)} fill={base} stroke={top1 ? 'var(--accent)' : line} strokeWidth={top1 ? 2 : 1} strokeLinejoin="round" />
      {labels && (
        <g>
          <line x1={anchor[0] + 4} y1={anchor[1]} x2={labelX - 6} y2={anchor[1]} stroke="var(--border)" strokeWidth="1" />
          <text x={labelX} y={anchor[1] + 4.5} fontSize="13.5" fontFamily="var(--font-sans)" fontWeight={top1 ? 650 : 450} fill={top1 ? 'var(--fg)' : 'var(--muted)'}>
            {layer.short}
          </text>
        </g>
      )}
    </motion.g>
  );
}
