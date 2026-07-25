import { Resend } from 'resend';
import { renderWelcomeEmail, renderPasswordResetEmail } from './email.templates.js';

/**
 * Envio de e-mail transacional via Resend.
 *
 * A chave e o remetente saem do ambiente. Sem RESEND_API_KEY o serviço não
 * quebra: loga um aviso e segue — cadastro e reset de senha continuam
 * funcionando, só não sai o e-mail. Isso evita que uma configuração pendente
 * derrube o fluxo de autenticação.
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
// Remetente. Precisa ser de um domínio verificado no Resend. Ex.:
// "Closer.IA <ola@closeria.com.br>".
const MAIL_FROM = process.env.MAIL_FROM || 'Closer.IA <ola@closeria.com.br>';

let resend = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
} else {
  console.warn('⚠️ RESEND_API_KEY não definido — os e-mails não serão enviados (só logados).');
}

/**
 * Dispara um e-mail. Nunca lança: retorna { ok } e registra o erro. Quem chama
 * (cadastro, reset) não deve falhar por causa de e-mail.
 */
const enviar = async ({ to, subject, html, text }) => {
  if (!resend) {
    console.log(`📧 [SEM RESEND] E-mail não enviado para ${to} — assunto: "${subject}"`);
    return { ok: false, skipped: true };
  }
  try {
    const { data, error } = await resend.emails.send({ from: MAIL_FROM, to, subject, html, text });
    if (error) {
      console.error(`❌ Falha ao enviar e-mail para ${to}:`, error);
      return { ok: false, error };
    }
    console.log(`📧 E-mail enviado para ${to} — id: ${data?.id} | assunto: "${subject}"`);
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error(`❌ Erro ao enviar e-mail para ${to}:`, err.message);
    return { ok: false, error: err.message };
  }
};

export const sendWelcomeEmail = async ({ to, fullName }) => {
  const { subject, html, text } = renderWelcomeEmail({ fullName });
  return enviar({ to, subject, html, text });
};

export const sendPasswordResetEmail = async ({ to, fullName, code, expiresMinutes = 10 }) => {
  const { subject, html, text } = renderPasswordResetEmail({ fullName, code, expiresMinutes });
  return enviar({ to, subject, html, text });
};
