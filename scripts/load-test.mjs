/**
 * Teste de carga: simula N usuários usando a API ao mesmo tempo e mede o número
 * REAL da sua máquina (latência e taxa de erro), em vez de estimativa.
 *
 * Roda contra a API JÁ NO AR (não sobe nada aqui). Só faz leituras (GET), então é
 * seguro rodar contra produção — não cria nem apaga dado nenhum.
 *
 * Uso:
 *   API_URL=https://sua-api/api/v1 TOKEN=seu_jwt CONCURRENCY=100 DURATION=30 \
 *     node scripts/load-test.mjs
 *
 * Como pegar o TOKEN: faça login na plataforma, abra o DevTools do navegador
 * (F12) → aba Application/Aplicativo → Local Storage → copie o valor de
 * "bankerpro_token".
 *
 * Variáveis:
 *   API_URL      base da API, com o /api/v1 (obrigatório)
 *   TOKEN        um JWT de um usuário logado (obrigatório)
 *   CONCURRENCY  quantos usuários simultâneos (padrão 100)
 *   DURATION     por quantos segundos rodar (padrão 30)
 *   THINK_MS     pausa entre requests de cada usuário, simulando gente real (padrão 800ms)
 */

const API_URL = (process.env.API_URL || '').replace(/\/$/, '');
const TOKEN = process.env.TOKEN || '';
const CONCURRENCY = Math.max(1, parseInt(process.env.CONCURRENCY || '100', 10));
const DURATION = Math.max(1, parseInt(process.env.DURATION || '30', 10));
const THINK_MS = Math.max(0, parseInt(process.env.THINK_MS || '800', 10));

if (!API_URL || !TOKEN) {
  console.error('❌ Defina API_URL e TOKEN. Ex.:');
  console.error('   API_URL=https://sua-api/api/v1 TOKEN=seu_jwt node scripts/load-test.mjs');
  process.exit(1);
}

// Só leituras — cada "usuário" sorteia um destes a cada volta. O peso simula o
// uso real: o painel e os cenários são abertos muito mais que o resto.
const ENDPOINTS = [
  { path: '/auth/me', peso: 4 },
  { path: '/scenarios', peso: 4 },
  { path: '/goals', peso: 2 },
  { path: '/notes', peso: 2 },
  { path: '/ranking', peso: 2 },
  { path: '/subscription/plans', peso: 1 },
  { path: '/simulations', peso: 2 }
];

const sorteados = ENDPOINTS.flatMap((e) => Array(e.peso).fill(e.path));
const escolher = () => sorteados[Math.floor(Math.random() * sorteados.length)];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const latencias = [];
let ok = 0;
let erros = 0;
const porStatus = {};
let rodando = true;

async function umUsuario() {
  while (rodando) {
    const path = escolher();
    const inicio = performance.now();
    try {
      const res = await fetch(`${API_URL}${path}`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      const ms = performance.now() - inicio;
      latencias.push(ms);
      porStatus[res.status] = (porStatus[res.status] || 0) + 1;
      if (res.ok) ok++;
      else erros++;
      // Consome o corpo para liberar a conexão.
      await res.arrayBuffer().catch(() => {});
    } catch {
      erros++;
      porStatus['conn_error'] = (porStatus['conn_error'] || 0) + 1;
    }
    if (THINK_MS > 0) await dormir(THINK_MS * (0.5 + Math.random()));
  }
}

const percentil = (arr, p) => {
  if (arr.length === 0) return 0;
  const ordenado = [...arr].sort((a, b) => a - b);
  const idx = Math.min(ordenado.length - 1, Math.floor((p / 100) * ordenado.length));
  return ordenado[idx];
};

async function main() {
  console.log(`\n🔫 Teste de carga: ${CONCURRENCY} usuários simultâneos por ${DURATION}s`);
  console.log(`   Alvo: ${API_URL}\n`);

  const inicio = Date.now();
  const usuarios = Array.from({ length: CONCURRENCY }, () => umUsuario());

  // Barra de progresso simples
  const tick = setInterval(() => {
    const s = Math.round((Date.now() - inicio) / 1000);
    process.stdout.write(`\r   ${s}s / ${DURATION}s — ${ok + erros} requests...`);
  }, 1000);

  await dormir(DURATION * 1000);
  rodando = false;
  clearInterval(tick);
  await Promise.all(usuarios);

  const total = ok + erros;
  const segundos = (Date.now() - inicio) / 1000;
  const media = latencias.reduce((a, b) => a + b, 0) / (latencias.length || 1);

  console.log('\n\n─────────── RESULTADO ───────────');
  console.log(`Requests totais:     ${total}`);
  console.log(`Requests/segundo:    ${(total / segundos).toFixed(1)}`);
  console.log(`Sucesso (2xx):       ${ok}`);
  console.log(`Erros:               ${erros}  (${((erros / total) * 100).toFixed(1)}%)`);
  console.log(`\nLatência (ms):`);
  console.log(`  média:  ${media.toFixed(0)}`);
  console.log(`  p50:    ${percentil(latencias, 50).toFixed(0)}`);
  console.log(`  p95:    ${percentil(latencias, 95).toFixed(0)}`);
  console.log(`  p99:    ${percentil(latencias, 99).toFixed(0)}`);
  console.log(`  máx:    ${Math.max(...latencias, 0).toFixed(0)}`);
  console.log(`\nPor status HTTP:`);
  for (const [status, qtd] of Object.entries(porStatus)) {
    console.log(`  ${status}: ${qtd}`);
  }

  console.log('\n─────────── LEITURA ───────────');
  const p95 = percentil(latencias, 95);
  const taxaErro = (erros / total) * 100;
  if (taxaErro > 5) {
    console.log(`⚠️  Taxa de erro ${taxaErro.toFixed(1)}% — a máquina está sofrendo com ${CONCURRENCY} usuários. Verifique se muitos são 429 (rate limit) ou 5xx (sobrecarga).`);
  } else if (p95 > 2000) {
    console.log(`⚠️  p95 de ${p95.toFixed(0)}ms — respostas lentas sob carga. Aguenta, mas no limite.`);
  } else {
    console.log(`✅ Aguentou ${CONCURRENCY} usuários com p95 de ${p95.toFixed(0)}ms e ${taxaErro.toFixed(1)}% de erro. Saudável.`);
  }
  console.log('');
  process.exit(0);
}

main();
