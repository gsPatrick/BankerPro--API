import { Simulation, Scenario, ProductKnowledge, CommercialLearning } from '../../models/index.js';
import * as anthropicProvider from '../../providers/anthropic/anthropic.provider.js';
import * as prompts from './ai.prompts.js';
import { sanitizeText, sanitizeObject } from '../../utils/client-sanitizer.js';
import { detectProductsOffered } from '../../utils/cross-sell-detector.js';
import AppError from '../../utils/app-error.js';

export const simulationChat = async (userId, { simulationId, userMessage }) => {
  const simulation = await Simulation.findOne({
    where: { id: simulationId, createdByUserId: userId },
    include: [{ model: Scenario, as: 'scenario' }]
  });

  if (!simulation) {
    throw new AppError('Simulação não encontrada.', 404, 'SIMULATION_NOT_FOUND');
  }

  if (simulation.status === 'completed') {
    throw new AppError('Esta simulação já foi concluída.', 400, 'SIMULATION_ALREADY_COMPLETED');
  }

  const scenario = simulation.scenario;
  if (!scenario) {
    throw new AppError('Cenário associado não encontrado.', 404, 'SCENARIO_NOT_FOUND');
  }

  const messages = [...(simulation.messages || [])];
  messages.push({
    role: 'user',
    content: userMessage.trim(),
    timestamp: new Date().toISOString()
  });

  const knowledgeBase = await ProductKnowledge.findAll({ limit: 10 });
  const userMsgCount = messages.filter(m => m.role === 'user').length;
  const { count: productOfferCount } = detectProductsOffered(messages);

  const difficultyLevel = scenario.difficulty;
  const messageLimits = {
    'Iniciante': { min: 3, max: 6, label: '3 a 6 mensagens do bancário' },
    'Intermediário': { min: 5, max: 10, label: '5 a 10 mensagens do bancário' },
    'Avançado': { min: 8, max: 15, label: '8 a 15 mensagens do bancário' }
  };
  const limit = messageLimits[difficultyLevel] || messageLimits['Intermediário'];
  
  const approachingLimit = userMsgCount >= limit.min;
  const atLimit = userMsgCount >= limit.max;
  const hasMinimumOffers = productOfferCount >= 2;

  // Obter prompt sistêmico externalizado com await
  const systemPrompt = await prompts.getSimulationChatPrompt({
    scenario,
    productOfferCount,
    userMsgCount,
    limit,
    approachingLimit,
    atLimit,
    hasMinimumOffers,
    knowledgeBase
  });

  const reply = await anthropicProvider.invokeLLM({
    system: systemPrompt,
    messages
  });

  const sanitizedReply = sanitizeText(reply);

  messages.push({
    role: 'client',
    content: sanitizedReply,
    timestamp: new Date().toISOString()
  });

  simulation.messages = messages;

  const terminationKeywords = [
    'NEGOCIAÇÃO ENCERRADA – PRODUTO CONTRATADO',
    'NEGOCIAÇÃO ENCERRADA – CLIENTE VAI ANALISAR',
    'NEGOCIAÇÃO ENCERRADA – SEM FECHAMENTO'
  ];
  
  const terminated = terminationKeywords.some(keyword => sanitizedReply.includes(keyword)) || atLimit;

  await simulation.save();

  return {
    message: sanitizedReply,
    terminated
  };
};

export const simulationEvaluate = async (userId, { simulationId, durationMinutes }) => {
  const simulation = await Simulation.findOne({
    where: { id: simulationId, createdByUserId: userId },
    include: [{ model: Scenario, as: 'scenario' }]
  });

  if (!simulation) {
    throw new AppError('Simulação não encontrada.', 404, 'SIMULATION_NOT_FOUND');
  }

  const scenario = simulation.scenario;
  const messages = simulation.messages || [];
  
  const conversationText = messages.map(m => 
    `${m.role === 'user' ? 'BANCÁRIO' : 'CLIENTE'}: ${m.content}`
  ).join('\n\n');

  const knowledgeBase = await ProductKnowledge.findAll({ limit: 10 });
  const difficultyLevel = scenario.difficulty;

  const difficultyEvalModifier = {
    'Iniciante': 'DIFICULDADE: FÁCIL — Cliente aberto, com pressa. O bancário só precisava explicar bem e conduzir. Nota esperada: 35-50.',
    'Intermediário': 'DIFICULDADE: MÉDIO — Cliente cauteloso, até 3 objeções. O bancário precisava argumentar e contornar dúvidas. Nota esperada: 25-45.',
    'Avançado': 'DIFICULDADE: DIFÍCIL — Cliente exigente e desconfiado, até 5 objeções progressivas. O bancário precisava demonstrar escuta, adaptação e paciência. Nota esperada: 15-40.'
  }[difficultyLevel] || 'DIFICULDADE: MÉDIO — Cliente cauteloso. Nota esperada: 25-45.';

  const isSemCreditoScenario = scenario.category === 'Sem Crédito Disponível' || 
                               (scenario.title && scenario.title.toLowerCase().includes('negativad')) ||
                               (scenario.title && scenario.title.toLowerCase().includes('sem cr'));

  // Obter prompt de avaliação com await
  const systemPrompt = await prompts.getSimulationEvaluatePrompt({
    scenario,
    difficultyEvalModifier,
    isSemCreditoScenario,
    knowledgeBase,
    conversationText
  });

  // Única chamada que mantém o raciocínio ligado: aqui a IA julga o desempenho e
  // atribui a nota, roda uma vez ao fim da simulação e o usuário já espera pelo
  // resultado. Nas demais o raciocínio só somava latência.
  const reply = await anthropicProvider.invokeLLM({
    system: systemPrompt,
    messages: [],
    thinking: { type: 'adaptive' },
    effort: 'medium'
  });

  const evaluationResult = anthropicProvider.parseJSONResponse(reply);
  return evaluationResult;
};

export const simulationExtractLearning = async (userId, { simulationId, evaluation }) => {
  const simulation = await Simulation.findOne({
    where: { id: simulationId, createdByUserId: userId },
    include: [{ model: Scenario, as: 'scenario' }]
  });

  if (!simulation) {
    throw new AppError('Simulação não encontrada.', 404, 'SIMULATION_NOT_FOUND');
  }

  const scenario = simulation.scenario;
  const messages = simulation.messages || [];
  
  const conversationText = messages.map(m => 
    `${m.role === 'user' ? 'BANCÁRIO' : 'CLIENTE'}: ${m.content}`
  ).join('\n\n');

  // Obter prompt de extração de aprendizado com await
  const systemPrompt = await prompts.getExtractLearningPrompt({
    scenario,
    evaluation,
    conversationText
  });

  const reply = await anthropicProvider.invokeLLM({
    system: systemPrompt,
    messages: []
  });

  const parsed = anthropicProvider.parseJSONResponse(reply);

  const learning = await CommercialLearning.create({
    sourceSimulationId: simulationId,
    createdByUserId: userId,
    title: parsed.title || `Aprendizado - ${scenario.title}`,
    score: evaluation.scoreTotal,
    resultType: parsed.result_type || 'venda',
    productMain: parsed.product_main || scenario.mainProduct || 'Desconhecido',
    productCrossSell: parsed.product_cross_sell || scenario.supportProducts || null,
    clientProfile: parsed.client_profile || scenario.clientProfile,
    objection: parsed.objection,
    winningArgument: parsed.winning_argument,
    winningScript: parsed.winning_script,
    whyItWorked: parsed.why_it_worked,
    tags: parsed.tags || [],
    conversationExcerpt: parsed.conversation_excerpt
  });

  return learning;
};

export const copilotoAnalyze = async (userId, { situationText }) => {
  const knowledgeBase = await ProductKnowledge.findAll({ limit: 10 });

  let detectedMode = 'Oferta Fria';
  const text = situationText.toLowerCase();
  
  if (text.includes('negativad') || text.includes('restriç') || text.includes('sem margem') || text.includes('sem linha')) {
    detectedMode = 'Cliente Sem Crédito / Negativado';
  } else if (text.includes('emprestimo') || text.includes('crédito') || text.includes('limite') || text.includes('consignado')) {
    detectedMode = 'Cliente com Crédito Disponível';
  } else if (text.includes('já tem') || text.includes('já contratou') || text.includes('cancelar') || text.includes('renovação')) {
    detectedMode = 'Produto Já Contratado';
  } else if (text.includes('aposentad') || text.includes('pensionista') || text.includes('inss')) {
    detectedMode = 'Aposentado/Consignado';
  } else if (text.includes('veiculo') || text.includes('carro') || text.includes('imovel') || text.includes('reforma') || text.includes('consórcio')) {
    detectedMode = 'Cross-sell puro';
  }

  // Obter prompt do copiloto com await
  const systemPrompt = await prompts.getCopilotoAnalyzePrompt({
    detectedMode,
    situationText,
    knowledgeBase
  });

  const reply = await anthropicProvider.invokeLLM({
    system: systemPrompt,
    messages: []
  });

  const plan = anthropicProvider.parseJSONResponse(reply);
  return sanitizeObject(plan);
};

export const approachGenerate = async ({ clientAge, clientIncome, objective, product }) => {
  // Obter prompt de geração de abordagens com await
  const systemPrompt = await prompts.getApproachGeneratePrompt({
    clientAge,
    clientIncome,
    objective,
    product
  });

  const reply = await anthropicProvider.invokeLLM({
    system: systemPrompt,
    messages: []
  });

  const approach = anthropicProvider.parseJSONResponse(reply);
  return sanitizeObject(approach);
};

export const knowledgePolish = async ({ topicTitle, category, content }) => {
  // Obter prompt de polimento de conhecimento com await
  const systemPrompt = await prompts.getKnowledgePolishPrompt({
    topicTitle,
    category
  });

  const reply = await anthropicProvider.invokeLLM({
    system: systemPrompt,
    messages: [{ role: 'user', content: content }]
  });

  return sanitizeText(reply);
};

export const genericInvokeLLM = async ({ prompt, messages, responseJsonSchema }) => {
  let systemPrompt = prompt;

  if (responseJsonSchema) {
    const schemaStr = JSON.stringify(responseJsonSchema, null, 2);
    systemPrompt = `${systemPrompt}\n\nVocê DEVE responder ESTRITAMENTE em formato JSON estruturado seguindo o esquema abaixo. Não adicione textos explicativos, introduções ou marcações markdown fora do JSON. Responda apenas com o objeto JSON.\nESQUEMA:\n${schemaStr}`;
  }

  const reply = await anthropicProvider.invokeLLM({
    system: systemPrompt,
    messages: messages || []
  });

  if (responseJsonSchema) {
    try {
      return anthropicProvider.parseJSONResponse(reply);
    } catch (e) {
      console.warn("Falha ao parsear JSON estruturado no genericInvokeLLM (fallback):", e);
    }
  }

  return { response: reply };
};
