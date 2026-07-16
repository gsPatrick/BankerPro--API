export const UserRoles = {
  USER: 'user',
  ADMIN: 'admin'
};

export const ScenarioCategories = [
  'Caixa e Balcão',
  'Mesa Comercial',
  'Conta e Relacionamento',
  'Crédito Disponível',
  'Sem Crédito Disponível',
  'Produto Já Contratado',
  'Aposentado/Consignado',
  'Cartão',
  'MEI/Pequeno Negócio'
];

export const Difficulties = [
  'Iniciante',
  'Intermediário',
  'Avançado'
];

export const ExperienceLevels = [
  'Iniciante',
  'Intermediário',
  'Avançado',
  'Especialista'
];

export const WorkSituations = {
  EMPLOYED: 'employed',
  STUDYING: 'studying'
};

export const CertificationOptions = [
  'C-Pro',
  'C-Pro R',
  'C-Pro I',
  'Ainda não comecei uma certificação',
  'Outra'
];

export const ClientStatus = [
  'Novo',
  'Em negociação',
  'Simulação enviada',
  'Aguardando retorno',
  'Fechado',
  'Perdido'
];

// Catálogo de funcionalidades que um plano pode liberar. A key é o que fica salvo
// em plans.permissions e é verificada pelo middleware de permissão; o label é o
// nome da página como o usuário a vê no menu, e é o que aparece no card do plano.
// Painel, Perfil, Configurações e Planos ficam fora de propósito: são sempre
// liberados, senão o usuário não conseguiria nem contratar um upgrade.
export const PlanFeatures = [
  { key: 'cenarios', label: 'Cenários' },
  { key: 'historico', label: 'Histórico' },
  { key: 'ranking', label: 'Ranking' },
  { key: 'carteira', label: 'Carteira' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'metas', label: 'Metas' },
  { key: 'anotacoes', label: 'Anotações' },
  { key: 'copiloto', label: 'Copiloto IA' },
  { key: 'oportunidades', label: 'Lista de Oportunidades' },
  { key: 'gerador', label: 'Gerador de abordagens' },
  { key: 'whatsapp_copilot', label: 'Copiloto no WhatsApp' }
];

export const PlanFeatureKeys = PlanFeatures.map((feature) => feature.key);

export const getPlanFeatureLabel = (key) =>
  PlanFeatures.find((feature) => feature.key === key)?.label || key;

// Os itens do card do plano são derivados do que ele realmente libera, e não de
// um texto solto: assim o card nunca promete uma funcionalidade que a permissão
// bloqueia. A ordem segue o catálogo para o card sair sempre igual.
export const buildPlanFeatures = (plan) => {
  const limit = Number(plan?.limitSimulations ?? plan?.limit_simulations ?? 0);
  const limitLabel = limit < 0 ? 'Simulações ilimitadas' : `${limit} Simulações / mês`;

  const permissions = Array.isArray(plan?.permissions) ? plan.permissions : [];
  const featureLabels = PlanFeatures
    .filter((feature) => permissions.includes(feature.key))
    .map((feature) => feature.label);

  return [limitLabel, ...featureLabels];
};

// Planos internos existem só para liberar a equipe: ficam fora da vitrine pública
// e não contam como receita.
export const INTERNAL_PLAN_PREFIX = 'admin_';
export const ADMIN_PLAN_KEY = 'admin_unlimited';

export const isInternalPlanKey = (key) =>
  String(key || '').startsWith(INTERNAL_PLAN_PREFIX);

export const SubscriptionStatus = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

export const SimulationStatus = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

export const CommercialLearningResults = {
  VENDA: 'venda',
  ANALISE: 'analise',
  SEM_VENDA: 'sem_venda'
};

export const OpportunityProducts = [
  'Consórcio',
  'Financiamento',
  'Empréstimo',
  'Consignado',
  'Cartão de Crédito',
  'Seguro de Vida',
  'Capitalização',
];

export const OpportunityChannels = [
  'Ligação',
  'WhatsApp',
  'Presencial',
];

export const OpportunityStatuses = [
  'Ativo',
  'Inativo',
];
