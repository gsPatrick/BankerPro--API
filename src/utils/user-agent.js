/**
 * Lightweight UA parser (no external deps)
 */
export function parseUserAgent(userAgent = '') {
  const ua = String(userAgent || '');

  let browser = 'Navegador';
  // Navegadores internos (WebView) dos apps primeiro — é como o tráfego de
  // Instagram/Facebook chega, e a UA "por baixo" é Safari/Chrome, o que
  // esconderia a origem se checássemos os de sempre antes.
  if (/Instagram/i.test(ua)) browser = 'Instagram (app)';
  else if (/FBAN|FBAV|FB_IAB/i.test(ua)) browser = 'Facebook (app)';
  else if (/BytedanceWebview|musical_ly|TikTok/i.test(ua)) browser = 'TikTok (app)';
  else if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  else if (/Opera|OPR\//i.test(ua)) browser = 'Opera';

  let os = 'Sistema';
  if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/CrOS/i.test(ua)) os = 'ChromeOS';

  let deviceType = 'desktop';
  if (/Mobi|Android.*Mobile|iPhone|iPod/i.test(ua)) deviceType = 'mobile';
  else if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) deviceType = 'tablet';

  const deviceLabel = `${browser} · ${os}`;

  return { browser, os, deviceType, deviceLabel, userAgent: ua };
}

export function getClientIp(req) {
  // req.ip primeiro. Com 'trust proxy' configurado no app, o Express já resolve
  // o IP real contando os hops confiáveis de trás para frente.
  //
  // Ler o X-Forwarded-For direto (pegando o primeiro item) era o mesmo que
  // aceitar o IP que o cliente quisesse: basta mandar o header na requisição que
  // o proxy acrescenta o IP verdadeiro DEPOIS, e o primeiro item continua sendo
  // o forjado. Isso ia parar no registro de sessões e no analytics — o painel
  // mostrava a origem que o visitante escolhesse.
  if (req.ip) return req.ip;

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    // Sem trust proxy configurado, o hop confiável é o ÚLTIMO da lista: os
    // anteriores podem ter vindo do cliente.
    const partes = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    if (partes.length) return partes[partes.length - 1];
  }

  return req.socket?.remoteAddress || null;
}
