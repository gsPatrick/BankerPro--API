// Script de teste de envio pelo WhatsApp (Evolution API).
//
// Manda uma mensagem direto pela Evolution, sem passar pela lógica da aplicação,
// para isolar se a ENTREGA está funcionando. Mostra a resposta crua e faz também a
// checagem do número (whatsappNumbers), útil para o problema do 9º dígito / LID.
//
// Uso:
//   node scripts/test-whatsapp-send.mjs                       -> manda para o número padrão
//   node scripts/test-whatsapp-send.mjs 5571982862912         -> manda para esse número
//   node scripts/test-whatsapp-send.mjs 5571982862912 "Oi, teste do Closer.IA"
//
// A URL e a chave saem do .env (EVOLUTION_API_URL / EVOLUTION_API_KEY); se não
// existirem, caem nos valores padrão do projeto.

import dotenv from 'dotenv';
dotenv.config();

const URL = process.env.EVOLUTION_API_URL || 'https://bankerpro-evolution-api.wohb2u.easypanel.host';
const API_KEY = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE = 'copilot';

const numero = (process.argv[2] || '5571982862912').replace(/\D/g, '');
const mensagem = process.argv[3] || `Teste de envio do Closer.IA às ${new Date().toISOString()}`;

const linha = () => console.log('─'.repeat(70));

async function checarNumero() {
  console.log(`\n🔎 Checando o número ${numero} na Evolution (whatsappNumbers)...`);
  try {
    const r = await fetch(`${URL}/chat/whatsappNumbers/${INSTANCE}`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ numbers: [numero] })
    });
    const texto = await r.text();
    console.log(`   status ${r.status} | ${texto}`);
  } catch (e) {
    console.log(`   ❌ falhou: ${e.message}`);
  }
}

async function verStatus() {
  console.log(`\n📶 Estado da conexão da instância "${INSTANCE}"...`);
  try {
    const r = await fetch(`${URL}/instance/connectionState/${INSTANCE}`, {
      headers: { 'apikey': API_KEY }
    });
    const texto = await r.text();
    console.log(`   status ${r.status} | ${texto}`);
  } catch (e) {
    console.log(`   ❌ falhou: ${e.message}`);
  }
}

async function enviar() {
  console.log(`\n📤 Enviando "${mensagem}" para ${numero}...`);
  try {
    const r = await fetch(`${URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: numero, text: mensagem, delay: 1200 })
    });
    const texto = await r.text();
    console.log(`   status ${r.status}`);
    console.log(`   resposta: ${texto}`);
    // Extrai o status e o remoteJid final que a Evolution usou, se possível.
    try {
      const data = JSON.parse(texto);
      const jid = data?.key?.remoteJid;
      const st = data?.status;
      if (jid) console.log(`   → Evolution enviou para o JID: ${jid}`);
      if (st) console.log(`   → status inicial: ${st} (PENDING é normal no ato; o que importa é chegar no aparelho)`);
    } catch { /* resposta não-JSON */ }
  } catch (e) {
    console.log(`   ❌ falhou: ${e.message}`);
  }
}

linha();
console.log(`Evolution: ${URL}`);
console.log(`Instância: ${INSTANCE}`);
console.log(`Número:    ${numero}`);
linha();

await verStatus();
await checarNumero();
await enviar();

linha();
console.log('Pronto. Agora confira NO APARELHO se a mensagem chegou.');
console.log('- Chegou  → a entrega funciona; o problema é outro (número/vínculo).');
console.log('- Não chegou e status ficou PENDING → é a camada Evolution/WhatsApp (LID).');
linha();
