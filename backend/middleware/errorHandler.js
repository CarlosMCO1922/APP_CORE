// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error("ERRO NÃO TRATADO:", err.stack || err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode; 
  res.status(statusCode);

  res.json({
    message: err.message || 'Ocorreu um erro no servidor.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};


const notFound = (req, res, next) => {
  const error = new Error(`Não encontrado - ${req.originalUrl}`);
  res.status(404);
  next(error); 
};

module.exports = {
  errorHandler,
  notFound,
};
