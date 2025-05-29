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
// == NOVA IMPORTAÇÃO ==
import NotificationsPage from './pages/NotificationsPage'; // Importa a nova página

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
              <Route path="/calendario" element={<CalendarPage />} />
              <Route path="/definicoes" element={<SettingsPage />} />
              <Route path="/meus-pagamentos" element={<MyPaymentsPage />} />
              <Route path="/treinos/:trainingId/plano" element={<ClientTrainingPlanPage />} />
              {/* == NOVA ROTA (CLIENTE) == */}
              <Route path="/notificacoes" element={<NotificationsPage />} />
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
              {/* == NOVA ROTA (ADMIN/STAFF) == */}
              {/* Pode usar a mesma rota /notificacoes se o conteúdo for o mesmo,
                  ou uma rota específica de admin se precisar de uma página diferente.
                  Por agora, vamos assumir que a mesma página serve para ambos.
                  Se o link na Navbar aponta para /notificacoes, esta rota será usada.
                  Se quiser um link diferente para admins na Navbar, precisará de ajustar
                  o `to` do `ViewAllNotificationsLink` condicionalmente na Navbar.
                  Vamos manter simples por agora e usar /notificacoes para todos os autenticados.
                  Se a rota /admin/notificacoes for necessária, adicione-a.
                  O ideal é que a Navbar já direcione para a rota correta dependendo do role.
                  No Navbar.js, o link é fixo para "/notificacoes".
                  Então, uma única rota protegida para utilizadores autenticados é suficiente.
                  Vamos remover a duplicada e colocar uma rota mais genérica.
              */}
            </Route>

            {/* Rota Genérica para Notificações (para qualquer utilizador autenticado) */}
            {/* Esta rota deve estar dentro de um ProtectedRoute genérico ou o ProtectedRoute acima
                que permite múltiplos roles já serve se "/notificacoes" estiver lá.
                Dado que /notificacoes está dentro do ProtectedRoute para 'user',
                staffs não acederiam.
                Vamos colocar uma rota para /notificacoes que seja acessível por todos os autenticados.
            */}
            <Route element={<ProtectedRoute allowedRoles={['user', 'admin', 'trainer', 'physiotherapist', 'employee']} />}>
                <Route path="/notificacoes" element={<NotificationsPage />} />
                 {/* Se precisar de um caminho específico para admin, pode adicionar:
                 <Route path="/admin/notificacoes" element={<NotificationsPage />} />
                 E ajustar o link na Navbar para apontar para /admin/notificacoes se for admin.
                 Por agora, /notificacoes serve para todos os autenticados.
                 */}
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