import { SystemSetting } from '../../../models/index.js';

export const listSettings = async () => {
  return await SystemSetting.findAll({
    order: [['key', 'ASC']]
  });
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
