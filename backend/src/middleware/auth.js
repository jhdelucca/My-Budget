const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mybudget_dev_secret';

/**
 * Middleware que protege rotas autenticadas.
 * Espera o header: Authorization: Bearer <token>
 * Em caso de sucesso, popula req.userId com o id do usuário do token.
 */
module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};
