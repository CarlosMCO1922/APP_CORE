// backend/middleware/errorHandler.js

/**
 * Middleware para tratamento de erros não apanhados.
 * Deve ser o último middleware a ser adicionado no server.js.
 */
const errorHandler = (err, req, res, next) => {
  console.error("ERRO NÃO TRATADO:", err.stack || err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Se o status code não foi alterado, é um erro de servidor
  res.status(statusCode);

  res.json({
    message: err.message || 'Ocorreu um erro no servidor.',
    // Em ambiente de desenvolvimento, podes querer enviar a stack trace
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

/**
 * Middleware para rotas não encontradas (404).
 * Deve ser colocado depois de todas as tuas rotas e antes do errorHandler.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Não encontrado - ${req.originalUrl}`);
  res.status(404);
  next(error); // Passa o erro para o próximo middleware de erro (errorHandler)
};

module.exports = {
  errorHandler,
  notFound,
};
