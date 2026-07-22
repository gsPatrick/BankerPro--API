import { SystemSetting } from '../../../models/index.js';

export const listSettings = async () => {
  const keys = [
    'MP_ACCESS_TOKEN',
    'MP_PUBLIC_KEY',
    'ANTHROPIC_API_KEY',
    // Usada só para transcrever o áudio da Análise de Áudio: a API da Anthropic
    // não recebe som. Toda a análise continua no Claude.
    'OPENAI_API_KEY',
    // Z-API (WhatsApp). ID e token vêm da instância no painel da Z-API; o
    // Client-Token é o "token de segurança da conta" (opcional, mas recomendado).
    'ZAPI_INSTANCE_ID',
    'ZAPI_INSTANCE_TOKEN',
    'ZAPI_CLIENT_TOKEN',
    // Número do WhatsApp do Copiloto que o usuário deve mandar mensagem para
    // vincular a conta. Mostrado na tela "Conectar WhatsApp".
    'WHATSAPP_COPILOT_NUMBER',
    'TERMS_OF_USE_TEXT'
  ];

  const dbSettings = await SystemSetting.findAll();
  const dbSettingsMap = {};
  dbSettings.forEach(s => {
    dbSettingsMap[s.key] = s.value;
  });

  const result = [];
  for (const key of keys) {
    let value = dbSettingsMap[key];
    if (value === undefined || value === null) {
      value = process.env[key] || '';
      try {
        await SystemSetting.create({ key, value });
      } catch (err) {
        // Ignora erros de unicidade em acessos paralelos
      }
    }
    result.push({ key, value });
  }

  result.sort((a, b) => a.key.localeCompare(b.key));
  return result;
};

export const saveSetting = async (key, value) => {
  const [setting] = await SystemSetting.findOrCreate({
    where: { key },
    defaults: { value }
  });

  if (setting.value !== value) {
    setting.value = value;
    await setting.save();
  }

  return setting;
};
