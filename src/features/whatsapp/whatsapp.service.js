import fs from 'fs';
import path from 'path';
import * as wpProvider from '../../providers/whatsapp/whatsapp.provider.js';
import { User, Subscription, SystemPrompt, ProductKnowledge, Plan } from '../../models/index.js';
import { invokeLLM } from '../../providers/anthropic/anthropic.provider.js';
import * as audioAnalysisService from '../audio-analysis/audio-analysis.service.js';

export const getStatus = async (appUrl) => {
  let statusInfo = await wpProvider.getInstanceStatus();
  
  if (!statusInfo.exists) {
    console.log('🔄 Instância "copilot" não existe no Evolution. Criando agora...');
    await wpProvider.createInstance();
    statusInfo = await wpProvider.getInstanceStatus();
  }

  // Se estiver criada, garante o webhook configurado apontando de volta para a API
  if (statusInfo.exists && appUrl) {
    const webhookUrl = `${appUrl}/api/v1/whatsapp/webhook`;
    await wpProvider.setWebhook(webhookUrl);
  }

  return statusInfo;
};

export const connectInstance = async () => {
  return await wpProvider.createInstance();
};

export const disconnectInstance = async () => {
  return await wpProvider.deleteInstance();
};

// Localiza o usuário pelo número e devolve também o plano ativo, que é o que
// decide se ele pode usar a funcionalidade pedida.
const resolverUsuarioPorNumero = async (cleanSender) => {
  const user = await User.findOne({
    where: { whatsapp: cleanSender },
    include: [{ model: Subscription, as: 'subscriptions', where: { status: 'active' }, required: false }]
  });

  if (!user) return { user: null, plan: null };

  const activeSub = user.subscriptions?.[0];
  const plan = activeSub ? await Plan.findOne({ where: { key: activeSub.plan } }) : null;
  return { user, plan };
};

const planoLibera = (plan, featureKey) =>
  Boolean(plan?.permissions && plan.permissions.includes(featureKey));

/**
 * Áudio recebido no WhatsApp vira Análise de Negociação: baixa a mídia, roda o
 * mesmo serviço do painel e responde o feedback no chat.
 */
const handleIncomingAudio = async ({ cleanSender, messageKey, durationSeconds }) => {
  const { user, plan } = await resolverUsuarioPorNumero(cleanSender);

  if (!user) {
    await wpProvider.sendMessage(cleanSender, `Olá! Sou o assistente do BankerPro. 🤖\n\nEste número não está cadastrado em nenhuma conta ativa.\n\nAcesse a plataforma, vá no seu Perfil e configure o seu número de WhatsApp para usar o Copiloto e a Análise de Áudio no celular!`);
    return { success: false, reason: 'User not found' };
  }

  if (!planoLibera(plan, 'analise_audio')) {
    await wpProvider.sendMessage(cleanSender, `Olá, ${user.fullName || 'Usuário'}! Recebi o seu áudio, mas o seu plano atual (${plan ? plan.name : 'sem plano ativo'}) não inclui a Análise de Áudio.\n\nFaça um upgrade no painel da plataforma para receber a análise das suas negociações por aqui!`);
    return { success: false, reason: 'Plan not authorized' };
  }

  // A transcrição e a análise levam algum tempo: sem este aviso o usuário fica
  // sem resposta achando que o áudio se perdeu.
  await wpProvider.sendMessage(cleanSender, '🎧 Recebi o seu áudio! Estou ouvindo a negociação e já te mando a análise. Leva alguns instantes.');

  const tmpDir = './uploads/audio-tmp';
  let filePath = null;

  try {
    const { buffer, mimetype } = await wpProvider.downloadMedia(messageKey);

    // A extensão precisa refletir o formato: é por ela que a transcrição decide
    // o mime type. O WhatsApp grava em ogg/opus.
    const ext = mimetype.includes('mp4') || mimetype.includes('m4a') ? '.m4a'
      : mimetype.includes('mpeg') ? '.mp3'
        : '.ogg';

    await fs.promises.mkdir(tmpDir, { recursive: true });
    filePath = path.join(tmpDir, `whatsapp-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    await fs.promises.writeFile(filePath, buffer);

    // O service apaga o arquivo por conta própria, no sucesso e no erro.
    const analise = await audioAnalysisService.analyzeAudio(user.id, {
      filePath,
      durationSeconds,
      source: 'whatsapp'
    });

    await wpProvider.sendMessage(cleanSender, `${analise.analysis}\n\n———\n📊 A análise completa também ficou salva no seu histórico da plataforma.`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao analisar áudio recebido no WhatsApp:', error);
    // Mensagem de AppError é escrita para o usuário; o resto é detalhe interno.
    const motivo = error.isOperational ? error.message : 'Não consegui analisar este áudio. Tente enviar novamente em instantes.';
    await wpProvider.sendMessage(cleanSender, `⚠️ ${motivo}`);
    return { success: false, error: error.message };
  }
};

export const handleIncomingWebhook = async (payload) => {
  try {
    const remoteJid = payload.data?.key?.remoteJid;
    const fromMe = payload.data?.key?.fromMe;

    if (fromMe || !remoteJid) {
      return { success: true, reason: 'Ignored outbound message' };
    }

    const senderNumber = remoteJid.split('@')[0];
    const cleanSender = senderNumber.replace(/\D/g, '');

    // Extrai o texto da mensagem recebida
    const messageObj = payload.data?.message;
    const incomingText = messageObj?.conversation ||
                         messageObj?.extendedTextMessage?.text ||
                         messageObj?.imageMessage?.caption ||
                         '';

    // Áudio segue outro caminho: vira Análise de Negociação, não conversa com o
    // Copiloto. Precisa vir antes da checagem de texto, que descarta tudo que
    // não é texto.
    const audioMessage = messageObj?.audioMessage;
    if (audioMessage) {
      return await handleIncomingAudio({
        cleanSender,
        messageKey: payload.data?.key,
        durationSeconds: audioMessage.seconds || null
      });
    }

    if (!incomingText || incomingText.trim() === '') {
      return { success: true, reason: 'No text content' };
    }

    console.log(`📩 Mensagem recebida no WhatsApp do Copiloto de ${cleanSender}: "${incomingText}"`);

    // 1) Localizar o usuário pelo número de WhatsApp cadastrado no banco
    const user = await User.findOne({ 
      where: { whatsapp: cleanSender },
      include: [{ 
        model: Subscription, 
        as: 'subscriptions',
        where: { status: 'active' },
        required: false 
      }]
    });

    if (!user) {
      const errorMsg = `Olá! Sou o assistente de Inteligência Artificial do BankerPro. 🤖\n\nIdentifiquei que este número de WhatsApp não está cadastrado em nenhuma conta ativa do sistema.\n\nPor favor, faça login na plataforma BankerPro, acesse o seu Perfil e configure o número de WhatsApp correto para habilitar o modo Copiloto no seu celular!`;
      await wpProvider.sendMessage(senderNumber, errorMsg);
      return { success: false, reason: 'User not found' };
    }

    // 2) Validar se o plano do usuário possui a funcionalidade ativa via permissão 'whatsapp_copilot'
    const activeSub = user.subscriptions?.[0];
    const planKey = activeSub ? activeSub.plan : 'free';
    const plan = await Plan.findOne({ where: { key: planKey } });

    const hasWhatsappAccess = plan && plan.permissions && plan.permissions.includes('whatsapp_copilot');

    if (!hasWhatsappAccess) {
      const freeMsg = `Olá, ${user.fullName || 'Usuário'}! Identificamos a sua conta BankerPro, mas o seu plano atual (${plan ? plan.name : 'Gratuito'}) não possui acesso ao Copiloto via WhatsApp.\n\nAssine ou faça upgrade para um plano com acesso ao Copiloto via WhatsApp no painel da plataforma para liberar esta funcionalidade no seu celular!`;
      await wpProvider.sendMessage(senderNumber, freeMsg);
      return { success: false, reason: 'Plan not authorized' };
    }

    // 3) Gerar a resposta com o LLM (Anthropic Claude) usando os prompts do Copiloto e a base de conhecimento de produtos
    const copilotPrompt = await SystemPrompt.findOne({ where: { key: 'simulation_copilot' } });
    const basePrompt = copilotPrompt ? copilotPrompt.content : `Você é o Copiloto de Simulações BankerPro. Seu objetivo é ajudar o bancário a contornar as piores objeções de vendas de consórcios, empréstimos, seguros, etc. Responda em tom profissional, focado em vendas e gatilhos mentais.`;

    const knowledgeList = await ProductKnowledge.findAll();
    const knowledgeContext = knowledgeList.map(k => 
      `TÓPICO: ${k.topicTitle}\nCATEGORIA: ${k.category}\nCONTEÚDO:\n${k.content}`
    ).join('\n\n---\n\n');

    const systemPrompt = `${basePrompt}

Abaixo está a Base de Conhecimento de Produtos cadastrada no sistema. Use-a como fonte de argumentação de vendas caso o usuário faça perguntas específicas sobre produtos:

${knowledgeContext}

IMPORTANTE: Responda de forma direta e estruturada via texto para leitura rápida no celular/WhatsApp.`;

    const messages = [{ role: 'user', content: incomingText }];
    
    // Invocar o modelo Claude para obter a melhor resposta
    const aiResponse = await invokeLLM({
      system: systemPrompt,
      messages,
      model: 'claude-sonnet-5'
    });

    // 4) Enviar a resposta gerada pela IA de volta ao usuário pelo WhatsApp
    await wpProvider.sendMessage(senderNumber, aiResponse);
    return { success: true };

  } catch (error) {
    console.error('Erro ao processar webhook do WhatsApp:', error);
    return { success: false, error: error.message };
  }
};
