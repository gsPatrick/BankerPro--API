# Feature: Operações de Inteligência Artificial (AI)

Gerencia a integração de prompts e histórico de conversas com a IA (Anthropic Claude), incluindo o chat de simulação de clientes, avaliação por rubricas, planos do Copiloto e geração de abordagens.

---

## 🛣️ Endpoints

### 1. Chat do Simulador (`POST /ai/simulation/chat`)
Envia a mensagem digitada pelo bancário, orquestra com o histórico e retorna a resposta do cliente simulado higienizada de jargões proibidos de investimento. Também indica se a simulação terminou com base nas respostas da IA ou nos limites.

- **Payload de Entrada (JSON):**
  ```json
  {
    "simulationId": "sim93e182-...",
    "userMessage": "Olá Sr. Renato, tudo bem? Percebi que o senhor quer organizar suas finanças..."
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Resposta do cliente simulado.",
    "data": {
      "message": "Olá! Sim, quero organizar sim. Mas não tenho muito tempo para isso. Quanto custa esse plano?",
      "terminated": false
    }
  }
  ```

---

### 2. Avaliação da Simulação (`POST /ai/simulation/evaluate`)
Analisa o diálogo completo e gera notas de 0 a 10 para as 5 dimensões do BankerPro, fornecendo feedbacks detalhados e argumentos de melhoria.

- **Payload de Entrada (JSON):**
  ```json
  {
    "simulationId": "sim93e182-...",
    "durationMinutes": 10
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Avaliação da simulação de atendimento concluída.",
    "data": {
      "score_diagnostico": 9,
      "score_argumentacao": 8,
      "score_objeccoes": 9,
      "score_cross_sell": 8,
      "score_fechamento": 8,
      "score_total": 42,
      "result": "venda",
      "pontos_fortes": "Excelente escuta das dores de tempo do Renato...",
      "oportunidades_melhoria": "Poderia ter introduzido o consórcio mais cedo...",
      "argumentos_sugeridos": "Você poderia propor a debitação automática em conta..."
    }
  }
  ```

---

### 3. Extrair Aprendizado Comercial (`POST /ai/simulation/extract-learning`)
Extrai as lições comerciais bem sucedidas que foram identificadas na simulação e as salva de forma consolidada e estruturada para servir de base ao Copiloto.

- **Payload de Entrada (JSON):**
  ```json
  {
    "simulationId": "sim93e182-...",
    "evaluation": {
      "score_total": 42
    }
  }
  ```
- **Resposta de Sucesso (201 Created):**
  ```json
  {
    "success": true,
    "message": "Lição comercial extraída e gravada com sucesso.",
    "data": {
      "id": "learn321-...",
      "title": "Abordagem rápida de Cartão e Capitalização para MEI",
      "resultType": "venda",
      "productMain": "Cartão de Crédito PF",
      "productCrossSell": "Capitalização",
      "clientProfile": "MEI de confecção de camisetas",
      "objection": "Falta de tempo e reclamação sobre tarifas do cartão",
      "winningArgument": "Explicou que a capitalização funciona como uma reserva automática...",
      "whyItWorked": "A conexão de dores com a reserva automática gerou confiança...",
      "tags": ["MEI", "Abertura de Conta", "Capitalização"]
    }
  }
  ```

---

### 4. Análise do Copiloto (`POST /ai/copiloto/analyze`)
O Copiloto analisa a situação relatada pelo bancário sobre um cliente real e gera estratégias, objeções e roteiros comerciais.

- **Payload de Entrada (JSON):**
  ```json
  {
    "situationText": "Cliente com 35 anos, casado, renda de R$ 5.000, quer comprar um lote mas está sem margem de crédito liberado no banco"
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Análise estratégica do Copiloto concluída.",
    "data": {
      "modo_negociacao": "Cliente Sem Crédito / Negativado",
      "estrategia": "Apresentar o consórcio de imóvel como poupança programada de médio prazo...",
      "necessidade_principal": "Comprar o lote sem juros de financiamento",
      "solucao_principal": {
        "produto": "Consórcio de Imóvel",
        "por_que_atende": "Permite planejar a compra do lote sem juros...",
        "por_que_relacionamento": "Gera relacionamento de longo prazo no banco"
      },
      "oportunidades_adicionais": ["Seguro de Vida"],
      "roteiro_venda": {
        "abertura": "Olá, vi que você quer planejar a compra do seu lote. Conseguimos estruturar isso de forma planejada...",
        "diagnostico": "Qual o valor aproximado desse lote e quanto você planejava pagar por mês?",
        "oferta_principal": "Com o consórcio de imóvel...",
        "transicao_cross_sell": "Para garantir a proteção desse seu plano residencial...",
        "fechamento": "Podemos dar início a essa simulação?"
      }
    }
  }
  ```

---

### 5. Gerador de Abordagens (`POST /ai/approach/generate`)
Gera roteiros e argumentos comerciais focados para o produto desejado.

- **Payload de Entrada (JSON):**
  ```json
  {
    "clientAge": "44",
    "clientIncome": "R$ 4.000",
    "objective": "Garantir estudos futuros dos filhos",
    "product": "Seguro de Vida"
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Roteiro de abordagem gerado com sucesso.",
    "data": {
      "abordagem_inicial": "Olá, tudo bem? Notei que você se preocupa bastante em garantir o futuro profissional dos seus filhos...",
      "perguntas_diagnostico": [
        "Quais são os maiores planos educacionais que você tem hoje para eles?",
        "Se ocorresse algum imprevisto hoje, você teria alguma reserva separada para essas mensalidades?"
      ],
      "argumentos": [
        { "titulo": "Amparo e Estabilidade", "fala": "O plano de proteção familiar garante que a educação deles esteja protegida independente de qualquer situação..." }
      ]
    }
  }
  ```
