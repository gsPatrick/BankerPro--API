import { SystemPrompt } from '../../models/index.js';

// Helper de Interpolação Simples
function interpolate(template, variables) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

export const getSimulationChatPrompt = async ({
  scenario,
  productOfferCount,
  userMsgCount,
  limit,
  approachingLimit,
  atLimit,
  hasMinimumOffers,
  knowledgeBase
}) => {
  const dbPrompt = await SystemPrompt.findOne({ where: { key: 'simulation_chat' } });
  
  // Computes dynamic status messages
  const productOfferStatusNotice = productOfferCount === 0 
    ? `⚠️ NENHUM PRODUTO OFERECIDO AINDA:
- NÃO encerre a conversa
- NÃO diga "não quero nada", "vou embora", "prefiro encerrar"
- NÃO recuse sem dar chance de oferta
- Faça perguntas, demonstre interesse, peça para o bancário sugerir algo`
    : productOfferCount === 1
      ? `⚠️ APENAS 1 PRODUTO OFERECIDO:
- Se recusou o primeiro → DIGA algo como:
  "Entendi. Tem alguma opção mais simples ou com parcela menor?"
  "E seguro de vida, como funcionaria? Seria mais em conta?"
  "Se esse não for o melhor agora, o que você me indicaria para começar com algo menor?"
- ⛔ NÃO encerre a conversa agora
- ⛔ NÃO diga "não quero nada" ou "depois eu vejo"
- Dê ABERTURA EXPLÍCITA para o bancário oferecer outro produto`
      : `✅ JÁ RECEBEU 2+ OFERTAS:
- Agora você PODE encerrar se nenhuma oferta atender
- No nível FÁCIL: ACEITE pelo menos um produto com boa explicação
- No nível MÉDIO: aceite se a segunda oferta foi bem explicada
- No nível DIFÍCIL: pode recusar, mas encerre com educação`;

  const kbText = knowledgeBase && knowledgeBase.length > 0 
    ? `🧠 BASE DE CONHECIMENTO DO BANCO:\n${knowledgeBase.map(k => `• ${k.topicTitle} (${k.category}): ${k.content?.substring(0, 200) || ''}`).join('\n\n')}\n`
    : '';

  const messageLimitNotice = atLimit 
    ? '— LIMITE ATINGIDO! Tome uma decisão AGORA.' 
    : approachingLimit 
      ? '— APROXIMANDO DO LIMITE. Prepare-se para decidir.' 
      : '';

  const terminationRequiredNotice = atLimit 
    ? '⚠️ VOCÊ ATINGIU O LIMITE DE MENSAGENS. TOME UMA DECISÃO E ENCERRE A NEGOCIAÇÃO NESTA RESPOSTA.' 
    : '';

  const minimumOffersNotice = !hasMinimumOffers 
    ? '⛔ NÃO ENCERRE AGORA — o bancário ainda não ofereceu 2 produtos. Dê abertura para mais uma oferta.' 
    : '';

  const variables = {
    productOfferCount,
    productOfferStatusNotice,
    clientName: scenario.clientName,
    clientAge: scenario.clientAge || 'Não informada',
    clientProfile: scenario.clientProfile || '',
    clientPersona: scenario.clientPersona,
    category: scenario.category,
    description: scenario.description || '',
    commercialClues: scenario.commercialClues || '',
    knowledgeBase: kbText,
    userMsgCount,
    messageLimitNotice,
    terminationRequiredNotice,
    minimumOffersNotice
  };

  if (dbPrompt && dbPrompt.content) {
    return interpolate(dbPrompt.content, variables);
  }

  // Fallback padrão se não encontrar no banco
  return `Você é um SIMULADOR DE CLIENTE para treinamento de bancários. Seu objetivo NÃO é comprar — é testar se o bancário sabe diagnosticar, argumentar, contornar objeções, fazer cross-sell e fechar.

━━━━━━━━━━━━━━━━━━━━
⚠️ REGRA DE OURO — MÍNIMO DE 2 OFERTAS ANTES DE ENCERRAR
━━━━━━━━━━━━━━━━━━━━

📊 OFERTAS DETECTADAS ATÉ AGORA: ${productOfferCount}

⛔ REGRA ABSOLUTA: Você NÃO PODE encerrar a negociação antes de o bancário apresentar PELO MENOS 2 produtos comerciais de Pessoa Física diferentes (ex: Crédito, Consórcio, Seguro de Vida, Capitalização).
⛔ Se ${productOfferCount === 0 ? 'NENHUM produto foi oferecido ainda' : productOfferCount === 1 ? 'APENAS 1 produto foi oferecido até agora' : 'já foram oferecidos produtos suficientes'}${productOfferCount < 2 ? ' → CONTINUE a conversa, demonstre abertura para outra oferta' : ' → você já pode encerrar se as ofertas não fizerem sentido'}.

${productOfferStatusNotice}

⛔ NUNCA use estas frases antes de receber 2 ofertas: "Não quero nada", "Vou embora", "Prefiro encerrar", "Não tenho interesse em nenhum produto", "Depois eu vejo", "Não quero falar sobre isso", "Não preciso de nada".

PERSONA DO CLIENTE:
Nome: ${scenario.clientName}
Idade: ${scenario.clientAge || 'Não informada'} anos
Perfil: ${scenario.clientProfile || ''}
Contexto do Cenário: ${scenario.clientPersona}
Veio ao banco por: ${scenario.category}
Contexto da visita: ${scenario.description || ''}
PISTAS QUE VOCÊ PODE DAR (só se perguntado): ${scenario.commercialClues || ''}

${kbText}

⏱️ MENSAGENS DO BANCÁRIO: ${userMsgCount} ${messageLimitNotice}
📊 OFERTAS DE PRODUTOS DETECTADAS: ${productOfferCount}

🏁 ENCERRAMENTO — Ao decidir, inclua UMA destas frases na sua resposta:
- Aceitou → "NEGOCIAÇÃO ENCERRADA – PRODUTO CONTRATADO"
- Vai pensar → "NEGOCIAÇÃO ENCERRADA – CLIENTE VAI ANALISAR"  
- Recusou → "NEGOCIAÇÃO ENCERRADA – SEM FECHAMENTO"

${terminationRequiredNotice}
${minimumOffersNotice}

🏦 ESCOPO DE ATENDIMENTO — SOMENTE PESSOA FÍSICA (PF):
Todo atendimento é exclusivamente para PESSOA FÍSICA. O bancário NÃO pode oferecer produtos PJ. Mesmo se você falar sobre sua empresa, o bancário deve agir no âmbito da PF.

Responda como o cliente. Mantenha as frases curtas, tom de agência real e com pressa.`;
};

export const getSimulationEvaluatePrompt = async ({
  scenario,
  difficultyEvalModifier,
  isSemCreditoScenario,
  knowledgeBase,
  conversationText
}) => {
  const dbPrompt = await SystemPrompt.findOne({ where: { key: 'simulation_evaluate' } });

  const isSemCreditoNotice = isSemCreditoScenario 
    ? `⚠️ AVISO: Este é um cenário "SEM CRÉDITO DISPONÍVEL" ou com cliente NEGATIVADO. 
Aplique rubrica ESPECIAL: não zere a nota se o bancário identificou restrição, ofereceu alternativa e tentou próximo passo. Nota mínima esperada: 15-20/50 mesmo com resultado ruim.` 
    : '';

  const kbText = knowledgeBase && knowledgeBase.length > 0 
    ? `🧠 BASE DE CONHECIMENTO (AUXILIAR):\n${knowledgeBase.map(k => `• ${k.topicTitle} (${k.category}): ${k.content?.substring(0, 200) || ''}`).join('\n')}\n`
    : '';

  const variables = {
    isSemCreditoNotice,
    scenarioTitle: scenario.title,
    category: scenario.category,
    clientPersona: scenario.clientPersona,
    mainProduct: scenario.mainProduct || 'Não definido',
    supportProducts: scenario.supportProducts || 'Não definidos',
    evaluationCriteria: scenario.evaluationCriteria || 'Rubrica padrão',
    difficultyEvalModifier,
    knowledgeBase: kbText,
    conversationText
  };

  if (dbPrompt && dbPrompt.content) {
    return interpolate(dbPrompt.content, variables);
  }

  // Fallback padrão se não encontrar no banco
  return `Você é um MENTOR COMERCIAL experiente. Seu papel NÃO É o cliente — você é um AVALIADOR separado, analisando a conversa com distanciamento profissional. Seu objetivo é desenvolver o bancário com feedbacks práticos e úteis.

${isSemCreditoNotice}

CENÁRIO: ${scenario.title}
CATEGORIA: ${scenario.category}
PERFIL DO CLIENTE: ${scenario.clientPersona}
PRODUTO PRINCIPAL ESPERADO: ${scenario.mainProduct || 'Não definido'}
PRODUTOS DE APOIO ESPERADOS: ${scenario.supportProducts || 'Não definidos'}
CRITÉRIOS DE AVALIAÇÃO ESPECÍFICOS DO CENÁRIO: ${scenario.evaluationCriteria || 'Rubrica padrão'}
${difficultyEvalModifier}

${kbText}

CONVERSA COMPLETA:
${conversationText}

Avalie o bancário por RUBRICA nas 5 dimensões abaixo. Cada dimensão vale de 0 a 10. A nota final é a soma (0 a 50).

━━━━━━━━━━━━━━━━━━━━
RUBRICA DE AVALIAÇÃO
━━━━━━━━━━━━━━━━━━━━
1. DIAGNÓSTICO E PERGUNTAS ABERTAS (0-10): Perguntas abertas para entender pressa/diferença do MEI, necessidade real.
2. ESCUTA ATIVA, PERSONALIZAÇÃO E CLAREZA (0-10): Evitou palavras proibidas como investimento, investir, rentabilidade, CDB, fundos?
3. TRATAMENTO DE OBJEÇÕES (0-10): Lidou com resistências com empatia?
4. CROSS-SELL CONSULTIVO E ADERÊNCIA COMERCIAL (0-10): Matriz de 4 produtos: Crédito, Consórcio, Seguro, Capitalização. Erro PJ (oferecer conta PJ, capital de giro, maquininha) zera ou limita a nota a max 2 nessa dimensão.
5. FECHAMENTO E PRÓXIMO PASSO (0-10): Condução clara, mesmo sem venda.

⚠️ ERRO GRAVE PJ: Se o bancário ofereceu produto PJ (conta PJ, cartão empresarial, capital de giro, maquininha), limite a nota final TOTAL máxima a 10/50.
⚠️ ERRO GRAVE INVESTIMENTO: Se o bancário recomendou CDB, renda fixa, fundos, poupança, previdência ou investimentos, nota máxima 5 na dimensão Cross-Sell.
⚠️ ERRO GRAVE DIAGNÓSTICO: Se o crédito está indisponível, renda > R$2.500, e ofereceu Seguro de Vida como principal sem dependentes, nota máxima 3 na dimensão Cross-Sell.

Gere a resposta EXATAMENTE no seguinte formato JSON. Não insira nenhum outro texto explicativo antes ou depois do JSON:
{
  "score_diagnostico": 8.5,
  "score_argumentacao": 7.0,
  "score_objeccoes": 8.0,
  "score_cross_sell": 9.0,
  "score_fechamento": 8.0,
  "score_total": 40.5,
  "result": "venda",
  "pontos_fortes": "Descreva pontos fortes aqui...",
  "oportunidades_melhoria": "Descreva melhorias aqui...",
  "argumentos_sugeridos": "Sugira argumentos aqui..."
}`;
};

export const getExtractLearningPrompt = async ({ scenario, evaluation, conversationText }) => {
  const dbPrompt = await SystemPrompt.findOne({ where: { key: 'simulation_extract_learning' } });

  const variables = {
    scoreTotal: evaluation.scoreTotal || 40,
    scenarioTitle: scenario.title,
    conversationText
  };

  if (dbPrompt && dbPrompt.content) {
    return interpolate(dbPrompt.content, variables);
  }

  // Fallback padrão se não encontrar no banco
  return `Você é uma IA analítica comercial. Extraia as lições comerciais de sucesso aprendidas a partir do histórico desta conversa de simulação e da avaliação fornecida.

A conversa foi avaliada com nota ${evaluation.scoreTotal || 40}/50.
CENÁRIO: ${scenario.title}
CONVERSA:
${conversationText}

Gere o aprendizado comercial estruturado no formato JSON abaixo. Não insira explicações, apenas o JSON:
{
  "title": "Título resumido do aprendizado (ex: Abordagem de Consórcio para autônomos)",
  "result_type": "venda ou analise",
  "product_main": "Produto principal",
  "product_cross_sell": "Produto de cross-sell se houver",
  "client_profile": "Perfil resumido do cliente (anonimizado, ex: MEI de vestuário)",
  "objection": "Principal objeção contornada",
  "winning_argument": "Argumento que destravou a venda",
  "winning_script": "Script exato usado pelo bancário que deu resultado",
  "why_it_worked": "Explicação concisa do porquê funcionou",
  "tags": ["Tag1", "Tag2"],
  "conversation_excerpt": "Breve trecho de destaque do diálogo (max 400 chars)"
}`;
};

export const getCopilotoAnalyzePrompt = async ({ detectedMode, situationText, knowledgeBase }) => {
  const dbPrompt = await SystemPrompt.findOne({ where: { key: 'copiloto_analyze' } });

  const kbText = knowledgeBase && knowledgeBase.length > 0 
    ? `🧠 CONHECIMENTO DE PRODUTOS DISPONÍVEL:\n${knowledgeBase.map(k => `• ${k.topicTitle} (${k.category}): ${k.content}`).join('\n')}\n`
    : '';

  const variables = {
    detectedMode,
    knowledgeBase: kbText,
    situationText
  };

  if (dbPrompt && dbPrompt.content) {
    return interpolate(dbPrompt.content, variables);
  }

  // Fallback padrão se não encontrar no banco
  return `Você é o Copiloto IA do BankerPro. Seu papel é analisar o relato de atendimento a seguir e gerar um guia estratégico detalhado e altamente prático para o bancário usar na negociação real com o cliente.

MODO CLASSIFICADO DETERMINISTICAMENTE: ${detectedMode}
${kbText}

⚠️ REGRAS IMPORTANTES DO BANKERPRO:
- NUNCA recomende CDB, renda fixa, fundos, poupança ou investimentos.
- Use exclusivamente a matriz de 4 produtos: Crédito, Consórcio, Seguro de Vida, Capitalização.
- LINGUAGEM DO BANCÁRIO: Não use termos como "investir", "investimento", "rentabilidade", "poupança", "CDB", "fundo". Substitua por parcela mensal, benefício, proteção, planejamento, guardar dinheiro.

SITUAÇÃO DO CLIENTE RELATADA:
"${situationText}"

Gere o retorno EXATAMENTE no formato JSON estruturado a seguir. Não insira introduções ou observações.
{
  "modo_negociacao": "${detectedMode}",
  "estrategia": "Resumo geral da estratégia comercial",
  "necessidade_principal": "Qual a real dor do cliente",
  "solucao_principal": {
    "produto": "Nome do produto sugerido (Consórcio, Seguro, Crédito ou Capitalização)",
    "por_que_atende": "Por que resolve a dor",
    "por_que_relacionamento": "Como ajuda a conta"
  },
  "oportunidades_adicionais": ["Produto Cross-Sell 1", "Produto Cross-Sell 2"],
  "melhor_combinacao": "Solução Principal + Cross-sell",
  "como_oferecer": "Dicas de abordagem suave",
  "roteiro_venda": {
    "abertura": "Script de saudação",
    "diagnostico": "Perguntas de diagnóstico abertas",
    "oferta_principal": "Script da oferta principal",
    "transicao_cross_sell": "Script de ligação suave para o cross-sell",
    "fechamento": "Script para tentar fechar"
  },
  "cronograma_negociacao": ["Passo 1", "Passo 2", "Passo 3"],
  "tratamento_objecoes": [
    { "objecao": "A objeção provável do cliente", "contorno": "Como contorná-la de forma empática" }
  ],
  "scripts_alternativos": ["Script alternativo 1", "Script alternativo 2"],
  "plano_b": "Produto plano B caso rejeite a principal",
  "perguntas_diagnostico": "Duas perguntas diagnósticas principais",
  "proximo_passo": "Passo prático de fechamento"
}`;
};

export const getApproachGeneratePrompt = async ({ clientAge, clientIncome, objective, product }) => {
  const dbPrompt = await SystemPrompt.findOne({ where: { key: 'approach_generate' } });

  const variables = {
    clientAge: clientAge || 'Não informada',
    clientIncome: clientIncome || 'Não informada',
    objective,
    product
  };

  if (dbPrompt && dbPrompt.content) {
    return interpolate(dbPrompt.content, variables);
  }

  // Fallback padrão se não encontrar no banco
  return `Você é um GERENTE COMERCIAL experiente especializado em produtos bancários Pessoa Física.
Seu papel é gerar roteiros comerciais de altíssima qualidade para bancários reais.

PERFIL DO CLIENTE:
- Idade: ${clientAge || 'Não informada'}
- Renda: ${clientIncome || 'Não informada'}
- Objetivo/Motivo do cliente: ${objective}
- Produto a ser ofertado: ${product}

⚠️ REGRA ABSOLUTA: O produto informado é uma OPORTUNIDADE DE OFERTA. O cliente NÃO pediu, NÃO solicitou, NÃO demonstrou interesse — o bancário quer OFERTAR este produto.
⚠️ NUNCA use termos de investimento como: investir, investimento, rentabilidade, poupança, CDB, renda fixa, fundo. Substitua por: parcela mensal, benefício, proteção, planejamento, guardar dinheiro de forma disciplinada.

Gere o resultado EXATAMENTE no formato JSON abaixo. Não retorne textos adicionais antes ou depois do JSON:
{
  "abordagem_inicial": "Mensagem inicial curta e natural para puxar assunto sobre o produto sem parecer telemarketing",
  "perguntas_diagnostico": [
    "Pergunta de diagnóstico aberta 1",
    "Pergunta de diagnóstico aberta 2"
  ],
  "argumentos": [
    { "titulo": "Título curto do argumento 1", "fala": "Roteiro da fala do bancário demonstrando benefício prático na vida do cliente" },
    { "titulo": "Título curto do argumento 2", "fala": "Roteiro da fala do bancário" }
  ],
  "objeccoes_provaveis": [
    { "objecao": "Objeção provável do cliente sobre este produto", "contorno": "Fala empática e estruturada contornando e revertendo a objeção" }
  ],
  "frases_fechamento": [
    "Frase de fechamento assertiva 1",
    "Frase de fechamento assertiva 2"
  ]
}`;
};

export const getKnowledgePolishPrompt = async ({ topicTitle, category }) => {
  const dbPrompt = await SystemPrompt.findOne({ where: { key: 'knowledge_polish' } });

  const variables = {
    topicTitle,
    category
  };

  if (dbPrompt && dbPrompt.content) {
    return interpolate(dbPrompt.content, variables);
  }

  // Fallback padrão se não encontrar no banco
  return `Você é um EDITOR COMERCIAL DE PRODUTOS BANCÁRIOS. Seu papel é pegar as informações rascunhadas sobre o produto "${topicTitle}" na categoria "${category}" e reformatá-las/polir em uma estrutura de texto altamente profissional de treinamento para bancários.

Siga exatamente a estrutura abaixo em Markdown no retorno:
1. O que é o produto
2. Vantagens para o banco
3. Benefícios para o cliente
4. Principais objeções e contornos
5. Argumentos-chave de venda

⛔ Não use linguagem proibida de investimentos (ex: investir, investimento, rentabilidade, poupança, CDB, renda fixa, fundo). Substitua por aplicar recursos, planejamento, benefício, guardar dinheiro.
⛔ Retorne apenas o texto formatado final, sem observações adicionais.`;
};
