/**
 * Popula o banco com um usuário de demonstração e alguns dados de exemplo.
 * Uso: npm run seed   (dentro da pasta backend) ou  npm run seed (na raiz)
 *
 * Login criado:  email: demo@mybudget.com   senha: 1234
 */
const bcrypt = require('bcryptjs');
const db = require('./database');

const EMAIL = 'demo@mybudget.com';

const hoje = new Date();
const mes = String(hoje.getMonth() + 1).padStart(2, '0');
const ano = String(hoje.getFullYear());
const dia = (d) => `${ano}-${mes}-${String(d).padStart(2, '0')}`;

function run() {
  // Remove usuário demo anterior (cascata apaga seus dados).
  const antigo = db.prepare('SELECT id FROM Usuario WHERE email = ?').get(EMAIL);
  if (antigo) db.prepare('DELETE FROM Usuario WHERE id = ?').run(antigo.id);

  const senhaHash = bcrypt.hashSync('1234', 10);
  const usuario = db
    .prepare('INSERT INTO Usuario (nome, email, senha) VALUES (?, ?, ?)')
    .run('Usuário Demo', EMAIL, senhaHash);
  const usuarioId = usuario.lastInsertRowid;

  // Orçamentos
  const orcAlim = db
    .prepare('INSERT INTO Orcamento (usuario_id, nome_categoria, limite_mensal, mes, ano) VALUES (?,?,?,?,?)')
    .run(usuarioId, 'Alimentação', 1200, mes, ano).lastInsertRowid;
  const orcTransp = db
    .prepare('INSERT INTO Orcamento (usuario_id, nome_categoria, limite_mensal, mes, ano) VALUES (?,?,?,?,?)')
    .run(usuarioId, 'Transporte', 400, mes, ano).lastInsertRowid;
  const orcLazer = db
    .prepare('INSERT INTO Orcamento (usuario_id, nome_categoria, limite_mensal, mes, ano) VALUES (?,?,?,?,?)')
    .run(usuarioId, 'Lazer', 600, mes, ano).lastInsertRowid;

  // Centros de custo
  const contaCorrente = db
    .prepare('INSERT INTO CentroCusto (usuario_id, nome, tipo, limite, saldo_disponivel) VALUES (?,?,?,?,?)')
    .run(usuarioId, 'Conta Corrente', 'Débito', 0, 5000).lastInsertRowid;
  const nubank = db
    .prepare('INSERT INTO CentroCusto (usuario_id, nome, tipo, limite, saldo_disponivel) VALUES (?,?,?,?,?)')
    .run(usuarioId, 'Nubank', 'Crédito', 3000, 0).lastInsertRowid;

  // Gastos
  const gastos = [
    [orcAlim, nubank, 'Mercado do mês', 320.5, dia(3)],
    [orcAlim, contaCorrente, 'Padaria', 45.9, dia(6)],
    [orcTransp, nubank, 'Viagem de Uber', 28.7, dia(7)],
    [orcTransp, contaCorrente, 'Recarga Bilhete Único', 100, dia(2)],
    [orcLazer, nubank, 'Cinema', 60, dia(10)],
  ];
  const insGasto = db.prepare(
    'INSERT INTO Gasto (orcamento_id, centro_custo_id, nome_gasto, valor, data) VALUES (?,?,?,?,?)'
  );
  gastos.forEach((g) => insGasto.run(...g));

  console.log('✅ Seed concluído!');
  console.log(`   Login: ${EMAIL}  |  Senha: 1234`);
}

run();
