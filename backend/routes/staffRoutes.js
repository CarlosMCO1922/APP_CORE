// backend/routes/staffRoutes.js
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { protect, isAdminStaff } = require('../middleware/authMiddleware');

// Rota para clientes e staff autenticados verem profissionais que podem dar consultas/treinos
router.get(
    '/professionals', 
    protect,          
    staffController.getProfessionals 
);

// --- Rotas apenas para Admin Staff ---

router.post('/', protect, isAdminStaff, staffController.createStaffMember);


router.get('/', protect, isAdminStaff, staffController.getAllStaffMembers);


router.get('/:id', protect, isAdminStaff, staffController.getStaffMemberById);


router.put('/:id', protect, isAdminStaff, staffController.updateStaffMember);


router.delete('/:id', protect, isAdminStaff, staffController.deleteStaffMember);

module.exports = router;
