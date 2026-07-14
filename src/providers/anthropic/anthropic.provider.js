import Anthropic from '@anthropic-ai/sdk';
import AppError from '../../utils/app-error.js';
import { getSettingValue } from '../../utils/settings-resolver.js';

let anthropicClient = null;

const getAnthropicClient = (apiKey) => {
  if (!anthropicClient || anthropicClient._options?.apiKey !== apiKey) {
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
};

export const invokeLLM = async ({ system, messages, model, maxTokens = 4000 }) => {
  const apiKey = await getSettingValue('ANTHROPIC_API_KEY');
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    // Modo de Simulação / Mock se não houver chave configurada para testes locais
    console.warn('⚠️ ANTHROPIC_API_KEY não configurada. Utilizando respostas simuladas do Mock.');
    return simulateMockResponse(system, messages);
  }

  let selectedModel = model || 'claude-sonnet-5';
  if (selectedModel === 'claude_sonnet_4_6') {
    selectedModel = 'claude-sonnet-5';
  }
  const client = getAnthropicClient(apiKey);

  // A API da Anthropic exige obrigatoriamente pelo menos 1 mensagem no array messages
  const formattedMessages = messages && messages.length > 0
    ? messages.map(m => ({
        role: m.role === 'client' ? 'assistant' : m.role,
        content: m.content
      }))
    : [{ role: 'user', content: 'Gere a resposta com base nas instruções fornecidas.' }];

  try {
    const response = await client.messages.create({
      model: selectedModel,
      max_tokens: maxTokens,
      system,
      messages: formattedMessages
    });

    return response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');
  } catch (error) {
    console.error('Erro na chamada da API Anthropic via SDK:', error);
    throw new AppError(`Falha de comunicação com a Inteligência Artificial: ${error.message}`, 500, 'LLM_COMMUNICATION_FAILED');
  }
};

/**
 * Função utilitária para extrair e fazer o parse do JSON retornado pela IA,
 * tratando casos onde a IA insere blocos de código markdown ou textos introdutórios.
 */
export const parseJSONResponse = (text) => {
  if (!text) return null;
  try {
    // 1) Limpar possíveis blocos de marcação de código markdown
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    
    cleaned = cleaned.trim();

    // 2) Tentar encontrar a primeira ocorrência de { e a última de } caso haja lixo ao redor
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }

    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Falha ao tentar parsear resposta JSON da IA:', text);
    throw new AppError('A resposta gerada pela Inteligência Artificial não pôde ser estruturada no formato esperado.', 500, 'AI_PARSING_FAILED');
  }
};

/**
 * Simulador de respostas para quando a chave da API não estiver disponível (facilita testes locais sem gastar créditos)
 */
function simulateMockResponse(system, messages) {
  const lastUserMsg = messages[messages.length - 1]?.content || '';
  const lowerMsg = lastUserMsg.toLowerCase();

  // Se o prompt é para avaliação (contém palavra "rubrica" ou "avaliação")
  if (system.includes('RUBRICA') || system.includes('AVALIAÇÃO') || system.includes('avaliar') || lowerMsg.includes('finalizar')) {
    return JSON.stringify({
      score_diagnostico: 8.5,
      score_argumentacao: 8.0,
      score_objeccoes: 7.5,
      score_cross_sell: 8.0,
      score_fechamento: 8.0,
      score_total: 40.0,
      result: 'venda',
      pontos_fortes: 'Fez perguntas diagnósticas excelentes para entender a necessidade e a pressa do cliente.',
      oportunidades_melhoria: 'Poderia ter contornado melhor a objeção inicial de taxa oferecendo alternativas de plano.',
      argumentos_sugeridos: 'Use o argumento da poupança forçada combinada com sorteios.'
    });
  }

  // Se o prompt é do Copiloto (contém palavra "Copiloto" ou "negociação")
  if (system.includes('Copiloto') || system.includes('modo_negociacao')) {
    return JSON.stringify({
      modo_negociacao: 'Cliente com Crédito Disponível',
      estrategia: 'Propor o crédito pessoal sob o argumento de taxa promocional e adicionar o seguro como blidagem familiar.',
      necessidade_principal: 'Dinheiro rápido para pagar cirurgia',
      solucao_principal: {
        produto: 'Crédito Pessoal PF',
        por_que_atende: 'Atendimento imediato da urgência médica',
        por_que_relacionamento: 'Cria histórico de adimplemento e reciprocidade com a instituição.'
      },
      oportunidades_adicionais: ['Seguro de Vida'],
      melhor_combinacao: 'Crédito Pessoal + Seguro de Vida',
      como_oferecer: 'Apresentar a parcela do seguro como parte do custo de segurança para a própria família.',
      roteiro_venda: {
        abertura: 'Olá, compreendo perfeitamente sua preocupação com a saúde da sua família.',
        diagnostico: 'Qual o valor total necessário e o prazo que fica confortável para sua parcela?',
        oferta_principal: 'Conseguimos liberar o valor com taxa de 1.89% ao mês.',
        transicao_cross_sell: 'E para garantir que a parcela fique coberta caso ocorra algum imprevisto, adicionamos a proteção familiar.',
        fechamento: 'Podemos rodar a contratação agora?'
      },
      cronograma_negociacao: ['Passo 1: Liberação do crédito', 'Passo 2: Adesão à proteção familiar'],
      tratamento_objecoes: [
        { objecao: 'Está muito caro', contorno: 'A taxa está reduzida e o seguro garante a segurança do saldo.' }
      ],
      scripts_alternativos: ['Opção parcelada menor com seguro reduzido'],
      plano_b: 'Consórcio para planejamento futuro',
      perguntas_diagnostico: 'Qual o impacto dessa despesa no seu mês?',
      proximo_passo: 'Submeter proposta para aprovação interna'
    });
  }

  // Se o prompt é do Gerador de Abordagens
  if (system.includes('GERENTE COMERCIAL') || system.includes('abordagem comercial')) {
    return JSON.stringify({
      abordagem_inicial: 'Olá, tudo bem? Percebi que você tem planos de trocar seu carro daqui a alguns meses. Como está o planejamento para isso?',
      perguntas_diagnostico: [
        'Qual o valor aproximado do veículo que você deseja adquirir?',
        'Quanto você consegue destinar por mês para esse objetivo sem apertar seu caixa?'
      ],
      argumentos: [
        { titulo: 'Zero Juros', fala: 'Diferente de um financiamento, no consórcio você não paga juros compensatórios.' },
        { titulo: 'Aumento de Patrimônio', fala: 'Funciona como uma poupança programada e forçada que garante a compra do seu veículo.' }
      ],
      objeccoes_provaveis: [
        { objecao: 'Consórcio demora para contemplar', contorno: 'Podemos ofertar lances para acelerar a sua contemplação e liberação do crédito.' }
      ],
      frases_fechamento: [
        'Podemos simular uma parcela de R$ 500 para iniciarmos o seu grupo?'
      ]
    });
  }

  // Resposta padrão de chat simulando o cliente
  return 'Entendo sua proposta, mas confesso que no momento meu orçamento está um pouco apertado. O que podemos fazer em relação à taxa ou ao prazo desse produto?';
}
