const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'mybudget_dev_secret';
const TOKEN_EXPIRES = '7d';

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });
}

// POST /api/auth/register
exports.register = (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }
  if (String(senha).length < 4) {
    return res.status(400).json({ error: 'A senha deve ter ao menos 4 caracteres.' });
  }

  const jaExiste = db.prepare('SELECT id FROM Usuario WHERE email = ?').get(email);
  if (jaExiste) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
  }

  const hash = bcrypt.hashSync(String(senha), 10);
  const info = db
    .prepare('INSERT INTO Usuario (nome, email, senha) VALUES (?, ?, ?)')
    .run(nome, email, hash);

  const usuario = { id: info.lastInsertRowid, nome, email };
  return res.status(201).json({ token: gerarToken(usuario), usuario });
};

// POST /api/auth/login
exports.login = (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const usuario = db.prepare('SELECT * FROM Usuario WHERE email = ?').get(email);
  if (!usuario || !bcrypt.compareSync(String(senha), usuario.senha)) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const dados = { id: usuario.id, nome: usuario.nome, email: usuario.email };
  return res.json({ token: gerarToken(dados), usuario: dados });
};

// GET /api/auth/me  (rota protegida)
exports.me = (req, res) => {
  const usuario = db
    .prepare('SELECT id, nome, email FROM Usuario WHERE id = ?')
    .get(req.userId);
  if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
  return res.json(usuario);
};
