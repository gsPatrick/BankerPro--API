export const plansData = [
  {
    key: 'standard_yearly',
    name: 'Standard - Anual',
    price: 247.00,
    limitSimulations: 30,
    features: ['30 Simulações / mês', 'Acesso à biblioteca de cenários', 'Histórico de treinos', 'Copiloto de IA básico', 'Economia de 30% no ano'],
    permissions: ['simulations', 'biblioteca']
  },
  {
    key: 'premium_yearly',
    name: 'Premium - Anual',
    price: 447.00,
    limitSimulations: 100,
    features: ['100 Simulações / mês', 'Todos os cenários liberados', 'Gerador de abordagens', 'Copiloto no WhatsApp', 'Metas e progresso individual', 'Economia de 25% no ano'],
    permissions: ['simulations', 'biblioteca', 'copiloto', 'gerador', 'anotacoes', 'metas', 'agenda']
  },
  {
    key: 'black_monthly',
    name: 'Black - Mensal',
    price: 69.00,
    limitSimulations: -1, // Ilimitado
    features: ['Simulações ilimitadas', 'Acesso antecipado a novos recursos', 'Copiloto no WhatsApp VIP', 'Gerador de abordagens avançado', 'Suporte prioritário individual'],
    permissions: ['simulations', 'biblioteca', 'copiloto', 'gerador', 'anotacoes', 'metas', 'agenda', 'whatsapp_copilot']
  },
  {
    key: 'black_yearly',
    name: 'Black - Anual',
    price: 647.00,
    limitSimulations: -1, // Ilimitado
    features: ['Simulações ilimitadas', 'Acesso antecipado a novos recursos', 'Copiloto no WhatsApp VIP', 'Gerador de abordagens avançado', 'Suporte prioritário individual', 'Economia de 22% no ano'],
    permissions: ['simulations', 'biblioteca', 'copiloto', 'gerador', 'anotacoes', 'metas', 'agenda', 'whatsapp_copilot']
  }
];
