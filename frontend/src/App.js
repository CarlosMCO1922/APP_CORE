// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Componentes de Página 
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import RegisterPage from './pages/RegisterPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import MyPaymentsPage from './pages/MyPaymentsPage';
import NotificationsPage from './pages/NotificationsPage';
import ExploreWorkoutPlansPage from './pages/ExploreWorkoutPlansPage';
import BookingServiceSelectionPage from './pages/BookingServiceSelectionPage';
import BookingCalendarPage from './pages/BookingCalendarPage';
import LiveWorkoutSessionPage from './pages/LiveWorkoutSessionPage';
import WorkoutSummaryPage from './pages/WorkoutSummaryPage';
import PersonalRecordsPage from './pages/PersonalRecordsPage';
import GroupTrainingCalendarPage from './pages/GroupTrainingCalendarPage';

import AdminManageUsersPage from './pages/admin/AdminManageUsersPage';
import AdminUserDetailsPage from './pages/admin/AdminUserDetailsPage';
import AdminManageStaffPage from './pages/admin/AdminManageStaffPage';
import AdminManageTrainingsPage from './pages/admin/AdminManageTrainingsPage';
import AdminManageAppointmentsPage from './pages/admin/AdminManageAppointmentsPage';
import AdminManagePaymentsPage from './pages/admin/AdminManagePaymentsPage';
import StaffManageRequestsPage from './pages/admin/StaffManageRequestsPage';
import AdminManageWorkoutPlansPage from './pages/admin/AdminManageWorkoutPlansPage';
import AdminManageExercisesPage from './pages/admin/AdminManageExercisesPage';
import ClientTrainingPlanPage from './pages/ClientTrainingPlanPage';
import ClientProgressPage from './pages/ClientProgressPage';
import AdminTrainingSeriesPage from './pages/admin/AdminTrainingSeriesPage';
import AdminManageGlobalWorkoutPlansPage from './pages/admin/AdminManageGlobalWorkoutPlansPage';


// Componente de Layout
import Navbar from './components/Layout/Navbar';

// --- Componente ProtectedRoute  ---
const ProtectedRoute = ({ allowedRoles }) => {
  const { authState } = useAuth();
  if (!authState.isAuthenticated) return <Navigate to="/login" replace />;
  const currentRole = authState.role; 

  if (allowedRoles && !currentRole) { 

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
  useEffect(() => {
  }, [authState]);

  return (
    <Router>
      <NotificationProvider> 
        {authState.isAuthenticated && <Navbar />}
        <div className="main-content-area"> 
          <Routes>
            <Route
              path="/login"
              element={
                !authState.isAuthenticated
                  ? <LoginPage />
                  : (authState.role === 'user' ? <Navigate to="/dashboard" replace /> : <Navigate to="/admin/dashboard" replace />)
              }
            />
            <Route
              path="/register"
              element={
                !authState.isAuthenticated
                  ? <RegisterPage />
                  : (authState.role === 'user' ? <Navigate to="/dashboard" replace /> : <Navigate to="/admin/dashboard" replace />)
              }
            />

            {/* Rotas de Cliente */}
            <Route element={<ProtectedRoute allowedRoles={['user']} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/definicoes" element={<SettingsPage />} />
              <Route path="/meus-pagamentos" element={<MyPaymentsPage />} />
              <Route path="/treinos/:trainingId/plano" element={<ClientTrainingPlanPage />} />
              <Route path="/meu-progresso" element={<ClientProgressPage />} />
              <Route path="/explorar-planos" element={<ExploreWorkoutPlansPage />} />
              <Route path="/meu-progresso/usar-plano/:globalPlanId" element={<ClientProgressPage />} />
              <Route path="/calendario" element={<BookingServiceSelectionPage />} />
              <Route path="/agendar" element={<BookingCalendarPage />} />
              <Route path="/agendar-treino-grupo" element={<GroupTrainingCalendarPage />} />
              <Route path="/treino/resumo" element={<WorkoutSummaryPage />} />
              <Route path="/treino-ao-vivo/plano/:globalPlanId" element={<LiveWorkoutSessionPage />} />
              <Route path="/treino-ao-vivo/treino/:trainingId" element={<LiveWorkoutSessionPage />} />
              <Route path="/meus-recordes" element={<PersonalRecordsPage />} />
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
        </div>
      </NotificationProvider>
    </Router>
  );
}
export default App;