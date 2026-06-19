# 💰 My Budget

Aplicação web para controle de gastos pessoais.

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router + Axios
- **Backend:** Node.js + Express (API REST)
- **Banco de dados:** SQLite embutido (via módulo nativo `node:sqlite` do Node 24 — **sem dependências nativas para compilar**)
- **Autenticação:** JWT + senha com hash (bcrypt)

Tudo no mesmo repositório (monorepo: `backend/` + `frontend/`).

---

## ✅ Pré-requisitos

- **Node.js 22.5+** (recomendado **Node 24 LTS**, que já inclui o módulo `node:sqlite`).
  Verifique com: `node --version`

---

## 🚀 Como rodar (passo a passo)

### 1. Instalar as dependências (uma única vez)

Na raiz do projeto (`C:\MyBudget`):

```bash
npm run install:all
```

> Esse comando instala as dependências da raiz, do `backend` e do `frontend`.

### 2. (Opcional) Popular o banco com dados de exemplo

```bash
npm run seed
```

Cria um usuário de demonstração:

- **E-mail:** `demo@mybudget.com`
- **Senha:** `1234`

### 3. Subir backend + frontend juntos

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
├─ backend/
│  ├─ .env                   # PORT e JWT_SECRET
│  ├─ data/                  # arquivo mybudget.db é criado aqui
│  └─ src/
│     ├─ index.js            # servidor Express
│     ├─ db/
│     │  ├─ database.js       # conexão SQLite + criação das tabelas
│     │  └─ seed.js           # dados de exemplo
│     ├─ middleware/auth.js  # validação do JWT
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

- O `node:sqlite` é marcado como experimental no Node; por isso os scripts usam `--no-warnings` apenas para deixar o console limpo. É estável para esta aplicação.
- Em produção, troque o `JWT_SECRET` em `backend/.env` por um valor longo e aleatório.
- O arquivo do banco fica em `backend/data/mybudget.db`. Para "zerar" tudo, apague esse arquivo (e os `.db-shm`/`.db-wal`) e rode `npm run seed` novamente.
