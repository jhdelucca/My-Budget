const path = require('path');
const fs = require('fs');
// SQLite embutido no próprio Node 24 (sem dependências nativas / sem compilação).
const { DatabaseSync } = require('node:sqlite');

// Garante que a pasta onde o arquivo .db será criado exista.
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Abre (ou cria) o banco SQLite embutido.
const db = new DatabaseSync(path.join(dataDir, 'mybudget.db'));

// WAL melhora a concorrência de leitura/escrita.
db.exec('PRAGMA journal_mode = WAL');
// SQLite só aplica chaves estrangeiras se isto estiver ligado.
db.exec('PRAGMA foreign_keys = ON');

/**
 * Cria as tabelas caso ainda não existam.
 * Modelo relacional do My Budget:
 *  - Usuario 1..N Orcamento
 *  - Usuario 1..N CentroCusto
 *  - Orcamento 1..N Gasto
 *  - CentroCusto 1..N Gasto
 */
function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Usuario (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      nome  TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Orcamento (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id     INTEGER NOT NULL,
      nome_categoria TEXT NOT NULL,
      limite_mensal  REAL NOT NULL DEFAULT 0,
      mes            TEXT NOT NULL,   -- "01".."12"
      ano            TEXT NOT NULL,   -- "2026"
      FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS CentroCusto (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id       INTEGER NOT NULL,
      nome             TEXT NOT NULL,
      tipo             TEXT NOT NULL CHECK (tipo IN ('Crédito', 'Débito')),
      limite           REAL NOT NULL DEFAULT 0,  -- usado quando tipo = Crédito
      saldo_disponivel REAL NOT NULL DEFAULT 0,  -- usado quando tipo = Débito
      FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Gasto (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      orcamento_id    INTEGER NOT NULL,
      centro_custo_id INTEGER NOT NULL,
      nome_gasto      TEXT NOT NULL,
      valor           REAL NOT NULL DEFAULT 0,
      data            TEXT NOT NULL,  -- "YYYY-MM-DD"
      FOREIGN KEY (orcamento_id)    REFERENCES Orcamento(id)   ON DELETE CASCADE,
      FOREIGN KEY (centro_custo_id) REFERENCES CentroCusto(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_orcamento_usuario ON Orcamento(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_centro_usuario    ON CentroCusto(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_gasto_orcamento   ON Gasto(orcamento_id);
    CREATE INDEX IF NOT EXISTS idx_gasto_centro      ON Gasto(centro_custo_id);
  `);
}

init();

module.exports = db;
