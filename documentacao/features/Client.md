# Feature: Clientes (CRM / Carteira)

Gerencia a carteira de contatos comerciais, acompanhamento de retornos e histórico de abordagens de cada bancário.

---

## 🛣️ Endpoints

### 1. Listar Clientes (`GET /clients`)
Retorna a lista de clientes cadastrados pelo usuário. Suporta filtros por status e termos de busca.

- **Query Parameters:**
  - `status`: Filtro por status (ex: `Todos`, `Novo`, `Em negociação`, `Fechado`, `Perdido`).
  - `search`: Termo de busca que varre o nome do cliente ou o objetivo.
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Lista de clientes da carteira.",
    "data": [
      {
        "id": "c1f78234-...",
        "name": "Alexandre Pires",
        "phone": "(11) 98765-4321",
        "whatsapp": "(11) 98765-4321",
        "objective": "Comprar carro seminovo",
        "approximateIncome": "R$ 6.500",
        "offeredProduct": "Consórcio",
        "status": "Em negociação",
        "lastContact": "2026-07-10",
        "nextReturn": "2026-07-15",
        "notes": "Cliente está avaliando o consórcio."
      }
    ]
  }
  ```

---

### 2. Cadastrar Cliente (`POST /clients`)
Cria um novo cliente na carteira do usuário logado.

- **Payload de Entrada (JSON):**
  ```json
  {
    "name": "Maria Oliveira",
    "phone": "(11) 99999-8888",
    "whatsapp": "(11) 99999-8888",
    "objective": "Planejar reforma da casa",
    "approximateIncome": "R$ 4.000",
    "offeredProduct": "Consórcio",
    "status": "Novo",
    "nextReturn": "2026-07-20",
    "notes": "Cliente gosta de consórcios."
  }
  ```
- **Resposta de Sucesso (201 Created):**
  ```json
  {
    "success": true,
    "message": "Cliente cadastrado com sucesso.",
    "data": {
      "id": "d7e324b1-...",
      "name": "Maria Oliveira",
      "status": "Novo"
    }
  }
  ```

---

### 3. Atualizar Cliente (`PUT /clients/:id`)
Altera dados, status ou agenda novos retornos.

- **Payload de Entrada (JSON - Parcial):**
  ```json
  {
    "status": "Fechado",
    "notes": "Consórcio contratado com sucesso!"
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Dados do cliente atualizados.",
    "data": {
      "id": "d7e324b1-...",
      "status": "Fechado"
    }
  }
  ```

---

### 4. Remover Cliente (`DELETE /clients/:id`)
Remove um cliente permanentemente da carteira.

- **Resposta de Sucesso (204 No Content):**
  *(Corpo de resposta vazio)*
