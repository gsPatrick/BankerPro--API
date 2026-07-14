# Feature: Ranking & Conquistas (Ranking & Achievements)

Gerencia a listagem geral de usuários por XP e o desbloqueio de conquistas.

---

## 🛣️ Endpoints

### 1. Obter Ranking (`GET /ranking`)
Retorna a lista de usuários cadastrados ordenada de forma decrescente por XP Points.

- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Ranking geral de usuários por XP.",
    "data": [
      {
        "userId": "e936b8fc-...",
        "userEmail": "bancario1@exemplo.com",
        "userName": "Carlos Alberto",
        "roleTitle": "Gerente de Relacionamento",
        "totalSimulations": 15,
        "averageScore": 41.2,
        "xpPoints": 1236
      }
    ]
  }
  ```

---

### 2. Listar Conquistas (`GET /achievements`)
Busca todas as conquistas já desbloqueadas pelo usuário autenticado.

- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Conquistas desbloqueadas do usuário.",
    "data": [
      {
        "id": "a92e3182-...",
        "userId": "e936b8fc-...",
        "achievementKey": "first_sim",
        "unlockedAt": "2026-07-14T04:20:00.000Z"
      }
    ]
  }
  ```

---

### 3. Registrar Conquista (`POST /achievements`)
Salva o desbloqueio de uma conquista para o usuário autenticado. Retorna de forma silenciosa se ela já estava desbloqueada anteriormente.

- **Payload de Entrada (JSON):**
  ```json
  {
    "achievementKey": "score_8"
  }
  ```
- **Resposta de Sucesso (201 Created):**
  ```json
  {
    "success": true,
    "message": "Conquista desbloqueada com sucesso.",
    "data": {
      "id": "a92e3182-...",
      "userId": "e936b8fc-...",
      "achievementKey": "score_8",
      "unlockedAt": "2026-07-14T04:25:00.000Z"
    }
  }
  ```
