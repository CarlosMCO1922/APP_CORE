// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Componentes de Página (como no seu ficheiro)
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import RegisterPage from './pages/RegisterPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import MyPaymentsPage from './pages/MyPaymentsPage';
import NotificationsPage from './pages/NotificationsPage';
import ExploreWorkoutPlansPage from './pages/ExploreWorkoutPlansPage';

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

// --- Componente ProtectedRoute (como no seu ficheiro) ---
const ProtectedRoute = ({ allowedRoles }) => {
  const { authState } = useAuth();
  if (!authState.isAuthenticated) return <Navigate to="/login" replace />;
  const currentRole = authState.role; // authState.user?.role se user puder ser null inicialmente

  // Se authState.role ainda não estiver definido (ex: no primeiro render antes do useEffect no AuthContext popular), pode mostrar um loader ou redirecionar
  if (allowedRoles && !currentRole) { 
    // Poderia mostrar um spinner ou algo enquanto o role é determinado
    // console.warn("ProtectedRoute: authState.role é null, isAuthenticated:", authState.isAuthenticated);
    // Se está autenticado mas o role é null, pode ser um estado transitório.
    // Se não estiver autenticado, o primeiro if já trata.
    // Considerar o que fazer aqui. Por agora, se autenticado mas sem role, permite acesso
    // ou redireciona para uma página de carregamento/erro se o role for estritamente necessário.
    // Para simplificar, vamos assumir que se está autenticado, o role será definido em breve.
  } else if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
    // Redireciona com base no role atual se não estiver nos permitidos
    if (['admin', 'trainer', 'physiotherapist', 'employee'].includes(currentRole)) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (currentRole === 'user') {
      return <Navigate to="/dashboard" replace />;
    }
    // Fallback se o role for desconhecido mas autenticado (improvável com a sua lógica de AuthContext)
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
      <NotificationProvider> {/* Envolve toda a app para acesso ao contexto de notificações */}
        {authState.isAuthenticated && <Navbar />}
        <div className="main-content-area"> {/* Ajuste App.css se esta classe aplicar padding */}
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
              <Route path="/meu-progresso" element={<ClientProgressPage />} />
              <Route path="/explorar-planos" element={<ExploreWorkoutPlansPage />} />
              <Route path="/meu-progresso/usar-plano/:globalPlanId" element={<ClientProgressPage />} />
              
            </Route>

            {/* Rotas de Staff/Admin */}
            {/* O AdminTrainingSeriesPage deve estar aqui dentro se for para todos os staff, ou num bloco mais restrito se for só para role 'admin' */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'trainer', 'physiotherapist', 'employee']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/calendario-geral" element={<CalendarPage />} />
              <Route path="/admin/manage-users" element={<AdminManageUsersPage />} />
              <Route path="/admin/manage-staff" element={<AdminManageStaffPage />} />
              <Route path="/admin/manage-trainings" element={<AdminManageTrainingsPage />} />
              <Route path="/admin/trainings/:trainingId/manage-plans" element={<AdminManageWorkoutPlansPage />} />
              <Route path="/admin/manage-appointments" element={<AdminManageAppointmentsPage />} />
              <Route path="/admin/manage-payments" element={<AdminManagePaymentsPage />} />
              <Route path="/admin/appointment-requests" element={<StaffManageRequestsPage />} /> {/* Staff também acede */}
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