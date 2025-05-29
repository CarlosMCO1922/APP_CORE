// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
// == NOVA IMPORTAÇÃO ==
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

import AdminManageUsersPage from './pages/admin/AdminManageUsersPage';
import AdminManageStaffPage from './pages/admin/AdminManageStaffPage';
import AdminManageTrainingsPage from './pages/admin/AdminManageTrainingsPage';
import AdminManageAppointmentsPage from './pages/admin/AdminManageAppointmentsPage';
import AdminManagePaymentsPage from './pages/admin/AdminManagePaymentsPage';
import StaffManageRequestsPage from './pages/admin/StaffManageRequestsPage';
import AdminManageWorkoutPlansPage from './pages/admin/AdminManageWorkoutPlansPage';
import AdminManageExercisesPage from './pages/admin/AdminManageExercisesPage';
import ClientTrainingPlanPage from './pages/ClientTrainingPlanPage';

// Componente de Layout
import Navbar from './components/Layout/Navbar';

// --- Componente ProtectedRoute ---
const ProtectedRoute = ({ allowedRoles }) => {
  const { authState } = useAuth();
  if (!authState.isAuthenticated) return <Navigate to="/login" replace />;
  const currentRole = authState.role;

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
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
    // console.log("App.js: authState mudou:", authState);
  }, [authState]);

  return (
    // O Router deve ser o mais externo possível se o NotificationProvider não depender dele
    // Mas como o NotificationProvider usa useAuth, ele deve estar dentro do AuthProvider.
    // E como Navbar usa useNotifications (futuramente), NotificationProvider deve envolver Navbar.
    <Router>
      {/* == NotificationProvider ENVOLVE A NAVBAR E AS ROTAS == */}
      <NotificationProvider>
        {authState.isAuthenticated && <Navbar />}
        <div className="main-content-area"> {/* Certifica-te que este estilo é útil ou remove-o */}
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
              <Route path="/calendario" element={<CalendarPage />} />
              <Route path="/definicoes" element={<SettingsPage />} />
              <Route path="/meus-pagamentos" element={<MyPaymentsPage />} />
              <Route path="/treinos/:trainingId/plano" element={<ClientTrainingPlanPage />} />
              <Route path="/notificacoes" element={<NotificationsPage />} />
              {/* Adicionar aqui rota para /notificacoes (cliente) quando criarmos a página */}
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
              <Route path="/admin/notificacoes" element={<NotificationsPage />} />
              {/* Adicionar aqui rota para /admin/notificacoes (admin/staff) quando criarmos a página */}
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