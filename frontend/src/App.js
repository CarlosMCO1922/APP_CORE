// src/App.js
import React, { useEffect, Suspense, lazy, useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useWorkout } from './context/WorkoutContext';
import styled from 'styled-components';
import Navbar from './components/Layout/Navbar';
import BottomNav from './components/Layout/BottomNav';
import OfflineIndicator from './components/OfflineIndicator';
import ConfirmationModal from './components/Common/ConfirmationModal';
import ErrorBoundary from './components/ErrorBoundary';
import { initializeErrorHandlers } from './services/logService';
import { logger } from './utils/logger';

// Code-splitting for pages (melhora UX e reduz bundle inicial)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const StaffLoginPage = lazy(() => import('./pages/StaffLoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MyPaymentsPage = lazy(() => import('./pages/MyPaymentsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ExploreWorkoutPlansPage = lazy(() => import('./pages/ExploreWorkoutPlansPage'));
const BookingServiceSelectionPage = lazy(() => import('./pages/BookingServiceSelectionPage'));
const BookingCalendarPage = lazy(() => import('./pages/BookingCalendarPage'));
const LiveWorkoutSessionPage = lazy(() => import('./pages/LiveWorkoutSessionPage'));
const WorkoutSummaryPage = lazy(() => import('./pages/WorkoutSummaryPage'));
const GroupTrainingCalendarPage = lazy(() => import('./pages/GroupTrainingCalendarPage'));
const IndividualPTRequestPage = lazy(() => import('./pages/IndividualPTRequestPage'));
const ClientProgressOverviewPage = lazy(() => import('./pages/ClientProgressOverviewPage'));
const WorkoutPlanSummaryPage = lazy(() => import('./pages/WorkoutPlanSummaryPage'));
const UserCalendarPage = lazy(() => import('./pages/UserCalendarPage'));

const AdminManageUsersPage = lazy(() => import('./pages/admin/AdminManageUsersPage'));
const AdminUserDetailsPage = lazy(() => import('./pages/admin/AdminUserDetailsPage'));
const AdminManageStaffPage = lazy(() => import('./pages/admin/AdminManageStaffPage'));
const AdminManageTrainingsPage = lazy(() => import('./pages/admin/AdminManageTrainingsPage'));
const AdminManageAppointmentsPage = lazy(() => import('./pages/admin/AdminManageAppointmentsPage'));
const AdminManagePaymentsPage = lazy(() => import('./pages/admin/AdminManagePaymentsPage'));
const StaffManageRequestsPage = lazy(() => import('./pages/admin/StaffManageRequestsPage'));
const AdminManageWorkoutPlansPage = lazy(() => import('./pages/admin/AdminManageWorkoutPlansPage'));
const AdminManageExercisesPage = lazy(() => import('./pages/admin/AdminManageExercisesPage'));
const ClientTrainingPlanPage = lazy(() => import('./pages/ClientTrainingPlanPage'));
const ClientProgressPage = lazy(() => import('./pages/ClientProgressPage'));
const AdminTrainingSeriesPage = lazy(() => import('./pages/admin/AdminTrainingSeriesPage'));
const AdminManageGlobalWorkoutPlansPage = lazy(() => import('./pages/admin/AdminManageGlobalWorkoutPlansPage'));
const AdminClientProgressDetailPage = lazy(() => import('./pages/admin/AdminClientProgressDetailPage'));
const AdminClientSelectionPage = lazy(() => import('./pages/admin/AdminClientSelectionPage'));
const AdminLogsPage = lazy(() => import('./pages/admin/AdminLogsPage'));

// Componente de Layout

const Fallback = styled.div`
  padding: 24px; text-align: center; opacity: 0.8;
`;

const MinimizedBar = styled.div`
  position: fixed;
  bottom: calc(70px + max(env(safe-area-inset-bottom), 8px)); /* Altura da BottomNav + safe area */
  left: 0;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.textMain};
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  z-index: 1001; /* Acima da BottomNav (1000) mas abaixo de modais */
  transition: bottom 0.3s ease-in-out, transform 0.3s ease-in-out;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  
  /* Em desktop, não há BottomNav, então fica no fundo */
  @media (min-width: 769px) {
    bottom: 0;
    border-top: none;
    border-bottom: 3px solid ${({ theme }) => theme.colors.primary};
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
  }
`;

const MinimizedBarContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const MinimizedBarTitle = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMain};
`;

const MinimizedBarSubtitle = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const SyncBadge = styled.span`
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 8px;
  background-color: ${({ theme, synced, error }) => 
    error ? `${theme.colors.error}30` : 
    synced ? `${theme.colors.success}30` : 
    `${theme.colors.warning || theme.colors.primary}30`};
  color: ${({ theme, synced, error }) => 
    error ? theme.colors.error : 
    synced ? theme.colors.success : 
    theme.colors.warning || theme.colors.primary};
`;

const PauseIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
  
  &::before {
    content: '⏸';
    font-size: 0.8rem;
  }
`;

const CancelButton = styled.button`
  background-color: ${({ theme }) => theme.colors.error};
  color: white;
  border: none;
  border-radius: 5px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 0.8rem;
`;

// --- Componente ProtectedRoute  ---
const ProtectedRoute = ({ allowedRoles }) => {
  const { authState, revalidateAuth } = useAuth();
  const [isValidating, setIsValidating] = React.useState(true);
  const [validationError, setValidationError] = React.useState(null);
  const hasValidatedRef = React.useRef(false); // Ref para evitar múltiplas validações

  // Calcular valores necessários para os hooks (antes de qualquer return)
  const currentRole = authState.role;
  const shouldLogUnauthorized = allowedRoles && currentRole && !allowedRoles.includes(currentRole);

  // SEGURANÇA: Validar com backend antes de permitir acesso
  React.useEffect(() => {
    // Se já não está autenticado, não fazer validação
    if (!authState.isAuthenticated || !authState.token) {
      setIsValidating(false);
      hasValidatedRef.current = false;
      return;
    }

    // Se já validou para este estado, não fazer novamente
    if (hasValidatedRef.current && !authState.isValidating) {
      setIsValidating(false);
      return;
    }

    // Se já está validando no contexto, esperar
    if (authState.isValidating) {
      return;
    }

    // Validar apenas uma vez quando o componente monta ou quando token muda
    const validateAccess = async () => {
      if (hasValidatedRef.current) return;
      
      try {
        hasValidatedRef.current = true;
        setIsValidating(true);
        
        // Revalidar autenticação
        const isValid = await revalidateAuth();
        
        if (!isValid) {
          setValidationError('Autenticação inválida');
          setIsValidating(false);
          hasValidatedRef.current = false;
          return;
        }

        // Pequeno delay para garantir que authState foi atualizado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setIsValidating(false);
      } catch (error) {
        logger.error('Erro ao validar acesso:', error);
        setValidationError('Erro ao validar acesso');
        setIsValidating(false);
        hasValidatedRef.current = false;
      }
    };

    validateAccess();
  }, [authState.isAuthenticated, authState.token]); // Remover revalidateAuth das dependências

  // Resetar ref quando token muda
  React.useEffect(() => {
    hasValidatedRef.current = false;
  }, [authState.token]);

  // Hook para log de segurança de acesso não autorizado (ANTES de qualquer return)
  React.useEffect(() => {
    if (shouldLogUnauthorized && authState.token) {
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/logs/security`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          description: `Tentativa de acesso a rota protegida. Role atual: ${currentRole}, Roles permitidos: ${allowedRoles?.join(', ') || ''}`,
          attemptedRole: currentRole,
          actualRole: currentRole,
          url: window.location.pathname,
          severity: 'HIGH',
        }),
      }).catch(() => {}); // Ignorar erros de rede
    }
  }, [shouldLogUnauthorized, authState.token, currentRole, allowedRoles]); // Apenas quando necessário

  // Mostrar loading durante validação (AGORA os returns vêm DEPOIS de todos os hooks)
  if (isValidating || authState.isValidating) {
    return <Fallback>A validar acesso...</Fallback>;
  }

  // Verificações de autenticação
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se role atual tem permissão após validação
  if (shouldLogUnauthorized) {
    // Redirecionar conforme role
    if (['admin', 'trainer', 'physiotherapist', 'employee'].includes(currentRole)) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (currentRole === 'user') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Se não há role após validação, redirecionar para login
  if (allowedRoles && !currentRole) {
    return <Navigate to="/login" replace />;
  }

  if (validationError) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

function App() {
  const { authState } = useAuth();
  const { activeWorkout, isMinimized, setIsMinimized, cancelWorkout, syncStatus } = useWorkout();
  const [showCancelWorkoutModal, setShowCancelWorkoutModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Inicializar handlers globais de erro
  useEffect(() => {
    initializeErrorHandlers(() => authState.token);
  }, [authState.token]);

  // Calcular tempo decorrido do treino
  useEffect(() => {
    if (!activeWorkout || !activeWorkout.startTime) return;
    
    const updateElapsedTime = () => {
      const elapsed = Math.floor((Date.now() - activeWorkout.startTime) / 1000);
      setElapsedTime(elapsed);
    };
    
    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);
    
    return () => clearInterval(interval);
  }, [activeWorkout]);

  // Verificar se há treino pendente ao iniciar
  useEffect(() => {
    if (!activeWorkout || !isMinimized || !authState.isAuthenticated) return;
    
    // Verificar se o treino foi recuperado do localStorage
    // Se o treino tem mais de 30 segundos desde o início, provavelmente foi recuperado
    const timeSinceStart = Date.now() - activeWorkout.startTime;
    const wasRecovered = timeSinceStart > 30000; // Mais de 30 segundos = recuperado
    
    if (wasRecovered) {
      // Pequeno delay para garantir que a UI está pronta
      const timer = setTimeout(() => {
        setShowRecoveryModal(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, []); // Apenas ao montar o componente

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? String(hours).padStart(2, '0') + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleCancelWorkoutClick = (e) => {
    e.stopPropagation();
    setShowCancelWorkoutModal(true);
  };

  const handleCancelWorkoutConfirm = () => {
    setShowCancelWorkoutModal(false);
    cancelWorkout();
  };

  const handleRecoveryContinue = () => {
    setShowRecoveryModal(false);
    setIsMinimized(false);
  };

  const handleRecoveryCancel = () => {
    setShowRecoveryModal(false);
    cancelWorkout();
  };

  return (
    <ErrorBoundary>
      <OfflineIndicator />
      {authState.isAuthenticated && <Navbar />}
      {authState.isAuthenticated && <BottomNav />}
      <div className="main-content-area"> 
        <Suspense fallback={<Fallback>A carregar…</Fallback>}>
          <Routes>
          <Route path="/login" element={ !authState.isAuthenticated ? <LoginPage /> : (authState.role === 'user' ? <Navigate to="/dashboard" replace /> : <Navigate to="/admin/dashboard" replace />)}/>
          <Route path="/register" element={ !authState.isAuthenticated ? <RegisterPage /> : (authState.role === 'user' ? <Navigate to="/dashboard" replace /> : <Navigate to="/admin/dashboard" replace />)}/>
          <Route path='/login-staff' element={ !authState.isAuthenticated ? <StaffLoginPage/> : <Navigate to="/admin/dashboard" replace/>}/>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          {/* Rotas de Cliente */}
          <Route element={<ProtectedRoute allowedRoles={['user']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
<Route path="/definicoes" element={<SettingsPage />} />
            <Route path="/meus-pagamentos" element={<MyPaymentsPage />} />
            <Route path="/meus-treinos" element={<UserCalendarPage />} />
            <Route path="/treinos/:trainingId/plano" element={<ClientTrainingPlanPage />} />
            <Route path="/meu-progresso" element={<ClientProgressPage />} />
            <Route path="/explorar-planos" element={<ExploreWorkoutPlansPage />} />
            <Route path="/meu-progresso/usar-plano/:globalPlanId" element={<ClientProgressPage />} />
            <Route path="/calendario" element={<BookingServiceSelectionPage />} />
            <Route path="/agendar" element={<BookingCalendarPage />} />
            <Route path="/agendar-treino-grupo" element={<GroupTrainingCalendarPage />} />
            <Route path="/treino/resumo" element={<WorkoutSummaryPage />} />
            <Route path="/meu-progresso-detalhado" element={<ClientProgressOverviewPage />} />
            <Route path="/pedir-pt-individual" element={<IndividualPTRequestPage />} />
            <Route path="/plano/:globalPlanId/resumo" element={<WorkoutPlanSummaryPage />} />
          </Route>
          {/* Rotas de Staff/Admin */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'trainer', 'physiotherapist', 'employee']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/calendario-geral" element={<CalendarPage />} />
            <Route path="/admin/manage-users" element={<AdminManageUsersPage />} />
            <Route path="/admin/manage-staff" element={<AdminManageStaffPage />} />
            <Route path="/admin/manage-trainings" element={<AdminManageTrainingsPage />} />
            <Route path="/admin/trainings/:trainingId/manage-plans" element={<AdminManageWorkoutPlansPage />} />
            <Route path="/admin/manage-appointments" element={<AdminManageAppointmentsPage />} />
            <Route path="/admin/manage-payments" element={<AdminManagePaymentsPage />} />
            <Route path="/admin/appointment-requests" element={<StaffManageRequestsPage />} /> 
            <Route path="/admin/manage-exercises" element={<AdminManageExercisesPage />} />
            <Route path="/admin/users/:userId/details" element={<AdminUserDetailsPage />} /> 
            <Route path='/admin/training-series' element={<AdminTrainingSeriesPage />} /> 
            <Route path="/admin/manage-global-plans" element={<AdminManageGlobalWorkoutPlansPage />} />
            <Route path="/admin/progresso-clientes" element={<AdminClientSelectionPage />} />
            <Route path="/admin/progresso-clientes/:userId" element={<AdminClientProgressDetailPage />} />
            <Route path="/admin/logs" element={<AdminLogsPage />} />
          </Route>
          {/* Rota Genérica para Notificações (para qualquer utilizador autenticado) */}
          <Route element={<ProtectedRoute allowedRoles={['user', 'admin', 'trainer', 'physiotherapist', 'employee']} />}>
              <Route path="/notificacoes" element={<NotificationsPage />} />
          </Route>
          {/* Rota Catch-all */}
          <Route
            path="*"
            element={
              authState.isAuthenticated
                ? (authState.role === 'user' ? <Navigate to="/dashboard" replace /> : <Navigate to="/admin/dashboard" replace />)
                : <Navigate to="/login" replace />
            }
          />
          </Routes>
        </Suspense>
      </div>
      {activeWorkout && !isMinimized && (
        <Suspense fallback={null}>
          <LiveWorkoutSessionPage />
        </Suspense>
      )}
      
      {activeWorkout && isMinimized && (
        <MinimizedBar onClick={() => setIsMinimized(false)}>
          <MinimizedBarContent>
            <MinimizedBarTitle>
              <PauseIndicator /> {activeWorkout.name}
            </MinimizedBarTitle>
            <MinimizedBarSubtitle>
              ⏱ {formatTime(elapsedTime)} • Toque para continuar
              {syncStatus && !syncStatus.synced && (
                <SyncBadge synced={syncStatus.synced} error={syncStatus.error}>
                  {syncStatus.error || 'A sincronizar...'}
                </SyncBadge>
              )}
            </MinimizedBarSubtitle>
          </MinimizedBarContent>
          <CancelButton onClick={handleCancelWorkoutClick}>
            Cancelar
          </CancelButton>
        </MinimizedBar>
      )}

      <ConfirmationModal
        isOpen={showCancelWorkoutModal}
        onClose={() => setShowCancelWorkoutModal(false)}
        onConfirm={handleCancelWorkoutConfirm}
        title="Cancelar Treino"
        message="Tem a certeza? Todos os dados registados serão perdidos."
        confirmText="Cancelar Treino"
        cancelText="Continuar"
        danger={true}
        loading={false}
      />

      <ConfirmationModal
        isOpen={showRecoveryModal}
        onClose={handleRecoveryCancel}
        onConfirm={handleRecoveryContinue}
        title="Treino em Pausa"
        message={`Encontramos um treino em pausa: "${activeWorkout?.name}". Tempo decorrido: ${formatTime(elapsedTime)}. Deseja continuar?`}
        confirmText="Continuar Treino"
        cancelText="Cancelar Treino"
        danger={false}
        loading={false}
      />
    </ErrorBoundary>
  );
}
export default App;
