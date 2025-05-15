// backend/routes/staffRoutes.js
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { protect, isAdminStaff } = require('../middleware/authMiddleware');

// Rota para clientes e staff autenticados verem profissionais que podem dar consultas/treinos
router.get(
    '/professionals', // Novo endpoint
    protect,          // Acessível por qualquer utilizador autenticado
    staffController.getProfessionals // Nova função no controlador
);

// --- Rotas apenas para Admin Staff ---
// @route   POST /api/staff
// @desc    Admin cria um novo funcionário
router.post('/', protect, isAdminStaff, staffController.createStaffMember);

// @route   GET /api/staff
// @desc    Admin lista TODOS os funcionários
router.get('/', protect, isAdminStaff, staffController.getAllStaffMembers);

// @route   GET /api/staff/:id
// @desc    Admin obtém detalhes de um funcionário
router.get('/:id', protect, isAdminStaff, staffController.getStaffMemberById);

// @route   PUT /api/staff/:id
// @desc    Admin atualiza um funcionário
router.put('/:id', protect, isAdminStaff, staffController.updateStaffMember);

// @route   DELETE /api/staff/:id
// @desc    Admin elimina um funcionário
router.delete('/:id', protect, isAdminStaff, staffController.deleteStaffMember);

module.exports = router;
