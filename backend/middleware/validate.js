// backend/middleware/validate.js
const { ZodError } = require('zod');

// where: 'body' | 'params' | 'query'
const validate = (schema, where = 'body') => (req, res, next) => {
  try {
    const data = req[where] || {};
    const parsed = schema.parse(data);
    req[where] = parsed; // normalized values
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: 'Dados inválidos',
        errors: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    next(err);
  }
};

module.exports = { validate };
