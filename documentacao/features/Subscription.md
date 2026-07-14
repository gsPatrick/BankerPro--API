# Feature: Cobrança e Assinaturas (Subscription)

Gerencia a base dinâmica de planos, checkout via Mercado Pago, validação de limites de uso e processamento de webhooks para ativação de assinaturas.

---

## 🛣️ Endpoints de Usuário

### 1. Listar Planos (`GET /subscription/plans`)
Retorna os planos cadastrados dinamicamente no banco de dados com seus respectivos preços, recursos e limites.

- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Lista de planos disponíveis.",
    "data": [
      {
        "id": "uuid-plano-1",
        "key": "free",
        "name": "Plano Gratuito",
        "price": 0,
        "limitSimulations": 10,
        "features": ["10 Simulações/mês", "Copiloto limitado"]
      },
      {
        "id": "uuid-plano-2",
        "key": "pro",
        "name": "Plano Pro",
        "price": 97,
        "limitSimulations": -1,
        "features": ["Simulações ilimitadas", "Copiloto completo", "Gerador de abordagens"]
      }
    ]
  }
  ```

---

### 2. Obter Assinatura Ativa (`GET /subscription/current`)
Busca a assinatura ativa do usuário logado. Caso não possua, retorna o plano gratuito padrão.

- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Assinatura atual do usuário.",
    "data": {
      "plan": "free",
      "status": "active",
      "startsAt": null,
      "endsAt": null
    }
  }
  ```

---

### 3. Iniciar Checkout (`POST /subscription/checkout`)
Gera um link de pagamento (preferência de checkout) no Mercado Pago. O valor cobrado é lido dinamicamente da tabela `plans` do banco de dados com base na chave fornecida.

- **Payload de Entrada (JSON):**
  ```json
  {
    "planType": "pro"
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Checkout criado com sucesso.",
    "data": {
      "init_point": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=...",
      "id": "pref_123456789"
    }
  }
  ```

---

### 4. Webhook Mercado Pago (`POST /subscription/webhook`)
Endpoint público que recebe notificações do Mercado Pago quando transações são criadas/atualizadas. Ao detectar um pagamento aprovado (`approved`), ativa a assinatura do usuário por 30 dias vinculando-o ao respectivo plano existente no banco de dados.

- **Payload de Entrada (JSON - Padrão IPN/Webhook MP):**
  ```json
  {
    "action": "payment.created",
    "data": {
      "id": "54321098"
    }
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Webhook recebido.",
    "data": {
      "id": "sub_uuid_...",
      "plan": "pro",
      "status": "active",
      "startsAt": "2026-07-14T04:20:00.000Z",
      "endsAt": "2026-08-13T04:20:00.000Z"
    }
  }
  ```

---

## 👑 Endpoints Administrativos de Planos

### 5. Criar Plano (`POST /subscription/plans`)
Cria um novo plano de assinatura com limites configuráveis.

- **Cabeçalhos Exigidos:**
  - `Authorization: Bearer <token_jwt_admin>`
- **Payload de Entrada (JSON):**
  ```json
  {
    "key": "super_vip",
    "name": "Plano Super VIP",
    "price": 497.00,
    "limitSimulations": -1,
    "features": ["Tudo do Pro", "Mentoria Exclusiva"]
  }
  ```

---

### 6. Atualizar Plano (`PUT /subscription/plans/:id`)
Atualiza as propriedades do plano.

- **Payload de Entrada (JSON):**
  ```json
  {
    "price": 549.00
  }
  ```

---

### 7. Excluir Plano (`DELETE /subscription/plans/:id`)
Remove o plano da plataforma (não é permitida a remoção do plano gratuito básico `'free'`).

---

## 🚫 Validação de Limites Dinâmicos (Middlewares)

- **`checkSimulationLimit`**: Middleware interceptor aplicado na criação de simulações. Ele busca a assinatura ativa do usuário, carrega a configuração do plano correspondente na tabela `plans` do banco de dados e verifica se o número de simulações criadas nos últimos 30 dias atinge ou supera o limite estabelecido no plano (`limitSimulations`). Caso o limite seja alcançado, bloqueia a criação retornando `403 LIMIT_EXCEEDED`. Planos com limite `-1` são interpretados como ilimitados.
