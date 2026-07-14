import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import apiRouter from './src/routes/index.js';
import errorMiddleware from './src/middlewares/error.middleware.js';
import { toCamelCase } from './src/utils/case-converter.js';
import { sequelize, User, UserProfile, Plan, Scenario, ProductKnowledge, SystemPrompt } from './src/models/index.js';
import { scenariosData } from './src/seeds/scenariosData.js';
import { knowledgeData } from './src/seeds/knowledgeData.js';
import { plansData } from './src/seeds/plansData.js';
import { promptsData } from './src/seeds/promptsData.js';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_PREFIX = process.env.APP_API_PREFIX || '/api/v1';

// Middlewares Globais
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://bankerpro-bankerpro--front.wohb2u.easypanel.host'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.easypanel.host')) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback para desenvolvimento
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Converter chaves de req.body, req.query, req.params de snake_case para camelCase
app.use((req, res, next) => {
  if (req.body) req.body = toCamelCase(req.body);
  if (req.query) req.query = toCamelCase(req.query);
  if (req.params) req.params = toCamelCase(req.params);
  next();
});

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Montar rotas agregadas
app.use(API_PREFIX, apiRouter);

// Rota raiz para identificação básica
app.get('/', (req, res) => {
  res.json({
    name: 'bankerpro-api',
    version: '1.0.0',
    description: 'BankerPro Backend API',
    status: 'online'
  });
});

// Tratamento de rotas não encontradas (excluindo favicon)
app.use((req, res, next) => {
  if (req.originalUrl === '/favicon.ico') {
    return res.status(204).end();
  }
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.status = 404;
  next(err);
});

// Tratador global de erros (global error handler)
app.use(errorMiddleware);

// ─────────────────────────────────────────────────
//  Boot: Sync DB e Seed se banco estiver vazio
// ─────────────────────────────────────────────────
async function bootDatabase() {
  try {
    console.log('🔌 Verificando conexão com o banco de dados...');
    await sequelize.authenticate();
    console.log('✅ Conexão com o PostgreSQL estabelecida.');

    // Sincronizar modelos (cria tabelas se não existirem, nunca destrói dados existentes)
    console.log('🔄 Sincronizando modelos com o banco de dados...');
    await sequelize.sync({ alter: false });
    console.log('✅ Modelos sincronizados.');

    // Verificar se o banco já tem dados (checando se existe ao menos 1 usuário)
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('🌱 Banco de dados vazio detectado. Realizando seed inicial...');

      // Admin
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
        bankName: 'BankerPro'
      });
      console.log('  ✅ Admin criado (admin@admin.com / admin123)');

      // Planos
      await Plan.bulkCreate(plansData);
      console.log(`  ✅ ${plansData.length} planos criados`);

      // Cenários
      await Scenario.bulkCreate(scenariosData);
      console.log(`  ✅ ${scenariosData.length} cenários criados`);

      // Base de conhecimento
      await ProductKnowledge.bulkCreate(knowledgeData);
      console.log(`  ✅ ${knowledgeData.length} tópicos de conhecimento criados`);

      // Prompts do sistema
      await SystemPrompt.bulkCreate(promptsData);
      console.log(`  ✅ ${promptsData.length} prompts criados`);

      console.log('🎉 Seed inicial concluído com sucesso!');
    } else {
      console.log(`✅ Banco de dados já contém ${userCount} usuário(s). Seed ignorado.`);
    }
  } catch (error) {
    console.error('❌ Falha ao inicializar o banco de dados:', error.message);
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────
//  Iniciar servidor após preparar o banco
// ─────────────────────────────────────────────────
bootDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`📡 API endpoints mounted at ${API_PREFIX}`);
  });
});

export default app;
