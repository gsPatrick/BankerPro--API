# Commercial Opportunities — Lista de Oportunidades

Catálogo global de roteiros comerciais prontos (produto + perfil + scripts). **Sem IA em tempo real.**

## Endpoints do usuário (JWT)

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/v1/commercial-opportunities` | Lista ativas (`?product=&channel=&tag=&search=`) |
| GET | `/api/v1/commercial-opportunities/:id` | Detalhe (somente Ativo) |

Aliases: `/opportunities`, `/opportunity`, `/commercial-opportunity`

## Admin (JWT + role admin)

| Método | Path |
|--------|------|
| GET/POST | `/api/v1/admin/opportunities` |
| PUT/DELETE | `/api/v1/admin/opportunities/:id` |

Lista inclui Ativo e Inativo.

## Codex (`X-Codex-Token`)

| Método | Path |
|--------|------|
| GET/POST | `/api/v1/codex/opportunities` |
| PUT/DELETE | `/api/v1/codex/opportunities/:id` |

## Produtos

Consórcio, Financiamento, Empréstimo, Consignado, Cartão de Crédito, Seguro de Vida, Capitalização

## Canais

Ligação, WhatsApp, Presencial

## Status

Ativo, Inativo

## Observação

Não recomendar investimentos. Saldo/aplicação entram só como contexto de perfil para ofertar produtos bancários permitidos.
