// Envolve handlers assíncronos para que erros (Promises rejeitadas)
// sejam encaminhados ao tratador de erros do Express via next(err).
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
