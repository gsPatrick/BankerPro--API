import dotenv from 'dotenv';
dotenv.config();

// Pool de conexões. O default do Sequelize é max 5, que é o teto de usuários
// simultâneos por processo — some rápido. Cada worker do cluster tem o seu
// próprio pool, então o total é (nº de workers × DB_POOL_MAX). Esse total precisa
// caber no max_connections do Postgres (default 100). Ex.: 4 workers × 15 = 60.
const pool = {
  max: parseInt(process.env.DB_POOL_MAX || '15', 10),
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  // Quanto esperar por uma conexão livre antes de falhar a request.
  acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
  // Devolve conexões ociosas ao banco para não segurar slots à toa.
  idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10)
};

export default {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'bankerpro_db',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    pool,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false,
    pool,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
};
