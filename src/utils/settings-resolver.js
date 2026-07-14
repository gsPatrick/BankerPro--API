import { SystemSetting } from '../models/index.js';

export const getSettingValue = async (key) => {
  try {
    const setting = await SystemSetting.findOne({ where: { key } });
    if (setting && setting.value !== null && setting.value !== undefined && setting.value.trim() !== '') {
      return setting.value;
    }
  } catch (error) {
    console.error(`Falha ao carregar configuração do banco para chave ${key}:`, error);
  }
  return process.env[key];
};
