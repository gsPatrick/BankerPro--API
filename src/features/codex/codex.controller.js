import { sequelize, Scenario, SystemPrompt, SystemSetting, ProductKnowledge } from '../../models/index.js';
import * as whatsappService from '../whatsapp/whatsapp.service.js';
import * as adminSettingsService from '../admin/services/admin-settings.service.js';
import * as opportunityService from '../commercial-opportunity/commercial-opportunity.service.js';

export const ping = (req, res) => {
  res.json({
    success: true,
    message: 'Codex Agent connected successfully.',
    timestamp: new Date().toISOString()
  });
};

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
    const list = await adminSettingsService.listSettings();
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

// --- PRODUCT KNOWLEDGE (COPILOT BASE) ---
export const listKnowledge = async (req, res, next) => {
  try {
    const list = await ProductKnowledge.findAll();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const createKnowledge = async (req, res, next) => {
  try {
    const topic = await ProductKnowledge.create(req.body);
    res.json({ success: true, data: topic });
  } catch (err) {
    next(err);
  }
};

export const updateKnowledge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const target = await ProductKnowledge.findByPk(id);
    if (!target) return res.status(404).json({ error: 'Tópico de conhecimento não encontrado.' });
    await target.update(req.body);
    res.json({ success: true, data: target });
  } catch (err) {
    next(err);
  }
};

export const deleteKnowledge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const target = await ProductKnowledge.findByPk(id);
    if (!target) return res.status(404).json({ error: 'Tópico de conhecimento não encontrado.' });
    await target.destroy();
    res.json({ success: true, message: 'Tópico de conhecimento removido.' });
  } catch (err) {
    next(err);
  }
};

// --- COMMERCIAL OPPORTUNITIES ---
export const listOpportunities = async (req, res, next) => {
  try {
    const { product, channel, tag, status, search } = req.query;
    const list = await opportunityService.listOpportunities({
      product,
      channel,
      tag,
      status,
      search,
      includeInactive: true,
    });
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const createOpportunity = async (req, res, next) => {
  try {
    const opportunity = await opportunityService.createOpportunity(req.body);
    res.json({ success: true, data: opportunity });
  } catch (err) {
    next(err);
  }
};

export const updateOpportunity = async (req, res, next) => {
  try {
    const opportunity = await opportunityService.updateOpportunity(
      req.params.id,
      req.body
    );
    res.json({ success: true, data: opportunity });
  } catch (err) {
    next(err);
  }
};

export const deleteOpportunity = async (req, res, next) => {
  try {
    await opportunityService.deleteOpportunity(req.params.id);
    res.json({ success: true, message: 'Oportunidade comercial removida.' });
  } catch (err) {
    next(err);
  }
};

// --- CODEX TERMS ---
export const getTerms = async (req, res, next) => {
  try {
    const terms = await SystemSetting.findOne({ where: { key: 'TERMS_OF_USE_TEXT' } });
    res.json({ success: true, data: terms });
  } catch (err) {
    next(err);
  }
};

export const updateTerms = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Texto dos termos não informado.' });
    const [setting] = await SystemSetting.findOrCreate({ where: { key: 'TERMS_OF_USE_TEXT' } });
    await setting.update({ value: text });
    res.json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
};

// --- CODEX WHATSAPP ---
export const getWhatsappStatus = async (req, res, next) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const appUrl = `${protocol}://${req.get('host')}`;
    const status = await whatsappService.getStatus(appUrl);
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
};

export const connectWhatsapp = async (req, res, next) => {
  try {
    const result = await whatsappService.connectInstance();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const disconnectWhatsapp = async (req, res, next) => {
  try {
    const result = await whatsappService.disconnectInstance();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
