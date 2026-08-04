import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import { renderWelcomeEmail, renderPasswordResetEmail, renderEmailVerificationEmail } from './email.templates.js';

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

// O hero vai EMBUTIDO no e-mail (anexo inline via CID), não como imagem remota.
// Imagem remota depende do cliente carregar de um domínio externo e do proxy do
// Gmail não ter cacheado uma falha — embutir remove esses dois pontos de falha.
// Lê o arquivo uma vez e guarda o base64.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HERO_PATH = path.resolve(__dirname, '../../../assets/email/welcome-hero.jpg');
const HERO_CID = 'welcome-hero';

let heroBase64 = null;
try {
  heroBase64 = fs.readFileSync(HERO_PATH).toString('base64');
} catch (err) {
  console.warn(`⚠️ Não foi possível ler o hero do e-mail (${HERO_PATH}): ${err.message}. Os e-mails usarão a imagem por URL remota.`);
}

// Quando temos o hero em disco: referencia por cid: no HTML e manda o anexo
// inline. Sem o arquivo: heroSrc fica undefined e o template cai na URL remota.
const heroSrc = heroBase64 ? `cid:${HERO_CID}` : undefined;
const heroAttachments = heroBase64
  ? [{ filename: 'welcome-hero.jpg', content: heroBase64, contentId: HERO_CID, contentType: 'image/jpeg' }]
  : undefined;

/**
 * Dispara um e-mail. Nunca lança: retorna { ok } e registra o erro. Quem chama
 * (cadastro, reset) não deve falhar por causa de e-mail.
 */
const enviar = async ({ to, subject, html, text, attachments }) => {
  if (!resend) {
    console.log(`📧 [SEM RESEND] E-mail não enviado para ${to} — assunto: "${subject}"`);
    return { ok: false, skipped: true };
  }
  try {
    const payload = { from: MAIL_FROM, to, subject, html, text };
    if (attachments) payload.attachments = attachments;
    const { data, error } = await resend.emails.send(payload);
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
  const { subject, html, text } = renderWelcomeEmail({ fullName, heroSrc });
  return enviar({ to, subject, html, text, attachments: heroAttachments });
};

export const sendPasswordResetEmail = async ({ to, fullName, code, expiresMinutes = 10 }) => {
  const { subject, html, text } = renderPasswordResetEmail({ fullName, code, expiresMinutes, heroSrc });
  return enviar({ to, subject, html, text, attachments: heroAttachments });
};

export const sendEmailVerificationEmail = async ({ to, fullName, code, expiresMinutes = 10 }) => {
  const { subject, html, text } = renderEmailVerificationEmail({ fullName, code, expiresMinutes, heroSrc });
  return enviar({ to, subject, html, text, attachments: heroAttachments });
};
