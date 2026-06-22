# 💰 My Budget

Aplicação web para controle de gastos pessoais.

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router + Axios
- **Backend:** Node.js + Express (API REST)
- **Banco de dados:** PostgreSQL (via driver `pg`) — recomendado [Neon](https://neon.tech) (grátis)
- **Autenticação:** JWT + senha com hash (bcrypt)

Tudo no mesmo repositório (monorepo: `backend/` + `frontend/`).

Para colocar em produção (Neon + Render + Vercel), veja **[DEPLOY.md](DEPLOY.md)**.

---

## ✅ Pré-requisitos

- **Node.js 18+** — verifique com `node --version`.
- Uma **string de conexão PostgreSQL** (`DATABASE_URL`). A forma mais fácil:
  crie um banco grátis no [Neon](https://neon.tech) e copie a connection string.
  (Alternativa: um PostgreSQL local — nesse caso defina `PGSSL=disable` no `.env`.)

---

## 🚀 Como rodar (passo a passo)

### 1. Instalar as dependências (uma única vez)

Na raiz do projeto (`C:\MyBudget`):

```bash
npm run install:all
```

> Esse comando instala as dependências da raiz, do `backend` e do `frontend`.

### 2. Configurar o banco de dados

Copie `backend/.env.example` para `backend/.env` e preencha a `DATABASE_URL`
com a string do Neon (ou do seu Postgres local). As tabelas são criadas
automaticamente quando a API sobe.

### 3. (Opcional) Popular o banco com dados de exemplo

```bash
npm run seed
```

Cria um usuário de demonstração:

- **E-mail:** `demo@mybudget.com`
- **Senha:** `1234`

### 4. Subir backend + frontend juntos

```bash
npm run dev
```

- API:      http://localhost:3001
- Frontend: http://localhost:5173  ← **abra esta no navegador**

> O Vite faz proxy automático de `/api` para o backend, então não há problema de CORS em desenvolvimento.

Para rodar separadamente, em dois terminais:

```bash
npm run dev:backend
npm run dev:frontend
```

---

## 🗂️ Estrutura de pastas

```
MyBudget/
├─ package.json              # scripts que orquestram backend + frontend
├─ render.yaml               # blueprint de deploy do backend (Render)
├─ backend/
│  ├─ .env                   # PORT, JWT_SECRET e DATABASE_URL
│  └─ src/
│     ├─ index.js            # servidor Express (conecta ao banco e sobe)
│     ├─ db/
│     │  ├─ database.js       # conexão PostgreSQL (pool) + criação das tabelas
│     │  └─ seed.js           # dados de exemplo
│     ├─ middleware/auth.js  # validação do JWT
│     ├─ utils/asyncHandler.js # captura erros de handlers async
│     ├─ controllers/        # regras de negócio (auth, orçamento, centro, gasto, dashboard)
│     └─ routes/             # rotas REST de cada entidade
└─ frontend/
   └─ src/
      ├─ main.jsx
      ├─ App.jsx             # rotas
      ├─ api/client.js       # instância do axios (injeta o token JWT)
      ├─ context/AuthContext.jsx
      ├─ components/         # Layout, Modal, ProgressBar, ProtectedRoute
      ├─ pages/              # Login, Register, Dashboard, Orcamentos, CentrosCusto, Gastos
      └─ utils/format.js     # formatação de moeda/datas
```

---

## 🧱 Modelo de dados

| Tabela        | Campos                                                                                |
|---------------|---------------------------------------------------------------------------------------|
| `Usuario`     | id, nome, email, senha                                                                |
| `Orcamento`   | id, usuario_id (FK), nome_categoria, limite_mensal, mes, ano                          |
| `CentroCusto` | id, usuario_id (FK), nome, tipo (`Crédito`/`Débito`), limite, saldo_disponivel        |
| `Gasto`       | id, orcamento_id (FK), centro_custo_id (FK), nome_gasto, valor, data                  |

Chaves estrangeiras com `ON DELETE CASCADE` (apagar um usuário/orçamento/centro remove os gastos vinculados).

---

## 🔌 Endpoints da API

Todas as rotas (exceto login/cadastro) exigem o header `Authorization: Bearer <token>`.

| Método | Rota                       | Descrição                                  |
|--------|----------------------------|--------------------------------------------|
| POST   | `/api/auth/register`       | Cadastro de usuário                        |
| POST   | `/api/auth/login`          | Login (retorna token JWT)                  |
| GET    | `/api/auth/me`             | Dados do usuário logado                    |
| GET    | `/api/orcamentos`          | Lista (filtros `?mes=&ano=`)               |
| POST   | `/api/orcamentos`          | Cria                                       |
| PUT    | `/api/orcamentos/:id`      | Edita                                      |
| DELETE | `/api/orcamentos/:id`      | Remove                                     |
| GET/POST/PUT/DELETE | `/api/centros-custo[/:id]` | CRUD de centros de custo        |
| GET    | `/api/gastos`              | Lista (busca/filtros/ordenação)            |
| POST/PUT/DELETE | `/api/gastos[/:id]` | CRUD de gastos                             |
| GET    | `/api/dashboard`           | Dados consolidados (`?mes=&ano=`)          |

### Regras de negócio no `/api/dashboard`

- **Mensal:** soma dos `Gasto` de cada orçamento × `limite_mensal`.
- **Diário/Semanal:** `(limite - gasto) ÷ dias restantes no mês` → quanto ainda dá pra gastar por dia; × 7 (ou dias restantes) → por semana.
- **Centros de custo:**
  - *Débito:* `saldo_disponivel − gastos do mês` = disponível na conta.
  - *Crédito:* `limite − gastos do mês` = limite disponível do cartão.

---

## 📝 Notas

- O banco é **PostgreSQL**. As tabelas são criadas automaticamente na inicialização (`initDb`).
- Em produção, troque o `JWT_SECRET` por um valor longo e aleatório (no Render é gerado automaticamente).
- Para colocar online de graça (Neon + Render + Vercel), siga o **[DEPLOY.md](DEPLOY.md)**.
- Para "zerar" os dados, rode `npm run seed` (ele recria o usuário demo) ou apague as tabelas no painel do Neon.
