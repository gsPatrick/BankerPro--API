# Feature: Simulações de Negociação (Simulations)

Orquestra a criação, histórico e salvamento de simulações em andamento e finalizadas.

---

## 🛣️ Endpoints

### 1. Iniciar Simulação (`POST /simulations`)
Cria um novo registro de simulação com status `in_progress`. Anexa a mensagem de abertura do cenário.

- **Payload de Entrada (JSON):**
  ```json
  {
    "scenarioId": "s83e9182-..."
  }
  ```
- **Resposta de Sucesso (201 Created):**
  ```json
  {
    "success": true,
    "message": "Simulação de atendimento iniciada.",
    "data": {
      "id": "sim93e182-...",
      "scenarioId": "s83e9182-...",
      "scenarioTitle": "Abertura de Conta de Microempresário",
      "status": "in_progress",
      "messages": [
        {
          "role": "client",
          "content": "Bom dia! Eu vim abrir uma conta pessoal...",
          "timestamp": "2026-07-14T04:20:00.000Z"
        }
      ]
    }
  }
  ```

---

### 2. Listar Simulações (`GET /simulations`)
Busca o histórico de simulações do usuário logado.

- **Query Parameters:**
  - `status`: Filtra por status (ex: `completed`, `in_progress`).
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Lista de simulações do usuário.",
    "data": [
      {
        "id": "sim93e182-...",
        "scenarioTitle": "Abertura de Conta de Microempresário",
        "status": "completed",
        "scoreTotal": "44.0",
        "createdAt": "2026-07-14T04:20:00.000Z"
      }
    ]
  }
  ```

---

### 3. Obter Detalhes da Simulação (`GET /simulations/:id`)
Retorna as informações completas de uma simulação específica.

- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Detalhes da simulação.",
    "data": {
      "id": "sim93e182-...",
      "scenarioTitle": "Abertura de Conta de Microempresário",
      "status": "completed",
      "messages": [...],
      "scoreTotal": "44.0",
      "feedback": "...",
      "pontosFortes": "...",
      "oportunidadesMelhoria": "..."
    }
  }
  ```

---

### 4. Atualizar/Finalizar Simulação (`PATCH /simulations/:id`)
Atualiza o histórico de mensagens da simulação e, ao concluir, preenche os campos de avaliação e recalcula o XP do usuário.

- **Payload de Entrada (JSON):**
  ```json
  {
    "status": "completed",
    "messages": [...],
    "durationMinutes": 12,
    "scoreDiagnostico": 9,
    "scoreArgumentacao": 8,
    "scoreObjeccoes": 9,
    "scoreCrossSell": 9,
    "scoreFechamento": 9,
    "scoreTotal": 44,
    "pontosFortes": "...",
    "oportunidadesMelhoria": "...",
    "argumentosSugeridos": "...",
    "feedback": "..."
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Simulação atualizada com sucesso.",
    "data": {
      "id": "sim93e182-...",
      "status": "completed",
      "scoreTotal": "44.0"
    }
  }
  ```
- **Processamento no Servidor:** Se o status for alterado para `completed`, a API atualiza as estatísticas de `UserProfile` do usuário de forma atômica (adiciona simulação realizada, atualiza a média geral, adiciona pontos de XP e calcula melhor nota).
