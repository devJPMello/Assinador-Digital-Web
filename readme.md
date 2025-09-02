# 🔏 Assinador Digital Web

Aplicação web para cadastro de usuários, geração de chaves criptográficas, assinatura digital de textos e verificação pública de assinaturas.

---

## 📂 Estrutura do projeto

- **server/** → Backend em Node.js + Express + Prisma (PostgreSQL/NeonDB)
- **client/** → Frontend em React + Vite

---

## 🚀 Como rodar

### 1. Clonar e instalar dependências
```bash
git clone <url-do-repo>
cd Assinador-Digital-Web
```

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd ../client
npm install
```

---

### 2. Configurar variáveis de ambiente

**server/.env**
```env
DATABASE_URL="postgresql://<usuario>:<senha>@<host>/<db>?sslmode=require"
JWT_SECRET="troque-por-um-segredo-jwt-forte"
MASTER_KEY="32bytes_em_base64_ou_hex"
PORT=4000

# Opções de exportação da chave privada
DEV_ALLOW_PRIVATE_EXPORT="true"
EXPOSE_PRIVATE_ALWAYS="false"
```

> ⚠️ `MASTER_KEY` precisa ter **32 bytes reais**.  
Exemplo válido (base64):  
```
MASTER_KEY="f3+1R0cG3o3V5uW5dGZqVw2m4p7x9b1kC0Y3s5u8wzA="
```

**client/.env**
```env
VITE_API_URL="http://localhost:4000"
```

---

### 3. Aplicar migrações do Prisma
```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
```

---

### 4. Rodar os servidores

**Backend**
```bash
cd server
npm run dev
```
Servidor em: [http://localhost:4000](http://localhost:4000)

**Frontend**
```bash
cd client
npm run dev
```
App em: [http://localhost:5173](http://localhost:5173)

---

## ✅ Critérios de Aceitação

- [x] **Cadastro** cria usuário e par de chaves (pública/privada).
- [x] **Assinatura** gera ID único, guarda no banco e retorna assinatura + hash.
- [x] **Verificação** (rota pública `/verify/:id`) confirma **VÁLIDA / INVÁLIDA**.
- [x] **Logs** de verificações persistidos.
- [x] **Página Minhas Chaves** mostra pública + fingerprint (e, opcionalmente, privada em DEV).

---

## 🔑 Fluxos principais

### 1. Cadastro
`POST /auth/register`

Request:
```json
{ "email": "user@mail.com", "password": "123456" }
```

Response:
```json
{ "ok": true, "userId": "abc123", "privateExportToken": "opcional-em-dev" }
```

### 2. Login
`POST /auth/login`

### 3. Assinar texto
`POST /sign`

Request:
```json
{ "text": "Olá mundo", "storeText": true }
```

Response:
```json
{
  "signatureId": "sig_123",
  "algorithm": "RSA-PSS-SHA256",
  "textHashHex": "a94a8fe5...",
  "signatureB64": "MEUCIQD..."
}
```

### 4. Verificar por ID
`GET /verify/:id`

Response:
```json
{
  "valid": true,
  "signatureId": "sig_123",
  "signer": "user@mail.com",
  "algorithm": "RSA-PSS-SHA256",
  "createdAt": "2025-09-02T23:45:00.000Z"
}
```

### 5. Verificar por texto + assinatura
`POST /verify`

Request:
```json
{ "text": "Olá mundo", "signatureB64": "MEUCIQD..." }
```

---

## 🧪 Testes básicos

**Teste positivo**
```bash
# cadastrar
curl -c cookies.txt -H "Content-Type: application/json"   -d '{"email":"t+$(date +%s)@mail.com","password":"123456"}'   http://localhost:4000/auth/register

# assinar
curl -b cookies.txt -H "Content-Type: application/json"   -d '{"text":"teste"}'   http://localhost:4000/sign
```

**Teste negativo**
```bash
# tentar verificar com texto alterado
curl -H "Content-Type: application/json"   -d '{"text":"texto alterado","signatureB64":"<assinatura>"}'   http://localhost:4000/verify
```

---

## 🔒 Chaves privadas

- **Padrão**: a chave **privada nunca é exibida**.
- **Dev opcional**: se `DEV_ALLOW_PRIVATE_EXPORT="true"`, o backend pode gerar um `privateExportToken` no cadastro para **um download único** da privada.
- Se `EXPOSE_PRIVATE_ALWAYS="true"`, o usuário logado pode **ver e baixar a chave privada a qualquer momento** (⚠️ não recomendado, apenas para testes locais).

---

## 📸 Telas do frontend

- **Cadastro / Login**
- **Assinar texto**
- **Verificar assinatura**
- **Minhas Chaves**  
  - mostra chave pública + fingerprint  
  - botão para baixar chave pública  
  - (em DEV) campo token + botões para ver/baixar privada  

---

## 📂 Entregáveis

- Código completo (`server/`, `client/`).
- Arquivo **README.md** (este).
- Migrações Prisma no repo (`prisma/migrations/`).
- Casos de teste: 1 positivo + 1 negativo.
- Opcional: dump SQL.

---

## ⚠️ Avisos de segurança

- Não ative `EXPOSE_PRIVATE_ALWAYS="true"` em produção.  
- Nunca exponha chaves privadas em ambientes reais.  
- Use apenas para fins acadêmicos e de aprendizado.

---
