import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import {
  sequelize,
  Scenario,
  ProductKnowledge,
  Plan,
  SystemPrompt,
  User,
  UserProfile,
  CommercialOpportunity,
} from '../models/index.js';
import { scenariosData } from '../seeds/scenariosData.js';
import { knowledgeData } from '../seeds/knowledgeData.js';
import { plansData } from '../seeds/plansData.js';
import { promptsData } from '../seeds/promptsData.js';
import { opportunitiesData } from '../seeds/opportunitiesData.js';

async function seedDatabase() {
  console.log('🌱 Iniciando o semeio (seeding) do banco de dados Closer.IA...');
  console.log(`Conectando em: ${process.env.DB_HOST}:${process.env.DB_PORT} (Banco: ${process.env.DB_NAME})`);

  try {
    // Autenticar conexão primeiro
    await sequelize.authenticate();
    console.log('✅ Conexão com o PostgreSQL estabelecida com sucesso.');

    // Limpar dados anteriores para evitar duplicações
    console.log('🔄 Limpando dados antigos das tabelas de cenários, base de conhecimento, planos, prompts e usuários...');
    await Scenario.destroy({ where: {}, cascade: true });
    await ProductKnowledge.destroy({ where: {}, cascade: true });
    await Plan.destroy({ where: {}, cascade: true });
    await SystemPrompt.destroy({ where: {}, cascade: true });
    await CommercialOpportunity.destroy({ where: {}, cascade: true });
    await User.destroy({ where: {}, cascade: true });
    console.log('✅ Tabelas limpas.');

    // Criar usuário administrador padrão
    console.log('📥 Semeando usuário Administrador padrão...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    const adminUser = await User.create({
      email: 'admin@admin.com',
      passwordHash,
      role: 'admin',
      emailVerified: true,
      isActive: true
    });
    await UserProfile.create({
      userId: adminUser.id,
      roleTitle: 'Administrador Principal',
      experienceLevel: 'Especialista',
      bankName: 'Closer.IA'
    });
    console.log('✅ Usuário administrador criado (admin@admin.com / admin123).');

    // Inserir planos padrão
    console.log('📥 Semeando planos de assinatura (Plans)...');
    const createdPlans = await Plan.bulkCreate(plansData);
    console.log(`✅ ${createdPlans.length} planos foram criados.`);

    // Inserir cenários padrão
    console.log('📥 Semeando cenários de simulação (Scenarios)...');
    const createdScenarios = await Scenario.bulkCreate(scenariosData);
    console.log(`✅ ${createdScenarios.length} cenários foram criados.`);

    // Inserir base de conhecimento de produtos
    console.log('📥 Semeando base de conhecimento de produtos (ProductKnowledge)...');
    const createdKnowledge = await ProductKnowledge.bulkCreate(knowledgeData);
    console.log(`✅ ${createdKnowledge.length} tópicos de conhecimento foram criados.`);

    // Inserir prompts do sistema
    console.log('📥 Semeando prompts padrões do sistema (SystemPrompts)...');
    const createdPrompts = await SystemPrompt.bulkCreate(promptsData);
    console.log(`✅ ${createdPrompts.length} prompts padrões foram criados.`);

    console.log('📥 Semeando oportunidades comerciais...');
    const createdOpportunities = await CommercialOpportunity.bulkCreate(opportunitiesData);
    console.log(`✅ ${createdOpportunities.length} oportunidades foram criadas.`);

    console.log('🎉 Semeio concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Falha ao semear o banco de dados:', error);
    process.exit(1);
  }
}

seedDatabase();
