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
