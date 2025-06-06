// src/pages/admin/AdminDashboardPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { adminGetTotalPaid } from '../services/paymentService';
import { adminGetCurrentWeekSignups, adminGetTodayTrainingsCount } from '../services/trainingService'; 
import { adminGetTodayAppointmentsCount } from '../services/appointmentService';
import {
    FaDollarSign, FaUsers, FaCalendarDay,
    FaCalendarAlt, FaUserMd, FaDumbbell, FaCreditCard,
    FaRunning, FaRegCalendarCheck, FaUserPlus, FaCalendarCheck as FaCalendarCheckIcon
} from 'react-icons/fa';
import { theme } from '../theme';

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 20px 40px;
  font-family: ${({ theme }) => theme.fonts.main};

  @media (max-width: 768px) {
    padding: 20px 20px;
  }
  @media (max-width: 480px) {
    padding: 15px 15px;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 10px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
  @media (max-width: 480px) {
    font-size: 1.8rem;
    margin-bottom: 15px;
  }
`;

const WelcomeMessage = styled.p`
  font-size: 1.1rem;
  color: #b0b0b0;
  margin-bottom: 30px;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 1rem;
    margin-bottom: 20px;
  }
`;

const AdminNavGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const AdminNavLinkCard = styled(Link)`
  background-color: #252525;
  padding: 25px;
  border-radius: 10px;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.textMain};
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  transition: transform 0.2s ease-in-out, background-color 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 150px;

  h2 {
    color: ${({ theme }) => theme.colors.primary};
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    svg {
        font-size: 1.3em;
    }
    @media (max-width: 480px) {
        font-size: 1.3rem;
    }
  }

  p {
    font-size: 0.9rem;
    color: #a0a0a0;
    line-height: 1.4;
    @media (max-width: 480px) {
        font-size: 0.85rem;
    }
  }

  &:hover {
    transform: translateY(-5px);
    background-color: #303030;
  }
`;

const StatsOverviewContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
  margin-top: 20px;
`;

const StatCard = styled.div`
  background-color: #2c2c2c;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border-left: 5px solid ${({ theme, color }) => color || theme.colors.primary};
`;

const StatIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 15px;
  color: ${({ theme, color }) => color || theme.colors.primary};
`;

const StatValue = styled.p`
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 5px 0;
`;

const StatLabel = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  text-transform: uppercase;
`;

const MessageBaseStyles = css`
  text-align: center;
  padding: 12px 18px;
  margin: 10px auto;
  border-radius: ${({ theme }) => theme.borderRadius};
  border-width: 1px;
  border-style: solid;
  max-width: 100%;
  font-size: 0.9rem;
  font-weight: 500;
`;

const LoadingText = styled.p`
    ${MessageBaseStyles}
    color: ${({ theme }) => theme.colors.primary};
    border-color: transparent;
    background: transparent;
    font-style: italic;
`;

const ErrorText = styled.p`
    ${MessageBaseStyles}
    color: ${({ theme }) => theme.colors.error};
    background-color: ${({ theme }) => theme.colors.errorBg};
    border-color: ${({ theme }) => theme.colors.error};
`;

const AdminDashboardPage = () => {
  const { authState } = useAuth();
  const [totalPaidThisMonth, setTotalPaidThisMonth] = useState(null);
  const [weeklySignups, setWeeklySignups] = useState(null);
  const [todayEventsCount, setTodayEventsCount] = useState({ trainings: null, appointments: null });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  const fetchDashboardStats = useCallback(async () => {
    if (authState.token) {
      setLoadingStats(true);
      setStatsError('');
      try {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const formattedStartDate = firstDayOfMonth.toISOString().split('T')[0];
        const formattedEndDate = lastDayOfMonth.toISOString().split('T')[0];

        const [
            totalPaidData,
            weeklySignupsData,
            todayTrainingsData,
            todayAppointmentsData
        ] = await Promise.all([
          adminGetTotalPaid(authState.token, { startDate: formattedStartDate, endDate: formattedEndDate }),
          adminGetCurrentWeekSignups(authState.token),
          adminGetTodayTrainingsCount(authState.token),
          adminGetTodayAppointmentsCount(authState.token)
        ]);

        setTotalPaidThisMonth(totalPaidData.totalPaid);
        setWeeklySignups(weeklySignupsData.currentWeekSignups);
        setTodayEventsCount({
            trainings: todayTrainingsData.todayTrainingsCount,
            appointments: todayAppointmentsData.todayAppointmentsCount
        });

      } catch (err) {
        console.error("Erro ao buscar estatísticas do dashboard admin:", err);
        setStatsError('Não foi possível carregar todas as estatísticas.');
      } finally {
        setLoadingStats(false);
      }
    }
  }, [authState.token]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const totalTodayEvents = (todayEventsCount.trainings !== null && todayEventsCount.appointments !== null)
    ? todayEventsCount.trainings + todayEventsCount.appointments
    : null;

  return (
    <PageContainer>
      <Title>Painel de Administração CORE</Title>
      <WelcomeMessage>
        Bem-vindo(a), {authState.user?.firstName || 'Admin'} ({authState.user?.email})!
      </WelcomeMessage>

      <StatsOverviewContainer>
        <StatCard color={theme.colors.success || '#4CAF50'}>
          <StatIcon color={theme.colors.success || '#4CAF50'}><FaDollarSign /></StatIcon>
          {loadingStats && totalPaidThisMonth === null && <LoadingText>A carregar...</LoadingText>}
          {!loadingStats && statsError && totalPaidThisMonth === null && <ErrorText>Erro</ErrorText>}
          {totalPaidThisMonth !== null && !loadingStats && <StatValue>{Number(totalPaidThisMonth).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</StatValue>}
          <StatLabel>Receita Este Mês</StatLabel>
        </StatCard>

        <StatCard color="#00A9FF">
          <StatIcon color="#00A9FF"><FaUserPlus /></StatIcon>
          {loadingStats && weeklySignups === null && <LoadingText>A carregar...</LoadingText>}
          {!loadingStats && statsError && weeklySignups === null && <ErrorText>Erro</ErrorText>}
          {weeklySignups !== null && !loadingStats && <StatValue>{weeklySignups}</StatValue>}
          <StatLabel>Inscrições Esta Semana</StatLabel>
        </StatCard>

        <StatCard color="#FFC107">
          <StatIcon color="#FFC107"><FaCalendarDay /></StatIcon>
          {loadingStats && totalTodayEvents === null && <LoadingText>A carregar...</LoadingText>}
          {!loadingStats && statsError && totalTodayEvents === null && <ErrorText>Erro</ErrorText>}
          {totalTodayEvents !== null && !loadingStats && <StatValue>{totalTodayEvents}</StatValue>}
          <StatLabel>Eventos Hoje (Total)</StatLabel>
          {totalTodayEvents !== null && !loadingStats && (
            <p style={{fontSize: '0.75rem', color: theme.colors.textMuted, margin: '5px 0 0 0'}}>
              (Treinos: {todayEventsCount.trainings ?? '?'}, Consultas: {todayEventsCount.appointments ?? '?'})
            </p>
          )}
        </StatCard>
      </StatsOverviewContainer>
      {statsError && !loadingStats && <ErrorText style={{maxWidth: '100%', marginBottom: '20px'}}>{statsError}</ErrorText>}

      <AdminNavGrid>
        <AdminNavLinkCard to="/admin/calendario-geral">
          <h2><FaCalendarAlt />Calendário Geral</h2>
          <p>Visualizar todos os treinos e consultas.</p>
        </AdminNavLinkCard>
        <AdminNavLinkCard to="/admin/manage-users">
          <h2><FaUsers />Gerir Clientes</h2>
          <p>Ver, criar, editar e eliminar contas de clientes.</p>
        </AdminNavLinkCard>
        <AdminNavLinkCard to="/admin/manage-staff">
          <h2><FaUserMd />Gerir Equipa</h2>
          <p>Adicionar e gerir contas de instrutores e staff.</p>
        </AdminNavLinkCard>
        <AdminNavLinkCard to="/admin/manage-trainings">
          <h2><FaDumbbell />Gerir Treinos</h2>
          <p>Criar, visualizar, editar e eliminar sessões de treino.</p>
        </AdminNavLinkCard>
        <AdminNavLinkCard to="/admin/manage-appointments">
          <h2><FaCalendarCheckIcon />Gerir Consultas</h2>
          <p>Criar, visualizar, editar e eliminar horários de consulta.</p>
        </AdminNavLinkCard>
        <AdminNavLinkCard to="/admin/manage-payments">
          <h2><FaCreditCard />Gerir Pagamentos</h2>
          <p>Registar e acompanhar pagamentos dos clientes.</p>
        </AdminNavLinkCard>
        <AdminNavLinkCard to="/admin/manage-global-plans">
          <h2><FaCreditCard />Gerir Planos de treino</h2>
          <p>Criar, visualizar, editar e eliminar planos de treino.</p>
        </AdminNavLinkCard>
        <AdminNavLinkCard to="/admin/manage-exercises">
          <h2><FaRunning />Gerir Exercícios Base</h2>
          <p>Criar e editar os exercícios disponíveis para os planos.</p>
        </AdminNavLinkCard>
        <AdminNavLinkCard to="/admin/appointment-requests">
          <h2><FaRegCalendarCheck />Pedidos de Consulta</h2>
          <p>Ver e responder a pedidos de consulta pendentes.</p>
        </AdminNavLinkCard>
      </AdminNavGrid>
    </PageContainer>
  );
};

export default AdminDashboardPage;