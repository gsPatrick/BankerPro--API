import { sequelize, Scenario, SystemPrompt, SystemSetting } from '../../models/index.js';

export const listScenarios = async (req, res, next) => {
  try {
    const list = await Scenario.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const createScenario = async (req, res, next) => {
  try {
    const newScenario = await Scenario.create(req.body);
    res.json({ success: true, data: newScenario });
  } catch (err) {
    next(err);
  }
};

export const updateScenario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const target = await Scenario.findByPk(id);
    if (!target) return res.status(404).json({ error: 'Cenário não encontrado.' });
    await target.update(req.body);
    res.json({ success: true, data: target });
  } catch (err) {
    next(err);
  }
};

export const deleteScenario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const target = await Scenario.findByPk(id);
    if (!target) return res.status(404).json({ error: 'Cenário não encontrado.' });
    await target.destroy();
    res.json({ success: true, message: 'Cenário excluído com sucesso.' });
  } catch (err) {
    next(err);
  }
};

export const listPrompts = async (req, res, next) => {
  try {
    const list = await SystemPrompt.findAll();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const updatePrompt = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { content } = req.body;
    const target = await SystemPrompt.findOne({ where: { key } });
    if (!target) return res.status(404).json({ error: 'Prompt não encontrado.' });
    target.content = content;
    await target.save();
    res.json({ success: true, data: target });
  } catch (err) {
    next(err);
  }
};

export const listSettings = async (req, res, next) => {
  try {
    const list = await SystemSetting.findAll();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const saveSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const [setting, created] = await SystemSetting.findOrCreate({
      where: { key },
      defaults: { value }
    });
    if (!created) {
      setting.value = value;
      await setting.save();
    }
    res.json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
};

export const executeSql = async (req, res, next) => {
  try {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ error: 'Comando SQL não informado.' });
    const [result] = await sequelize.query(sql);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
