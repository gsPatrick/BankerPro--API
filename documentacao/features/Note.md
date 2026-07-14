# Feature: Anotações Rápidas (Notes)

Gerencia anotações e insights comerciais que o bancário registra ao longo do dia de trabalho.

---

## 🛣️ Endpoints

### 1. Listar Anotações (`GET /notes`)
Retorna todas as anotações feitas pelo usuário.

- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Lista de anotações.",
    "data": [
      {
        "id": "n83f81e3-...",
        "content": "Cliente Roberto prefere consórcio de veículo do que empréstimo",
        "createdAt": "2026-07-14T04:20:00.000Z"
      }
    ]
  }
  ```

---

### 2. Criar Anotação (`POST /notes`)
Registra uma nova anotação.

- **Payload de Entrada (JSON):**
  ```json
  {
    "content": "Ligar para Patrícia amanhã sobre o seguro"
  }
  ```
- **Resposta de Sucesso (201 Created):**
  ```json
  {
    "success": true,
    "message": "Anotação criada.",
    "data": {
      "id": "m93f912e-...",
      "content": "Ligar para Patrícia amanhã sobre o seguro"
    }
  }
  ```

---

### 3. Excluir Anotação (`DELETE /notes/:id`)
Remove a anotação selecionada.

- **Resposta de Sucesso (204 No Content):**
  *(Corpo de resposta vazio)*
