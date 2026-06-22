/**
 * Popula o banco PostgreSQL com um usuário de demonstração e dados de exemplo.
 * Uso:  npm run seed   (na pasta backend)  ou  npm run seed  (na raiz)
 *
 * Login criado:  demo@mybudget.com  /  1234
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query, initDb } = require('./database');

const EMAIL = 'demo@mybudget.com';

const hoje = new Date();
const mes = String(hoje.getMonth() + 1).padStart(2, '0');
const ano = String(hoje.getFullYear());
const dia = (d) => `${ano}-${mes}-${String(d).padStart(2, '0')}`;

async function run() {
  await initDb();

  // Remove o usuário demo anterior (cascata apaga os dados dele).
  await query('DELETE FROM usuario WHERE email = $1', [EMAIL]);

  const senhaHash = bcrypt.hashSync('1234', 10);
  const u = await query(
    'INSERT INTO usuario (nome, email, senha) VALUES ($1, $2, $3) RETURNING id',
    ['Usuário Demo', EMAIL, senhaHash]
  );
  const usuarioId = u.rows[0].id;

  // Orçamentos
  const orc = async (cat, lim) =>
    (
      await query(
        'INSERT INTO orcamento (usuario_id, nome_categoria, limite_mensal, mes, ano) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [usuarioId, cat, lim, mes, ano]
      )
    ).rows[0].id;

  const orcAlim = await orc('Alimentação', 1200);
  const orcTransp = await orc('Transporte', 400);
  const orcLazer = await orc('Lazer', 600);

  // Centros de custo
  const centro = async (nome, tipo, limite, saldo) =>
    (
      await query(
        'INSERT INTO centrocusto (usuario_id, nome, tipo, limite, saldo_disponivel) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [usuarioId, nome, tipo, limite, saldo]
      )
    ).rows[0].id;

  const contaCorrente = await centro('Conta Corrente', 'Débito', 0, 5000);
  const nubank = await centro('Nubank', 'Crédito', 3000, 0);

  // Gastos
  const gastos = [
    [orcAlim, nubank, 'Mercado do mês', 320.5, dia(3)],
    [orcAlim, contaCorrente, 'Padaria', 45.9, dia(6)],
    [orcTransp, nubank, 'Viagem de Uber', 28.7, dia(7)],
    [orcTransp, contaCorrente, 'Recarga Bilhete Único', 100, dia(2)],
    [orcLazer, nubank, 'Cinema', 60, dia(10)],
  ];
  for (const g of gastos) {
    await query(
      'INSERT INTO gasto (orcamento_id, centro_custo_id, nome_gasto, valor, data) VALUES ($1,$2,$3,$4,$5)',
      g
    );
  }

  console.log('✅ Seed concluído!');
  console.log(`   Login: ${EMAIL}  |  Senha: 1234`);
}

run()
  .catch((err) => {
    console.error('❌ Erro no seed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
