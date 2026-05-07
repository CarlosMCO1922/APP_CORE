// backend/validation/schemas.js
const { z } = require('zod');

const email = z.string().email();
const nonEmpty = z.string().min(1, 'Obrigatório');

const registerUserSchema = z.object({
  firstName: nonEmpty,
  lastName: nonEmpty,
  email,
  password: z.string().min(6),
});

const loginSchema = z.object({
  email,
  password: nonEmpty,
});

const staffRegisterSchema = z.object({
  firstName: nonEmpty,
  lastName: nonEmpty,
  email,
  password: z.string().min(6),
  role: z.enum(['admin', 'trainer', 'physiotherapist', 'employee']).optional(),
});

const paymentStatusSchema = z.object({
  status: z.enum(['pendente', 'pago', 'cancelado', 'rejeitado']),
});

const referenceMonthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

const adminCreatePaymentSchema = z.object({
  userId: z.coerce.number().int().positive().optional().nullable().refine((val) => val === null || val === undefined || (!isNaN(val) && isFinite(val)), {
    message: 'userId must be a valid number'
  }),
  clientName: z.string().min(2).max(120).optional().nullable(),
  amount: z.coerce.number().positive().refine((val) => !isNaN(val) && isFinite(val), {
    message: 'amount must be a valid number'
  }),
  paymentDate: z.string().min(1), // ISO date string YYYY-MM-DD
  referenceMonth: z.string().regex(referenceMonthRegex, 'YYYY-MM'),
  category: z.enum(['treino_aula_avulso','mensalidade_treino','consulta_fisioterapia','sinal_consulta','outro']),
  description: z.string().optional().nullable(),
  status: z.enum(['pendente', 'pago', 'cancelado', 'rejeitado']).optional(),
  relatedResourceId: z.coerce.number().int().positive().optional().nullable().refine(
    (val) => val === null || val === undefined || (!isNaN(val) && isFinite(val)),
    { message: 'relatedResourceId must be a valid number or null' }
  ),
  relatedResourceType: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  const hasUserId = data.userId !== null && data.userId !== undefined;
  const hasClientName = typeof data.clientName === 'string' && data.clientName.trim().length >= 2;
  if (!hasUserId && !hasClientName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['userId'],
      message: 'É obrigatório fornecer userId ou clientName.',
    });
  }
});

const paymentIdParams = z.object({
  paymentId: z.coerce.number().int().positive(),
});

module.exports = {
  registerUserSchema,
  loginSchema,
  staffRegisterSchema,
  paymentStatusSchema,
  adminCreatePaymentSchema,
  paymentIdParams,
};
