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
