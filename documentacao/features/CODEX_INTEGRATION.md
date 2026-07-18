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

Tabela: `scenarios`

> [!IMPORTANT]
> Os campos são enviados **exatamente** com os nomes abaixo, em camelCase. O endpoint de cenários **não** faz conversão de nomes: um campo com nome errado é **ignorado em silêncio** (no `POST` isso derruba a criação se o campo for obrigatório; no `PUT` a requisição retorna sucesso sem alterar nada).

#### 📋 Campos do cenário

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `title` | texto | ✅ | Título do cenário |
| `category` | texto | ✅ | Precisa ser um dos valores válidos (ver abaixo) |
| `difficulty` | texto | ✅ | `Iniciante`, `Intermediário` ou `Avançado` |
| `clientName` | texto | ✅ | Nome do cliente simulado |
| `clientPersona` | texto | ✅ | Personalidade/comportamento do cliente na simulação |
| `openingMessage` | texto | ✅ | Primeira fala do cliente ao abrir a simulação |
| `description` | texto | — | Resumo da situação |
| `clientAge` | número | — | Idade do cliente |
| `clientProfile` | texto | — | Perfil financeiro / relacionamento com o banco |
| `userObjective` | texto | — | O que o bancário precisa alcançar |
| `commercialClues` | texto | — | Pistas que o cliente revela se questionado |
| `mainProduct` | texto | — | Produto principal do cenário |
| `supportProducts` | texto | — | Produtos de apoio |
| `evaluationCriteria` | texto | — | Critérios de avaliação do desempenho |
| `tags` | array de texto | — | Padrão: `[]` |

* **Categorias válidas (`category`):** `Caixa e Balcão`, `Mesa Comercial`, `Conta e Relacionamento`, `Crédito Disponível`, `Sem Crédito Disponível`, `Produto Já Contratado`, `Aposentado/Consignado`, `Cartão`, `MEI/Pequeno Negócio`
* **Dificuldades válidas (`difficulty`):** `Iniciante`, `Intermediário`, `Avançado`

#### 🔹 Listar todos os cenários
* **Método:** `GET`
* **Endpoint:** `/scenarios`
* **Ordenação:** do mais recente para o mais antigo.
* **Exemplo de Chamada (curl):**
  ```bash
  curl -H "X-Codex-Token: seu_token" https://bankerpro-bankerpro--api.wohb2u.easypanel.host/api/v1/codex/scenarios
  ```
* **Exemplo de Retorno (JSON):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-...",
        "title": "Renegociação de financiamento imobiliário",
        "category": "Crédito Disponível",
        "difficulty": "Intermediário",
        "clientName": "Roberto Silva",
        "clientAge": 42,
        "clientPersona": "Desconfiado, pragmático, não gosta de enrolação.",
        "openingMessage": "Olha, eu só quero entender por que a minha parcela subiu.",
        "tags": [],
        "created_at": "2026-07-16T12:00:00.000Z",
        "updated_at": "2026-07-16T12:00:00.000Z"
      }
    ]
  }
  ```
  > **Atenção:** os campos do cenário vêm em camelCase, mas os carimbos de data/hora vêm em snake_case (`created_at` / `updated_at`). Isso vale para todos os recursos da API.

#### 🔹 Criar um novo cenário
* **Método:** `POST`
* **Endpoint:** `/scenarios`
* **Body (JSON):**
  ```json
  {
    "title": "Renegociação de financiamento imobiliário",
    "category": "Crédito Disponível",
    "difficulty": "Intermediário",
    "clientName": "Roberto Silva",
    "clientAge": 42,
    "clientPersona": "Desconfiado, pragmático, não gosta de enrolação.",
    "openingMessage": "Olha, eu só quero entender por que a minha parcela subiu.",
    "description": "Roberto quer renegociar uma parcela mas tem medo de pagar juros abusivos.",
    "clientProfile": "Cliente há 8 anos, financiamento ativo, sem atraso até agora.",
    "userObjective": "Reconstruir a confiança e apresentar a renegociação sem parecer venda.",
    "commercialClues": "Se perguntado sobre a família, vai revelar que tem dois filhos em escola privada.",
    "mainProduct": "Financiamento",
    "supportProducts": "Seguro de Vida",
    "evaluationCriteria": "Acolheu a objeção antes de ofertar? Explicou os juros com clareza?",
    "tags": ["financiamento", "renegociação"]
  }
  ```

#### 🔹 Atualizar um cenário existente
* **Método:** `PUT`
* **Endpoint:** `/scenarios/:id`
* **Body (JSON):** *(Envie apenas os campos que deseja atualizar)*
  ```json
  {
    "difficulty": "Avançado"
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
* **Keys existentes:**

| Key | O que controla |
|---|---|
| `simulation_chat` | Como o cliente simulado se comporta na simulação |
| `simulation_evaluate` | A avaliação e a nota ao fim da simulação |
| `simulation_extract_learning` | O aprendizado comercial extraído da simulação |
| `copiloto_analyze` | O plano de negociação do Copiloto IA |
| `approach_generate` | O Gerador de abordagens |
| `knowledge_polish` | O polimento dos tópicos da base de conhecimento |
| `audio_analysis` | A **Análise de Negociação por Áudio** (ver seção 10) |

> Rode `GET /prompts` para conferir as keys existentes antes de atualizar: uma key errada retorna 404 e nada é alterado.
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

Tabela: `product_knowledges`

#### 📋 Campos do tópico

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `topicTitle` | texto | ✅ | Título do tópico |
| `category` | texto | ✅ | Precisa ser um dos valores válidos (ver abaixo) |
| `content` | texto | — | Conteúdo do conhecimento |

* **Categorias válidas (`category`):** `Geral`, `Investimentos`, `Previdência`, `Seguros`, `Crédito`, `Cartões`, `Consórcio`, `Capitalização`
  * Os nomes são validados **exatamente** (case-sensitive). Um valor fora da lista é recusado com `Validation isIn on category failed`. Atenção aos plurais: é `Seguros` (não `Seguro`) e `Cartões` (não `Cartão`).
  * **`Geral`** é para conhecimentos que **não são de um produto específico** — abordagem humanizada, cross-sell, plano B, sem crédito disponível, produto já contratado, persistência comercial, oferta completa, régua de renda, transição após resolver problema, abordagem sem valor específico, etc.

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
* **Exemplo com a categoria `Geral`:**
  ```json
  {
    "topicTitle": "Abordagem humanizada na abertura",
    "category": "Geral",
    "content": "Antes de ofertar qualquer produto, acolha o cliente e faça o diagnóstico da necessidade real..."
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

### 9. Planos de Assinatura (`/plans`) ⭐

Permite listar, criar, editar e excluir os planos. A coluna `permissions` é o que **bloqueia ou libera as telas** para o assinante — é a parte mais sensível deste endpoint.

Tabela: `plans`

> [!IMPORTANT]
> Use estes endpoints em vez de `/sql` para mexer em planos. Eles validam as keys de permissão e impedem excluir um plano em uso; o SQL cru aceita qualquer coisa e quebra o acesso em silêncio.

#### 📋 Campos do plano

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `key` | texto | ✅ (na criação) | Identificador único, com sufixo de cobrança: `_monthly` ou `_yearly` (ex: `standard_monthly`). **É o sufixo que separa os planos no seletor Mensal/Anual da landing.** Não pode ser alterada depois — `subscriptions.plan` aponta para ela |
| `name` | texto | ✅ | Nome visível (ex: `Standard - Mensal`) |
| `price` | número | — | Preço em reais (ex: `29.00`). Padrão: `0` |
| `limitSimulations` | número | — | Simulações por mês. `-1` = ilimitado. Padrão: `10` |
| `permissions` | array de texto | — | Funcionalidades liberadas. Só aceita as keys abaixo. **Padrão: vazio (nada liberado)** |
| `features` | array de texto | — | **Legado — não use.** O card do plano é montado a partir de `permissions` + `limitSimulations` |

#### 🔑 Keys válidas em `permissions`

| Key | Tela que libera |
|---|---|
| `cenarios` | Cenários (e iniciar simulações) |
| `historico` | Histórico |
| `ranking` | Ranking |
| `carteira` | Carteira |
| `agenda` | Agenda |
| `metas` | Metas |
| `anotacoes` | Anotações |
| `copiloto` | Copiloto IA |
| `oportunidades` | Lista de Oportunidades |
| `gerador` | Gerador de abordagens |
| `analise_audio` | Análise de Áudio (painel e WhatsApp) |
| `whatsapp_copilot` | Copiloto no WhatsApp |

Painel, Perfil, Configurações e Planos são sempre liberados e não têm key — bloquear a tela de Planos impediria o próprio upgrade.

#### 🔹 Consultar as keys válidas
Sempre disponível na API, para não depender desta tabela ficar atualizada.

* **Método:** `GET`
* **Endpoint:** `/plans/features`
* **Exemplo de Retorno (JSON):**
  ```json
  {
    "success": true,
    "data": [
      { "key": "cenarios", "label": "Cenários" },
      { "key": "anotacoes", "label": "Anotações" }
    ]
  }
  ```

#### 🔹 Listar todos os planos
* **Método:** `GET`
* **Endpoint:** `/plans`
* Retorna também os planos internos (prefixo `admin_`), que ficam fora da vitrine pública.

#### 🔹 Criar um plano
* **Método:** `POST`
* **Endpoint:** `/plans`
* **Body (JSON):**
  ```json
  {
    "key": "starter_monthly",
    "name": "Starter - Mensal",
    "price": 19.00,
    "limitSimulations": 10,
    "permissions": ["cenarios", "historico"]
  }
  ```

#### 🔹 Atualizar um plano
* **Método:** `PUT`
* **Endpoint:** `/plans/:id` *(o `id` é o UUID, não a key)*
* **Body (JSON):** *(envie apenas o que deseja alterar; `key` não é alterável)*
  ```json
  {
    "permissions": ["cenarios", "historico", "anotacoes", "metas"]
  }
  ```

#### 🔹 Excluir um plano
* **Método:** `DELETE`
* **Endpoint:** `/plans/:id`
* Recusa com `PLAN_IN_USE` se houver assinatura apontando para o plano — migre as assinaturas antes.

#### ⚠️ Erros específicos

| Código | Quando acontece |
|---|---|
| `INVALID_PLAN_PERMISSION` | Uma key fora do catálogo. A mensagem lista as válidas |
| `PLAN_ALREADY_EXISTS` | Já existe plano com essa `key` |
| `PLAN_IN_USE` | Exclusão de plano com assinaturas vinculadas |
| `PLAN_NOT_FOUND` | `id` inexistente |

> [!IMPORTANT]
> **O card do plano é derivado.** Alterar `permissions` muda automaticamente o que aparece na landing e no checkout — não existe texto de marketing separado para manter em sincronia. Um plano sem permissão nenhuma mostra só a linha do limite de simulações, e o assinante não acessa nada.

> **Planos internos:** keys com o prefixo `admin_` (ex: `admin_unlimited`) são da equipe. Ficam fora da vitrine pública, não entram no resumo financeiro e são recusados no checkout. Não os exponha nem os ofereça.

---

### 10. Análise de Negociação por Áudio

O usuário grava ou envia o áudio de um atendimento real — pelo painel ou pelo WhatsApp — e recebe o feedback de um treinador comercial. Fica salvo no histórico dele.

**Não há endpoint de áudio no Codex**, e isso é proposital: o áudio pertence ao usuário e a análise é gravada na conta dele. O que o Codex controla aqui é o **prompt** e a **permissão de plano**.

#### Como funciona por dentro

| Etapa | Onde roda |
|---|---|
| 1. Recebe o áudio | Painel (`POST /api/v1/audio-analysis`) ou webhook do WhatsApp |
| 2. Transcreve | **OpenAI Whisper** — a API da Anthropic aceita texto, imagem e PDF, mas **não recebe áudio** |
| 3. Analisa a transcrição | **Claude**, com o prompt `audio_analysis` |
| 4. Salva o histórico | Tabela `audio_analyses` |

O arquivo de áudio é **apagado assim que a transcrição sai** — é gravação de negociação real com cliente e não fica parada no servidor. O que persiste é a transcrição e a análise.

#### 🔹 Ajustar o comportamento da análise
É o prompt `audio_analysis`, editável como qualquer outro:

```bash
curl -H "X-Codex-Token: seu_token" \
  https://bankerpro-bankerpro--api.wohb2u.easypanel.host/api/v1/codex/prompts
```

Variáveis disponíveis no template:

| Variável | Conteúdo |
|---|---|
| `{{transcricao}}` | A conversa transcrita. **Obrigatória** — sem ela a IA analisa o vazio |
| `{{produtos_identificados}}` | Categorias da base de conhecimento citadas no áudio, se houver |
| `{{contexto}}` | Contexto opcional informado pelo usuário |

> [!IMPORTANT]
> **A análise é sobre a qualidade da conversa comercial, não sobre o produto.** O prompt proíbe explicitamente entrar em taxa, parcela, renda, margem, prazo, viabilidade financeira, compliance e LGPD. Ao editar, preserve essas proibições — elas são a regra de negócio da funcionalidade, não enfeite.
>
> Exemplo do que **não** deve sair: *"O cliente não fechou porque a parcela ficou alta para a renda dele."*
> Exemplo do que **deve** sair: *"O cliente demonstrou resistência quando percebeu compromisso na proposta. Faltou investigar o motivo antes de insistir."*

#### 🔹 Liberar a funcionalidade num plano
A permissão é `analise_audio` (ver seção 9). Vale para os dois canais: sem ela, o painel bloqueia e o WhatsApp responde convidando ao upgrade.

#### ⚙️ Configuração necessária
A transcrição depende da chave `OPENAI_API_KEY`, cadastrada em `/settings` (ou no painel administrativo). Sem ela, a funcionalidade responde `TRANSCRIPTION_NOT_CONFIGURED` e nada é analisado.

```json
{
  "key": "OPENAI_API_KEY",
  "value": "sk-..."
}
```

#### ⚠️ Erros específicos

| Código | Quando acontece |
|---|---|
| `TRANSCRIPTION_NOT_CONFIGURED` | `OPENAI_API_KEY` não cadastrada |
| `TRANSCRIPTION_UNAUTHORIZED` | A chave da OpenAI foi recusada |
| `AUDIO_TOO_LARGE` | Áudio acima de 25MB (limite do Whisper) |
| `AUDIO_EMPTY` | Não foi identificada fala no áudio |
| `PLAN_FEATURE_DENIED` | O plano do usuário não inclui `analise_audio` |

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
- GET/POST /plans e PUT/DELETE /plans/:id  ← Planos e o que cada um libera. GET /plans/features lista as keys válidas
- GET /prompts e PUT /prompts/:key
- GET/POST /knowledge e PUT/DELETE /knowledge/:id
- GET/POST /opportunities e PUT/DELETE /opportunities/:id  ← Lista de Oportunidades (roteiros comerciais por produto/perfil; sem IA em tempo real)
- GET/POST /settings, GET/PUT /terms, WhatsApp e /sql

Produtos válidos em opportunities: Consórcio, Financiamento, Empréstimo, Consignado, Cartão de Crédito, Seguro de Vida, Capitalização.
Canais: Ligação, WhatsApp, Presencial. Status: Ativo | Inativo.
Não recomendar investimentos; saldo/aplicação só como contexto de perfil.

Em knowledge, os campos são topicTitle, category e content. A category é validada exatamente (case-sensitive) contra: Geral, Investimentos, Previdência, Seguros, Crédito, Cartões, Consórcio, Capitalização (repare nos plurais: Seguros e Cartões). Valor fora da lista é recusado com "Validation isIn on category failed". Use Geral para conhecimentos que não são de um produto específico (abordagem, cross-sell, plano B, persistência comercial, oferta completa, etc.).

Em plans, permissions é o que libera as telas do assinante. Use GET/POST /plans e PUT/DELETE /plans/:id — nunca SQL cru, que aceita key inválida sem erro.
Keys válidas: cenarios, historico, ranking, carteira, agenda, metas, anotacoes, copiloto, oportunidades, gerador, analise_audio, whatsapp_copilot (confirme em GET /plans/features).

A Análise de Negociação por Áudio usa o prompt audio_analysis e a permissão analise_audio. O áudio é transcrito pelo Whisper (a Anthropic não recebe áudio) e analisado pelo Claude; o arquivo é apagado após a transcrição. A análise é sobre a QUALIDADE DA CONVERSA COMERCIAL: ao editar o prompt, mantenha as proibições de falar de taxa, parcela, renda, margem, prazo, viabilidade, compliance e LGPD. Requer a chave OPENAI_API_KEY em /settings.
O campo features é legado e ignorado: o card do plano é montado a partir de permissions + limitSimulations.
A key do plano precisa terminar em _monthly ou _yearly (é o sufixo que separa Mensal/Anual na landing) e nunca deve ser alterada depois de criada: subscriptions.plan aponta para ela.
Plano novo nasce sem permissão nenhuma. Planos com prefixo admin_ são internos da equipe — não exponha nem ofereça.

Em scenarios, os nomes dos campos são exatos e não há conversão automática — campo com nome errado é ignorado em silêncio.
Obrigatórios: title, category, difficulty, clientName, clientPersona, openingMessage.
category: Caixa e Balcão | Mesa Comercial | Conta e Relacionamento | Crédito Disponível | Sem Crédito Disponível | Produto Já Contratado | Aposentado/Consignado | Cartão | MEI/Pequeno Negócio.
difficulty: Iniciante | Intermediário | Avançado (o campo chama-se difficulty, NÃO difficultyLevel).
Opcionais: description, clientAge, clientProfile, userObjective, commercialClues, mainProduct, supportProducts, evaluationCriteria, tags.
Nas respostas, os campos vêm em camelCase, mas as datas vêm como created_at e updated_at.

Quando eu pedir para criar roteiros/opportunities, cenários ou alterar prompts, formule e execute a requisição HTTP (curl) e mostre o resultado com clareza.
```
