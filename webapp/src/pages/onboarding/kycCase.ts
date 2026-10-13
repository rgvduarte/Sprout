import { KYC_QUEUE } from '../../data';
import type { KycCase, OnboardingState } from '../../data/types';

/* =====================================================================
   Processo KYC criado pela submissão do registo (perfil Visitante).
   O estado vive em useGame().onboarding (loja partilhada); esta função
   converte-o no formato da fila de compliance de Bastidores (KYC_QUEUE).

   Para Bastidores: o perfil Visitante não é o perfil ativo quando se vê
   como Equipa. Ler `GameContext` de src/state/AppProvider e usar
   `kycCaseFromOnboarding(ctx.state.profiles.visitante.onboarding)`.
   ===================================================================== */

/** Número do processo da demonstração (a seguir ao último da fila). */
export const VISITOR_KYC_ID = (() => {
  const max = Math.max(...KYC_QUEUE.map((k) => Number(k.id.replace(/\D/g, '')) || 0));
  return `kyc-${String(max + 1).padStart(3, '0')}`;
})();

export const caseLabel = (id: string) => id.toUpperCase();

/** Chaves numéricas guardadas em onboarding.adequacao na submissão. */
export const ADQ = {
  pep: 'pep', // 0 não · 1 próprio · 2 familiar ou associado
  rota: 'rota', // 0 regulada · 1 grande · 2 pedido · 3 nenhuma
  quizCorrect: 'quizCorrect', // 0–3
  criterios: 'criterios',
  submittedAt: 'submittedAt', // epoch ms
} as const;

export function kycCaseFromOnboarding(o: OnboardingState): KycCase | null {
  if (o.status === 'nao-iniciado' || o.status === 'em-curso' || !o.nome || !o.tipo) return null;
  const a = o.adequacao ?? {};
  const pep = a[ADQ.pep] ?? 0;
  const flags: string[] = [];
  if (pep === 1) flags.push('Pessoa politicamente exposta: diligência reforçada');
  if (pep === 2) flags.push('Familiar ou associado de pessoa politicamente exposta: diligência reforçada');
  if (o.status === 'bloqueado') flags.push(o.blockedReason ?? 'Investidor não qualificado: piloto fechado');
  if ((a[ADQ.quizCorrect] ?? 3) < 2) flags.push('Respostas de conhecimento do produto abaixo de 2 em 3');
  const submitted = a[ADQ.submittedAt] ? new Date(a[ADQ.submittedAt]).toISOString().slice(0, 10) : (o.updatedAt ?? '').slice(0, 10);
  return {
    id: VISITOR_KYC_ID,
    nome: o.nome,
    tipo: o.tipo,
    classe: o.classe ?? 'nao-qualificado',
    submittedAt: submitted,
    status: o.status === 'aprovado' ? 'aprovado' : o.status === 'bloqueado' ? 'bloqueado' : 'em-analise',
    risco: pep ? 'elevado' : 'baixo',
    flags,
    responsavel: 'Compliance',
  };
}
