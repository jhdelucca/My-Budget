# 🚀 Deploy do My Budget em produção

Arquitetura de produção:

```
   Vercel (frontend React)  ──HTTPS──►  Render (API Node/Express)  ──►  Neon (PostgreSQL)
```

- **Neon** → banco PostgreSQL gerenciado (dados persistentes).
- **Render** → hospeda a API (backend).
- **Vercel** → hospeda o frontend (build estático do React).

Tudo nos planos **gratuitos**.

---

## Passo 1 — Banco de dados (Neon)

1. Crie uma conta em https://neon.tech e um novo projeto (escolha a região mais próxima, ex.: South America).
2. No painel, copie a **Connection string** (formato `postgresql://usuario:senha@host/dbname?sslmode=require`).
3. Guarde essa string — ela será a variável `DATABASE_URL`.

> As tabelas são criadas automaticamente na primeira vez que a API sobe (`initDb`).
> Para popular dados de exemplo, veja "Seed" no fim deste arquivo.

---

## Passo 2 — Backend (Render)

1. Suba o projeto para o GitHub (a pasta toda).
2. Em https://render.com → **New > Blueprint** e aponte para o repositório.
   - O arquivo [`render.yaml`](render.yaml) já configura o serviço (rootDir `backend`, build `npm install`, start `npm start`).
3. Em **Environment**, defina:
   - `DATABASE_URL` → a connection string do Neon.
   - `JWT_SECRET` → o Render gera automaticamente (ou defina o seu).
4. Deploy. Ao final, anote a URL pública, algo como `https://my-budget-api.onrender.com`.
5. Teste: acesse `https://my-budget-api.onrender.com/api/health` → deve responder `{"status":"ok"}`.

> Alternativa sem Blueprint: **New > Web Service**, conecte o repo, defina
> Root Directory = `backend`, Build Command = `npm install`, Start Command = `npm start`,
> e adicione as variáveis acima.

---

## Passo 3 — Frontend (Vercel)

1. Em https://vercel.com → **Add New > Project** e importe o repositório.
2. Configure o projeto:
   - **Root Directory:** `frontend`
   - Framework: Vite (detectado automaticamente).
   - Build Command: `npm run build` · Output: `dist` (padrão).
3. Em **Environment Variables**, adicione:
   - `VITE_API_URL` = `https://my-budget-api.onrender.com/api`
     (a URL do backend no Render, **com `/api` no final**).
4. Deploy. A Vercel te dá uma URL, ex.: `https://my-budget.vercel.app`.

> O arquivo [`frontend/vercel.json`](frontend/vercel.json) garante que as rotas do
> React (ex.: `/gastos`) funcionem ao recarregar a página.

---

## Passo 4 — Liberar o CORS (recomendado)

Por padrão a API aceita qualquer origem. Para restringir ao seu site, no Render
adicione a variável `FRONTEND_URL` com a URL da Vercel e ajuste o `cors()` no
backend, se desejar reforçar a segurança. (Opcional para começar.)

---

## Seed (dados de exemplo) em produção

Com a `DATABASE_URL` do Neon no seu `.env` local, rode uma única vez:

```bash
npm run seed
```

Isso cria o usuário `demo@mybudget.com` / `1234` no banco do Neon.

---

## Resumo das variáveis de ambiente

| Onde   | Variável        | Valor                                              |
|--------|-----------------|----------------------------------------------------|
| Render | `DATABASE_URL`  | connection string do Neon                          |
| Render | `JWT_SECRET`    | string longa e aleatória                           |
| Vercel | `VITE_API_URL`  | `https://SEU-BACKEND.onrender.com/api`             |

---

## Alternativa: deploy como serviço único (só Render)

O backend já serve o frontend buildado se existir a pasta `frontend/dist`.
Para isso, faça o build do frontend e publique tudo num único serviço Render
(Build Command: `npm run install:all && npm run build`; Start: `npm start --prefix backend`).
Nesse modo **não** defina `VITE_API_URL` (o frontend usa `/api` na mesma origem).
A separação Vercel + Render (acima) é a recomendada para um projeto sério.
