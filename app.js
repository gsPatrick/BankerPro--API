import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './src/routes/index.js';
import errorMiddleware from './src/middlewares/error.middleware.js';
import { toCamelCase } from './src/utils/case-converter.js';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_PREFIX = process.env.APP_API_PREFIX || '/api/v1';

// Middlewares Globais
app.use(cors());
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

// Tratatamento de rotas não encontradas
app.use((req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.status = 404;
  next(err);
});

// Tratador global de erros (global error handler)
app.use(errorMiddleware);

// Listen
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`API endpoints mounted at ${API_PREFIX}`);
});

export default app;
