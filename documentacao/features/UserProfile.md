# Feature: Perfil do Usuário (UserProfile)

Gerencia as configurações profissionais e objetivos semanais de cada usuário.

---

## 🛣️ Endpoints

### 1. Obter Perfil (`GET /profile`)
Busca os dados do perfil do usuário logado.

- **Cabeçalhos Exigidos:**
  `Authorization: Bearer <token_jwt>`
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Perfil do usuário.",
    "data": {
      "id": "fa213e4b-...",
      "userId": "e936b8fc-...",
      "roleTitle": "Gerente de Relacionamento",
      "experienceLevel": "Iniciante",
      "bankName": "Itaú",
      "weeklyGoal": 5,
      "weeklyCompleted": 0,
      "totalSimulations": 0,
      "averageScore": "0.0",
      "bestScore": "0.0",
      "streakDays": 0,
      "xpPoints": 0,
      "lastActiveDate": null
    }
  }
  ```

---

### 2. Configurar Novo Perfil (`POST /profile`)
Cria o perfil do usuário logado durante o fluxo de onboarding.

- **Payload de Entrada (JSON):**
  ```json
  {
    "roleTitle": "Gerente de Relacionamento",
    "experienceLevel": "Iniciante",
    "bankName": "Itaú",
    "weeklyGoal": 5
  }
  ```
- **Resposta de Sucesso (201 Created):**
  ```json
  {
    "success": true,
    "message": "Perfil criado com sucesso.",
    "data": {
      "id": "fa213e4b-...",
      "userId": "e936b8fc-...",
      "roleTitle": "Gerente de Relacionamento",
      "experienceLevel": "Iniciante",
      "bankName": "Itaú",
      "weeklyGoal": 5,
      "xpPoints": 0
    }
  }
  ```

---

### 3. Atualizar Perfil (`PUT /profile`)
Atualiza as configurações profissionais do usuário logado.

- **Payload de Entrada (JSON - Parcial):**
  ```json
  {
    "roleTitle": "Gerente de Alta Renda",
    "weeklyGoal": 8
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Perfil atualizado com sucesso.",
    "data": {
      "id": "fa213e4b-...",
      "roleTitle": "Gerente de Alta Renda",
      "weeklyGoal": 8
    }
  }
  ```
