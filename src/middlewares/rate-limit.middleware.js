import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

/**
 * Limite de requisições nos endpoints que gastam dinheiro (IA e transcrição). O
 * objetivo aqui não é segurança fina — é estabilidade e custo: impedir que um
 * loop (bug no front, script, ou abuso) dispare centenas de chamadas ao
 * Claude/OpenAI, estourando a fatura e saturando a máquina.
 *
 * O limite é generoso de propósito: um usuário real nunca chega perto; só um
 * comportamento anormal bate no teto. Ajuste por env se precisar.
 */
// Chaveia por usuário (todos estes endpoints são autenticados, então o id sempre
// existe). O IP é só um fallback de segurança, e usa o helper do próprio
// express-rate-limit — ele normaliza IPv6 (mascara em subnet), o que evita a
// validação que estourava no boot e impede um usuário IPv6 de furar o limite.
const chavePorUsuario = (req) =>
  req.user?.id ? `u:${req.user.id}` : ipKeyGenerator(req.ip);

// IA interativa (copiloto, simulação, gerador): muitas chamadas legítimas em
// sequência, mas ainda assim com um teto que só um loop ultrapassa.
export const aiRateLimit = rateLimit({
  windowMs: 60_000,
  limit: parseInt(process.env.RATE_LIMIT_AI || '40', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: chavePorUsuario,
  message: {
    success: false,
    error: {
      message: 'Muitas solicitações de IA em pouco tempo. Aguarde um instante e tente novamente.',
      code: 'RATE_LIMITED'
    }
  }
});

/**
 * Autenticação: aqui o limite É segurança, não custo. Sem ele, /auth/login aceita
 * milhares de tentativas de senha por minuto e /auth/reset-password aceita força
 * bruta no OTP — que tem só 6 dígitos (1 milhão de combinações, minutos de
 * trabalho para um script). Com 10 tentativas por minuto por IP+e-mail, o mesmo
 * ataque levaria semanas.
 *
 * A chave inclui o e-mail alvo para que um NAT/operadora com muitos usuários
 * legítimos não derrube todo mundo por causa de um só, e o IP para que trocar de
 * e-mail a cada tentativa também não fure o limite.
 */
const chavePorIpEEmail = (req) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  return `${ipKeyGenerator(req.ip)}|${email}`;
};

export const authRateLimit = rateLimit({
  windowMs: 60_000,
  limit: parseInt(process.env.RATE_LIMIT_AUTH || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: chavePorIpEEmail,
  // Login certo não conta contra o limite: quem sabe a senha não é atacante.
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      message: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
      code: 'RATE_LIMITED'
    }
  }
});

/**
 * Envio de código (cadastro, reenviar OTP, esqueci a senha): cada chamada dispara
 * um e-mail. Teto baixo para não virar ferramenta de spam contra terceiros nem
 * queimar a cota do provedor de e-mail.
 */
export const otpRequestRateLimit = rateLimit({
  windowMs: 60 * 60_000,
  limit: parseInt(process.env.RATE_LIMIT_OTP || '5', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: chavePorIpEEmail,
  message: {
    success: false,
    error: {
      message: 'Muitas solicitações de código. Tente novamente mais tarde.',
      code: 'RATE_LIMITED'
    }
  }
});

/**
 * Confirmação do código de vínculo do WhatsApp. O código tem 6 dígitos e vale
 * para QUALQUER número com código ativo (não dá para escopar por usuário: o
 * vínculo é justamente o que descobre de quem é o número). Sem teto, um script
 * chuta códigos até acertar o de outra pessoa e rouba o número dela.
 */
export const linkCodeRateLimit = rateLimit({
  windowMs: 60_000,
  limit: parseInt(process.env.RATE_LIMIT_LINK_CODE || '5', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: chavePorUsuario,
  message: {
    success: false,
    error: {
      message: 'Muitas tentativas de código. Aguarde um minuto e tente novamente.',
      code: 'RATE_LIMITED'
    }
  }
});

/**
 * Coleta pública de analytics: sem autenticação, grava no banco. O teto por IP
 * evita que alguém encha as tabelas com lixo (e a fatura de disco junto).
 * Generoso o bastante para uma navegação real, que manda eventos em lote.
 */
export const publicCollectRateLimit = rateLimit({
  windowMs: 60_000,
  limit: parseInt(process.env.RATE_LIMIT_COLLECT || '60', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  // O beacon não lê a resposta; devolver 204 mantém o console do visitante limpo.
  handler: (req, res) => res.status(204).end()
});

/**
 * Webhooks públicos (Mercado Pago e Z-API). São as únicas rotas abertas que
 * disparam trabalho caro: a do pagamento faz uma consulta de volta ao Mercado
 * Pago a cada chamada, e a do WhatsApp encosta no banco antes de descartar o que
 * não reconhece. Sem teto, quem descobrir a URL mantém a API ocupada de graça —
 * e ainda pode fazer o Mercado Pago nos limitar por excesso de consultas.
 *
 * O teto é alto de propósito: o volume real desses provedores fica muito abaixo.
 */
export const webhookRateLimit = rateLimit({
  windowMs: 60_000,
  limit: parseInt(process.env.RATE_LIMIT_WEBHOOK || '300', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  message: { success: false, error: { message: 'Too many requests.', code: 'RATE_LIMITED' } }
});

// Análise de áudio: cada uma custa transcrição + análise, então o teto é menor.
export const audioRateLimit = rateLimit({
  windowMs: 60_000,
  limit: parseInt(process.env.RATE_LIMIT_AUDIO || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: chavePorUsuario,
  message: {
    success: false,
    error: {
      message: 'Muitos áudios enviados em pouco tempo. Aguarde um instante e tente novamente.',
      code: 'RATE_LIMITED'
    }
  }
});
