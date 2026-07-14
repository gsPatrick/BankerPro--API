# Referência de Variáveis de Ambiente

Este documento lista todas as variáveis de ambiente necessárias para o correto funcionamento da API do BankerPro, detalhando seus propósitos, tipos e valores de exemplo.

---

## 📋 Lista de Variáveis

| Variável | Obrigatória? | Descrição | Exemplo |
|---|---|---|---|
| `PORT` | Não (Padrão: 3001) | Porta onde o servidor Express irá escutar as conexões HTTP. | `3001` |
| `NODE_ENV` | Não (Padrão: development) | Ambiente de execução do Node.js (`development`, `production`, `test`). | `development` |
| `APP_API_PREFIX` | Não (Padrão: /api/v1) | Prefixo de versionamento global para as rotas da API. | `/api/v1` |
| `DB_HOST` | Sim | Endereço (IP ou Hostname) do banco de dados PostgreSQL. | `127.0.0.1` |
| `DB_PORT` | Não (Padrão: 5432) | Porta de conexão do PostgreSQL. | `5432` |
| `DB_USER` | Sim | Nome de usuário para autenticação no PostgreSQL. | `postgres` |
| `DB_PASSWORD` | Sim | Senha do usuário do banco de dados PostgreSQL. | `postgres` |
| `DB_NAME` | Sim | Nome do banco de dados a ser utilizado. | `bankerpro_db` |
| `DB_LOGGING` | Não (Padrão: false) | Habilita os logs das queries SQL geradas pelo Sequelize no console (`true`/`false`). | `true` |
| `JWT_SECRET` | Sim (Produção) | Chave secreta usada para assinar e verificar tokens JWT de autenticação. | `qualquer_chave_secreta_longa_e_segura` |
| `JWT_EXPIRES_IN` | Não (Padrão: 7d) | Tempo de expiração do token JWT. | `7d` |
| `ANTHROPIC_API_KEY` | Sim (Integração IA) | Chave da API da Anthropic para chamadas aos modelos Claude. | `sk-ant-api03-...` |
| `MP_ACCESS_TOKEN` | Sim (Integração Gateway) | Access Token do Mercado Pago para controle de assinaturas recorrentes. | `APP_USR-...` |
| `WHATSAPP_API_TOKEN` | Não | Token de autenticação do provedor de envio de WhatsApp. | `token_whatsapp_aqui` |
