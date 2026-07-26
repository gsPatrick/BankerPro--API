/**
 * Geolocalização por IP, sem chave, via ipwho.is (grátis, HTTPS).
 *
 * Melhor esforço: se falhar, timeout ou for IP privado/local, devolve null e a
 * vida segue — geo é um enriquecimento, não pode travar a ingestão.
 *
 * Há um cache em memória por IP para não repetir a chamada externa a cada
 * evento do mesmo visitante.
 */
const cache = new Map();
const CACHE_MAX = 5000;

const isPrivateOrLocal = (ip) => {
  if (!ip) return true;
  const s = String(ip);
  return (
    s === '::1' ||
    s.startsWith('127.') ||
    s.startsWith('10.') ||
    s.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(s) ||
    s.startsWith('::ffff:127.') ||
    s === 'localhost'
  );
};

export const lookupGeo = async (ipRaw) => {
  // x-forwarded-for pode vir com porta ou lista; pega só o IP.
  const ip = String(ipRaw || '').split(',')[0].trim().replace(/^::ffff:/, '');
  if (!ip || isPrivateOrLocal(ip)) return null;
  if (cache.has(ip)) return cache.get(ip);

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,country_code,region,city`, {
      signal: controller.signal
    });
    clearTimeout(t);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data || data.success === false) {
      // Guarda o negativo também, para não martelar a API com o mesmo IP ruim.
      if (cache.size < CACHE_MAX) cache.set(ip, null);
      return null;
    }
    const geo = {
      country: data.country || null,
      countryCode: data.country_code || null,
      region: data.region || null,
      city: data.city || null
    };
    if (cache.size < CACHE_MAX) cache.set(ip, geo);
    return geo;
  } catch {
    return null;
  }
};
