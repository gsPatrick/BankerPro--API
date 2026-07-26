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
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}
