import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import * as wpProvider from '../../providers/whatsapp/whatsapp.provider.js';
import { User, Subscription, SystemPrompt, ProductKnowledge, Plan, AudioAnalysis, WhatsappOtp } from '../../models/index.js';
import { invokeLLM } from '../../providers/anthropic/anthropic.provider.js';
import { getSettingValue } from '../../utils/settings-resolver.js';
import * as audioAnalysisService from '../audio-analysis/audio-analysis.service.js';
import { enqueueWhatsappAnalysis } from '../../queues/audio.queue.js';
import AppError from '../../utils/app-error.js';

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
 * Áudio recebido no WhatsApp vira Análise de Negociação. Aqui só validamos e
 * confirmamos o recebimento na hora; o trabalho pesado (baixar a mídia,
 * transcrever, analisar) vai para a fila e responde o feedback quando terminar.
 * Assim o webhook fecha rápido — a Evolution não dá timeout nem reenvia a
 * mensagem (o que causava análise e cobrança duplicadas).
 */
const handleIncomingAudio = async ({ cleanSender, messageKey, durationSeconds }) => {
  const { user, plan } = await resolverUsuarioPorNumero(cleanSender);

  if (!user) {
    await wpProvider.sendMessage(cleanSender, `Olá! Sou o assistente do Closer.IA. 🤖\n\nEste número não está cadastrado em nenhuma conta ativa.\n\nAcesse a plataforma, vá no seu Perfil e configure o seu número de WhatsApp para usar o Copiloto e a Análise de Áudio no celular!`);
    return { success: false, reason: 'User not found' };
  }

  if (!planoLibera(plan, 'analise_audio')) {
    await wpProvider.sendMessage(
      cleanSender,
      `🎧 Olá, *${user.fullName || 'tudo bem'}*!\n\n` +
      `Recebi o seu áudio, mas o seu plano *${plan ? plan.name : 'atual'}* ainda não inclui a *Análise de Áudio*.\n\n` +
      `Faça um upgrade no painel para receber a análise das suas negociações por aqui. 🚀`
    );
    return { success: false, reason: 'Plan not authorized' };
  }

  await wpProvider.sendMessage(
    cleanSender,
    `🎧 *Áudio recebido!*\n\nJá estou ouvindo a negociação e preparando a sua análise. Isso leva alguns instantes... ⏳`
  );

  const jobData = { userId: user.id, sender: cleanSender, messageKey, durationSeconds };

  const job = await enqueueWhatsappAnalysis(jobData);
  if (job) {
    return { success: true, queued: true };
  }

  // Sem fila (Redis indisponível): processa na hora, como antes. O erro já é
  // respondido ao usuário dentro do job; aqui só evitamos que ele suba.
  try {
    await processWhatsappAudioJob(jobData);
  } catch {
    // já tratado (mensagem enviada ao usuário)
  }
  return { success: true };
};

/**
 * O trabalho pesado do áudio do WhatsApp, chamado pelo worker da fila (ou inline
 * no fallback síncrono): baixa a mídia, transcreve, analisa, salva no histórico e
 * responde o feedback no chat.
 */
export const processWhatsappAudioJob = async ({ userId, sender, messageKey, durationSeconds }) => {
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

    // runTranscriptionAndAnalysis apaga o arquivo por conta própria, no sucesso e no erro.
    const resultado = await audioAnalysisService.runTranscriptionAndAnalysis(filePath, {});

    await AudioAnalysis.create({
      createdByUserId: userId,
      status: 'completed',
      ...resultado,
      durationSeconds: durationSeconds ?? null,
      source: 'whatsapp'
    });

    await wpProvider.sendMessage(
      sender,
      `${resultado.analysis}\n\n━━━━━━━━━━━━━━━\n📊 Análise salva também no seu *histórico* na plataforma.`
    );
  } catch (error) {
    console.error('Erro ao analisar áudio recebido no WhatsApp:', error);
    // Garante que o arquivo não fique órfão se falhou antes da transcrição.
    if (filePath) await fs.promises.unlink(filePath).catch(() => {});
    const motivo = error.isOperational ? error.message : 'Não consegui analisar este áudio. Tente enviar novamente em instantes.';
    await wpProvider.sendMessage(sender, `⚠️ ${motivo}`);
    throw error;
  }
};

// Gera um código de 6 dígitos, guarda ligado ao número e o envia de volta pelo
// WhatsApp para o usuário digitar no painel.
const enviarOtpVinculo = async (cleanSender) => {
  // Só o mais recente vale: apaga códigos antigos deste número.
  await WhatsappOtp.destroy({ where: { whatsapp: cleanSender } });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
  await WhatsappOtp.create({ whatsapp: cleanSender, code, expiresAt });

  await wpProvider.sendMessage(
    cleanSender,
    `🔐 *Closer.IA • Código de verificação*\n\n` +
    `Use o código abaixo para conectar este WhatsApp à sua conta:\n\n` +
    `\`\`\`${code}\`\`\`\n\n` +
    `⏱️ Válido por *10 minutos*.\n` +
    `Volte ao painel, abra a tela *Conectar WhatsApp* e digite o código. ✅\n\n` +
    `_Se não foi você, é só ignorar esta mensagem._`
  );

  return { success: true, reason: 'otp_sent' };
};

/**
 * Vincula o número ao usuário logado a partir do código que ele recebeu no
 * WhatsApp. Chamado pelo endpoint do painel (usuário autenticado).
 */
export const verifyLinkCode = async (userId, code) => {
  const otp = await WhatsappOtp.findOne({
    where: { code: String(code).trim(), expiresAt: { [Op.gt]: new Date() } },
    order: [['created_at', 'DESC']]
  });

  if (!otp) {
    throw new AppError('Código inválido ou expirado. Gere um novo enviando outra mensagem ao WhatsApp do Closer.IA.', 400, 'INVALID_LINK_CODE');
  }

  // O número é único por conta: se já estava em outra, solta de lá antes (e
  // desmarca a verificação de lá).
  await User.update(
    { whatsapp: null, whatsappVerified: false },
    { where: { whatsapp: otp.whatsapp } }
  );

  const user = await User.findByPk(userId);
  user.whatsapp = otp.whatsapp;
  user.whatsappVerified = true; // confirmado pelo próprio WhatsApp
  await user.save();

  // Consome o código.
  await WhatsappOtp.destroy({ where: { whatsapp: otp.whatsapp } });

  const activeSub = await Subscription.findOne({ where: { userId, status: 'active' } });
  const plan = activeSub ? await Plan.findOne({ where: { key: activeSub.plan } }) : null;
  const hasCopilot = Boolean(plan?.permissions?.includes('whatsapp_copilot'));

  return { linked: true, whatsapp: otp.whatsapp, hasCopilot };
};

// Informações para a tela de conectar: número a mandar mensagem e status atual.
export const getLinkInfo = async (userId) => {
  const numeroCopiloto = await getSettingValue('WHATSAPP_COPILOT_NUMBER');
  const user = await User.findByPk(userId);
  const activeSub = await Subscription.findOne({ where: { userId, status: 'active' } });
  const plan = activeSub ? await Plan.findOne({ where: { key: activeSub.plan } }) : null;

  // Só reporta como vinculado o número confirmado pelo WhatsApp. Um número apenas
  // digitado no perfil (verified=false) aparece como NÃO conectado, para o usuário
  // fazer o vínculo por OTP.
  const verificado = Boolean(user?.whatsappVerified && user?.whatsapp);

  return {
    copilotNumber: numeroCopiloto || null,
    linkedWhatsapp: verificado ? user.whatsapp : null,
    hasCopilot: Boolean(plan?.permissions?.includes('whatsapp_copilot')),
    hasAudio: Boolean(plan?.permissions?.includes('analise_audio'))
  };
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

    // Número ainda não vinculado E VERIFICADO por nenhuma conta: em vez de
    // recusar, iniciamos a vinculação — geramos um OTP e mandamos de volta. Só
    // conta como vinculado o número confirmado pelo próprio WhatsApp (via OTP);
    // um número digitado no perfil não vale, porque pode estar errado.
    const vinculado = await User.findOne({
      where: { whatsapp: cleanSender, whatsappVerified: true }
    });
    if (!vinculado) {
      return await enviarOtpVinculo(cleanSender);
    }

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
      const errorMsg = `Olá! Sou o assistente de Inteligência Artificial do Closer.IA. 🤖\n\nIdentifiquei que este número de WhatsApp não está cadastrado em nenhuma conta ativa do sistema.\n\nPor favor, faça login na plataforma Closer.IA, acesse o seu Perfil e configure o número de WhatsApp correto para habilitar o modo Copiloto no seu celular!`;
      await wpProvider.sendMessage(senderNumber, errorMsg);
      return { success: false, reason: 'User not found' };
    }

    // 2) Validar se o plano do usuário possui a funcionalidade ativa via permissão 'whatsapp_copilot'
    const activeSub = user.subscriptions?.[0];
    const planKey = activeSub ? activeSub.plan : 'free';
    const plan = await Plan.findOne({ where: { key: planKey } });

    const hasWhatsappAccess = plan && plan.permissions && plan.permissions.includes('whatsapp_copilot');

    if (!hasWhatsappAccess) {
      const freeMsg =
        `👋 Olá, *${user.fullName || 'tudo bem'}*!\n\n` +
        `Sua conta foi reconhecida, mas o seu plano *${plan ? plan.name : 'atual'}* ainda não inclui o *Copiloto no WhatsApp*.\n\n` +
        `Faça um upgrade no painel para liberar o assistente de vendas aqui no seu WhatsApp. 🚀`;
      await wpProvider.sendMessage(senderNumber, freeMsg);
      return { success: false, reason: 'Plan not authorized' };
    }

    // 3) Gerar a resposta com o LLM (Anthropic Claude) usando os prompts do Copiloto e a base de conhecimento de produtos
    const copilotPrompt = await SystemPrompt.findOne({ where: { key: 'simulation_copilot' } });
    const basePrompt = copilotPrompt ? copilotPrompt.content : `Você é o Copiloto de Simulações Closer.IA. Seu objetivo é ajudar o bancário a contornar as piores objeções de vendas de consórcios, empréstimos, seguros, etc. Responda em tom profissional, focado em vendas e gatilhos mentais.`;

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
