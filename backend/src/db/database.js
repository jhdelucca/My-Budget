const { Pool, types } = require('pg');

// Por padrão o pg converte DATE (OID 1082) em objeto Date (com fuso horário),
// o que desloca/quebra o formato esperado pelo frontend. Forçamos string "YYYY-MM-DD".
types.setTypeParser(1082, (val) => val);

/**
 * Conexão com o PostgreSQL.
 * A string de conexão vem da variável de ambiente DATABASE_URL.
 *   Ex (Neon): postgresql://usuario:senha@host.neon.tech/dbname?sslmode=require
 *
 * SSL: serviços gerenciados (Neon, Render, Supabase) exigem SSL.
 * Para um Postgres local sem SSL, defina PGSSL=disable no .env.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    '\n❌ DATABASE_URL não definida. Configure no backend/.env a string de conexão do Postgres (ex.: Neon).\n'
  );
}

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
});

// Atalho para executar queries: const { rows } = await query(sql, params)
function query(text, params) {
  return pool.query(text, params);
}

/**
 * Cria as tabelas caso não existam.
 * (No Postgres, identificadores sem aspas viram minúsculos — por isso usamos
 *  nomes em minúsculo de forma consistente em todas as queries.)
 */
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuario (
      id         SERIAL PRIMARY KEY,
      nome       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      senha      TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orcamento (
      id             SERIAL PRIMARY KEY,
      usuario_id     INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
      nome_categoria TEXT NOT NULL,
      limite_mensal  DOUBLE PRECISION NOT NULL DEFAULT 0,
      mes            TEXT NOT NULL,
      ano            TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS centrocusto (
      id               SERIAL PRIMARY KEY,
      usuario_id       INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
      nome             TEXT NOT NULL,
      tipo             TEXT NOT NULL CHECK (tipo IN ('Crédito', 'Débito')),
      limite           DOUBLE PRECISION NOT NULL DEFAULT 0,
      saldo_disponivel DOUBLE PRECISION NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS gasto (
      id              SERIAL PRIMARY KEY,
      orcamento_id    INTEGER NOT NULL REFERENCES orcamento(id)   ON DELETE CASCADE,
      centro_custo_id INTEGER NOT NULL REFERENCES centrocusto(id) ON DELETE CASCADE,
      nome_gasto      TEXT NOT NULL,
      valor           DOUBLE PRECISION NOT NULL DEFAULT 0,
      data            DATE NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orcamento_usuario ON orcamento(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_centro_usuario    ON centrocusto(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_gasto_orcamento   ON gasto(orcamento_id);
    CREATE INDEX IF NOT EXISTS idx_gasto_centro      ON gasto(centro_custo_id);
  `);
  console.log('🗄️  Banco PostgreSQL pronto.');
}

module.exports = { pool, query, initDb };
