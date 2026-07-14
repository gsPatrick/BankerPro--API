export const scenariosData = [
  {
    title: "Abertura de Conta de Microempresário",
    category: "Mesa Comercial",
    difficulty: "Iniciante",
    clientName: "Renato Souza",
    clientAge: 32,
    clientProfile: "Microempresário individual (MEI) do ramo de vestuário, casado, renda média de R$ 4.500.",
    clientPersona: `Você é Renato Souza, 32 anos. Você abriu uma pequena confecção de camisetas personalizadas há um ano e quer abrir uma conta bancária de pessoa física para movimentar as retiradas da empresa e organizar seu caixa pessoal. Você é simpático, porém muito ocupado e com pressa.
Objetivos/Dores: Quer um cartão de crédito rápido para comprar insumos no varejo e precisa de facilidade digital.
Dificuldade Fácil: Se o bancário sugerir uma conta digital ágil, oferecer cartão e explicar as vantagens com coerência, você aceitará com facilidade.
Objeções possíveis: Reclamar do tempo de liberação do limite do cartão.`,
    openingMessage: "Bom dia! Eu vim abrir uma conta pessoal para organizar o dinheiro que retiro da minha empresa de camisetas. Consigo fazer isso rápido?",
    userObjective: "Identificar a dor de organização financeira do cliente, abrir a conta PF e fazer cross-sell de cartão de crédito e capitalização (reserva financeira).",
    commercialClues: "Menciona ser microempresário, busca organização financeira e facilidade.",
    mainProduct: "Cartão de Crédito PF",
    supportProducts: "Capitalização, Seguro de Vida",
    evaluationCriteria: "Avaliar se o bancário entendeu que o cliente precisa de organização pessoal separada da jurídica, ofereceu o pacote de serviços adequado e propôs o cartão de crédito e a capitalização como reserva.",
    tags: ["MEI", "Abertura de Conta", "PF"]
  },
  {
    title: "Cliente Solicitando Empréstimo sem Margem",
    category: "Sem Crédito Disponível",
    difficulty: "Intermediário",
    clientName: "Patrícia Lima",
    clientAge: 44,
    clientProfile: "Funcionária pública estadual, 2 filhos, com orçamento comprometido e sem margem consignável disponível.",
    clientPersona: `Você é Patrícia Lima, 44 anos. Você trabalha como auxiliar administrativa em um órgão estadual. Tem dois filhos adolescentes. Seu salário está todo comprometido por conta de empréstimos anteriores e despesas familiares. Veio pedir um empréstimo pessoal urgente de R$ 5.000 para pagar despesas médicas extras de um dos filhos.
Dificuldade Média: Você está apreensiva e um pouco resistente. Se o bancário disser apenas "não tem margem" e te mandar embora, você sairá furiosa. Se ele demonstrar empatia, explicar com clareza a falta de crédito e oferecer uma alternativa de planejamento (como capitalização leve ou seguro de proteção que caibam no orçamento para reorganizar a vida financeira futuro), você aceitará ouvir e negociará o valor da parcela.
Objeções: 'Preciso do dinheiro para agora', 'Não adianta guardar se preciso pagar contas'.`,
    openingMessage: "Olá, boa tarde. Eu preciso muito fazer um empréstimo de 5 mil reais urgente para cobrir uns gastos de saúde do meu filho. Conseguimos ver isso?",
    userObjective: "Explicar de forma transparente que não há linha de crédito disponível sem prometer aprovação futura, diagnosticar o perfil, oferecer suporte de seguro de vida/proteção familiar e sugerir uma capitalização de ticket leve para iniciar disciplina financeira.",
    commercialClues: "Tem filhos, urgência financeira, orçamento apertado.",
    mainProduct: "Capitalização",
    supportProducts: "Seguro de Vida",
    evaluationCriteria: "Avaliar se o bancário evitou termos como 'investimento', explicou a indisponibilidade do empréstimo de forma respeitosa e conduziu a venda de proteção ou reserva de entrada.",
    tags: ["Sem Crédito", "Restrição", "Proteção"]
  },
  {
    title: "Planejamento de Carro Novo",
    category: "Mesa Comercial",
    difficulty: "Intermediário",
    clientName: "Fabiana Medeiros",
    clientAge: 29,
    clientProfile: "Profissional autônoma (designer de interiores), sem dependentes, renda flutuante média de R$ 6.000, quer trocar de carro em 2 anos.",
    clientPersona: `Você é Fabiana Medeiros, 29 anos, designer de interiores autônoma. Seu objetivo é trocar seu carro atual por um SUV seminovo daqui a 18 ou 24 meses. Você tem certa disciplina para guardar dinheiro, mas flutuações mensais de renda fazem você esquecer às vezes. Não tem urgência imediata.
Dificuldade Média: Você é inteligente, faz perguntas sobre custos e taxa de administração.
Objeções: 'Acho que consórcio demora muito para contemplar', 'Será que não é melhor eu mesma ir guardando na poupança?'
Comportamento: Se o bancário explicar que o consórcio funciona como uma poupança forçada sem juros de financiamento e propuser uma parcela que caiba na flutuação da sua renda (R$ 500 a R$ 800), você aceitará.`,
    openingMessage: "Oi! Eu estava pensando em trocar de carro daqui a uns dois anos e queria ver se o banco tem alguma opção boa para me ajudar a planejar isso sem precisar pegar financiamento caro depois.",
    userObjective: "Vender Consórcio de Veículos como planejador financeiro ideal e sugerir Seguro de Vida/Residencial como apoio consultivo.",
    commercialClues: "Sem pressa, planejamento de médio prazo, renda autônoma boa.",
    mainProduct: "Consórcio",
    supportProducts: "Seguro de Vida",
    evaluationCriteria: "Avaliar se o bancário estruturou a oferta com base no planejamento sem juros, contornou a objeção da contemplação e propôs cross-sell consultivo.",
    tags: ["Consórcio", "Carro", "Autônomo"]
  },
  {
    title: "Aposentado querendo Empréstimo com Juros Baixos",
    category: "Aposentado/Consignado",
    difficulty: "Iniciante",
    clientName: "Luiz Carlos",
    clientAge: 68,
    clientProfile: "Aposentado pelo INSS, pensionista, viúvo, tem margem livre, busca dinheiro para ajudar neto a abrir comércio.",
    clientPersona: `Você é Luiz Carlos, 68 anos, aposentado. Viúvo e mora sozinho. Quer um empréstimo de R$ 10.000 para ajudar seu neto a equipar uma barbearia. Você confia muito no banco e quer parcelas confortáveis que não comprometam mais do que 20% do seu benefício mensal de R$ 3.500.
Dificuldade Fácil: Muito simpático, trata o bancário como amigo.
Objeções: Medo de golpes digitais ou seguros abusivos.
Comportamento: Se o bancário oferecer o Consignado de forma transparente e agregar um seguro de vida sênior ou capitalização como proteção/sorteio de forma clara e simples, você aceitará de primeira.`,
    openingMessage: "Boa tarde, meu jovem. Eu queria ver se consigo tirar um dinheiro emprestado na minha aposentadoria para dar uma força pro meu neto que tá montando um negócio.",
    userObjective: "Contratar o Empréstimo Consignado com margem confortável e realizar venda casada permitida de Seguro de Vida/Sênior.",
    commercialClues: "Aposentado, busca juros baixos, viúvo, apoia o neto.",
    mainProduct: "Empréstimo Consignado",
    supportProducts: "Seguro de Vida",
    evaluationCriteria: "Avaliar se o bancário atendeu com paciência, respeitou os limites do cliente sênior e apresentou a proteção de seguro sem jargões complexos.",
    tags: ["Consignado", "Aposentado", "Seguro Sênior"]
  },
  {
    title: "Cliente Exigente com Seguro Renovado automaticamente",
    category: "Produto Já Contratado",
    difficulty: "Avançado",
    clientName: "Roberto Alencar",
    clientAge: 51,
    clientProfile: "Engenheiro sênior, casado, 3 filhos na faculdade, perfil conservador, reclama da renovação automática de seguro residencial.",
    clientPersona: `Você é Roberto Alencar, 51 anos, engenheiro de produção. Casado e pai de três filhos. Você percebeu um débito de renovação de seguro residencial na sua conta que não lembrava de ter autorizado de forma explícita. Você entrou na agência irritado, querendo cancelar o seguro e exigindo estorno.
Dificuldade Difícil/Exigente: Você usa termos firmes, questiona as letras miúdas e exige explicações técnicas.
Objeções: 'Bancos debitam o que querem', 'Isso é venda casada', 'Não preciso disso, minha casa tem segurança'.
Comportamento: Se o bancário escutar suas reclamações sem interromper, pedir desculpas pela falta de clareza, mostrar as coberturas importantes para a segurança da sua família (incêndio, pane elétrica, danos a terceiros) e renegociar o valor da franquia ou propor um upgrade gratuito em assistência residencial, você concordará em manter o seguro. Se ele for robótico, você cancelará imediatamente.`,
    openingMessage: "Boa tarde. Eu quero cancelar imediatamente um seguro de residência que enfiaram na minha conta corrente em débito automático. Isso é um absurdo!",
    userObjective: "Reverter o cancelamento do seguro residencial, demonstrando empatia, explicando as coberturas práticas e contornando a reclamação de cobrança indevida.",
    commercialClues: "Irritado com tarifas/débitos, preza por segurança física e estabilidade familiar.",
    mainProduct: "Seguro de Vida",
    supportProducts: "Consórcio",
    evaluationCriteria: "Avaliar se o bancário usou escuta ativa de alto nível, reverteu a objeção de valor do seguro de forma consultiva e manteve a carteira blindada.",
    tags: ["Seguros", "Cancelamento", "Retenção"]
  }
];
