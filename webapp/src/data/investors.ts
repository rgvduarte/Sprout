import type { EarnedSeal, Investor, Position } from './types';

/** Investidor de demonstração (perfil "Investidor qualificado"). */
export const DEMO_INVESTOR_ID = 'inv-marta-calado';

export const INVESTORS: Investor[] = [
  {
    id: DEMO_INVESTOR_ID,
    nome: 'Marta Calado Investimentos, Lda.',
    tipo: 'pessoa-coletiva',
    classe: 'qualificado',
    kyc: 'aprovado',
    pais: 'Portugal',
    since: '2025-11-27',
    nota: 'Sociedade de investimento familiar. KYB aprovado em 27/11/2025.',
    demo: true,
  },
  { id: 'inv-vale-sorraia', nome: 'Sociedade Agrícola Vale do Sorraia, SA', tipo: 'pessoa-coletiva', classe: 'qualificado', kyc: 'aprovado', pais: 'Portugal', since: '2024-12-18' },
  { id: 'inv-atlantico-norte', nome: 'Family Office Atlântico Norte, Lda.', tipo: 'pessoa-coletiva', classe: 'profissional', kyc: 'aprovado', pais: 'Portugal', since: '2024-12-05' },
  { id: 'inv-rui-fonseca', nome: 'Rui Teixeira Fonseca', tipo: 'pessoa-singular', classe: 'qualificado', kyc: 'aprovado', pais: 'Portugal', since: '2025-01-09', nota: 'Tratado como investidor qualificado a pedido, com avaliação de experiência e património.' },
  { id: 'inv-helena-brito', nome: 'Helena Brito Gestão de Patrimónios, Lda.', tipo: 'pessoa-coletiva', classe: 'qualificado', kyc: 'aprovado', pais: 'Portugal', since: '2025-02-14' },
  { id: 'inv-quinta-lajes', nome: 'Quinta das Lajes Holding, SA', tipo: 'pessoa-coletiva', classe: 'qualificado', kyc: 'aprovado', pais: 'Portugal', since: '2025-06-03' },
  { id: 'inv-ribeirinho', nome: 'Capital Ribeirinho, SA', tipo: 'pessoa-coletiva', classe: 'profissional', kyc: 'em-analise', pais: 'Espanha', nota: 'Beneficiário efetivo em validação.' },
  { id: 'inv-joao-antunes', nome: 'João Pedro Antunes', tipo: 'pessoa-singular', classe: 'qualificado', kyc: 'pendente', pais: 'Portugal', nota: 'Falta comprovativo de origem de fundos.' },
  { id: 'inv-carla-mendes', nome: 'Carla Mendes', tipo: 'pessoa-singular', classe: 'nao-qualificado', kyc: 'bloqueado', pais: 'Portugal', nota: 'Investidora não qualificada. O piloto está fechado a investidores qualificados.' },
  { id: 'inv-tiago-sardinha', nome: 'Tiago Sardinha', tipo: 'pessoa-singular', classe: 'nao-qualificado', kyc: 'bloqueado', pais: 'Portugal', nota: 'Investidor não qualificado. Inscrito na lista de interesse para a Fase 2.' },
];

/** Posições da investidora de demonstração: 4 lotes ativos. */
export const SEED_POSITIONS: Position[] = [
  { id: 'pos-001', investorId: DEMO_INVESTOR_ID, lotId: 'AZ-2025-031', amount: 15000, committedAt: '2025-12-02', fundedAt: '2025-12-04', status: 'ativo' },
  { id: 'pos-002', investorId: DEMO_INVESTOR_ID, lotId: 'AG-2026-003', amount: 8000, committedAt: '2026-01-29', fundedAt: '2026-02-02', status: 'ativo' },
  { id: 'pos-003', investorId: DEMO_INVESTOR_ID, lotId: 'AZ-2026-009', amount: 10000, committedAt: '2026-02-16', fundedAt: '2026-02-19', status: 'ativo' },
  { id: 'pos-004', investorId: DEMO_INVESTOR_ID, lotId: 'AZ-2026-014', amount: 20000, committedAt: '2026-06-12', fundedAt: '2026-06-16', status: 'ativo' },
];

/** Selos já ganhos pela investidora de demonstração (3). */
export const SEED_SEALS: EarnedSeal[] = [
  { sealId: 'seal-gardunha-2526', at: '2025-12-05', by: 'compromisso', lotId: 'AZ-2025-031' },
  { sealId: 'seal-fontefria-2526', at: '2026-02-03', by: 'compromisso', lotId: 'AG-2026-003' },
  { sealId: 'seal-monteclaro-2526', at: '2026-06-18', by: 'compromisso', lotId: 'AZ-2026-014' },
];
