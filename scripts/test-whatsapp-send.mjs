// Script de teste de envio pelo WhatsApp (Z-API).
//
// Manda uma mensagem direto pela Z-API, sem passar pela lógica da aplicação,
// para isolar se a ENTREGA está funcionando. Mostra a resposta crua e faz também
// a checagem do número (phone-exists), útil para o problema do 9º dígito.
//
// Uso:
//   node scripts/test-whatsapp-send.mjs                       -> manda para o número padrão
//   node scripts/test-whatsapp-send.mjs 5571982862912         -> manda para esse número
//   node scripts/test-whatsapp-send.mjs 5571982862912 "Oi, teste do Closer.IA"
//
// As credenciais saem do .env: ZAPI_INSTANCE_ID, ZAPI_INSTANCE_TOKEN e
// ZAPI_CLIENT_TOKEN (o token de segurança da conta, opcional).

import dotenv from 'dotenv';
dotenv.config();

const BASE = (process.env.ZAPI_BASE_URL || 'https://api.z-api.io').replace(/\/+$/, '');
const INSTANCE_ID = process.env.ZAPI_INSTANCE_ID || '';
const INSTANCE_TOKEN = process.env.ZAPI_INSTANCE_TOKEN || '';
const CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN || '';

if (!INSTANCE_ID || !INSTANCE_TOKEN) {
  console.error('❌ Faltam ZAPI_INSTANCE_ID e/ou ZAPI_INSTANCE_TOKEN no .env.');
  process.exit(1);
}

const URL_BASE = `${BASE}/instances/${INSTANCE_ID}/token/${INSTANCE_TOKEN}`;
const headers = { 'Content-Type': 'application/json' };
if (CLIENT_TOKEN) headers['Client-Token'] = CLIENT_TOKEN;

const numero = (process.argv[2] || '5571982862912').replace(/\D/g, '');
const mensagem = process.argv[3] || `Teste de envio do Closer.IA às ${new Date().toISOString()}`;

const linha = () => console.log('─'.repeat(70));

async function verStatus() {
  console.log('\n📶 Estado da conexão da instância...');
  try {
    const r = await fetch(`${URL_BASE}/status`, { headers });
    console.log(`   status ${r.status} | ${await r.text()}`);
  } catch (e) {
    console.log(`   ❌ falhou: ${e.message}`);
  }
}

async function verNumeroConectado() {
  console.log('\n📱 Número conectado na instância...');
  try {
    const r = await fetch(`${URL_BASE}/device`, { headers });
    const texto = await r.text();
    try {
      const d = JSON.parse(texto);
      console.log(`   status ${r.status} | phone: ${d.phone} | nome: ${d.name}`);
    } catch {
      console.log(`   status ${r.status} | ${texto}`);
    }
  } catch (e) {
    console.log(`   ❌ falhou: ${e.message}`);
  }
}

async function checarNumero() {
  console.log(`\n🔎 Checando se ${numero} existe no WhatsApp...`);
  try {
    const r = await fetch(`${URL_BASE}/phone-exists/${numero}`, { headers });
    console.log(`   status ${r.status} | ${await r.text()}`);
  } catch (e) {
    console.log(`   ❌ falhou: ${e.message}`);
  }
}

async function enviar() {
  console.log(`\n📤 Enviando "${mensagem}" para ${numero}...`);
  try {
    const r = await fetch(`${URL_BASE}/send-text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone: numero, message: mensagem, delayMessage: 2, delayTyping: 1 })
    });
    const texto = await r.text();
    console.log(`   status ${r.status}`);
    console.log(`   resposta: ${texto}`);
    try {
      const data = JSON.parse(texto);
      // zaapId/messageId só aparecem quando a Z-API realmente enfileirou o envio.
      if (data?.zaapId) console.log(`   → aceito pela Z-API | zaapId: ${data.zaapId} | messageId: ${data.messageId}`);
      if (data?.error) console.log(`   → ⚠️ a Z-API devolveu erro: ${data.error}`);
    } catch { /* resposta não-JSON */ }
  } catch (e) {
    console.log(`   ❌ falhou: ${e.message}`);
  }
}

linha();
console.log(`Z-API:     ${BASE}`);
console.log(`Instância: ${INSTANCE_ID}`);
console.log(`Número:    ${numero}`);
linha();

await verStatus();
await verNumeroConectado();
await checarNumero();
await enviar();

linha();
console.log('Pronto. Agora confira NO APARELHO se a mensagem chegou.');
console.log('- Chegou  → a entrega funciona; o problema é outro (número/vínculo).');
console.log('- Não chegou mas veio zaapId → a Z-API aceitou; veja o painel da Z-API.');
console.log('- Veio erro no corpo → credencial, Client-Token ou instância desconectada.');
linha();
