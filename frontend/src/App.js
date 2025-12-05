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
  padding: 10px 15px;
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
  const { authState } = useAuth();
  if (!authState.isAuthenticated) return <Navigate to="/login" replace />;
  const currentRole = authState.role; 

  if (allowedRoles && !currentRole) {
    return <Navigate to="/login" replace />;
  } else if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
    if (['admin', 'trainer', 'physiotherapist', 'employee'].includes(currentRole)) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (currentRole === 'user') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/login" replace />; 
  }
  return <Outlet />;
};

function App() {
  const { authState } = useAuth();
  const { activeWorkout, isMinimized, setIsMinimized, cancelWorkout } = useWorkout();
  const [showCancelWorkoutModal, setShowCancelWorkoutModal] = useState(false);

  const handleCancelWorkoutClick = (e) => {
    e.stopPropagation();
    setShowCancelWorkoutModal(true);
  };

  const handleCancelWorkoutConfirm = () => {
    setShowCancelWorkoutModal(false);
    cancelWorkout();
  };

  return (
    <>
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
          <span>Treino em Andamento: {activeWorkout.name}</span>
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
  </>
  );
}
export default App;
