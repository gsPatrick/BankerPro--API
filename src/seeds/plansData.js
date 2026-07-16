export const plansData = [
  {
    // Plano interno da equipe: o prefixo admin_ o mantém fora da vitrine pública.
    key: 'admin_unlimited',
    name: 'Administrador - Interno',
    price: 0.00,
    limitSimulations: -1, // Ilimitado
    features: ['Acesso interno ilimitado'],
    permissions: ['cenarios', 'historico', 'ranking', 'carteira', 'agenda', 'metas', 'anotacoes', 'copiloto', 'oportunidades', 'gerador', 'whatsapp_copilot']
  },
  {
    key: 'standard_monthly',
    name: 'Standard - Mensal',
    price: 29.00,
    limitSimulations: 30,
    features: ['30 Simulações / mês', 'Acesso à biblioteca de cenários', 'Histórico de treinos', 'Copiloto de IA básico'],
    permissions: ['cenarios', 'historico', 'ranking']
  },
  {
    key: 'premium_monthly',
    name: 'Premium - Mensal',
    price: 49.00,
    limitSimulations: 100,
    features: ['100 Simulações / mês', 'Todos os cenários liberados', 'Gerador de abordagens', 'Copiloto no WhatsApp', 'Metas e progresso individual'],
    permissions: ['cenarios', 'historico', 'ranking', 'carteira', 'agenda', 'metas', 'anotacoes', 'copiloto', 'oportunidades', 'gerador']
  },
  {
    key: 'standard_yearly',
    name: 'Standard - Anual',
    price: 247.00,
    limitSimulations: 30,
    features: ['30 Simulações / mês', 'Acesso à biblioteca de cenários', 'Histórico de treinos', 'Copiloto de IA básico', 'Economia de 30% no ano'],
    permissions: ['cenarios', 'historico', 'ranking']
  },
  {
    key: 'premium_yearly',
    name: 'Premium - Anual',
    price: 447.00,
    limitSimulations: 100,
    features: ['100 Simulações / mês', 'Todos os cenários liberados', 'Gerador de abordagens', 'Copiloto no WhatsApp', 'Metas e progresso individual', 'Economia de 25% no ano'],
    permissions: ['cenarios', 'historico', 'ranking', 'carteira', 'agenda', 'metas', 'anotacoes', 'copiloto', 'oportunidades', 'gerador']
  },
  {
    key: 'black_monthly',
    name: 'Black - Mensal',
    price: 69.00,
    limitSimulations: -1, // Ilimitado
    features: ['Simulações ilimitadas', 'Acesso antecipado a novos recursos', 'Copiloto no WhatsApp VIP', 'Gerador de abordagens avançado', 'Suporte prioritário individual'],
    permissions: ['cenarios', 'historico', 'ranking', 'carteira', 'agenda', 'metas', 'anotacoes', 'copiloto', 'oportunidades', 'gerador', 'whatsapp_copilot']
  },
  {
    key: 'black_yearly',
    name: 'Black - Anual',
    price: 647.00,
    limitSimulations: -1, // Ilimitado
    features: ['Simulações ilimitadas', 'Acesso antecipado a novos recursos', 'Copiloto no WhatsApp VIP', 'Gerador de abordagens avançado', 'Suporte prioritário individual', 'Economia de 22% no ano'],
    permissions: ['cenarios', 'historico', 'ranking', 'carteira', 'agenda', 'metas', 'anotacoes', 'copiloto', 'oportunidades', 'gerador', 'whatsapp_copilot']
  }
];
