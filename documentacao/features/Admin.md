# Feature: Painel Administrativo Consolidado (Admin)

Descreve as operações exclusivas para administradores da plataforma (`user.role === 'admin'`). Todas as rotas deste módulo exigem autenticação e privilégios administrativos.

Todas as rotas administrativas estão sob o prefixo `/api/v1/admin`.

---

## 🛣️ Endpoints

### 1. Cenários de Simulação (`/admin/scenarios`)
Gerencia o catálogo de cenários comerciais disponíveis para os treinamentos dos bancários.

* **Listar Cenários (`GET /admin/scenarios`):**
  - **Resposta (200 OK):**
    ```json
    {
      "success": true,
      "message": "Todos os cenários de atendimento.",
      "data": [
        { "id": "scenario-uuid", "title": "Cenário Consórcio", "difficulty": "Iniciante" }
      ]
    }
    ```

* **Criar Cenário (`POST /admin/scenarios`):**
  - **Payload de Entrada (JSON):**
    ```json
    {
      "title": "Aposentado sem Margem Consignado",
      "category": "Sem Crédito Disponível",
      "difficulty": "Intermediário",
      "clientName": "Sebastião",
      "clientAge": 68,
      "clientPersona": "Você é Sebastião, aposentado, precisa de dinheiro...",
      "openingMessage": "Olá, queria ver meu extrato e ver se tem empréstimo...",
      "userObjective": "Oferecer consórcio ou capitalização...",
      "tags": ["Consignado", "Aposentado"]
    }
    ```

* **Editar Cenário (`PUT /admin/scenarios/:id`):**
  - Permite atualização parcial ou total dos campos do cenário.

* **Excluir Cenário (`DELETE /admin/scenarios/:id`):**
  - Exclui permanentemente o cenário da base.

---

### 2. Base de Conhecimento de Produtos (`/admin/knowledge`)
Gerencia os tópicos instrucionais consultados pelos usuários na Biblioteca e injetados de forma dinâmica como contexto para o simulador de IA.

* **Listar Tópicos (`GET /admin/knowledge`):**
  - Retorna todos os tópicos de conhecimento cadastrados.

* **Criar Tópico (`POST /admin/knowledge`):**
  - **Payload de Entrada (JSON):**
    ```json
    {
      "topicTitle": "Capitalização Comercial",
      "category": "Capitalização",
      "content": "A capitalização é ideal para clientes sem disciplina..."
    }
    ```

* **Excluir Tópico (`DELETE /admin/knowledge/:id`):**
  - Remove o tópico de conhecimento cadastrado (Retorna `204 No Content`).

---

### 3. Gerenciador Dinâmico de Prompts (`/admin/prompts`)
Permite aos administradores alterar as regras de negócios, personas dos simuladores e rubricas de avaliação diretamente no banco de dados sem precisar de deploy ou desenvolvedores.

* **Listar Prompts de Sistema (`GET /admin/prompts`):**
  - Retorna todos os templates de prompts (simulation_chat, simulation_evaluate, copiloto_analyze, etc.) e seus respectivos textos.

* **Atualizar Prompt (`PUT /admin/prompts/:key`):**
  - **Payload de Entrada (JSON):**
    ```json
    {
      "content": "Você é um SIMULADOR DE CLIENTE chato e desconfiado... [novo prompt]"
    }
    ```

* **Testar Prompt Isoladamente (`POST /admin/prompts/test`):**
  - Permite submeter um prompt de sistema e mensagens para testar diretamente o comportamento no Claude.
  - **Payload de Entrada (JSON):**
    ```json
    {
      "system": "Você é um cliente da roça de café...",
      "messages": [
        { "role": "user", "content": "Olá, em que posso ajudar?" }
      ]
    }
    ```

---

### 4. Gerenciamento de Planos (`/admin/plans`)
CRUD completo para controle dinâmico dos limites de uso de planos da plataforma.

* **Listar Planos (`GET /admin/plans`):**
  - Retorna a lista de planos cadastrados por ordem de valor.

* **Criar Plano (`POST /admin/plans`):**
  - **Payload de Entrada (JSON):**
    ```json
    {
      "key": "vip_premium",
      "name": "Plano VIP Premium",
      "price": 199.90,
      "limitSimulations": -1,
      "features": ["Simulações ilimitadas", "Acesso a mentor exclusivo"]
    }
    ```

* **Atualizar Plano (`PUT /admin/plans/:id`)**
* **Excluir Plano (`DELETE /admin/plans/:id`):**
  - *(Nota: O plano gratuito padrão 'free' não pode ser excluído por segurança).*

---

### 5. Gestão de Usuários e Assinaturas (`/admin/users`)
Controle administrativo de contas de usuários, papéis (RBAC) e concessão manual de assinaturas pagas.

* **Listar Usuários (`GET /admin/users`):**
  - Retorna todos os usuários cadastrados contendo suas estatísticas de perfil (`UserProfile`) e sua assinatura ativa atual (`Subscription`).

* **Alterar Role (RBAC) (`PUT /admin/users/:id/role`):**
  - Promove ou rebaixa o nível de acesso do usuário.
  - **Payload (JSON):**
    ```json
    {
      "role": "admin"
    }
    ```

* **Atribuir Assinatura Manual (`POST /admin/users/:id/subscription`):**
  - Permite conceder planos Pro/Corporate sem necessidade de checkout ou pagamento via webhook do Mercado Pago (ex: suporte, cortesia).
  - **Payload (JSON):**
    ```json
    {
      "planKey": "pro",
      "durationDays": 90
    }
    ```

* **Excluir Conta do Usuário (`DELETE /admin/users/:id`):**
  - Remove o usuário permanentemente, executando a limpeza em cascata de suas simulações, anotações e assinaturas vinculadas.
