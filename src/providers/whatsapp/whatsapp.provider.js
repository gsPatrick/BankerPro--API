import AppError from '../../utils/app-error.js';
import { getSettingValue } from '../../utils/settings-resolver.js';

/**
 * Provider de WhatsApp — Z-API (https://developer.z-api.io).
 *
 * Toda chamada vai para {base}/instances/{ID}/token/{TOKEN}/{rota} e leva o
 * header `Client-Token` (o "token de segurança da conta" do painel da Z-API).
 * Diferente da Evolution, a instância NÃO é criada por API: ela nasce no painel
 * da Z-API e aqui só a consultamos, conectamos e desconectamos.
 */
const getZapiConfig = async () => {
  const base = (await getSettingValue('ZAPI_BASE_URL') || 'https://api.z-api.io').trim().replace(/\/+$/, '');
  const instanceId = (await getSettingValue('ZAPI_INSTANCE_ID') || '').trim();
  const instanceToken = (await getSettingValue('ZAPI_INSTANCE_TOKEN') || '').trim();
  const clientToken = (await getSettingValue('ZAPI_CLIENT_TOKEN') || '').trim();

  if (!instanceId || !instanceToken) {
    throw new AppError('Z-API não configurada: informe ZAPI_INSTANCE_ID e ZAPI_INSTANCE_TOKEN nas Configurações.', 500, 'ZAPI_NOT_CONFIGURED');
  }

  return {
    url: `${base}/instances/${instanceId}/token/${instanceToken}`,
    clientToken
  };
};

// Headers padrão. O Client-Token só vai quando configurado — a conta pode estar
// com o token de segurança desligado, e mandar vazio faria a Z-API recusar.
const montarHeaders = (clientToken) => {
  const headers = { 'Content-Type': 'application/json' };
  if (clientToken) headers['Client-Token'] = clientToken;
  return headers;
};

/**
 * Status da instância. Mantém o mesmo formato que o painel já consome:
 * { exists, status, qrcode: { base64 } }.
 */
export const getInstanceStatus = async () => {
  let url;
  let clientToken;
  try {
    ({ url, clientToken } = await getZapiConfig());
  } catch (error) {
    return { exists: false, status: 'NOT_CONFIGURED', error: error.message };
  }

  try {
    const response = await fetch(`${url}/status`, { headers: montarHeaders(clientToken) });

    if (!response.ok) {
      const detalhe = await response.text().catch(() => '');
      console.warn(`⚠️ /status da Z-API recusado (${response.status}): ${detalhe}`);
      // 4xx aqui é credencial/instância errada — não é "existe mas caiu".
      return { exists: false, status: 'ERROR', error: `${response.status} — ${detalhe.slice(0, 200)}` };
    }

    const data = await response.json();
    const estaConectado = Boolean(data?.connected);
    const status = estaConectado ? 'CONNECTED' : 'DISCONNECTED';

    console.log(`ℹ️ Status da instância Z-API — bruto: ${JSON.stringify(data)} | normalizado: ${status}`);

    let qrcode = null;
    // Só pede o QR quando realmente não está conectado.
    if (!estaConectado) {
      try {
        const qrResponse = await fetch(`${url}/qr-code/image`, { headers: montarHeaders(clientToken) });
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          // A Z-API devolve { value: "data:image/png;base64,..." }; toleramos a
          // string crua e o base64 sem o prefixo data:.
          let base64 = typeof qrData === 'string' ? qrData : (qrData?.value || null);
          if (base64 && !base64.startsWith('data:')) {
            base64 = `data:image/png;base64,${base64}`;
          }
          qrcode = { base64, code: null, pairingCode: null };
          console.log(`ℹ️ QR do WhatsApp (Z-API) — tem base64: ${Boolean(base64)}`);
        } else {
          const detalhe = await qrResponse.text().catch(() => '');
          console.warn(`⚠️ /qr-code/image recusado (${qrResponse.status}): ${detalhe}`);
        }
      } catch (err) {
        console.error('Erro ao buscar QR code na Z-API:', err.message);
      }
    }

    return { exists: true, status, qrcode };
  } catch (error) {
    console.error('Erro ao verificar status da instância na Z-API:', error);
    return { exists: false, status: 'ERROR', error: error.message };
  }
};

/**
 * Número (MSISDN) da conta conectada. Na Z-API vem do endpoint /device.
 * Retorna só os dígitos, ou null se não estiver conectada.
 */
export const getConnectedNumber = async () => {
  try {
    const { url, clientToken } = await getZapiConfig();
    const response = await fetch(`${url}/device`, { headers: montarHeaders(clientToken) });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    const bruto = data?.phone || data?.me?.user || null;
    if (!bruto) return null;
    const digitos = String(bruto).split('@')[0].replace(/\D/g, '');
    return digitos || null;
  } catch (error) {
    console.error('Erro ao buscar o número conectado na Z-API:', error.message);
    return null;
  }
};

/**
 * Na Z-API a instância é criada/paga no painel, não por API. Aqui só
 * verificamos se as credenciais respondem — o "conectar" de verdade é ler o QR
 * Code que o /status já devolve.
 */
export const createInstance = async () => {
  const info = await getInstanceStatus();
  return {
    managed: false,
    message: 'A instância da Z-API é criada no painel da Z-API. Leia o QR Code para conectar o número.',
    ...info
  };
};

/** Desconecta o número da instância (equivale ao "logout" do WhatsApp Web). */
export const deleteInstance = async () => {
  const { url, clientToken } = await getZapiConfig();
  try {
    const response = await fetch(`${url}/disconnect`, {
      method: 'GET',
      headers: montarHeaders(clientToken)
    });
    const texto = await response.text();
    if (!response.ok) {
      throw new Error(`${response.status} — ${texto}`);
    }
    try {
      return JSON.parse(texto);
    } catch {
      return { ok: true, raw: texto };
    }
  } catch (error) {
    throw new AppError(`Falha ao desconectar a instância na Z-API: ${error.message}`, 500);
  }
};

/**
 * Registra a URL do nosso webhook na Z-API.
 *
 * A Z-API só aceita webhook em HTTPS. Usamos `update-webhook-received` (só
 * mensagens recebidas), que é o que o Copiloto precisa; se a conta/versão não
 * expuser essa rota, caímos em `update-every-webhooks` — nesse caso chegam
 * também callbacks de entrega/status, que o handler descarta pelo `type`.
 */
export const setWebhook = async (webhookUrl) => {
  const { url, clientToken } = await getZapiConfig();

  if (!/^https:\/\//i.test(webhookUrl)) {
    console.error(`❌ A Z-API só aceita webhook HTTPS. URL recusada: ${webhookUrl}`);
    return { ok: false, error: 'WEBHOOK_MUST_BE_HTTPS' };
  }

  const tentar = async (rota, corpo) => {
    const response = await fetch(`${url}/${rota}`, {
      method: 'PUT',
      headers: montarHeaders(clientToken),
      body: JSON.stringify(corpo)
    });
    const texto = await response.text();
    return { ok: response.ok, status: response.status, texto };
  };

  try {
    // notifySentByMe: false — não queremos eco das mensagens que nós mesmos
    // enviamos (isso geraria loop de resposta do Copiloto).
    let r = await tentar('update-webhook-received', { value: webhookUrl, notifySentByMe: false });
    if (!r.ok) {
      console.warn(`⚠️ update-webhook-received recusado (${r.status}): ${r.texto}. Tentando update-every-webhooks...`);
      r = await tentar('update-every-webhooks', { value: webhookUrl, notifySentByMe: false });
    }

    if (r.ok) {
      console.log(`🔗 Webhook do WhatsApp (Z-API) configurado em: ${webhookUrl} | resposta: ${r.texto?.slice(0, 400)}`);
    } else {
      console.error(`❌ Falha ao configurar o webhook do WhatsApp na Z-API (${r.status}): ${r.texto}`);
    }
    return { ok: r.ok, status: r.status };
  } catch (error) {
    console.error('❌ Erro de comunicação ao configurar o webhook na Z-API:', error.message);
    return { ok: false, error: error.message };
  }
};

/**
 * Garante o 9º dígito em celular brasileiro. Números chegam do WhatsApp com 12
 * dígitos (55 + DDD + 8), mas quem ENTREGA de verdade costuma ser o de 13 dígitos
 * (com o 9 depois do DDD). Só mexe em celular BR (começa com 55, 12 dígitos, e o
 * primeiro dígito do assinante é 6-9); qualquer outro número passa intacto.
 */
const garantirNoveBrasil = (digitos) => {
  if (/^55\d{2}[6-9]\d{7}$/.test(digitos)) {
    return `${digitos.slice(0, 4)}9${digitos.slice(4)}`;
  }
  return digitos;
};

export const sendMessage = async (number, text) => {
  const { url, clientToken } = await getZapiConfig();
  const numeroCru = String(number).replace(/\D/g, '');
  const formattedNumber = garantirNoveBrasil(numeroCru);
  if (formattedNumber !== numeroCru) {
    console.log(`🔢 9º dígito ajustado: ${numeroCru} → ${formattedNumber}`);
  }

  // delayMessage/delayTyping simulam digitação: reduzem o risco de o WhatsApp
  // marcar o número como robô. Os valores são em SEGUNDOS na Z-API (1 a 15).
  const corpo = {
    phone: formattedNumber,
    message: text,
    delayMessage: 2,
    delayTyping: 1
  };

  try {
    const response = await fetch(`${url}/send-text`, {
      method: 'POST',
      headers: montarHeaders(clientToken),
      body: JSON.stringify(corpo)
    });
    const texto = await response.text();

    if (!response.ok) {
      throw new Error(`${response.status} — ${texto}`);
    }

    // Um 2xx só diz que a Z-API aceitou; o corpo traz zaapId/messageId, que é o
    // que confirma o enfileiramento de verdade.
    console.log(`📤 send-text para ${formattedNumber} — status ${response.status} | resposta: ${texto?.slice(0, 400)}`);
    return { ok: true };
  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem para ${formattedNumber} na Z-API:`, error.message);
    throw new AppError(`Falha ao enviar mensagem de WhatsApp: ${error.message}`, 500, 'WHATSAPP_SEND_FAILED');
  }
};

/**
 * Envia um código de verificação com o botão nativo "Copiar código" do WhatsApp.
 *
 * É o mesmo componente que bancos usam: o usuário toca no botão e o código vai
 * para a área de transferência, sem precisar selecionar o texto na mão.
 *
 * O botão depende de a conta estar apta a enviar botões (ver o status de botões
 * no painel da Z-API). Se a Z-API recusar, caímos no texto simples — o usuário
 * ainda recebe o código, só sem o atalho de copiar.
 */
export const sendOtpCode = async (number, { code, message, buttonText = 'Copiar código' }) => {
  const { url, clientToken } = await getZapiConfig();
  const numeroCru = String(number).replace(/\D/g, '');
  const formattedNumber = garantirNoveBrasil(numeroCru);

  try {
    const response = await fetch(`${url}/send-button-otp`, {
      method: 'POST',
      headers: montarHeaders(clientToken),
      body: JSON.stringify({
        phone: formattedNumber,
        message,
        code,
        buttonText
      })
    });
    const texto = await response.text();

    // Um 2xx sem zaapId significa que a Z-API respondeu mas não enfileirou —
    // tratamos como falha para cair no texto simples.
    if (!response.ok || !texto.includes('zaapId')) {
      throw new Error(`${response.status} — ${texto}`);
    }

    console.log(`📤 send-button-otp para ${formattedNumber} — status ${response.status} | resposta: ${texto?.slice(0, 400)}`);
    return { ok: true, withButton: true };
  } catch (error) {
    console.warn(`⚠️ Botão de copiar código recusado (${error.message}). Enviando o código como texto simples.`);
    await sendMessage(number, `${message}\n\n\`\`\`${code}\`\`\``);
    return { ok: true, withButton: false };
  }
};

/**
 * Baixa a mídia de uma mensagem recebida.
 *
 * Na Z-API não existe o passo de descriptografia da Evolution: o webhook já
 * entrega uma URL pública e temporária (`audio.audioUrl`), válida por 30 dias.
 * Basta buscar os bytes.
 *
 * @param {string|{audioUrl?: string, url?: string}} media  a URL da mídia (ou o objeto de áudio do webhook)
 * @returns {Promise<{buffer: Buffer, mimetype: string}>}
 */
export const downloadMedia = async (media) => {
  const mediaUrl = typeof media === 'string' ? media : (media?.audioUrl || media?.url || null);

  if (!mediaUrl) {
    console.error('downloadMedia chamado sem URL de mídia:', JSON.stringify(media).slice(0, 300));
    throw new AppError('Não foi possível localizar o áudio enviado no WhatsApp.', 502, 'WHATSAPP_MEDIA_URL_MISSING');
  }

  const response = await fetch(mediaUrl);

  if (!response.ok) {
    const detalhe = await response.text().catch(() => '');
    console.error('Erro ao baixar mídia do WhatsApp (Z-API):', response.status, detalhe.slice(0, 300));
    throw new AppError('Não foi possível baixar o áudio do WhatsApp.', 502, 'WHATSAPP_MEDIA_DOWNLOAD_FAILED');
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (!buffer.length) {
    throw new AppError('O áudio recebido veio vazio do WhatsApp.', 502, 'WHATSAPP_MEDIA_EMPTY');
  }

  // O header pode vir com parâmetros ("audio/ogg; codecs=opus") — guardamos só o tipo.
  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim();
  const mimetype = (typeof media === 'object' && media?.mimeType ? String(media.mimeType).split(';')[0].trim() : '')
    || contentType
    || 'audio/ogg';

  return { buffer, mimetype };
};
