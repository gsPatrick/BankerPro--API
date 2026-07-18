import AppError from '../../utils/app-error.js';
import { getSettingValue } from '../../utils/settings-resolver.js';

const getEvolutionConfig = async () => {
  const url = await getSettingValue('EVOLUTION_API_URL') || 'https://bankerpro-evolution-api.wohb2u.easypanel.host';
  const apiKey = await getSettingValue('EVOLUTION_API_KEY') || '429683C4C977415CAAFCCE10F7D57E11';
  return { url, apiKey };
};

export const getInstanceStatus = async () => {
  const { url, apiKey } = await getEvolutionConfig();
  try {
    const response = await fetch(`${url}/instance/connectionState/copilot`, {
      headers: {
        'apikey': apiKey
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { exists: false, status: 'NOT_FOUND' };
      }
      throw new Error(`State error: ${response.statusText}`);
    }

    const data = await response.json();

    // O estado vem em caminhos diferentes conforme a versão da Evolution. Lemos
    // de todos os prováveis e normalizamos: "open"/"connected"/"online" = conectado.
    const rawState = data.instance?.state
      ?? data.state
      ?? data.instance?.status
      ?? data.status
      ?? null;

    const estaConectado = ['open', 'connected', 'online'].includes(String(rawState || '').toLowerCase());
    const status = estaConectado ? 'CONNECTED' : (rawState ? String(rawState).toUpperCase() : 'DISCONNECTED');

    // Loga a resposta crua para diagnosticar diferenças de versão da Evolution.
    console.log(`ℹ️ Status da instância WhatsApp — bruto: ${JSON.stringify(data)} | normalizado: ${status}`);

    let qrcode = null;
    // Só busca o QR Code se realmente NÃO estiver conectado.
    if (!estaConectado) {
      try {
        const connectResponse = await fetch(`${url}/instance/connect/copilot`, {
          headers: {
            'apikey': apiKey
          }
        });
        if (connectResponse.ok) {
          const connectData = await connectResponse.json();
          let base64 = connectData.base64 || connectData.qrcode?.base64 || connectData.qr || null;
          if (base64 && !base64.startsWith('data:')) {
            base64 = `data:image/png;base64,${base64}`;
          }
          const pairingCode = connectData.pairingCode || connectData.qrcode?.pairingCode || null;
          qrcode = {
            base64,
            code: connectData.code || connectData.qrcode?.code || null,
            pairingCode
          };
          // Loga se o QR/código de pareamento veio, sem despejar o base64 inteiro.
          console.log(`ℹ️ QR do WhatsApp — campos: ${Object.keys(connectData).join(', ')} | tem base64: ${Boolean(base64)} | pairingCode: ${pairingCode || '—'}`);
        } else {
          const detalhe = await connectResponse.text().catch(() => '');
          console.warn(`⚠️ /instance/connect recusado (${connectResponse.status}): ${detalhe}`);
        }
      } catch (err) {
        console.error('Erro ao buscar QR code no Evolution connect:', err);
      }
    }

    return { exists: true, status, qrcode };
  } catch (error) {
    console.error('Erro ao verificar status da instância no Evolution:', error);
    return { exists: false, status: 'ERROR', error: error.message };
  }
};

/**
 * Descobre o número (MSISDN) da conta que está conectada na instância "copilot".
 * A Evolution expõe isso no `ownerJid`/`owner` de fetchInstances quando conectada.
 * Retorna só os dígitos, ou null se não estiver conectada / não encontrado.
 */
export const getConnectedNumber = async () => {
  const { url, apiKey } = await getEvolutionConfig();
  try {
    const response = await fetch(`${url}/instance/fetchInstances`, {
      headers: { 'apikey': apiKey }
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();

    // O formato varia entre versões: pode vir um array direto ou { instances: [] },
    // e cada item pode ter os campos soltos ou aninhados em "instance".
    const lista = Array.isArray(data) ? data : (data.instances || data.data || []);
    const alvo = (Array.isArray(lista) ? lista : [])
      .map((item) => item?.instance || item)
      .find((inst) => (inst?.instanceName || inst?.name) === 'copilot');

    if (!alvo) {
      return null;
    }

    const bruto = alvo.ownerJid || alvo.owner || alvo.wuid || alvo.number || null;
    if (!bruto) {
      return null;
    }
    const digitos = String(bruto).split('@')[0].replace(/\D/g, '');
    return digitos || null;
  } catch (error) {
    console.error('Erro ao buscar o número conectado no Evolution:', error.message);
    return null;
  }
};

export const createInstance = async () => {
  const { url, apiKey } = await getEvolutionConfig();
  try {
    const response = await fetch(`${url}/instance/create`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceName: 'copilot',
        token: 'copilot_secure_token_123',
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    throw new AppError(`Falha ao criar instância no Evolution API: ${error.message}`, 500);
  }
};

export const deleteInstance = async () => {
  const { url, apiKey } = await getEvolutionConfig();
  try {
    const response = await fetch(`${url}/instance/delete/copilot`, {
      method: 'DELETE',
      headers: {
        'apikey': apiKey
      }
    });
    const data = await response.json();
    return data;
  } catch (error) {
    throw new AppError(`Falha ao remover instância no Evolution API: ${error.message}`, 500);
  }
};

export const setWebhook = async (webhookUrl) => {
  const { url, apiKey } = await getEvolutionConfig();

  // Formatos aceitos variam entre versões da Evolution: as v2 esperam o corpo
  // aninhado em "webhook", as v1 esperam plano. Tentamos o aninhado e, se a
  // Evolution recusar, caímos no plano — assim funciona nas duas.
  const corpoV2 = {
    webhook: {
      enabled: true,
      url: webhookUrl,
      webhookByEvents: false,
      events: ['MESSAGES_UPSERT']
    }
  };
  const corpoV1 = {
    enabled: true,
    url: webhookUrl,
    webhookByEvents: false,
    events: ['MESSAGES_UPSERT']
  };

  const tentar = async (corpo) => {
    const response = await fetch(`${url}/webhook/set/copilot`, {
      method: 'POST',
      headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo)
    });
    const texto = await response.text();
    return { ok: response.ok, status: response.status, texto };
  };

  try {
    let r = await tentar(corpoV2);
    if (!r.ok) {
      console.warn(`⚠️ Webhook (formato v2) recusado (${r.status}): ${r.texto}. Tentando formato v1...`);
      r = await tentar(corpoV1);
    }

    if (r.ok) {
      // Loga o que a Evolution guardou — confirma se os eventos de mensagem
      // (MESSAGES_UPSERT) ficaram mesmo inscritos, que é o que dispara o webhook.
      console.log(`🔗 Webhook do WhatsApp configurado em: ${webhookUrl} | resposta: ${r.texto?.slice(0, 400)}`);
    } else {
      console.error(`❌ Falha ao configurar o webhook do WhatsApp (${r.status}): ${r.texto}`);
    }
    return { ok: r.ok, status: r.status };
  } catch (error) {
    console.error('❌ Erro de comunicação ao configurar o webhook no Evolution:', error.message);
    return { ok: false, error: error.message };
  }
};

/**
 * Pergunta à Evolution qual é o JID real de um número. Isso corrige o problema do
 * 9º dígito no Brasil: o número pode chegar com 12 dígitos (sem o 9), mas o que
 * está registrado no WhatsApp tem 13 (com o 9). A Evolution devolve o JID canônico,
 * que é para onde a mensagem realmente entrega. Retorna só os dígitos, ou null se
 * não conseguir resolver (aí o chamador usa o número como veio).
 */
const resolverNumeroReal = async (url, apiKey, numeroDigitos) => {
  try {
    const response = await fetch(`${url}/chat/whatsappNumbers/copilot`, {
      method: 'POST',
      headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ numbers: [numeroDigitos] })
    });
    if (!response.ok) {
      const detalhe = await response.text().catch(() => '');
      console.warn(`⚠️ Checagem de número (whatsappNumbers) indisponível (${response.status}): ${detalhe.slice(0, 200)}`);
      return null;
    }
    const data = await response.json();
    console.log(`🔎 whatsappNumbers p/ ${numeroDigitos} — resposta: ${JSON.stringify(data).slice(0, 300)}`);
    const lista = Array.isArray(data) ? data : (data?.numbers || data?.data || []);
    const item = (Array.isArray(lista) ? lista : [])[0];
    // Alguns retornos trazem exists:false para número sem WhatsApp — nesse caso não força.
    if (!item || item.exists === false) {
      return null;
    }
    const jid = item.jid || item.number || null;
    if (!jid) {
      return null;
    }
    const soDigitos = String(jid).split('@')[0].replace(/\D/g, '');
    return soDigitos || null;
  } catch (error) {
    console.error('Erro ao resolver o número real no Evolution:', error.message);
    return null;
  }
};

export const sendMessage = async (number, text) => {
  const { url, apiKey } = await getEvolutionConfig();
  const numeroCru = number.replace(/\D/g, '');

  // Resolve o JID canônico (corrige o 9º dígito). Se não der, usa o número como veio.
  const resolvido = await resolverNumeroReal(url, apiKey, numeroCru);
  const formattedNumber = resolvido || numeroCru;
  if (resolvido && resolvido !== numeroCru) {
    console.log(`🔁 Número ${numeroCru} resolvido para ${formattedNumber} (correção de 9º dígito/JID).`);
  }

  // O corpo do sendText mudou entre versões da Evolution: a v2 espera { number,
  // text } plano; a v1 espera o texto aninhado em textMessage. Tentamos a v2
  // primeiro e, se recusada, caímos na v1 — assim funciona nas duas.
  const corpoV2 = { number: formattedNumber, text };
  const corpoV1 = {
    number: formattedNumber,
    options: { delay: 1000, presence: 'composing' },
    textMessage: { text }
  };

  const tentar = async (corpo) => {
    const response = await fetch(`${url}/message/sendText/copilot`, {
      method: 'POST',
      headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo)
    });
    const texto = await response.text();
    return { ok: response.ok, status: response.status, texto };
  };

  try {
    let formato = 'v2';
    let r = await tentar(corpoV2);
    if (!r.ok) {
      console.warn(`⚠️ sendText (formato v2) recusado (${r.status}): ${r.texto}. Tentando formato v1...`);
      formato = 'v1';
      r = await tentar(corpoV1);
    }

    if (!r.ok) {
      throw new Error(`${r.status} — ${r.texto}`);
    }
    // Loga o corpo da resposta: um 2xx só confirma que a Evolution aceitou; o corpo
    // mostra se a mensagem foi de fato enfileirada/enviada (key, status) ou se veio
    // algo estranho apesar do 2xx.
    console.log(`📤 sendText (${formato}) para ${formattedNumber} — status ${r.status} | resposta: ${r.texto?.slice(0, 400)}`);
    return { ok: true };
  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem para ${formattedNumber} no Evolution:`, error.message);
    throw new AppError(`Falha ao enviar mensagem de WhatsApp: ${error.message}`, 500, 'WHATSAPP_SEND_FAILED');
  }
};

/**
 * Baixa a mídia de uma mensagem recebida. O webhook entrega só os metadados do
 * áudio criptografado — os bytes precisam ser pedidos à Evolution, que descriptografa.
 *
 * @param {object} messageKey  o objeto `key` da mensagem, vindo do payload do webhook
 * @returns {Promise<{buffer: Buffer, mimetype: string}>}
 */
export const downloadMedia = async (messageKey) => {
  const { url, apiKey } = await getEvolutionConfig();

  const response = await fetch(`${url}/chat/getBase64FromMediaMessage/copilot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey
    },
    body: JSON.stringify({
      message: { key: messageKey },
      convertToMp4: false
    })
  });

  if (!response.ok) {
    const detalhe = await response.text().catch(() => '');
    console.error('Erro ao baixar mídia do WhatsApp:', response.status, detalhe);
    throw new AppError('Não foi possível baixar o áudio do WhatsApp.', 502, 'WHATSAPP_MEDIA_DOWNLOAD_FAILED');
  }

  const data = await response.json();
  const base64 = data?.base64 || data?.media || data?.buffer;

  if (!base64) {
    console.error('Resposta inesperada ao baixar mídia do WhatsApp:', JSON.stringify(data).slice(0, 300));
    throw new AppError('O áudio recebido veio vazio do WhatsApp.', 502, 'WHATSAPP_MEDIA_EMPTY');
  }

  return {
    buffer: Buffer.from(base64, 'base64'),
    mimetype: data?.mimetype || 'audio/ogg'
  };
};
