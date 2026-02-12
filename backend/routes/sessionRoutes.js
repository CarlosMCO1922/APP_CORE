// backend/routes/sessionRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createSession,
  getSessionsHistory,
  getSessionDetails,
  getLastSessionForPlan,
  updateSession,
  deleteSession,
  getSessionStats,
} = require('../controllers/sessionController');

// Todas as rotas requerem autenticação
router.use(protect);

// POST /api/sessions/create - Criar sessão ao finalizar treino
router.post('/create', createSession);

// GET /api/sessions/history - Listar histórico de sessões
router.get('/history', getSessionsHistory);

// GET /api/sessions/stats - Estatísticas gerais
router.get('/stats', getSessionStats);

// GET /api/sessions/last-for-plan/:workoutPlanId - Última sessão de um plano
router.get('/last-for-plan/:workoutPlanId', getLastSessionForPlan);

// GET /api/sessions/:sessionId - Detalhes de uma sessão específica
router.get('/:sessionId', getSessionDetails);

// PATCH /api/sessions/:sessionId - Atualizar notas/metadata
router.patch('/:sessionId', updateSession);

// DELETE /api/sessions/:sessionId - Eliminar/cancelar sessão
router.delete('/:sessionId', deleteSession);

module.exports = router;
