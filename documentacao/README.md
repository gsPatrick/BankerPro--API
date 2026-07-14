# BankerPro Backend API — Documentação

Bem-vindo à documentação oficial da API do **BankerPro**! Este diretório centraliza todas as informações necessárias para rodar, configurar, desenvolver e dar manutenção no sistema.

---

## 🗂️ Índice de Documentos

1. [Guia de Onboarding (Iniciar Aqui)](./ONBOARDING.md) — Como configurar e rodar o projeto localmente, gerenciar o banco de dados e dar os primeiros passos.
2. [Referência de Variáveis de Ambiente](./ENV_REFERENCE.md) — Descrição detalhada de cada variável de ambiente (`.env`).

---

## 🏗️ Arquitetura e Organização

O projeto segue uma arquitetura orientada a capacidades de negócio (**Features**), encapsulando rotas, controladores e serviços em pastas dedicadas.

### Convenções de Estrutura

- **`app.js`**: Arquivo de inicialização na raiz do projeto. Responsável por carregar o `.env`, inicializar o Express, configurar middlewares globais e escutar a porta HTTP.
- **`src/config/`**: Configurações compartilhadas como banco de dados (`database.js`) e constantes de negócio (`constants.js`).
- **`src/models/`**: Definição dos modelos de dados do Sequelize e suas associações em um arquivo index centralizador.
- **`src/features/`**: Código de negócio subdividido em subpastas por domínio (ex: `user/`, `simulation/`). Cada uma contendo seus respectivos `.routes.js`, `.controller.js` e `.service.js`.
- **`src/routes/`**: Centralização de roteamento da API. Agrega os sub-roteadores das features sob o prefixo `/api/v1/`.
- **`src/middlewares/`**: Middlewares globais e transversais (autenticação, CORS, tratamento de erros).
- **`src/providers/`**: Adaptadores e clientes para integrações com serviços externos (OpenAI/Anthropic, Mercado Pago, etc.).
- **`src/utils/`**: Helpers genéricos e utilitários puros.
