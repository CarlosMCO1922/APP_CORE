// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { registerUserSchema, loginSchema, staffRegisterSchema } = require('../validation/schemas');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', validate(registerUserSchema), authController.registerUser); 
router.post('/login', validate(loginSchema), authController.loginUser);       

router.post('/staff/register', validate(staffRegisterSchema), authController.registerStaff); 
router.post('/staff/login', validate(loginSchema), authController.loginStaff);    

router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

// Endpoint de validação (protegido - requer token válido)
router.get('/validate', protect, authController.validateAuth);

module.exports = router;
