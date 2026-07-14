# Feature: Autenticação (Auth)

Esta feature gerencia a autenticação, criação de contas, validação de e-mails via códigos OTP e obtenção de dados do usuário autenticado.

---

## 🛣️ Endpoints

### 1. Registrar Usuário (`POST /auth/register`)
Cria uma conta pendente e dispara um código OTP de 6 dígitos (no ambiente de desenvolvimento, este código é exibido no console do servidor).

- **Payload de Entrada (JSON):**
  ```json
  {
    "email": "bancario@exemplo.com",
    "password": "senha_segura"
  }
  ```
- **Resposta de Sucesso (201 Created):**
  ```json
  {
    "success": true,
    "message": "Cadastro realizado com sucesso. Um código de verificação foi enviado para seu e-mail.",
    "data": {
      "id": "e936b8fc-84f9-4674-bf4b-8e990ad31234",
      "email": "bancario@exemplo.com",
      "role": "user"
    }
  }
  ```

---

### 2. Confirmar OTP (`POST /auth/verify-otp`)
Valida o código de 6 dígitos enviado por e-mail, confirma a conta do usuário e retorna o token JWT de acesso.

- **Payload de Entrada (JSON):**
  ```json
  {
    "email": "bancario@exemplo.com",
    "otpCode": "123456"
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "E-mail verificado com sucesso.",
    "data": {
      "access_token": "eyJhbGciOi...",
      "user": {
        "id": "e936b8fc-84f9-4674-bf4b-8e990ad31234",
        "email": "bancario@exemplo.com",
        "fullName": null,
        "role": "user"
      }
    }
  }
  ```

---

### 3. Reenviar OTP (`POST /auth/resend-otp`)
Gera e dispara um novo código de verificação para o e-mail informado (inutilizando códigos anteriores).

- **Payload de Entrada (JSON):**
  ```json
  {
    "email": "bancario@exemplo.com"
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Novo código OTP enviado.",
    "data": {
      "message": "OTP reenviado com sucesso."
    }
  }
  ```

---

### 4. Login do Usuário (`POST /auth/login`)
Autentica o usuário por e-mail e senha. Requer que o e-mail já tenha sido verificado pelo OTP.

- **Payload de Entrada (JSON):**
  ```json
  {
    "email": "bancario@exemplo.com",
    "password": "senha_segura"
  }
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Autenticado com sucesso.",
    "data": {
      "access_token": "eyJhbGciOi...",
      "user": {
        "id": "e936b8fc-84f9-4674-bf4b-8e990ad31234",
        "email": "bancario@exemplo.com",
        "fullName": null,
        "role": "user"
      }
    }
  }
  ```

---

### 5. Obter Dados Pessoais (`GET /auth/me`)
Retorna as informações do usuário autenticado no token.

- **Cabeçalhos Exigidos:**
  `Authorization: Bearer <token_jwt>`
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "success": true,
    "message": "Dados do usuário autenticado.",
    "data": {
      "id": "e936b8fc-84f9-4674-bf4b-8e990ad31234",
      "email": "bancario@exemplo.com",
      "fullName": "João Silva",
      "role": "user",
      "profile": {
        "id": "fa213e4b-...",
        "roleTitle": "Gerente de Relacionamento",
        "experienceLevel": "Iniciante",
        "bankName": "Itaú",
        "weeklyGoal": 5,
        "xpPoints": 120
      }
    }
  }
  ```

---

## 🚫 Códigos de Erro Específicos

- **`EMAIL_EXISTS`**: Lançado no registro quando o e-mail informado já está em uso (Status: 409).
- **`INVALID_OTP`**: O código OTP de 6 dígitos informado está errado ou já foi utilizado (Status: 400).
- **`OTP_EXPIRED`**: O código informado expirou por tempo (Status: 400).
- **`EMAIL_NOT_VERIFIED`**: O login foi tentado antes de validar a conta por OTP (Status: 403).
- **`INVALID_CREDENTIALS`**: Senha ou e-mail incorretos (Status: 401).
