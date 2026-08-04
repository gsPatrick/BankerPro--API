/**
 * Templates de e-mail do Closer.IA.
 *
 * HTML de e-mail é hostil: cada cliente (Gmail, Outlook, Apple Mail) renderiza
 * de um jeito, ignora <style> externo, quebra flexbox/grid e não carrega fonte
 * web. Por isso aqui é tudo à moda antiga — tabelas, estilo inline em cada
 * elemento e cor explícita em tudo. A identidade é a "Darkroom" do app: fundo
 * quase preto, acento prateado, tipografia editorial e nada de emoji.
 *
 * Cada função devolve `{ subject, html, text }`. O `text` é o fallback para
 * quem lê em modo texto puro (e ajuda a não cair em spam).
 */

// Paleta e tipografia espelhando app/globals.css do front.
const BRAND = {
  canvas: '#0E0E0E',
  canvasDeep: '#060608',
  card: '#161616',
  cardRaised: '#1E1E1E',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  silver: '#F2F4F7',
  silverMuted: '#C9CED6',
  textPrimary: '#F6F6F6',
  textSecondary: '#9E9E9E',
  textTertiary: '#6E6E6E',
  ink: '#0E0E0E',
  fontDisplay: "'Plus Jakarta Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  fontBody: "'Inter',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
};

const SUPPORT_EMAIL = 'ola@closeria.com.br';
// URL da área logada usada nos botões. Configurável para não ficar presa a um
// domínio; cai no domínio da marca se o ambiente não definir.
const WEB_URL = (process.env.APP_WEB_URL || 'https://closeria.com.br').replace(/\/+$/, '');
// Onde as imagens do e-mail estão hospedadas. A API serve /assets estático (pasta
// versionada no repo, não é volume — ao contrário de /uploads), e APP_PUBLIC_URL
// é o domínio público dela. Imagem de e-mail precisa de URL absoluta e pública —
// clientes não carregam anexo/local nem base64 (Gmail).
const ASSET_BASE_DEFAULT =
  (process.env.APP_PUBLIC_URL || 'https://bankerpro-bankerpro--api.wohb2u.easypanel.host')
    .replace(/\/+$/, '') + '/assets/email';

/**
 * Escapa o que vai para dentro do HTML do e-mail.
 *
 * O nome é escolhido pelo próprio usuário e caía cru no template. Como o
 * cadastro não prova a posse do e-mail (a conta já nasce verificada) e dispara
 * as boas-vindas, dava para se cadastrar com o e-mail de outra pessoa e um
 * "nome" contendo HTML — a vítima recebia, de um domínio legítimo
 * (@closeria.com.br), uma mensagem com conteúdo escolhido pelo atacante,
 * inclusive link falso. Escapar corta isso na raiz.
 */
const escaparHtml = (valor) =>
  String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const primeiroNome = (nome) => {
  const n = (nome || '').trim();
  if (!n) return null;
  // Só a primeira palavra, com teto de tamanho: um "nome" gigante deformaria o
  // layout do e-mail mesmo já escapado.
  return escaparHtml(n.split(/\s+/)[0].slice(0, 40));
};

/**
 * A marca geométrica do app (squircle prateado com furo preto) recriada só com
 * divs — SVG é removido pelo Gmail. `border-radius` em div é bem suportado.
 */
const logoMark = () => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td style="padding-right:11px;vertical-align:middle;">
        <div style="width:38px;height:38px;background:${BRAND.silver};border-radius:11px;text-align:center;line-height:38px;">
          <div style="display:inline-block;width:17px;height:17px;background:${BRAND.ink};border-radius:50%;vertical-align:middle;"></div>
        </div>
      </td>
      <td style="vertical-align:middle;">
        <span style="font-family:${BRAND.fontDisplay};font-size:20px;font-weight:800;color:${BRAND.textPrimary};letter-spacing:-0.4px;">Closer<span style="color:${BRAND.silverMuted};">.IA</span></span>
      </td>
    </tr>
  </table>`;

const kicker = (texto) => `
  <p style="margin:0 0 12px;font-family:${BRAND.fontBody};font-size:11px;font-weight:600;letter-spacing:2.4px;text-transform:uppercase;color:${BRAND.silverMuted};">${texto}</p>`;

// Botão "bulletproof" (funciona no Outlook via padding no <a>).
const button = (label, href) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td align="center" style="border-radius:12px;background:${BRAND.silver};">
        <a href="${href}" target="_blank" style="display:inline-block;padding:15px 36px;font-family:${BRAND.fontDisplay};font-size:15px;font-weight:700;color:${BRAND.ink};text-decoration:none;border-radius:12px;letter-spacing:-0.2px;">${label}</a>
      </td>
    </tr>
  </table>`;

/**
 * Casca compartilhada: preheader oculto, cabeçalho com a marca e um cartão. Se
 * `bannerImg` vier, entra como faixa cinematográfica no topo do cartão, sem
 * respiro, com os cantos superiores arredondados; o conteúdo vem logo abaixo.
 */
const baseLayout = ({ title, previewText, bannerImg, contentHtml }) => {
  const banner = bannerImg
    ? `<tr>
         <td style="padding:0;line-height:0;font-size:0;">
           <img src="${bannerImg}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border-radius:20px 20px 0 0;border:0;outline:none;text-decoration:none;">
         </td>
       </tr>`
    : '';
  const contentRadius = bannerImg ? '0 0 20px 20px' : '20px';
  const contentBorderTop = bannerImg ? 'border-top:0;' : '';

  return `<!doctype html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
  <!--[if mso]><style>* { font-family: Arial, sans-serif !important; }</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${BRAND.canvasDeep};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${BRAND.canvasDeep};">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.canvasDeep};">
    <tr>
      <td align="center" style="padding:36px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
          <tr>
            <td align="center" style="padding:4px 0 30px;">
              ${logoMark()}
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:20px;">
                ${banner}
                <tr>
                  <td style="padding:38px 40px 36px;background:${BRAND.card};border-radius:${contentRadius};${contentBorderTop}">
                    ${contentHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:26px 24px 8px;text-align:center;">
              <p style="margin:0 0 6px;font-family:${BRAND.fontBody};font-size:12px;line-height:19px;color:${BRAND.textTertiary};letter-spacing:0.2px;">
                Closer.IA — Treinamento e vendas para o bancário
              </p>
              <p style="margin:0;font-family:${BRAND.fontBody};font-size:12px;line-height:19px;color:${BRAND.textTertiary};">
                Dúvidas? <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.silverMuted};text-decoration:none;">${SUPPORT_EMAIL}</a>
              </p>
              <p style="margin:14px 0 0;font-family:${BRAND.fontBody};font-size:11px;line-height:16px;color:${BRAND.textTertiary};">
                © ${new Date().getFullYear()} Closer.IA. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Item de feature: sem ícone. Um índice prateado fino + título + descrição,
// separados por hairline. Leitura editorial, tom premium.
const featureRow = (index, title, desc, isLast) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td width="42" valign="top" style="padding:0;">
        <span style="font-family:${BRAND.fontDisplay};font-size:13px;font-weight:700;color:${BRAND.silverMuted};letter-spacing:1px;">${index}</span>
      </td>
      <td valign="top" style="padding:0;">
        <p style="margin:0;font-family:${BRAND.fontDisplay};font-size:15px;font-weight:700;color:${BRAND.textPrimary};line-height:20px;letter-spacing:-0.2px;">${title}</p>
        <p style="margin:3px 0 0;font-family:${BRAND.fontBody};font-size:13px;color:${BRAND.textSecondary};line-height:20px;">${desc}</p>
      </td>
    </tr>
  </table>
  ${isLast ? '' : `<div style="height:1px;background:${BRAND.border};margin:16px 0;"></div>`}`;

/**
 * E-mail de boas-vindas, disparado logo após o cadastro.
 * @param {object} opts
 * @param {string} [opts.fullName]
 * @param {string} [opts.assetBaseUrl]  base das imagens (default: APP_PUBLIC_URL/uploads/email)
 */
export const renderWelcomeEmail = ({ fullName, assetBaseUrl, heroSrc } = {}) => {
  const base = (assetBaseUrl || ASSET_BASE_DEFAULT).replace(/\/+$/, '');
  const bannerImg = heroSrc || `${base}/welcome-hero.jpg`;
  const nome = primeiroNome(fullName);
  const saudacao = nome ? `Bem-vindo, ${nome}.` : 'Bem-vindo ao Closer.IA.';

  const contentHtml = `
    ${kicker('Sua conta está pronta')}
    <h1 style="margin:0 0 16px;font-family:${BRAND.fontDisplay};font-size:27px;font-weight:800;color:${BRAND.textPrimary};line-height:33px;letter-spacing:-0.6px;">${saudacao}</h1>
    <p style="margin:0 0 30px;font-family:${BRAND.fontBody};font-size:15px;color:${BRAND.textSecondary};line-height:24px;">
      O Closer.IA é o seu copiloto de vendas. Treine as objeções mais difíceis, receba a análise das suas negociações e chegue no atendimento com o argumento certo na mão.
    </p>

    ${featureRow('01', 'Cenários de treino', 'Simule negociações reais e receba nota e feedback a cada rodada.')}
    ${featureRow('02', 'Copiloto no WhatsApp', 'Mande a objeção do cliente e receba a melhor resposta na hora.')}
    ${featureRow('03', 'Análise de áudio', 'Envie o áudio da negociação e veja onde ganhou e onde perdeu a venda.')}
    ${featureRow('04', 'Carteira', 'Organize seus clientes e oportunidades em um só lugar.', true)}

    <div style="height:1px;background:${BRAND.border};margin:30px 0 28px;"></div>

    <div style="text-align:center;">
      ${button('Acessar a plataforma', WEB_URL)}
      <p style="margin:16px 0 0;font-family:${BRAND.fontBody};font-size:12px;color:${BRAND.textTertiary};line-height:18px;">
        Comece pelo onboarding — leva um minuto e deixa o copiloto com a sua cara.
      </p>
    </div>`;

  const html = baseLayout({
    title: 'Bem-vindo ao Closer.IA',
    previewText: 'Sua conta está pronta. Veja o que dá para fazer no Closer.IA.',
    bannerImg,
    contentHtml
  });

  const text = [
    saudacao,
    '',
    'O Closer.IA é o seu copiloto de vendas.',
    '',
    '01 · Cenários de treino — simule negociações e receba nota e feedback.',
    '02 · Copiloto no WhatsApp — mande a objeção e receba a resposta na hora.',
    '03 · Análise de áudio — envie o áudio da negociação e veja onde ganhou/perdeu.',
    '04 · Carteira — organize clientes e oportunidades.',
    '',
    `Acesse: ${WEB_URL}`,
    '',
    `Dúvidas? ${SUPPORT_EMAIL}`,
    '— Closer.IA'
  ].join('\n');

  return { subject: 'Bem-vindo ao Closer.IA', html, text };
};

/**
 * E-mail de redefinição de senha com código OTP.
 */
export const renderPasswordResetEmail = ({ fullName, code, expiresMinutes = 10, assetBaseUrl, heroSrc } = {}) => {
  const base = (assetBaseUrl || ASSET_BASE_DEFAULT).replace(/\/+$/, '');
  const bannerImg = heroSrc || `${base}/welcome-hero.jpg`;
  const nome = primeiroNome(fullName);
  const ola = nome ? `Olá, ${nome}.` : 'Olá.';
  const codeSpaced = String(code || '').split('').join('&nbsp;');

  const contentHtml = `
    ${kicker('Redefinição de senha')}
    <h1 style="margin:0 0 16px;font-family:${BRAND.fontDisplay};font-size:27px;font-weight:800;color:${BRAND.textPrimary};line-height:33px;letter-spacing:-0.6px;">Seu código de verificação</h1>
    <p style="margin:0 0 28px;font-family:${BRAND.fontBody};font-size:15px;color:${BRAND.textSecondary};line-height:24px;">
      ${ola} Recebemos um pedido para criar uma nova senha da sua conta. Use o código abaixo para continuar.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td align="center" style="background:${BRAND.cardRaised};border:1px solid ${BRAND.borderStrong};border-radius:16px;padding:30px 16px;">
          <div style="font-family:${BRAND.fontDisplay};font-size:42px;font-weight:800;letter-spacing:12px;color:${BRAND.textPrimary};line-height:1;">${codeSpaced}</div>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 28px;font-family:${BRAND.fontBody};font-size:13px;color:${BRAND.textTertiary};line-height:20px;text-align:center;">
      Válido por <span style="color:${BRAND.silverMuted};font-weight:600;">${expiresMinutes} minutos</span>. Digite-o na tela de redefinição de senha para escolher a nova.
    </p>

    <div style="height:1px;background:${BRAND.border};margin:0 0 20px;"></div>

    <p style="margin:0;font-family:${BRAND.fontBody};font-size:13px;color:${BRAND.textTertiary};line-height:20px;">
      Se você não pediu para redefinir a senha, ignore este e-mail — sua senha atual continua valendo. Nunca compartilhe este código com ninguém.
    </p>`;

  const html = baseLayout({
    title: 'Seu código de redefinição de senha · Closer.IA',
    previewText: `Seu código é ${code}. Válido por ${expiresMinutes} minutos.`,
    bannerImg,
    contentHtml
  });

  const text = [
    ola,
    '',
    'Recebemos um pedido para redefinir a senha da sua conta Closer.IA.',
    '',
    `Código de verificação: ${code}`,
    `Válido por ${expiresMinutes} minutos.`,
    '',
    'Digite-o na tela de redefinição de senha para escolher uma nova senha.',
    '',
    'Se você não fez este pedido, ignore este e-mail — sua senha atual continua valendo.',
    `Dúvidas? ${SUPPORT_EMAIL}`,
    '— Closer.IA'
  ].join('\n');

  return { subject: `${code} é o seu código de redefinição · Closer.IA`, html, text };
};
