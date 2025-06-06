// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


router.post('/register', authController.registerUser); 
router.post('/login', authController.loginUser);       

router.post('/staff/register', authController.registerStaff); 
router.post('/staff/login', authController.loginStaff);       

module.exports = router;
