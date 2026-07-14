# Guia de Onboarding — BankerPro API

Este guia contém as instruções passo-a-passo para configurar e rodar o projeto do backend do BankerPro em sua máquina local.

---

## 🛠️ Requisitos Prévios

- **Node.js**: v18 ou superior recomendado.
- **npm**: Gerenciador de pacotes padrão do Node.js.
- **PostgreSQL**: Banco de dados relacional instalado e rodando localmente (ou em um container Docker).

---

## 🚀 Passo a Passo de Configuração

### 1. Clonar / Acessar o Repositório
Navegue até a pasta da API:
```bash
cd BankerPro--API
```

### 2. Instalar Dependências
Instale todos os pacotes definidos no `package.json`:
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo `.env.example` para `.env`:
```bash
cp .env.example .env
```
Abra o arquivo `.env` e configure as credenciais do seu banco de dados PostgreSQL local (usuário, senha, nome do banco, host e porta).

### 4. Inicializar o Banco de Dados (Sincronização dos Modelos)
Para criar as tabelas estruturadas no PostgreSQL baseando-se nas definições dos modelos Sequelize:
```bash
npm run db:sync
```
*(Nota: Este script executará `sequelize.sync({ alter: true })` para criar/atualizar as tabelas relativas a todas as entidades.)*

### 5. Iniciar o Servidor de Desenvolvimento
Inicie o servidor local com hot-reloads automáticos via Nodemon:
```bash
npm run dev
```
O servidor estará rodando por padrão na porta `3001` (ou na porta configurada no seu `.env`).

---

## 🩺 Testando a Conexão

Uma vez iniciado o servidor, você pode testar se a API está respondendo acessando o endpoint de teste:

- **Ping**: [http://localhost:3001/api/v1/ping](http://localhost:3001/api/v1/ping)
  - Esperado: `{ "status": "success", "message": "pong", ... }`
- **Health Check**: [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health)
  - Esperado: `{ "status": "UP", ... }`
