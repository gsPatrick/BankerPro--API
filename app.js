import cluster from 'node:cluster';
import os from 'node:os';
import express from 'express';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import apiRouter from './src/routes/index.js';
import errorMiddleware from './src/middlewares/error.middleware.js';
import { toCamelCase } from './src/utils/case-converter.js';
import { isQueueEnabled, closeRedisConnection, closeCacheConnection } from './src/config/redis.js';
import { startAudioWorker, stopAudioWorker } from './src/workers/audio.worker.js';
import { closeAudioQueue } from './src/queues/audio.queue.js';
import {
  sequelize,
  User,
  UserProfile,
  Plan,
  Subscription,
  Scenario,
  ProductKnowledge,
  SystemPrompt,
  SystemSetting,
  CommercialOpportunity,
} from './src/models/index.js';
import { scenariosData } from './src/seeds/scenariosData.js';
import { knowledgeData } from './src/seeds/knowledgeData.js';
import { plansData } from './src/seeds/plansData.js';
import { promptsData } from './src/seeds/promptsData.js';
import { opportunitiesData } from './src/seeds/opportunitiesData.js';
import { ADMIN_PLAN_KEY } from './src/config/constants.js';
import * as whatsappService from './src/features/whatsapp/whatsapp.service.js';

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
// Comprime as respostas (gzip): payloads menores, mais rápidos para o cliente e
// menos banda gasta.
app.use(compression());
app.use(express.json());
app.use('/uploads', express.static(path.resolve('uploads')));

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
    description: 'Closer.IA Backend API',
    status: 'online'
  });
});

// Health check que realmente verifica as dependências (banco e, se houver, fila).
// Serve para o painel/monitor saber se a instância está saudável de verdade, não
// só se o processo respondeu.
app.get('/health', async (req, res) => {
  const health = { status: 'ok', db: 'ok', queue: isQueueEnabled() ? 'enabled' : 'disabled' };
  try {
    await sequelize.authenticate();
  } catch {
    health.status = 'degraded';
    health.db = 'down';
  }
  res.status(health.status === 'ok' ? 200 : 503).json(health);
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

    // Sincronizar modelos (cria ou altera tabelas se necessário, nunca destrói dados existentes)
    console.log('🔄 Sincronizando modelos com o banco de dados...');
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados.');

    // Garantir sincronização automática e atualizada dos planos
    console.log('🌱 Sincronizando planos...');
    for (const plan of plansData) {
      await Plan.upsert(plan);
    }
    // Remover planos obsoletos e suas inscrições associadas para evitar quebra de FK
    await Subscription.destroy({
      where: {
        plan: ['free', 'team']
      }
    });
    await Plan.destroy({
      where: {
        key: ['free', 'team']
      }
    });
    console.log('✅ Planos sincronizados.');

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
        bankName: 'Closer.IA'
      });
      console.log('  ✅ Admin criado (admin@admin.com / admin123)');

      // Planos (sincronizados no boot acima)

      // Cenários
      await Scenario.bulkCreate(scenariosData);
      console.log(`  ✅ ${scenariosData.length} cenários criados`);

      // Base de conhecimento
      await ProductKnowledge.bulkCreate(knowledgeData);
      console.log(`  ✅ ${knowledgeData.length} tópicos de conhecimento criados`);

      // Prompts do sistema
      await SystemPrompt.bulkCreate(promptsData);
      console.log(`  ✅ ${promptsData.length} prompts criados`);

      // Oportunidades comerciais
      await CommercialOpportunity.bulkCreate(opportunitiesData);
      console.log(`  ✅ ${opportunitiesData.length} oportunidades comerciais criadas`);

      console.log('🎉 Seed inicial concluído com sucesso!');
    } else {
      console.log(`✅ Banco de dados já contém ${userCount} usuário(s). Seed ignorado.`);
    }

    // Garantir que todo admin tenha o plano interno ilimitado. Sem assinatura ativa
    // o middleware de limite trata o admin como plano gratuito e o corta em 10 simulações.
    const admins = await User.findAll({ where: { role: 'admin' } });
    for (const admin of admins) {
      const activeSub = await Subscription.findOne({
        where: { userId: admin.id, status: 'active' }
      });
      if (activeSub) continue;
      await Subscription.create({
        userId: admin.id,
        plan: ADMIN_PLAN_KEY,
        status: 'active',
        paymentMethod: 'internal',
        startsAt: new Date(),
        endsAt: null
      });
      console.log(`🌱 Plano interno vinculado ao admin ${admin.email}.`);
    }

    // Garantir que prompts novos cheguem a bases já existentes. O seed acima só
    // roda em banco vazio, então sem isto um prompt adicionado depois nunca
    // existiria em produção. Só cria o que falta: o texto editado pelo admin
    // nunca é sobrescrito.
    for (const prompt of promptsData) {
      const [, created] = await SystemPrompt.findOrCreate({
        where: { key: prompt.key },
        defaults: prompt
      });
      if (created) {
        console.log(`🌱 Prompt "${prompt.key}" criado.`);
      }
    }

    // Garantir seed de oportunidades em bases já existentes
    const opportunityCount = await CommercialOpportunity.count();
    if (opportunityCount === 0) {
      await CommercialOpportunity.bulkCreate(opportunitiesData);
      console.log(
        `🌱 ${opportunitiesData.length} oportunidade(s) comercial(is) semeada(s).`
      );
    }

    // Garantir que a configuração dos Termos de Uso e LGPD exista no banco de dados para edição pelo Admin
    await SystemSetting.findOrCreate({
      where: { key: 'TERMS_OF_USE_TEXT' },
      defaults: {
        value: `TERMOS DE USO E POLÍTICA DE PRIVACIDADE (LGPD)

1. Proteção de dados e LGPD
Você deve utilizar a plataforma respeitando a Lei Geral de Proteção de Dados Pessoais. Não insira dados pessoais reais de clientes sem autorização, necessidade legítima e finalidade adequada. Sempre que possível, utilize dados fictícios, anonimizados ou resumidos.

2. Dados sensíveis e sigilosos
É proibido inserir senhas, documentos completos, dados bancários completos, informações médicas, dados sensíveis, prints de sistemas internos, dados de conta, score interno, propostas confidenciais ou qualquer informação protegida por sigilo bancário/comercial.

3. Uso da inteligência artificial
As respostas da IA são sugestões de treinamento e apoio comercial. O usuário deve revisar, adaptar e validar qualquer abordagem antes de usar com clientes reais. A IA pode cometer erros e não deve ser tratada como decisão final.

4. Produtos financeiros permitidos na plataforma
A plataforma foi criada para apoiar negociações de produtos bancários como consórcio, seguro de vida, capitalização, cartão de crédito, empréstimo pessoal, consignado e relacionamento bancário. A plataforma não deve ser usada para recomendação de investimentos, promessa de rentabilidade, promessa de aprovação de crédito ou garantia de contemplação.

5. Conduta comercial responsável
O usuário deve agir com transparência, ética e responsabilidade. É proibido prometer crédito futuro, aprovação garantida, aumento de score, contemplação em consórcio, rentabilidade, vantagem inexistente ou qualquer condição que dependa de análise da instituição financeira.

6. Adequação ao perfil do cliente
Toda abordagem comercial deve considerar o perfil, renda, momento financeiro, capacidade de pagamento, objetivo e necessidade do cliente. O usuário não deve empurrar produtos inadequados, gerar endividamento irresponsável ou omitir informações relevantes.

7. Normas internas e regulatórias
O usuário é responsável por respeitar as normas da instituição onde atua, políticas internas, regras de compliance, LGPD, sigilo bancário, Código de Defesa do Consumidor e boas práticas do mercado financeiro, incluindo diretrizes aplicáveis de entidades como FEBRABAN, ANBIMA e órgãos reguladores quando cabível.

8. Responsabilidade pelo uso
O Closer.IA é uma ferramenta de apoio. A responsabilidade pelo atendimento, oferta, comunicação, registro e fechamento comercial é do usuário e/ou da instituição responsável pela operação.`
      }
    });

    console.log('✅ Configuração de Termos de Uso ativa no banco.');
  } catch (error) {
    console.error('❌ Falha ao inicializar o banco de dados:', error.message);
    process.exit(1);
  }
}

// Prepara o WhatsApp automaticamente no boot: garante a instância criada, registra
// o webhook apontando de volta para a API e captura o número conectado. Assim, depois
// que o admin escaneia o QR, o sistema faz o resto sozinho — sem depender de alguém
// abrir a tela de status. Precisa da URL pública da API em APP_PUBLIC_URL; sem ela,
// o webhook ainda é configurado quando a tela de status é aberta.
async function ensureWhatsappReady() {
  const appUrl = (process.env.APP_PUBLIC_URL || '').trim().replace(/\/+$/, '');
  if (!appUrl) {
    console.log('ℹ️ APP_PUBLIC_URL não definido — o webhook do WhatsApp será configurado quando o admin abrir a tela de status.');
    return;
  }
  try {
    await whatsappService.getStatus(appUrl);
    console.log('✅ WhatsApp preparado no boot (instância, webhook e número verificados).');
  } catch (err) {
    console.error('⚠️ Não foi possível preparar o WhatsApp no boot (segue normalmente):', err.message);
  }
}

// ─────────────────────────────────────────────────
//  Cluster: um processo por núcleo para usar a CPU inteira
// ─────────────────────────────────────────────────
// Um processo Node roda em um core só. Com o cluster, o primary prepara o banco
// UMA vez e sobe N workers que atendem em paralelo. Os workers dividem o mesmo
// disco (mesmo container), então o upload local continua funcionando entre eles.
// Como só o primary roda o bootDatabase, o sync({ alter: true }) e os seeds
// rodam uma vez, sem várias migrações concorrentes na mesma base.
const WORKER_COUNT = Math.max(1, parseInt(process.env.WEB_CONCURRENCY || String(os.cpus().length), 10));

let httpServer = null;
const startServer = () => {
  httpServer = app.listen(PORT, () => {
    const quem = cluster.isPrimary ? 'servidor' : `worker ${process.pid}`;
    console.log(`🚀 ${quem} rodando em modo ${process.env.NODE_ENV || 'development'} na porta ${PORT}`);
    console.log(`📡 API montada em ${API_PREFIX}`);
  });
  return httpServer;
};

// Desligamento gracioso: no redeploy o container recebe SIGTERM. Aqui paramos de
// aceitar requests, drenamos os jobs de áudio em andamento e fechamos fila/Redis
// antes de sair — assim uma análise em curso não é perdida no meio.
let encerrando = false;
const gracefulShutdown = async (signal) => {
  if (encerrando) return;
  encerrando = true;
  console.log(`\n⏳ Encerrando (${signal})...`);

  // Rede de segurança: se algo travar no shutdown, força a saída em 25s.
  const forcar = setTimeout(() => {
    console.error('⚠️ Timeout no encerramento; forçando saída.');
    process.exit(1);
  }, 25000);
  forcar.unref();

  try {
    if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
    await stopAudioWorker();
    await closeAudioQueue();
    await closeRedisConnection();
    await closeCacheConnection();
  } catch (err) {
    console.error('Erro durante o encerramento:', err.message);
  }
  clearTimeout(forcar);
  process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (WORKER_COUNT > 1 && cluster.isPrimary) {
  // Primary: prepara o banco uma vez, roda o worker de fila (não atende HTTP,
  // então o trabalho pesado não disputa com as requests) e sobe os web workers.
  bootDatabase().then(() => {
    ensureWhatsappReady();
    startAudioWorker();
    console.log(`🧩 Subindo ${WORKER_COUNT} workers...`);
    for (let i = 0; i < WORKER_COUNT; i++) {
      cluster.fork();
    }

    // Se um worker cair, sobe outro no lugar — mas não durante o encerramento.
    cluster.on('exit', (worker, code, signal) => {
      if (encerrando) return;
      console.error(`⚠️ Worker ${worker.process.pid} saiu (code ${code}, signal ${signal}). Recriando...`);
      cluster.fork();
    });
  });
} else if (WORKER_COUNT > 1) {
  // Web worker: o banco já foi preparado pelo primary; só atende requests.
  startServer();
} else {
  // WEB_CONCURRENCY=1 (ex.: VPS de 1 core): um processo único prepara o banco,
  // roda o worker de fila e serve.
  bootDatabase().then(() => {
    ensureWhatsappReady();
    startAudioWorker();
    startServer();
  });
}

export default app;
