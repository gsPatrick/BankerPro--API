import dns from 'node:dns/promises';
import net from 'node:net';
import AppError from './app-error.js';

/**
 * Busca HTTP para URLs que vieram de fora (hoje: a URL do áudio no payload do
 * webhook do WhatsApp).
 *
 * O risco é SSRF: quem conseguir influenciar essa URL faz a NOSSA máquina bater
 * em endereços que só ela alcança — o Postgres e o Redis na rede interna do
 * Docker, o painel do Easypanel, ou o serviço de metadados da cloud em
 * 169.254.169.254, que costuma devolver credenciais. A requisição sai de dentro,
 * então firewall nenhum barra.
 *
 * A proteção resolve o DNS antes e recusa qualquer destino que caia em faixa
 * privada, loopback ou link-local. Host público continua funcionando normalmente,
 * então o download legítimo de áudio não muda.
 */

const ehEnderecoInterno = (ip) => {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;                          // 10.0.0.0/8
    if (a === 127) return true;                         // loopback
    if (a === 0) return true;                           // "este host"
    if (a === 169 && b === 254) return true;            // link-local (metadados da cloud)
    if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
    if (a === 192 && b === 168) return true;            // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true;  // CGNAT
    if (a >= 224) return true;                          // multicast/reservado
    return false;
  }

  if (net.isIPv6(ip)) {
    const normalizado = ip.toLowerCase();
    if (normalizado === '::1' || normalizado === '::') return true;
    if (normalizado.startsWith('fe80')) return true;    // link-local
    if (/^f[cd]/.test(normalizado)) return true;        // unique local (fc00::/7)
    // IPv4 mapeado em IPv6: checa a parte IPv4. Vem em duas formas —
    // "::ffff:127.0.0.1" e a hexadecimal "::ffff:7f00:1", que é como o próprio
    // objeto URL normaliza o endereço. Só a primeira era tratada, e por isso
    // "http://[::ffff:127.0.0.1]/" passava direto para o loopback.
    const mapeadoDecimal = normalizado.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapeadoDecimal) return ehEnderecoInterno(mapeadoDecimal[1]);

    const mapeadoHex = normalizado.match(/::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (mapeadoHex) {
      const alto = parseInt(mapeadoHex[1], 16);
      const baixo = parseInt(mapeadoHex[2], 16);
      const ipv4 = [alto >> 8, alto & 0xff, baixo >> 8, baixo & 0xff].join('.');
      return ehEnderecoInterno(ipv4);
    }

    return false;
  }

  return true; // formato desconhecido: recusa por precaução
};

export const assertUrlExterna = async (urlBruta) => {
  let url;
  try {
    url = new URL(String(urlBruta));
  } catch {
    throw new AppError('Endereço de mídia inválido.', 400, 'INVALID_MEDIA_URL');
  }

  // file:, gopher:, ftp: e afins não têm por que aparecer aqui.
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new AppError('Endereço de mídia não permitido.', 400, 'INVALID_MEDIA_URL');
  }

  const host = url.hostname.replace(/^\[|\]$/g, '');

  // Host já escrito como IP: checa direto, sem consultar DNS.
  if (net.isIP(host)) {
    if (ehEnderecoInterno(host)) {
      throw new AppError('Endereço de mídia não permitido.', 400, 'BLOCKED_INTERNAL_ADDRESS');
    }
    return url;
  }

  let enderecos;
  try {
    enderecos = await dns.lookup(host, { all: true });
  } catch {
    throw new AppError('Não foi possível resolver o endereço da mídia.', 502, 'MEDIA_DNS_FAILED');
  }

  // Basta um endereço interno para recusar: um domínio pode apontar para
  // 127.0.0.1 de propósito justamente para furar esta checagem.
  if (enderecos.some(({ address }) => ehEnderecoInterno(address))) {
    throw new AppError('Endereço de mídia não permitido.', 400, 'BLOCKED_INTERNAL_ADDRESS');
  }

  return url;
};

/**
 * fetch com a checagem acima aplicada antes, e um teto de tempo para a chamada
 * não ficar pendurada.
 */
export const fetchExterno = async (urlBruta, options = {}, { timeoutMs = 30_000 } = {}) => {
  const url = await assertUrlExterna(urlBruta);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal, redirect: 'error' });
  } finally {
    clearTimeout(timer);
  }
};
