import type { WorldId } from './types';

/* =====================================================================
   Cadeia de valor: um só sítio para os números que várias páginas mostram
   (Apresentação, Mercados, Jornada do lote, Academia).

   O bloco entre o preço ao produtor e o preço ao comprador NÃO é a margem
   do embalador. É o diferencial granel → comprador: inclui embalamento,
   logística e as margens de todos os intermediários. A margem líquida do
   embalador é só uma parte dele (valores verificados abaixo). Ver
   docs/research/00-base-factual.md §1.4 e §12.
   ===================================================================== */

/** Preço que o produtor recebe hoje na cadeia habitual: hipótese de trabalho, ilustrativa (por kg, por L, por kg). */
export const PRODUCER_PRICE_TODAY: Record<WorldId, number> = { azeite: 3.2, agua: 0.175, cafe: 5.45 };

/** Nome e conteúdo do diferencial produtor → comprador, por mundo. */
export const CHAIN_DIFFERENTIAL: Record<WorldId, { label: string; short: string; contains: string }> = {
  azeite: { label: 'Diferencial granel → comprador', short: 'Diferencial', contains: 'embalamento, logística e margens de intermediação' },
  agua: { label: 'Diferencial nascente → comprador', short: 'Diferencial', contains: 'transporte, armazém e margem do grossista' },
  cafe: { label: 'Diferencial fazenda → torrefação', short: 'Diferencial', contains: 'exportação, frete, importação e margens dos intermediários' },
};

/**
 * Valores verificados da cadeia do azeite virgem extra, €/kg.
 * Fonte: Observatorio de la Cadena Alimentaria (Ministerio de Agricultura, Espanha),
 * estudos da cadeia de valor do AOVE, campanhas 2018/19 a 2020/21.
 */
export const OLIVE_CHAIN_FACTS = {
  /** custo de embalamento */
  packingCost: [0.47, 0.51] as [number, number],
  /** margem líquida do embalador */
  packagerNetMargin: [0.19, 0.5] as [number, number],
  /** a mesma margem em fração do preço de venda ao público sem IVA */
  packagerNetMarginOfRetail: [0.049, 0.141] as [number, number],
  sourceShort: 'Observatório da cadeia alimentar de Espanha, campanhas 2018/19 a 2020/21',
};

/** Tese original dos fundadores (documento de 13/10/2026). Está por validar no piloto. */
export const FOUNDERS_THESIS = {
  packagerMarginCaptured: [0.8, 0.9] as [number, number],
  buyerDiscount: [0.1, 0.15] as [number, number],
  status: 'tese original dos fundadores, por validar no piloto',
};
