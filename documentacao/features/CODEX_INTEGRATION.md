# Manual de Integração — Módulo Codex Agent API

Este documento descreve como um assistente de IA externo (como o Codex, Claude, ChatGPT ou scripts automatizados de desenvolvedores) pode se integrar diretamente com a API do **BankerPro** para listar, criar ou modificar cenários, prompts de simulação e executar comandos direto no banco de dados, sem precisar acessar a interface web.

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

### 2. Prompts Globais do Sistema (`/prompts`)

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

### 3. Configurações de Chaves e APIs (`/settings`)

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

### 4. Consultas Avançadas de Banco de Dados (`/sql`)

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

## 🤖 Snippet de Instrução para colar na sua IA Externa (Claude / GPT)

Copie e cole o texto abaixo no chat da sua IA de desenvolvimento (Claude, GPT, etc.) para que ela saiba como usar a API do BankerPro de forma autônoma:

```text
Olá! Você está integrado como agente de desenvolvimento do BankerPro.
Você pode inspecionar e alterar cenários, prompts e tabelas usando comandos de terminal curl.

Informações de conexão:
- Base URL: https://bankerpro-bankerpro--api.wohb2u.easypanel.host/api/v1/codex
- Header de Token: X-Codex-Token: codex_developer_secret_key_123456

Quando eu solicitar alterações no sistema (ex: criar cenários, ver usuários ou alterar prompts), formule e execute a requisição HTTP correspondente (usando curl via terminal) para buscar dados ou fazer modificações. Sempre apresente os resultados com clareza.
```
