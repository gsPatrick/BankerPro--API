import fetch from 'node-fetch';
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
    return { exists: true, status: data.instance?.state || 'DISCONNECTED', qrcode: data.qrcode || null };
  } catch (error) {
    console.error('Erro ao verificar status da instância no Evolution:', error);
    return { exists: false, status: 'ERROR', error: error.message };
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
        qrcode: true
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
  try {
    const response = await fetch(`${url}/webhook/set/copilot`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        events: ['MESSAGES_UPSERT']
      })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao configurar webhook no Evolution:', error);
  }
};

export const sendMessage = async (number, text) => {
  const { url, apiKey } = await getEvolutionConfig();
  const formattedNumber = number.replace(/\D/g, '');
  
  try {
    const response = await fetch(`${url}/message/sendText/copilot`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: formattedNumber,
        options: {
          delay: 1000,
          presence: 'composing'
        },
        textMessage: {
          text: text
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || response.statusText);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Erro ao enviar mensagem para ${formattedNumber} no Evolution API:`, error);
    throw new AppError(`Falha ao enviar mensagem de WhatsApp: ${error.message}`, 500);
  }
};
