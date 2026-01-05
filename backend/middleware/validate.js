// backend/middleware/validate.js
const { ZodError } = require('zod');

// where: 'body' | 'params' | 'query'
const validate = (schema, where = 'body') => (req, res, next) => {
  try {
    const data = req[where] || {};
    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[VALIDATE] Validating ${where}:`, JSON.stringify(data, null, 2));
    }
    const parsed = schema.parse(data);
    req[where] = parsed; // normalized values
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      // Log detalhes do erro em desenvolvimento
      if (process.env.NODE_ENV !== 'production') {
        console.error('[VALIDATE] Validation errors:', err.issues);
      }
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    next(err);
  }
};

module.exports = { validate };
