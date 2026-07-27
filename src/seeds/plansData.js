export const plansData = [
  {
    // Plano interno da equipe: o prefixo admin_ o mantém fora da vitrine pública.
    key: 'admin_unlimited',
    name: 'Administrador - Interno',
    price: 0.00,
    billingPeriod: 'yearly',
    durationDays: 3650,
    isFree: true,
    limitSimulations: -1, // Ilimitado
    limits: {},
    features: ['Acesso interno ilimitado'],
    permissions: ['cenarios', 'historico', 'ranking', 'carteira', 'agenda', 'metas', 'anotacoes', 'copiloto', 'oportunidades', 'gerador', 'analise_audio', 'whatsapp_copilot']
  },
  {
    key: 'standard_monthly',
    name: 'Standard - Mensal',
    price: 29.00,
    billingPeriod: 'monthly',
    durationDays: 30,
    isFree: false,
    limitSimulations: 30,
    limits: {},
    features: ['30 Simulações / mês', 'Acesso à biblioteca de cenários', 'Histórico de treinos', 'Copiloto de IA básico'],
    permissions: ['cenarios', 'historico', 'ranking']
  },
  {
    key: 'premium_monthly',
    name: 'Premium - Mensal',
    price: 49.00,
    billingPeriod: 'monthly',
    durationDays: 30,
    isFree: false,
    limitSimulations: 100,
    limits: {},
    features: ['100 Simulações / mês', 'Todos os cenários liberados', 'Gerador de abordagens', 'Copiloto no WhatsApp', 'Metas e progresso individual'],
    permissions: ['cenarios', 'historico', 'ranking', 'carteira', 'agenda', 'metas', 'anotacoes', 'copiloto', 'oportunidades', 'gerador', 'analise_audio']
  },
  {
    key: 'standard_yearly',
    name: 'Standard - Anual',
    price: 247.00,
    billingPeriod: 'yearly',
    durationDays: 365,
    isFree: false,
    limitSimulations: 30,
    limits: {},
    features: ['30 Simulações / mês', 'Acesso à biblioteca de cenários', 'Histórico de treinos', 'Copiloto de IA básico', 'Economia de 30% no ano'],
    permissions: ['cenarios', 'historico', 'ranking']
  },
  {
    key: 'premium_yearly',
    name: 'Premium - Anual',
    price: 447.00,
    billingPeriod: 'yearly',
    durationDays: 365,
    isFree: false,
    limitSimulations: 100,
    limits: {},
    features: ['100 Simulações / mês', 'Todos os cenários liberados', 'Gerador de abordagens', 'Copiloto no WhatsApp', 'Metas e progresso individual', 'Economia de 25% no ano'],
    permissions: ['cenarios', 'historico', 'ranking', 'carteira', 'agenda', 'metas', 'anotacoes', 'copiloto', 'oportunidades', 'gerador', 'analise_audio']
  },
  {
    key: 'black_monthly',
    name: 'Black - Mensal',
    price: 69.00,
    billingPeriod: 'monthly',
    durationDays: 30,
    isFree: false,
    limitSimulations: -1, // Ilimitado
    limits: {},
    features: ['Simulações ilimitadas', 'Acesso antecipado a novos recursos', 'Copiloto no WhatsApp VIP', 'Gerador de abordagens avançado', 'Suporte prioritário individual'],
    permissions: ['cenarios', 'historico', 'ranking', 'carteira', 'agenda', 'metas', 'anotacoes', 'copiloto', 'oportunidades', 'gerador', 'analise_audio', 'whatsapp_copilot']
  },
  {
    key: 'black_yearly',
    name: 'Black - Anual',
    price: 647.00,
    billingPeriod: 'yearly',
    durationDays: 365,
    isFree: false,
    limitSimulations: -1, // Ilimitado
    limits: {},
    features: ['Simulações ilimitadas', 'Acesso antecipado a novos recursos', 'Copiloto no WhatsApp VIP', 'Gerador de abordagens avançado', 'Suporte prioritário individual', 'Economia de 22% no ano'],
    permissions: ['cenarios', 'historico', 'ranking', 'carteira', 'agenda', 'metas', 'anotacoes', 'copiloto', 'oportunidades', 'gerador', 'analise_audio', 'whatsapp_copilot']
  }
];
