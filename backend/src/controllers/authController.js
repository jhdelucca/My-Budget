const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'mybudget_dev_secret';
const TOKEN_EXPIRES = '7d';

function gerarToken(usuario) {
  return jwt.sign({ id: usuario.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });
}

// POST /api/auth/register
exports.register = async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }
  if (String(senha).length < 4) {
    return res.status(400).json({ error: 'A senha deve ter ao menos 4 caracteres.' });
  }

  const existe = await query('SELECT id FROM usuario WHERE email = $1', [email]);
  if (existe.rows.length) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
  }

  const hash = bcrypt.hashSync(String(senha), 10);
  const { rows } = await query(
    'INSERT INTO usuario (nome, email, senha) VALUES ($1, $2, $3) RETURNING id',
    [nome, email, hash]
  );

  const usuario = { id: rows[0].id, nome, email };
  return res.status(201).json({ token: gerarToken(usuario), usuario });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const { rows } = await query('SELECT * FROM usuario WHERE email = $1', [email]);
  const usuario = rows[0];
  if (!usuario || !bcrypt.compareSync(String(senha), usuario.senha)) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const dados = { id: usuario.id, nome: usuario.nome, email: usuario.email };
  return res.json({ token: gerarToken(dados), usuario: dados });
};

// GET /api/auth/me
exports.me = async (req, res) => {
  const { rows } = await query('SELECT id, nome, email FROM usuario WHERE id = $1', [req.userId]);
  if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });
  return res.json(rows[0]);
};
