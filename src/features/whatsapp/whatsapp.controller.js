import * as whatsappService from './whatsapp.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess } from '../../utils/api-response.js';
import AppError from '../../utils/app-error.js';

export const getStatus = catchAsync(async (req, res, next) => {
  // Constrói a URL do app dinamicamente se o webhook precisar ser atualizado
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const appUrl = `${protocol}://${req.get('host')}`;
  
  const status = await whatsappService.getStatus(appUrl);
  return sendSuccess(res, status, 'Status da conexão do WhatsApp obtida.');
});

export const connect = catchAsync(async (req, res, next) => {
  const result = await whatsappService.connectInstance();
  return sendSuccess(res, result, 'Solicitação de conexão enviada.');
});

export const disconnect = catchAsync(async (req, res, next) => {
  const result = await whatsappService.disconnectInstance();
  return sendSuccess(res, result, 'Instância desconectada.');
});

export const webhook = catchAsync(async (req, res, next) => {
  // A Z-API envia as notificações de mensagem neste webhook.
  //
  // Respondemos 200 na hora e processamos depois: a resposta do Copiloto passa
  // por uma chamada ao Claude, que leva alguns segundos. Se segurássemos o
  // webhook até lá, a Z-API poderia estourar o timeout e REENVIAR o evento —
  // gerando resposta duplicada no chat e cobrança de IA em dobro.
  const payload = req.body;
  res.json({ success: true, received: true });

  whatsappService.handleIncomingWebhook(payload).catch((error) => {
    console.error('Erro não tratado ao processar webhook do WhatsApp:', error);
  });
});

// Tela "Conectar WhatsApp": número para mandar mensagem + status do vínculo.
export const getLinkInfo = catchAsync(async (req, res) => {
  const info = await whatsappService.getLinkInfo(req.user.id);
  return sendSuccess(res, info, 'Informações de conexão do WhatsApp.');
});

// Vincula o número ao usuário a partir do código recebido no WhatsApp.
export const verifyCode = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  if (!code) {
    return next(new AppError('Informe o código recebido no WhatsApp.', 400, 'BAD_REQUEST'));
  }
  const result = await whatsappService.verifyLinkCode(req.user.id, code);
  return sendSuccess(res, result, 'WhatsApp vinculado com sucesso.');
});
