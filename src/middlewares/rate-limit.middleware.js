import { rateLimit } from 'express-rate-limit';

/**
 * Limite de requisições nos endpoints que gastam dinheiro (IA e transcrição). O
 * objetivo aqui não é segurança fina — é estabilidade e custo: impedir que um
 * loop (bug no front, script, ou abuso) dispare centenas de chamadas ao
 * Claude/OpenAI, estourando a fatura e saturando a máquina.
 *
 * O limite é generoso de propósito: um usuário real nunca chega perto; só um
 * comportamento anormal bate no teto. Ajuste por env se precisar.
 */
const chavePorUsuario = (req) => req.user?.id || req.ip;

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
