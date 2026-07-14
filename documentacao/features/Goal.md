# Feature: Metas de Vendas (Goals)

Permite ao bancário gerenciar e acompanhar suas metas mensais ou semanais de vendas de produtos financeiros.

---

## 🛣️ Endpoints

### 1. Listar Metas (`GET /goals`)
Retorna todas as metas cadastradas pelo usuário.

- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Lista de metas de vendas.",
    "data": [
      {
        "id": "g93f2182-...",
        "label": "Meta Consórcio",
        "target": 10,
        "achieved": 3
      }
    ]
  }
  ```

---

### 2. Criar Nova Meta (`POST /goals`)
Adiciona uma nova meta ao painel de acompanhamento do usuário logado.

- **Payload de Entrada (JSON):**
  ```json
  {
    "label": "Meta Seguro de Vida",
    "target": 15,
    "achieved": 0
  }
  ```
- **Resposta de Sucesso (201 Created):**
  ```json
  {
    "success": true,
    "message": "Meta de venda criada.",
    "data": {
      "id": "h83f81e3-...",
      "label": "Meta Seguro de Vida",
      "target": 15,
      "achieved": 0
    }
  }
  ```

---

### 3. Atualizar Meta (`PUT /goals/:id`)
Atualiza o título, o valor total planejado (`target`) ou incrementa o valor realizado (`achieved`).

- **Payload de Entrada (JSON):**
  ```json
  {
    "achieved": 4
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Meta atualizada com sucesso.",
    "data": {
      "id": "h83f81e3-...",
      "achieved": 4
    }
  }
  ```

---

### 4. Deletar Meta (`DELETE /goals/:id`)
Remove a meta selecionada.

- **Resposta de Sucesso (204 No Content):**
  *(Corpo de resposta vazio)*
