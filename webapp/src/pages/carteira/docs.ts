import { getRegion, getWorld, RESERVE_SHARE, SETTLEMENT_MONTHS, EXTENSION_MONTHS } from '../../data';
import type { Investor, Lot, QualityAnalysis } from '../../data';
import type { PositionView } from '../../state';
import { TODAY_DATE, toDate } from '../../lib/clock';
import { date as fmtDate, eur, lisbonParts, MONTHS_LONG, num, pct } from '../../lib/format';
import { decimalsOf, physicalShare, plannedSettlement, playbookFor, windowOf } from './positions';

/* =====================================================================
   Documentos da carteira gerados no browser a partir dos dados de
   demonstração: extratos mensais, resumo de condições por lote e boletins.
   Texto simples, para descarregar. Nada sai do browser.
   ===================================================================== */

const HEADER = 'SPROUT · AMBIENTE DE DEMONSTRAÇÃO · DADOS FICTÍCIOS';
const RULE = '-'.repeat(72);

/** Descarrega texto como ficheiro .txt (UTF-8). */
export function downloadText(filename: string, text: string): boolean {
  try {
    const blob = new Blob([`\ufeff${text}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch {
    return false;
  }
}

/** 'YYYY-MM' → "setembro de 2026" */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS_LONG[m - 1]} de ${y}`;
}

const lastDay = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return `${ym}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
};

/** Data de emissão do extrato de um mês: dia 5 do mês seguinte. */
export function statementIssueDate(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const total = y * 12 + m; // mês seguinte
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}-05`;
}

/** Meses com extrato emitido (do primeiro compromisso até ao último mês fechado). */
export function statementMonths(positions: PositionView[]): string[] {
  if (!positions.length) return [];
  const first = positions.map((p) => p.committedAt.slice(0, 7)).sort()[0];
  const out: string[] = [];
  let [y, m] = first.split('-').map(Number);
  for (;;) {
    const ym = `${y}-${String(m).padStart(2, '0')}`;
    if (statementIssueDate(ym) > TODAY_DATE) break;
    out.push(ym);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out.reverse();
}

const pad = (s: string, n: number) => (s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length));
const padL = (s: string, n: number) => (s.length >= n ? s : ' '.repeat(n - s.length) + s);
/** espaços não separáveis → espaços normais (ficheiros de texto) */
const plain = (s: string) => s.replace(/\u00a0/g, ' ');

function stageAt(lot: Lot, isoDate: string): string {
  const labels = getWorld(lot.world).journeyLabels;
  const done = lot.milestones.filter((m) => m.date && m.date <= isoDate);
  const last = done[done.length - 1];
  return last ? labels[last.stage] : 'Antes da colheita';
}

export function monthlyStatement(investor: Investor, positions: PositionView[], ym: string): string {
  const end = lastDay(ym);
  const inMonth = (iso?: string) => Boolean(iso && iso.slice(0, 7) === ym);
  const held = positions.filter((p) => p.committedAt.slice(0, 10) <= end);
  const total = held.reduce((s, p) => s + p.amount, 0);
  const lines: string[] = [
    HEADER,
    `EXTRATO MENSAL · ${monthLabel(ym).toUpperCase()}`,
    RULE,
    `Titular: ${investor.nome}`,
    `Classificação: investidor ${investor.classe === 'profissional' ? 'profissional' : 'qualificado'}`,
    `Período: ${fmtDate(`${ym}-01`)} a ${fmtDate(end)} · emitido a ${fmtDate(statementIssueDate(ym))}`,
    'Conta: conta segregada de clientes num prestador de serviços de pagamento licenciado na UE',
    RULE,
    'POSIÇÕES NO FIM DO PERÍODO',
    `${pad('Lote', 13)}${pad('Produtor', 26)}${padL('Montante', 12)}  Etapa`,
  ];
  for (const p of held) {
    lines.push(`${pad(p.lot.id, 13)}${pad(p.producer.nome, 26)}${padL(plain(eur(p.amount)), 12)}  ${stageAt(p.lot, end)}`);
  }
  lines.push(`${pad('Total', 39)}${padL(plain(eur(total)), 12)}`);
  lines.push(RULE, 'MOVIMENTOS NO PERÍODO');
  const moves = held.flatMap((p) => [
    ...(inMonth(p.committedAt) ? [`${fmtDate(p.committedAt)}  Compromisso no lote ${p.lot.id}: ${plain(eur(p.amount))}`] : []),
    ...(inMonth(p.fundedAt) ? [`${fmtDate(p.fundedAt!)}  Transferência SEPA recebida na conta segregada: ${plain(eur(p.amount))} (${p.lot.id})`] : []),
  ]);
  lines.push(...(moves.length ? moves.sort() : ['Sem movimentos.']));
  lines.push(RULE, 'LIQUIDAÇÕES NO PERÍODO', 'Nenhuma.', RULE);
  lines.push(
    'Capital em risco. A liquidação prevista é uma estimativa, não uma promessa: o preço pode',
    'cair, a venda pode atrasar e pode haver perda de parte ou da totalidade do capital.',
    'Não há mercado secundário antes da liquidação.',
  );
  return lines.join('\n');
}

export function contractSummary(investor: Investor, p: PositionView): string {
  const lot = p.lot;
  const w = windowOf(lot);
  const share = physicalShare(p);
  const pb = playbookFor(lot);
  const region = getRegion(lot.regionId);
  const lines: string[] = [
    HEADER,
    `RESUMO DAS CONDIÇÕES · LOTE ${lot.id}`,
    'Este resumo não substitui o contrato assinado entre a plataforma e o investidor.',
    RULE,
    `Investidor: ${investor.nome}`,
    `Lote: ${lot.id} · ${lot.title} · ${p.producer.nome}, ${region?.nome ?? ''} · campanha ${lot.campanha}`,
    `Mercadoria: ${plain(lot.product)}`,
    `Montante financiado: ${plain(eur(p.amount))} (${plain(pct(share.shareOfLot, 1))} do lote; ${plain(share.primary)} ${plain(share.secondary)})`,
    `Compromisso: ${fmtDate(p.committedAt)}${p.fundedAt ? ` · transferência recebida a ${fmtDate(p.fundedAt)}` : ' · transferência por receber'}`,
    RULE,
    'PRAZO E LIQUIDAÇÃO',
    `Janela de ${SETTLEMENT_MONTHS} meses: ${fmtDate(w.start)} a ${fmtDate(w.end)}${w.projected ? ' (começa quando o financiamento fechar)' : ''}.`,
    `Liquidação prevista: ${plannedSettlement(lot) ? fmtDate(plannedSettlement(lot)!) : 'a definir'}. Estimativa, não garantida.`,
    'A liquidação é feita de uma só vez, por transferência SEPA da conta segregada para o IBAN',
    'registado, depois de o lote estar vendido e os compradores terem pago.',
    RULE,
    `EXTENSÃO (uma vez, até ${EXTENSION_MONTHS} meses)`,
    ...lot.extension.conditions.map((c) => `- ${plain(c)}`),
    plain(lot.extension.decision),
    RULE,
    'COBERTURA E RESERVA',
    `${plain(lot.hedge.label)}: ${plain(lot.hedge.note)}`,
    ...(lot.hedge.trigger ? [`Gatilho: ${plain(lot.hedge.trigger)}`] : []),
    `Reserva de primeira perda: ${num(RESERVE_SHARE * 100)} % da margem bruta do lote, retida pela Sprout.`,
    RULE,
    'REFUNDING',
    ...(pb ? [`${pb.title}. Gatilho: ${plain(pb.trigger)}`, ...pb.steps.map((s) => `${s.order}. ${plain(s.title)} (${s.owner}, ${s.sla})`)] : ['Playbook por publicar.']),
    'O refunding dá tempo ao lote, com custo. Não elimina a perda.',
    RULE,
    'Sem mercado secundário no piloto: a posição não pode ser vendida antes da liquidação.',
    'Cláusula de força maior: prevista no contrato padrão do piloto.',
  ];
  return lines.join('\n');
}

export function analysisReport(lot: Lot, a: QualityAnalysis): string {
  const lines: string[] = [
    HEADER,
    `BOLETIM DE ANÁLISES ${a.reportId} · LOTE ${lot.id}`,
    RULE,
    `Laboratório: ${plain(a.lab)}`,
    `Data: ${fmtDate(a.date)}`,
    `Referência: ${plain(a.reference)}`,
    `Resultado: ${plain(a.category)}`,
    RULE,
    `${pad('Parâmetro', 32)}${padL('Valor', 12)}  Limite`,
    ...a.params.map((x) => `${pad(plain(x.label), 32)}${padL(plain(`${num(x.value, decimalsOf(x.value, x.limit))}${x.unit ? ` ${x.unit}` : ''}`), 12)}  ${plain(x.limitLabel)}${x.pass ? '' : '  (fora do limite)'}`),
    ...(a.panel ? [RULE, `Painel de prova: frutado ${num(a.panel.medianaFrutado, 1)} · defeito ${num(a.panel.medianaDefeito, 1)} · ${a.panel.atributos.join(', ')}`] : []),
    ...(a.note ? [RULE, plain(a.note)] : []),
  ];
  return lines.join('\n');
}

/** Data ISO curta para nomes de ficheiro. */
export const fileDate = (iso: string) => {
  const p = lisbonParts(toDate(iso));
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
};
