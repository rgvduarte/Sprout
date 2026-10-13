import type { ActionItem, ExecutionPlanRow } from './types';

/* =====================================================================
   Plano de execução e próximos passos, transcritos do documento-fonte
   (docs/fonte/plano-estrategico-10-13.md). Pessoas reais só aparecem aqui.
   ===================================================================== */

export const SOURCE_DOC = {
  title: '10-13 Plano Estratégico e Arquitetura de Marketplace B2B para Commodities Agroalimentares',
  meeting: 'Resumo da reunião de 13/10 · alinhamento 14h45–16h',
  path: 'docs/fonte/plano-estrategico-10-13.md',
};

export const EXECUTION_PLAN: ExecutionPlanRow[] = [
  { responsavel: 'Gonçalo Almeida', area: 'Jurídico & Compliance', entregaveis: 'Nota de 2 páginas sobre SPV e restrições de promoção UE; Minutas contratuais (18M, extensão, força maior)', foco: 'Jurisdição e rails PSP' },
  { responsavel: 'Pedro Marques', area: 'Operações & Oferta', entregaveis: 'Feed de stock e curva de produção anual; SLA de expedição e lotes mínimos', foco: 'Âncora: Lagar do Val' },
  { responsavel: 'Speaker 1', area: 'Produto & Comercial', entregaveis: 'Lista de produtores e target 10–15% desc.; Deck de roadshow com disclaimers', foco: 'Target: Investidores qualificados' },
  { responsavel: 'Speaker 2', area: 'Tecnologia & Sistemas', entregaveis: 'Auditoria do backoffice e eliminação de riscos; Integração de PSP/KYC e dashboard de risco', foco: 'Segregação diária de contas' },
  { responsavel: 'Tesouraria', area: 'Risco & Coberturas', entregaveis: 'Definir política de hedge e contrapartes; Playbook de refunding por lote', foco: 'Owner a designar' },
];

export const ACTION_ITEMS: ActionItem[] = [
  { id: 'ai-01', owner: 'Gonçalo Almeida', ownerLabel: '@Gonçalo Almeida (Jurídico)', text: 'Mapear a estrutura jurídica adequada (SPV vs. plataforma de intermediação) e restrições de promoção a investidores (UE) com nota de 2 páginas', due: 'TBD', done: false },
  { id: 'ai-02', owner: 'Gonçalo Almeida', ownerLabel: '@Gonçalo Almeida (Jurídico)', text: 'Propor jurisdição primária e rails de pagamento compatíveis (PSP/E-money UE), incluindo risco de repatriação', due: 'TBD', done: false },
  { id: 'ai-03', owner: 'Gonçalo Almeida', ownerLabel: '@Gonçalo Almeida (Jurídico)', text: 'Rascunhar contratos padrão Produtor↔Plataforma e Plataforma↔Investidor com cláusulas de 18 meses, extensão e força maior', due: 'TBD', done: false },
  { id: 'ai-04', owner: 'Pedro Marques', ownerLabel: '@Pedro Marques (Lagar do Val/Operações)', text: 'Fornecer feed de stock (formato e frequência), curva de produção anual e SLA de expedição para o piloto', due: 'TBD', done: false },
  { id: 'ai-05', owner: 'Pedro Marques', ownerLabel: '@Pedro Marques (Lagar do Val/Operações)', text: 'Validar capacidade mínima/máxima de lote e requisitos de qualidade/auditoria', due: 'TBD', done: false },
  { id: 'ai-06', owner: 'Speaker 1', ownerLabel: '@Speaker 1 (Produto/Comercial)', text: 'Consolidar lista de produtores iniciais (azeite, água, café) com volumes, preços e descontos-alvo (10–15%)', due: 'TBD', done: false },
  { id: 'ai-07', owner: 'Speaker 1', ownerLabel: '@Speaker 1 (Produto/Comercial)', text: 'Definir coorte piloto de investidores (qualificados), com critérios de elegibilidade e processo KYC', due: 'TBD', done: false },
  { id: 'ai-08', owner: 'Speaker 1', ownerLabel: '@Speaker 1 (Produto/Comercial)', text: 'Preparar deck de roadshow com métricas operacionais, estrutura de risco e disclaimers jurídicos aprovados', due: 'TBD', done: false },
  { id: 'ai-09', owner: 'Speaker 2', ownerLabel: '@Speaker 2 (Tecnologia/Operações)', text: 'Auditar o backoffice atual (segurança, conformidade, logs) e remover dependências de "reverse engineering" sensíveis', due: 'TBD', done: false },
  { id: 'ai-10', owner: 'Speaker 2', ownerLabel: '@Speaker 2 (Tecnologia/Operações)', text: 'Integrar PSP/KYC-AML (UE) e configurar segregação de contas + reconciliação diária', due: 'TBD', done: false },
  { id: 'ai-11', owner: 'Speaker 2', ownerLabel: '@Speaker 2 (Tecnologia/Operações)', text: 'Implementar dashboard de risco (preço de mercado vs. contrato, gatilhos de hedge, PnL do lote)', due: 'TBD', done: false },
  { id: 'ai-12', owner: 'Tesouraria', ownerLabel: '@Risco/Tesouraria (Owner a designar)', text: 'Definir política de hedge (instrumentos permitidos, limites de custo, contrapartes, gatilhos) e playbook de "refunding"', due: 'TBD', done: false },
];

/** Diretriz de produto aprovada (documento-fonte): o que a gamificação pode e não pode fazer. */
export const PRODUCT_DIRECTIVE = {
  permitida: 'Acompanhamento operacional, painéis de colheita, badges de compliance e rastreabilidade de lotes.',
  proibida: 'Zero ludificação de retornos financeiros ou volatilidade, prevenindo escrutínio de supervisores.',
  pilotoFechado: 'Coorte restrita (Azeite + Água), contratos padronizados com cláusulas de força maior, SLA diário de reconciliação e medição de fill rate.',
};
