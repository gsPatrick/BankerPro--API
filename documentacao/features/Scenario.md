# Feature: Cenários de Simulação (Scenarios)

Permite consultar os cenários de simulação cadastrados na base de dados para treinamento.

---

## 🛣️ Endpoints

### 1. Listar Cenários (`GET /scenarios`)
Retorna os cenários de simulação com filtros opcionais.

- **Query Parameters:**
  - `category`: Filtra por categoria de atendimento (ex: `Mesa Comercial`, `Caixa e Balcão`).
  - `difficulty`: Filtra por nível de dificuldade (`Iniciante`, `Intermediário`, `Avançado`).
  - `search`: Busca por termo no título, descrição ou nome do cliente.
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Lista de cenários comerciais.",
    "data": [
      {
        "id": "s83e9182-...",
        "title": "Abertura de Conta de Microempresário",
        "category": "Mesa Comercial",
        "difficulty": "Iniciante",
        "clientName": "Renato Souza",
        "clientAge": 32,
        "clientProfile": "Microempresário individual (MEI)...",
        "openingMessage": "Bom dia! Eu vim abrir uma conta pessoal...",
        "userObjective": "Mapear dores e propor cartão de crédito...",
        "tags": ["MEI", "Abertura de Conta"]
      }
    ]
  }
  ```

---

### 2. Detalhes de Cenário (`GET /scenarios/:id`)
Busca as informações completas de um cenário de simulação específico pelo ID.

- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Detalhes do cenário comercial.",
    "data": {
      "id": "s83e9182-...",
      "title": "Abertura de Conta de Microempresário",
      "clientPersona": "Você é Renato Souza, 32 anos...",
      "openingMessage": "Bom dia! Eu vim abrir uma conta...",
      "evaluationCriteria": "Avaliar se o bancário entendeu..."
    }
  }
  ```
