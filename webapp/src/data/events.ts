import { tidyDeep } from '../lib/format';
import type { CampaignEvent, CampaignEventKind, WorldId } from './types';

/* =====================================================================
   Diário de campanha: histórico (setembro–outubro de 2026). Eventos ao
   vivo são acrescentados por lib/useLiveFeed.ts a partir das 10:00 de 13/10.
   ===================================================================== */

type Row = [at: string, world: WorldId, kind: CampaignEventKind, title: string, ref?: { producerId?: string; lotId?: string }, detail?: string];

const ROWS: Row[] = [
  ['2026-09-04T16:05:00+01:00', 'agua', 'expedicao', 'AG-2026-002 expedido: 24 paletes para grossista HoReCa, Braga', { producerId: 'nascente-serra-verde', lotId: 'AG-2026-002' }],
  ['2026-09-08T10:30:00+01:00', 'azeite', 'venda', 'AZ-2025-031: 1 800 kg vendidos a cadeia de supermercados regional, Centro', { producerId: 'lagar-serra-gardunha', lotId: 'AZ-2025-031' }],
  ['2026-09-10T09:00:00+01:00', 'azeite', 'extensao', 'AZ-2025-017 entra em extensão até 10/03/2027', { producerId: 'herdade-monte-claro', lotId: 'AZ-2025-017' }, 'Referência 32 % abaixo da entrada e 40 % do stock por vender no mês 18. Comunicado aos co-financiadores a 11/08/2026.'],
  ['2026-09-11T15:40:00+01:00', 'agua', 'engarrafamento', 'Águas da Fonte Fria engarrafou 38 paletes na linha 2', { producerId: 'aguas-fonte-fria' }],
  ['2026-09-16T12:10:00+01:00', 'azeite', 'venda', 'AZ-2026-009: 1 200 kg vendidos a cash & carry, Coimbra', { producerId: 'lagar-serra-gardunha', lotId: 'AZ-2026-009' }],
  ['2026-09-18T14:30:00+01:00', 'cafe', 'analise', 'Fazenda Alto Mogiana: amostra de pré-safra com 82,5 pontos SCA', { producerId: 'fazenda-alto-mogiana', lotId: 'CF-2027-001' }, 'Due diligence da Fase 2. Sem financiamento aberto.'],
  ['2026-09-22T17:05:00+01:00', 'agua', 'venda', 'AG-2026-002: 30 paletes vendidas a grossista HoReCa, Braga', { producerId: 'nascente-serra-verde', lotId: 'AG-2026-002' }],
  ['2026-09-24T10:15:00+01:00', 'azeite', 'cobertura', 'Cobertura do AZ-2026-014 revista: referência a 4,47 €/kg, gatilho em 4,05 €/kg', { producerId: 'herdade-monte-claro', lotId: 'AZ-2026-014' }],
  ['2026-09-25T11:00:00+01:00', 'cafe', 'analise', 'Finca Los Naranjos: amostra da mitaca com 84,25 pontos SCA', { producerId: 'finca-los-naranjos', lotId: 'CF-2027-002' }, 'Due diligence da Fase 2. Sem financiamento aberto.'],
  ['2026-09-29T08:40:00+01:00', 'azeite', 'colheita', 'Olival do Guadiana começou a apanha da Cordovil', { producerId: 'olival-guadiana' }],
  ['2026-09-29T15:00:00+01:00', 'agua', 'engarrafamento', 'Linha 2 da Fonte Fria começou o lote de engarrafamento L2609', { producerId: 'aguas-fonte-fria', lotId: 'AG-2026-007' }],
  ['2026-09-30T18:20:00+01:00', 'azeite', 'venda', 'AZ-2025-017: 2 600 kg vendidos a distribuidor HoReCa, Lisboa', { producerId: 'herdade-monte-claro', lotId: 'AZ-2025-017' }],
  ['2026-10-01T09:00:00+01:00', 'azeite', 'colheita', 'Lagar da Ribeira Alta abriu a campanha 2026/27', { producerId: 'lagar-ribeira-alta' }],
  ['2026-10-02T12:45:00+01:00', 'azeite', 'expedicao', 'AZ-2026-003 expedido: últimos 8 IBC para distribuidor HoReCa, Algarve', { producerId: 'olival-guadiana', lotId: 'AZ-2026-003' }],
  ['2026-10-02T17:30:00+01:00', 'agua', 'engarrafamento', 'Lote L2609 fechado: 320 paletes em armazém', { producerId: 'aguas-fonte-fria', lotId: 'AG-2026-007' }],
  ['2026-10-03T16:10:00+01:00', 'azeite', 'rececao', 'Olival do Guadiana recebeu 61 t de azeitona', { producerId: 'olival-guadiana' }],
  ['2026-10-05T10:20:00+01:00', 'agua', 'analise', 'Análise laboratorial publicada: AG-2026-007 conforme, resíduo seco 29 mg/L', { producerId: 'aguas-fonte-fria', lotId: 'AG-2026-007' }],
  ['2026-10-05T19:00:00+01:00', 'azeite', 'telemetria', 'Lagar da Ribeira Alta encheu o Depósito 1 · 20 000 kg', { producerId: 'lagar-ribeira-alta' }],
  ['2026-10-06T09:30:00+01:00', 'agua', 'financiamento', 'AG-2026-007 aberto a financiamento: 320 paletes', { producerId: 'aguas-fonte-fria', lotId: 'AG-2026-007' }],
  ['2026-10-06T14:15:00+01:00', 'agua', 'expedicao', 'AG-2026-003 expedido para cash & carry, Porto', { producerId: 'aguas-fonte-fria', lotId: 'AG-2026-003' }, 'Últimas 60 paletes. Pagamento a 45 dias.'],
  ['2026-10-07T11:40:00+01:00', 'azeite', 'telemetria', 'Olival do Guadiana encheu o Depósito 2 · 25 000 kg', { producerId: 'olival-guadiana' }],
  ['2026-10-08T08:15:00+01:00', 'azeite', 'colheita', 'Lagar Serra da Gardunha moeu a primeira Galega de colheita precoce', { producerId: 'lagar-serra-gardunha', lotId: 'AZ-2026-019' }],
  ['2026-10-08T13:00:00+01:00', 'azeite', 'venda', 'AZ-2025-031: 1 400 kg vendidos a cadeia de supermercados regional, Centro', { producerId: 'lagar-serra-gardunha', lotId: 'AZ-2025-031' }],
  ['2026-10-09T10:00:00+01:00', 'agua', 'engarrafamento', 'Nascente da Serra Verde começou o engarrafamento do AG-2026-010', { producerId: 'nascente-serra-verde', lotId: 'AG-2026-010' }],
  ['2026-10-09T12:00:00+01:00', 'azeite', 'cobertura', 'Venda a prazo do AZ-2026-021 assinada: 12 000 kg a 3,96 €/kg', { producerId: 'lagar-ribeira-alta', lotId: 'AZ-2026-021' }, 'Entregas de fevereiro a junho de 2027 a cadeia de distribuição alimentar, Norte.'],
  ['2026-10-09T16:30:00+01:00', 'azeite', 'analise', 'Análise laboratorial publicada: AZ-2026-021 virgem extra, acidez 0,21 %', { producerId: 'lagar-ribeira-alta', lotId: 'AZ-2026-021' }],
  ['2026-10-10T09:00:00+01:00', 'azeite', 'financiamento', 'AZ-2026-021 aberto a financiamento: 24 000 kg', { producerId: 'lagar-ribeira-alta', lotId: 'AZ-2026-021' }],
  ['2026-10-10T18:45:00+01:00', 'azeite', 'telemetria', 'Lagar Serra da Gardunha: Depósito 1 a 14 250 kg', { producerId: 'lagar-serra-gardunha' }],
  ['2026-10-11T11:20:00+01:00', 'azeite', 'analise', 'Análise laboratorial publicada: AZ-2026-024 virgem extra, acidez 0,26 %', { producerId: 'olival-guadiana', lotId: 'AZ-2026-024' }],
  ['2026-10-11T17:50:00+01:00', 'agua', 'telemetria', 'Nascente da Serra Verde: 142 paletes do AG-2026-010 em armazém', { producerId: 'nascente-serra-verde', lotId: 'AG-2026-010' }],
  ['2026-10-12T09:00:00+01:00', 'azeite', 'financiamento', 'AZ-2026-024 aberto a financiamento: 30 000 kg', { producerId: 'olival-guadiana', lotId: 'AZ-2026-024' }],
  ['2026-10-12T15:10:00+01:00', 'azeite', 'rececao', 'Lagar da Ribeira Alta recebeu 48 t de azeitona Verdeal', { producerId: 'lagar-ribeira-alta' }],
  ['2026-10-12T19:40:00+01:00', 'agua', 'engarrafamento', 'Águas da Fonte Fria engarrafou 26 paletes na linha 1', { producerId: 'aguas-fonte-fria' }],
  ['2026-10-13T07:55:00+01:00', 'azeite', 'telemetria', 'Olival do Guadiana: Depósito 3 a 11 800 kg', { producerId: 'olival-guadiana' }],
  ['2026-10-13T08:20:00+01:00', 'azeite', 'qualidade', 'Inventário mensal do AZ-2025-017: 10 IBC e 400 kg confirmados', { producerId: 'herdade-monte-claro', lotId: 'AZ-2025-017' }],
  ['2026-10-13T09:05:00+01:00', 'azeite', 'qualidade', 'Inventário mensal do AZ-2026-014: 22 IBC selados confirmados', { producerId: 'herdade-monte-claro', lotId: 'AZ-2026-014' }],
  ['2026-10-13T09:22:00+01:00', 'agua', 'telemetria', 'Águas da Fonte Fria: armazém com 612 paletes', { producerId: 'aguas-fonte-fria' }],
  ['2026-10-13T09:41:00+01:00', 'azeite', 'telemetria', 'Lagar da Ribeira Alta: Depósito 2 a 17 960 kg', { producerId: 'lagar-ribeira-alta' }],
  ['2026-10-13T09:52:00+01:00', 'azeite', 'rececao', 'Lagar Serra da Gardunha recebeu 9,4 t de azeitona', { producerId: 'lagar-serra-gardunha' }],
];

export const CAMPAIGN_EVENTS: CampaignEvent[] = tidyDeep(ROWS).map(([at, world, kind, title, ref, detail], i) => ({
  id: `ev-${String(i + 1).padStart(3, '0')}`,
  at,
  world,
  kind,
  title,
  detail,
  producerId: ref?.producerId,
  lotId: ref?.lotId,
})).reverse(); // mais recente primeiro

export const EVENT_KIND_LABEL: Record<CampaignEventKind, string> = {
  telemetria: 'Telemetria',
  colheita: 'Colheita',
  rececao: 'Receção',
  analise: 'Análise',
  engarrafamento: 'Engarrafamento',
  financiamento: 'Financiamento',
  expedicao: 'Expedição',
  venda: 'Venda',
  liquidacao: 'Liquidação',
  cobertura: 'Cobertura',
  extensao: 'Extensão',
  qualidade: 'Qualidade',
};
