import crypto from 'node:crypto';
import dotenv from 'dotenv';

// Este módulo lê o ambiente no momento do import (antes do dotenv.config() do
// app.js, porque imports são avaliados primeiro), então carrega o .env aqui —
// mesmo padrão de src/config/database.js. Chamar duas vezes é inofensivo.
dotenv.config();

/**
 * Segredos da aplicação em um lugar só.
 *
 * O motivo de existir: antes, cada arquivo fazia
 * `process.env.JWT_SECRET || 'super_secret_jwt_key_...'`. Esse fallback está no
 * código de um repositório PÚBLICO — ou seja, se a variável faltasse no deploy,
 * qualquer pessoa poderia assinar um token válido de qualquer usuário (inclusive
 * admin) só copiando a string do GitHub. O mesmo valia para o CODEX_TOKEN, que
 * libera o endpoint de SQL arbitrário.
 *
 * Regra agora: em produção, sem segredo forte a aplicação NÃO sobe. Em
 * desenvolvimento, gera um valor aleatório em memória (derruba as sessões a cada
 * restart, o que é o comportamento correto para um segredo que ninguém definiu).
 */

const isProduction = process.env.NODE_ENV === 'production';

// Valores que já vazaram no repositório público: nunca mais podem ser aceitos,
// nem que alguém os coloque no .env do servidor.
const SEGREDOS_QUEIMADOS = new Set([
  'super_secret_jwt_key_bankerpro_change_me_in_production',
  'codex_developer_secret_key_123456',
  'troque-me',
  'change-me'
]);

const TAMANHO_MINIMO = 32;

const limpar = (valor) => (typeof valor === 'string' ? valor.trim() : '');

const abortar = (mensagem) => {
  console.error(`\n❌ ERRO DE CONFIGURAÇÃO DE SEGURANÇA\n   ${mensagem}\n`);
  process.exit(1);
};

/**
 * Lê um segredo obrigatório. Em produção aborta o boot se estiver ausente, curto
 * ou for um dos valores públicos. Fora de produção, gera um efêmero.
 */
const lerSegredoObrigatorio = (nome, { minimo = TAMANHO_MINIMO } = {}) => {
  const valor = limpar(process.env[nome]);

  // Segredo existente porém curto: avisa, mas NÃO derruba a aplicação. Só o que
  // é comprovadamente público (ausente ou valor do repositório) justifica
  // recusar o boot — um segredo próprio de 20 caracteres não é motivo para tirar
  // o sistema do ar com usuários dentro.
  if (valor && !SEGREDOS_QUEIMADOS.has(valor) && valor.length < minimo) {
    console.warn(
      `⚠️  ${nome} tem menos de ${minimo} caracteres. Funciona, mas troque por um valor ` +
      `gerado com "openssl rand -hex 32" (trocar derruba as sessões abertas).`
    );
    return valor;
  }

  // Valor publicado no repositório: recusa o boot em QUALQUER ambiente. Não pode
  // depender de NODE_ENV, porque o servidor de produção pode estar rodando com
  // NODE_ENV=development — e é justamente aí que a checagem seria pulada.
  if (valor && SEGREDOS_QUEIMADOS.has(valor)) {
    abortar(
      `A variável de ambiente ${nome} está com o valor de exemplo que está publicado\n   ` +
      `no repositório. Com ela assim, qualquer pessoa consegue assinar um token válido\n   ` +
      `de qualquer conta (inclusive admin), então a API se recusa a subir.\n   ` +
      `Gere um valor novo com: openssl rand -hex 32\n   ` +
      `e configure ${nome} no painel de deploy antes de subir a API.`
    );
  }

  if (!valor) {
    if (isProduction) {
      abortar(
        `A variável de ambiente ${nome} não está definida.\n   ` +
        `Gere um valor com: openssl rand -hex 32 e configure ${nome} no painel de deploy.`
      );
    }

    const efemero = crypto.randomBytes(32).toString('hex');
    // Grava no ambiente para que os workers criados por cluster.fork() herdem o
    // MESMO valor. Sem isto, cada worker assinaria com um segredo diferente e o
    // login falharia de forma intermitente, dependendo de qual worker atendesse.
    process.env[nome] = efemero;
    console.warn(
      `⚠️  ${nome} ausente — usando um segredo aleatório só desta execução ` +
      `(as sessões caem a cada restart). Defina ${nome} no .env.`
    );
    return efemero;
  }

  return valor;
};

/**
 * Lê um segredo opcional. Sem ele, o recurso correspondente fica DESLIGADO —
 * nunca liberado por um valor padrão.
 */
const lerSegredoOpcional = (nome, { minimo = TAMANHO_MINIMO } = {}) => {
  const valor = limpar(process.env[nome]);
  if (!valor) return null;

  // Mesma regra do segredo obrigatório: valor público derruba o boot em qualquer
  // ambiente. No caso do Codex isto é ainda mais sério — o token libera execução
  // de SQL arbitrário no banco.
  if (SEGREDOS_QUEIMADOS.has(valor)) {
    abortar(
      `A variável ${nome} está com o valor de exemplo publicado no repositório.\n   ` +
      `Esse token libera execução de SQL no banco de produção.\n   ` +
      `Gere outro com: openssl rand -hex 32 — ou deixe ${nome} VAZIA para desligar o módulo.`
    );
  }

  if (valor.length < minimo) {
    console.warn(
      `⚠️  ${nome} é curta (mínimo recomendado: ${minimo} caracteres). ` +
      `Gere outra com "openssl rand -hex 32".`
    );
  }

  return valor;
};

export const JWT_SECRET = lerSegredoObrigatorio('JWT_SECRET');

// Sem CODEX_TOKEN configurado, o módulo Codex (que expõe SQL arbitrário) fica
// fechado. Fail-closed é obrigatório aqui: é o endpoint mais perigoso da API.
export const CODEX_TOKEN = lerSegredoOpcional('CODEX_TOKEN');

/**
 * Comparação em tempo constante — evita que a diferença de tempo entre um token
 * errado no 1º caractere e um errado no último ajude a adivinhar o valor.
 */
export const compararSegredos = (recebido, esperado) => {
  if (typeof recebido !== 'string' || typeof esperado !== 'string') return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) {
    // Ainda assim compara algo do mesmo tamanho para não vazar o comprimento.
    crypto.timingSafeEqual(a, a);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
};
