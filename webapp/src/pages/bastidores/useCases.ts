import { useContext } from 'react';
import { KYC_QUEUE, type KycCase, type KycStatus } from '../../data';
import { GameContext } from '../../state/AppProvider';
import { TODAY_DATE } from '../../lib/clock';
import type { KycDecision } from './store';
import { kycCaseFromOnboarding, VISITOR_KYC_ID } from '../onboarding/kycCase';

/* =====================================================================
   Casos KYC/KYB: a fila dos dados de demonstração + o registo feito em
   /onboarding nesta sessão (perfil Visitante), lido do estado do jogo.
   ===================================================================== */

/** O mesmo número de processo que o Visitante vê em /onboarding (KYC-032). */
export const SESSION_CASE_ID = VISITOR_KYC_ID;

/** Caso criado pelo onboarding do Visitante nesta sessão, se já tiver começado. */
export function useVisitorCase(): KycCase | null {
  const ctx = useContext(GameContext);
  const ob = ctx?.state.profiles.visitante.onboarding;
  if (!ob || ob.status === 'nao-iniciado') return null;
  const status: KycStatus = ob.status === 'em-curso' ? 'pendente' : ob.status === 'em-analise' ? 'em-analise' : ob.status === 'aprovado' ? 'aprovado' : 'bloqueado';
  // só alertas reais: a origem do registo (esta sessão) aparece no selo "Registo desta sessão", não como alerta
  const flags: string[] = [];
  // registo submetido: o processo completo (PEP, rota de qualificação, respostas de conhecimento)
  const submitted = kycCaseFromOnboarding(ob);
  if (submitted) return { ...submitted, id: SESSION_CASE_ID, flags: [...submitted.flags] };
  if (ob.status === 'em-curso') flags.push(ob.reviewDecision === 'pedir-info' ? 'Informação pedida pela Compliance: registo reaberto' : `Registo ainda em curso (passo ${ob.step + 1})`);
  if (ob.classe === 'nao-qualificado') flags.push('Declarou-se não qualificado: piloto fechado');
  if (ob.blockedReason) flags.push(ob.blockedReason);
  return {
    id: SESSION_CASE_ID,
    nome: ob.nome?.trim() || 'Registo sem nome (Visitante)',
    tipo: ob.tipo ?? 'pessoa-singular',
    classe: ob.classe ?? 'nao-qualificado',
    submittedAt: ob.updatedAt ? ob.updatedAt.slice(0, 10) : TODAY_DATE,
    status,
    risco: 'baixo',
    flags,
    responsavel: 'Compliance',
  };
}

/** Todos os casos, com o da sessão no topo. */
export function useKycCases(): KycCase[] {
  const visitor = useVisitorCase();
  return visitor ? [visitor, ...KYC_QUEUE] : KYC_QUEUE;
}

/** Estado de um caso depois da última decisão desta sessão. */
export function kycStatusAfter(c: KycCase, d?: KycDecision): KycStatus {
  if (!d) return c.status;
  return d.action === 'aprovar' ? 'aprovado' : d.action === 'pedir-info' ? 'pendente' : 'recusado';
}
