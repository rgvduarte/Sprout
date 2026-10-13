import type { Lot } from '../data/types';
import { eurToKg, eurToPaletes, eurToSacas, kgToBottles, num, PALETE, SACA_KG } from './format';

/**
 * Traduz um montante em mercadoria física do lote.
 * physicalForAmount(AZ-2026-021, 5000) → "1 416 kg", "≈ 2 061 garrafas de 0,75 L".
 */
export interface Physical {
  /** quantidade na unidade base (kg ou L) */
  base: number;
  /** quantidade na unidade do lote (kg, paletes, sacas) */
  units: number;
  /** texto principal, p.ex. "1 416 kg" ou "29,8 paletes" */
  primary: string;
  /** equivalência legível, p.ex. "≈ 2 061 garrafas de 0,75 L" */
  secondary: string;
  /** fração do lote */
  shareOfLot: number;
}

export function physicalForAmount(lot: Lot, amount: number): Physical {
  const price = lot.economics.fundingPrice;
  const shareOfLot = lot.funding.goal > 0 ? amount / lot.funding.goal : 0;
  if (lot.world === 'azeite') {
    const kgv = eurToKg(amount, price);
    return { base: kgv, units: kgv, primary: `${num(kgv)} kg`, secondary: `≈ ${num(kgToBottles(kgv))} garrafas de 0,75 L`, shareOfLot };
  }
  if (lot.world === 'agua') {
    const paletes = eurToPaletes(amount, price);
    const litros = paletes * PALETE.litros;
    return {
      base: litros,
      units: paletes,
      primary: `${num(paletes, 1)} paletes`,
      secondary: `≈ ${num(Math.floor(paletes * PALETE.garrafas))} garrafas de 1,5 L`,
      shareOfLot,
    };
  }
  const sacas = eurToSacas(amount, price);
  return { base: sacas * SACA_KG, units: sacas, primary: `${num(sacas, 1)} sacas`, secondary: `≈ ${num(sacas * SACA_KG)} kg de café verde`, shareOfLot };
}

/** Quantidade total do lote em texto: "24 000 kg", "320 paletes", "320 sacas de 60 kg". */
export function lotQuantityLabel(lot: Pick<Lot, 'unit' | 'quantity'>): string {
  if (lot.unit === 'kg') return `${num(lot.quantity)} kg`;
  if (lot.unit === 'palete') return `${num(lot.quantity)} paletes`;
  return `${num(lot.quantity)} sacas de 60 kg`;
}
