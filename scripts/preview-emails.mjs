// Renderiza os templates de e-mail com dados de exemplo e salva o HTML em
// tmp/email-previews/ para abrir no navegador e conferir o visual.
//
// Uso: node scripts/preview-emails.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderWelcomeEmail, renderPasswordResetEmail } from '../src/features/email/email.templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'tmp', 'email-previews');
fs.mkdirSync(outDir, { recursive: true });

// Copia o hero para junto do preview e aponta o banner para o arquivo local,
// para o preview mostrar a imagem sem depender do deploy.
const heroSrc = path.join(__dirname, '..', 'assets', 'email', 'welcome-hero.jpg');
if (fs.existsSync(heroSrc)) fs.copyFileSync(heroSrc, path.join(outDir, 'welcome-hero.jpg'));

const welcome = renderWelcomeEmail({ fullName: 'Pedro Henrique Souza', assetBaseUrl: '.' });
const reset = renderPasswordResetEmail({ fullName: 'Pedro Henrique Souza', code: '482913', expiresMinutes: 10, assetBaseUrl: '.' });

const arquivos = [
  { nome: 'boas-vindas.html', assunto: welcome.subject, html: welcome.html },
  { nome: 'redefinir-senha.html', assunto: reset.subject, html: reset.html }
];

for (const a of arquivos) {
  fs.writeFileSync(path.join(outDir, a.nome), a.html, 'utf8');
  console.log(`✅ ${a.nome}  —  assunto: "${a.assunto}"`);
}

// Página índice para abrir os dois lado a lado (com a caixa de assunto simulada).
const indice = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preview de e-mails · Closer.IA</title>
<style>
  body{margin:0;background:#060608;font-family:'Inter',system-ui,sans-serif;color:#F6F6F6;}
  header{padding:24px 20px;border-bottom:1px solid rgba(255,255,255,.08);}
  header h1{margin:0;font-size:18px;font-weight:700;}
  header p{margin:4px 0 0;font-size:13px;color:#9E9E9E;}
  .grid{display:flex;flex-wrap:wrap;gap:24px;padding:24px;align-items:flex-start;}
  .col{flex:1 1 420px;min-width:340px;}
  .meta{font-size:12px;color:#9E9E9E;margin:0 0 8px;padding:10px 12px;background:#161616;border:1px solid rgba(255,255,255,.08);border-radius:10px;}
  .meta b{color:#F6F6F6;}
  iframe{width:100%;height:900px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:#060608;}
</style></head>
<body>
  <header>
    <h1>Preview de e-mails · Closer.IA</h1>
    <p>Dados de exemplo. Assim que os destinatários reais receberem, os nomes/código vêm dinâmicos.</p>
  </header>
  <div class="grid">
    <div class="col">
      <p class="meta"><b>Boas-vindas</b> · De: Closer.IA &lt;ola@closeria.com.br&gt; · Assunto: <b>${welcome.subject}</b></p>
      <iframe src="./boas-vindas.html" title="Boas-vindas"></iframe>
    </div>
    <div class="col">
      <p class="meta"><b>Redefinir senha (OTP)</b> · De: Closer.IA &lt;ola@closeria.com.br&gt; · Assunto: <b>${reset.subject}</b></p>
      <iframe src="./redefinir-senha.html" title="Redefinir senha"></iframe>
    </div>
  </div>
</body></html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), indice, 'utf8');
console.log(`\n📂 Previews em: ${outDir}`);
console.log('   Abra o index.html no navegador para ver os dois lado a lado.');
