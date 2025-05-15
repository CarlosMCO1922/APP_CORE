// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rotas para Utilizadores (Clientes)
router.post('/register', authController.registerUser); // Endpoint: POST /api/auth/register
router.post('/login', authController.loginUser);       // Endpoint: POST /api/auth/login

// Rotas para Staff (Funcionários/Admin)
// NOTA: A rota /staff/register deverá ser protegida no futuro para ser acessível apenas por admins.
router.post('/staff/register', authController.registerStaff); // Endpoint: POST /api/auth/staff/register
router.post('/staff/login', authController.loginStaff);       // Endpoint: POST /api/auth/staff/login

module.exports = router;
