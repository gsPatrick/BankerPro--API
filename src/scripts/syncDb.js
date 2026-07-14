import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../models/index.js';

async function syncDatabase() {
  console.log('🔄 Iniciando a sincronização do banco de dados...');
  console.log(`Conectando em: ${process.env.DB_HOST}:${process.env.DB_PORT} (Banco: ${process.env.DB_NAME})`);

  try {
    // Autenticar conexão primeiro
    await sequelize.authenticate();
    console.log('✅ Conexão com o PostgreSQL estabelecida com sucesso.');

    // Sincronizar todos os modelos
    await sequelize.sync({ alter: true });
    console.log('✅ Todos os modelos foram sincronizados com sucesso (alter: true).');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Falha na conexão ou sincronização do banco de dados:', error);
    process.exit(1);
  }
}

syncDatabase();
