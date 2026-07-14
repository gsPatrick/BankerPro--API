export const plansData = [
  {
    key: 'free',
    name: 'Plano Gratuito',
    price: 0.00,
    limitSimulations: 10,
    features: ['10 Simulações/mês', 'Copiloto limitado'],
    permissions: ['simulations', 'biblioteca']
  },
  {
    key: 'pro',
    name: 'Plano Pro',
    price: 97.00,
    limitSimulations: -1, // Ilimitado
    features: ['Simulações ilimitadas', 'Copiloto completo', 'Gerador de abordagens'],
    permissions: ['simulations', 'biblioteca', 'copiloto', 'gerador', 'anotacoes', 'metas', 'agenda']
  },
  {
    key: 'team',
    name: 'Plano Corporate / Team',
    price: 297.00,
    limitSimulations: -1, // Ilimitado
    features: ['Tudo do Pro', 'Múltiplos usuários', 'Relatórios consolidados'],
    permissions: ['simulations', 'biblioteca', 'copiloto', 'gerador', 'anotacoes', 'metas', 'agenda']
  }
];
