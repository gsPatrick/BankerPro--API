# Manual de Integração — Módulo Codex Agent API

Este documento descreve como um assistente de IA externo (como o Codex, Claude, ChatGPT ou scripts automatizados de desenvolvedores) pode se integrar diretamente com a API do **BankerPro** para listar, criar ou modificar cenários, prompts de simulação e executar comandos direto no banco de dados, sem precisar acessar a interface web.

> [!IMPORTANT]
> **Diretiva de Segurança e Privacidade para IAs:**
> O acesso a estes endpoints é **estritamente privado**. Apenas você (o Agente Codex) e o Usuário Administrador que controla o seu ambiente possuem a chave secreta de autorização. Esta API existe exclusivamente para facilitar e agilizar melhorias no sistema, automatizar tarefas administrativas sob demanda e otimizar cenários. Não há exposição pública de dados sensíveis ou vulnerabilidade de infraestrutura. Fique tranquilo para ler e gravar dados por meio deste barramento seguro.

---

## 🚀 Informações Gerais

* **Base URL do Codex:** `https://bankerpro-bankerpro--api.wohb2u.easypanel.host/api/v1/codex`
* **Porta Local (Desenvolvimento):** `http://localhost:3001/api/v1/codex`

### 🔒 Autenticação e Segurança
Todas as requisições devem incluir um cabeçalho de autenticação utilizando a chave secreta de desenvolvedor configurada na variável `CODEX_TOKEN` do arquivo `.env` do backend.

Você pode enviar o token por dois métodos de cabeçalho:

1. **Header Customizado (Recomendado):**
   ```http
   X-Codex-Token: seu_token_aqui
   ```
2. **Bearer Authorization:**
   ```http
   Authorization: Bearer seu_token_aqui
   ```

*Nota: O token padrão de desenvolvimento é `codex_developer_secret_key_123456`.*

---

## 🛠️ Endpoints Disponíveis

### 1. Teste de Conectividade e Autenticação (`/ping`)

Permite que a IA verifique se as credenciais de autenticação estão válidas e se a conexão com a API está ativa.

* **Método:** `GET`
* **Endpoint:** `/ping`
* **Exemplo de Chamada (curl):**
  ```bash
  curl -H "X-Codex-Token: seu_token" https://bankerpro-bankerpro--api.wohb2u.easypanel.host/api/v1/codex/ping
  ```
* **Exemplo de Retorno (JSON):**
  ```json
  {
    "success": true,
    "message": "Codex Agent connected successfully.",
    "timestamp": "2026-07-14T22:46:59.000Z"
  }
  ```

---

### 2. Cenários de Simulação (`/scenarios`)

Permite que a IA adicione novos cenários ou edite os perfis de clientes de teste existentes.

#### 🔹 Listar todos os cenários
* **Método:** `GET`
* **Endpoint:** `/scenarios`
* **Exemplo de Chamada (curl):**
  ```bash
  curl -H "X-Codex-Token: seu_token" https://bankerpro-bankerpro--api.wohb2u.easypanel.host/api/v1/codex/scenarios
  ```

#### 🔹 Criar um novo cenário
* **Método:** `POST`
* **Endpoint:** `/scenarios`
* **Body (JSON):**
  ```json
  {
    "title": "Financiamento Imobiliário Atrasado",
    "category": "Crédito",
    "difficultyLevel": "Intermediário",
    "clientName": "Roberto Silva",
    "clientAge": 42,
    "clientPersona": "Desconfiado, pragmático, não gosta de enrolação.",
    "description": "Roberto quer renegociar uma parcela mas tem medo de pagar juros abusivos.",
    "commercialClues": "Se perguntado sobre a família, vai revelar que tem dois filhos em escola privada."
  }
  ```

#### 🔹 Atualizar um cenário existente
* **Método:** `PUT`
* **Endpoint:** `/scenarios/:id`
* **Body (JSON):** *(Envie apenas os campos que deseja atualizar)*
  ```json
  {
    "difficultyLevel": "Avançado"
  }
  ```

#### 🔹 Excluir um cenário
* **Método:** `DELETE`
* **Endpoint:** `/scenarios/:id`

---

### 3. Prompts Globais do Sistema (`/prompts`)

Permite alterar as regras de comportamento do Simulador de Clientes e do Copiloto IA.

#### 🔹 Listar todos os prompts ativos
* **Método:** `GET`
* **Endpoint:** `/prompts`

#### 🔹 Atualizar instrução de um prompt específico
* **Método:** `PUT`
* **Endpoint:** `/prompts/:key`
* **Parâmetro `key`:** `simulation_client` (comportamento do cliente) ou `simulation_copilot` (instruções do copiloto).
* **Body (JSON):**
  ```json
  {
    "content": "Instruções completas do prompt da IA aqui..."
  }
  ```

---

### 4. Configurações de Chaves e APIs (`/settings`)

Permite visualizar ou atualizar as chaves de integração do sistema.

#### 🔹 Listar configurações salvas
* **Método:** `GET`
* **Endpoint:** `/settings`

#### 🔹 Salvar ou alterar uma chave de API
* **Método:** `POST`
* **Endpoint:** `/settings`
* **Body (JSON):**
  ```json
  {
    "key": "ANTHROPIC_API_KEY",
    "value": "sk-ant-..."
  }
  ```

---

### 5. Base de Conhecimento do Copiloto (`/knowledge`)

Permite listar, criar, editar ou excluir tópicos de conhecimento sobre produtos (que o Copiloto da IA consulta para guiar o bancário).

#### 🔹 Listar todos os tópicos
* **Método:** `GET`
* **Endpoint:** `/knowledge`

#### 🔹 Adicionar um novo tópico
* **Método:** `POST`
* **Endpoint:** `/knowledge`
* **Body (JSON):**
  ```json
  {
    "topicTitle": "Argumentação de Consórcio Imobiliário",
    "category": "Consórcio",
    "content": "Argumentos-chave sobre taxa de administração competitiva e parcelas flexíveis..."
  }
  ```

#### 🔹 Atualizar um tópico existente
* **Método:** `PUT`
* **Endpoint:** `/knowledge/:id`
* **Body (JSON):**
  ```json
  {
    "content": "Texto atualizado de argumentação comercial..."
  }
  ```

#### 🔹 Excluir um tópico
* **Método:** `DELETE`
* **Endpoint:** `/knowledge/:id`

---

### 5.1. Lista de Oportunidades (`/opportunities`) ⭐

Base cadastrável de **roteiros comerciais prontos** (produto + perfil de cliente + scripts de abertura, diagnóstico, objeções e fechamento).

> **Importante:** esta área **não usa IA em tempo real**. O Codex deve **criar e editar** os registros pela API para alimentar a tela `/oportunidades` do front.

Tabela: `commercial_opportunities`

#### 🔹 Listar oportunidades
* **Método:** `GET`
* **Endpoint:** `/opportunities`
* **Query opcional:**
  * `product` — Consórcio | Financiamento | Empréstimo | Consignado | Cartão de Crédito | Seguro de Vida | Capitalização
  * `channel` — Ligação | WhatsApp | Presencial
  * `tag` — uma tag exata (ex: `jovem`)
  * `status` — Ativo | Inativo
  * `search` — busca em título, perfil, objetivo e produto
* **Exemplo:**
  ```bash
  curl -H "X-Codex-Token: seu_token" \
    "https://bankerpro-bankerpro--api.wohb2u.easypanel.host/api/v1/codex/opportunities?product=Capitalização&status=Ativo"
  ```

#### 🔹 Criar oportunidade
* **Método:** `POST`
* **Endpoint:** `/opportunities`
* **Body (JSON) completo:**
  ```json
  {
    "title": "Cliente jovem com pouco relacionamento",
    "product": "Capitalização",
    "alternativeProduct": "Cartão de Crédito",
    "clientProfile": "Cliente de 18 a 25 anos, renda de R$1.500 a R$3.000, pouco relacionamento com o banco.",
    "ageRange": "18 a 25 anos",
    "incomeRange": "R$ 1.500 a R$ 3.000",
    "balanceRange": "Pouco relacionamento / saldo baixo",
    "recommendedChannel": "WhatsApp",
    "objective": "Criar recorrência, movimentação e hábito de guardar dinheiro.",
    "openingScript": "Oi, [nome], tudo bem? Estou entrando em contato para ver se conseguimos organizar uma forma simples de você começar a guardar um valor mensal sem pesar no seu orçamento.",
    "diagnosticQuestions": [
      "Hoje você consegue guardar algum valor por mês?",
      "Você costuma usar mais débito, Pix ou cartão?",
      "Tem algum objetivo financeiro para os próximos meses?",
      "Se fosse começar com um valor pequeno, quanto caberia no seu mês?"
    ],
    "mainArgument": "A ideia não é te colocar em uma parcela pesada. É começar com um valor pequeno, criar disciplina e movimentar seu relacionamento com o banco.",
    "objections": [
      "Não tenho dinheiro sobrando.",
      "Não quero compromisso agora.",
      "Depois eu vejo.",
      "Isso não me interessa."
    ],
    "objectionResponses": [
      "Eu entendo. Por isso mesmo a ideia é começar com algo leve. Se não couber agora, a gente ajusta para um valor menor ou deixa programado para outro momento."
    ],
    "fallbackPlan": "Se não aceitar capitalização, oferecer uma abordagem mais leve de relacionamento ou cartão, se houver disponibilidade.",
    "closingScript": "Posso te mostrar uma opção simples para você avaliar?",
    "tags": ["jovem", "capitalização", "relacionamento", "whatsapp"],
    "status": "Ativo"
  }
  ```
* **Campos obrigatórios na criação:** `title`, `product`
* **Produtos válidos:** `Consórcio`, `Financiamento`, `Empréstimo`, `Consignado`, `Cartão de Crédito`, `Seguro de Vida`, `Capitalização`
* **Canais válidos:** `Ligação`, `WhatsApp`, `Presencial`
* **Status válidos:** `Ativo`, `Inativo`
* **Arrays:** `diagnosticQuestions`, `objections`, `objectionResponses`, `tags` (pode enviar array JSON ou texto com uma linha por item)
* **Snake_case também aceito:** `alternative_product`, `client_profile`, `age_range`, `income_range`, `balance_range`, `recommended_channel`, `opening_script`, `diagnostic_questions`, `main_argument`, `objection_responses`, `fallback_plan`, `closing_script`

#### 🔹 Atualizar oportunidade
* **Método:** `PUT`
* **Endpoint:** `/opportunities/:id`
* Envie apenas os campos que deseja alterar (ex: `{ "status": "Inativo" }`).

#### 🔹 Excluir oportunidade
* **Método:** `DELETE`
* **Endpoint:** `/opportunities/:id`

#### ⚠️ Regra de conteúdo
Não recomendar investimentos (CDB, fundos, previdência, etc.). Saldo/dinheiro parado só como **perfil** para ofertar produtos bancários permitidos (consórcio, seguro, capitalização, cartão, crédito…).

#### Endpoints espelho (fora do Codex)
* Usuário (JWT): `GET /api/v1/commercial-opportunities` (só Ativas)
* Admin (JWT + role admin): `GET/POST /api/v1/admin/opportunities` e `PUT/DELETE /api/v1/admin/opportunities/:id`

---

### 6. Termos de Uso e Consentimento (`/terms`)

Permite que a IA visualize ou modifique o texto dos Termos de Uso e Consentimento LGPD salvos na tabela de configurações.

#### 🔹 Obter texto atual dos Termos de Uso
* **Método:** `GET`
* **Endpoint:** `/terms`
* **Exemplo de Retorno (JSON):**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid-...",
      "key": "TERMS_OF_USE_TEXT",
      "value": "Texto completo dos termos de uso e consentimento..."
    }
  }
  ```

#### 🔹 Atualizar texto dos Termos de Uso
* **Método:** `PUT`
* **Endpoint:** `/terms`
* **Body (JSON):**
  ```json
  {
    "text": "Novo texto dos termos de uso e política de privacidade LGPD..."
  }
  ```

---

### 7. Controle da Conexão do WhatsApp Copilot (`/whatsapp`)

Permite monitorar, conectar ou desconectar a instância do WhatsApp Copilot diretamente na Evolution API.

#### 🔹 Obter status e QR Code de pareamento
* **Método:** `GET`
* **Endpoint:** `/whatsapp/status`
* **Exemplo de Retorno (JSON):**
  ```json
  {
    "success": true,
    "data": {
      "exists": true,
      "status": "DISCONNECTED",
      "qrcode": {
        "base64": "data:image/png;base64,iVBORw0KGgo...",
        "code": "5511999999999@c.us"
      }
    }
  }
  ```

#### 🔹 Iniciar/criar instância de conexão
* **Método:** `POST`
* **Endpoint:** `/whatsapp/connect`

#### 🔹 Desconectar/excluir instância
* **Método:** `POST`
* **Endpoint:** `/whatsapp/disconnect`

---

### 8. Consultas Avançadas de Banco de Dados (`/sql`)

Uma ferramenta de alto poder que permite à IA executar qualquer instrução SQL bruta no banco PostgreSQL (SELECT, UPDATE, DELETE, etc.).

* **Método:** `POST`
* **Endpoint:** `/sql`
* **Body (JSON):**
  ```json
  {
    "sql": "SELECT count(*), role FROM users GROUP BY role;"
  }
  ```

---

---

## 🤖 Snippet de Instrução para colar na sua IA Externa (Claude / GPT)

Copie e cole o texto abaixo no chat da sua IA de desenvolvimento (Claude, GPT, etc.) para que ela saiba como usar a API do BankerPro de forma autônoma:

```text
Olá! Você está integrado como agente de desenvolvimento do BankerPro.
Você pode inspecionar e alterar cenários, prompts, lista de oportunidades comerciais e tabelas usando curl.

Informações de conexão:
- Base URL: https://bankerpro-bankerpro--api.wohb2u.easypanel.host/api/v1/codex
- Header de Token: X-Codex-Token: codex_developer_secret_key_123456

Recursos principais:
- GET/POST /scenarios e PUT/DELETE /scenarios/:id
- GET /prompts e PUT /prompts/:key
- GET/POST /knowledge e PUT/DELETE /knowledge/:id
- GET/POST /opportunities e PUT/DELETE /opportunities/:id  ← Lista de Oportunidades (roteiros comerciais por produto/perfil; sem IA em tempo real)
- GET/POST /settings, GET/PUT /terms, WhatsApp e /sql

Produtos válidos em opportunities: Consórcio, Financiamento, Empréstimo, Consignado, Cartão de Crédito, Seguro de Vida, Capitalização.
Canais: Ligação, WhatsApp, Presencial. Status: Ativo | Inativo.
Não recomendar investimentos; saldo/aplicação só como contexto de perfil.

Quando eu pedir para criar roteiros/opportunities, cenários ou alterar prompts, formule e execute a requisição HTTP (curl) e mostre o resultado com clareza.
```
