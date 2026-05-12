// src/pages/admin/AdminDashboardPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { css, useTheme } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { adminGetTotalPaid } from '../services/paymentService';
import { adminGetCurrentWeekSignups, adminGetTodayTrainingsCount, adminGetTodayTrainingsEnrollmentsCount } from '../services/trainingService'; 
import { adminGetTodayAppointmentsCount } from '../services/appointmentService';
import {
    FaDollarSign, FaUsers, FaCalendarDay,
    FaCalendarAlt, FaUserMd, FaDumbbell, FaCreditCard,
    FaRunning, FaRegCalendarCheck, FaUserPlus, FaCalendarCheck as FaCalendarCheckIcon,
    FaClock,
} from 'react-icons/fa';
import ThemeToggler from '../components/Theme/ThemeToggler';


// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 20px 40px;
  font-family: ${({ theme }) => theme.fonts.main};
  position: relative;

  @media (max-width: 768px) {
    padding: 20px 20px;
  }
  @media (max-width: 480px) {
    padding: 15px 15px;
  }
`;

const TogglerContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 40px;
  z-index: 10;
  
  @media (max-width: 768px) {
    right: 20px;
    top: 15px;
  }
  @media (max-width: 480px) {
    right: 15px;
    top: 15px;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 10px;
  text-align: center;
  padding-right: 80px; /* Espaço para o toggle */
  padding-left: 20px; /* Balanceamento visual */
  
  @media (max-width: 768px) {
    font-size: 2.2rem;
    padding-right: 70px;
  }
  @media (max-width: 480px) {
    font-size: 1.8rem;
    margin-bottom: 15px;
    padding-right: 60px;
    padding-left: 15px;
  }
`;

const WelcomeMessage = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.textMuted};
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
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 25px;
  border-radius: 10px;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.textMain};
  box-shadow: ${({ theme }) => theme.boxShadow};
  transition: transform 0.2s ease-in-out, background-color 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  text-align: left;
  min-height: 110px;

  h2 {
    color: ${({ theme }) => theme.colors.primary};
    margin: 0;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    width: 100%;
    svg {
        font-size: 1.3em;
        flex-shrink: 0;
    }
    @media (max-width: 480px) {
        font-size: 1.3rem;
    }
  }

  &:hover {
    transform: translateY(-5px);
    background-color: ${({ theme }) => theme.colors.cardBackgroundDarker};
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
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px;
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  width: 100%;
  border-left: 5px solid ${({ theme, color }) => color || theme.colors.primary};
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: transform 0.2s ease-in-out, background-color 0.2s ease-in-out;

  &:hover {
    ${props => props.$clickable && `
      transform: translateY(-2px);
      background-color: ${props.theme.colors.cardBackgroundDarker};
    `}
  }
`;

const StatTopRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-width: 0;
`;

const StatValueArea = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
`;

const StatIcon = styled.div`
  font-size: 2.25rem;
  line-height: 1;
  flex-shrink: 0;
  color: ${({ theme, color }) => color || theme.colors.primary};
`;

const StatValue = styled.p`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0;
  line-height: 1.15;
`;

const StatInlineHint = styled.span`
  font-size: 0.95rem;
  color: ${({ theme, $error, $muted }) => {
    if ($error) return theme.colors.error;
    if ($muted) return theme.colors.textMuted;
    return theme.colors.primary;
  }};
  font-style: italic;
`;

const StatLabel = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 10px 0 0 0;
  text-transform: uppercase;
  width: 100%;
`;

const StatSubLabel = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 6px 0 0 0;
  width: 100%;
  line-height: 1.35;
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

const ErrorText = styled.p`
    ${MessageBaseStyles}
    color: ${({ theme }) => theme.colors.error};
    background-color: ${({ theme }) => theme.colors.errorBg};
    border-color: ${({ theme }) => theme.colors.error};
`;

const ROLES_FULL_ADMIN = ['admin'];

/** Comparação tolerante a maiúsculas / acentos (ex.: Vítor → vitor). */
const normalizeFirstNameKey = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/**
 * Cartão "Eventos hoje": fisios de consultas vêem marcações; admin e Gonçalo vêem treinos em grupo.
 */
const getTodayEventsCardPath = (user) => {
  const role = user?.role;
  const key = normalizeFirstNameKey(user?.firstName);
  if (role === 'admin') return '/admin/manage-trainings';
  if (key === 'goncalo') return '/admin/manage-trainings';
  if (['ines', 'elsa', 'vitor'].includes(key)) return '/admin/manage-appointments';
  return '/admin/manage-appointments';
};

const AdminDashboardPage = () => {
  const theme = useTheme();
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [totalPaidThisMonth, setTotalPaidThisMonth] = useState(null);
  const [weeklySignups, setWeeklySignups] = useState(null);
  const [todayEventsCount, setTodayEventsCount] = useState({ trainings: null, appointments: null, enrollments: null });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  const isFullAdmin = ROLES_FULL_ADMIN.includes(authState.user?.role);

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

        if (isFullAdmin) {
          const [
              totalPaidData,
              weeklySignupsData,
              todayTrainingsData,
              todayAppointmentsData,
              todayEnrollmentsData
          ] = await Promise.all([
            adminGetTotalPaid(authState.token, { startDate: formattedStartDate, endDate: formattedEndDate }),
            adminGetCurrentWeekSignups(authState.token),
            adminGetTodayTrainingsCount(authState.token),
            adminGetTodayAppointmentsCount(authState.token),
            adminGetTodayTrainingsEnrollmentsCount(authState.token)
          ]);
          setTotalPaidThisMonth(totalPaidData.totalPaid);
          setWeeklySignups(weeklySignupsData.currentWeekSignups);
          setTodayEventsCount({
              trainings: todayTrainingsData.todayTrainingsCount,
              appointments: todayAppointmentsData.todayAppointmentsCount,
              enrollments: todayEnrollmentsData.todayEnrollmentsCount
          });
        } else {
          const todayAppointmentsData = await adminGetTodayAppointmentsCount(authState.token);
          setTodayEventsCount({
              trainings: 0,
              appointments: todayAppointmentsData.todayAppointmentsCount,
              enrollments: 0
          });
        }
      } catch (err) {
        console.error("Erro ao buscar estatísticas do dashboard admin:", err);
        setStatsError('Não foi possível carregar todas as estatísticas.');
      } finally {
        setLoadingStats(false);
      }
    }
  }, [authState.token, isFullAdmin]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const totalTodayEvents = (todayEventsCount.trainings !== null && todayEventsCount.appointments !== null)
    ? todayEventsCount.trainings + todayEventsCount.appointments
    : null;

  const todayEventsTargetPath = getTodayEventsCardPath(authState.user);
  const goTodayEventsTarget = () => navigate(todayEventsTargetPath);

  return (
    <PageContainer>
      <TogglerContainer>
        <ThemeToggler />
      </TogglerContainer>
      <Title>Administração CORE</Title>
      <WelcomeMessage>
        Bem-vindo(a), {authState.user?.firstName || 'Admin'} ({authState.user?.email})!
      </WelcomeMessage>

      <StatsOverviewContainer>
        {isFullAdmin && (
          <StatCard
            color={theme.colors.success || '#4CAF50'}
            $clickable
            onClick={() => navigate('/admin/manage-payments', { state: { openCreatePayment: true } })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/admin/manage-payments', { state: { openCreatePayment: true } });
              }
            }}
          >
            <StatTopRow>
              <StatIcon color={theme.colors.success || '#4CAF50'}><FaDollarSign /></StatIcon>
              <StatValueArea>
                {loadingStats && totalPaidThisMonth === null && <StatInlineHint>A carregar…</StatInlineHint>}
                {!loadingStats && statsError && totalPaidThisMonth === null && <StatInlineHint $error>Erro</StatInlineHint>}
                {totalPaidThisMonth !== null && !loadingStats && (
                  <StatValue>{Number(totalPaidThisMonth).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</StatValue>
                )}
              </StatValueArea>
            </StatTopRow>
            <StatLabel>Receita Este Mês</StatLabel>
          </StatCard>
        )}

        {isFullAdmin && (
          <StatCard color="#00A9FF"          >
            <StatTopRow>
              <StatIcon color="#00A9FF"><FaUserPlus /></StatIcon>
              <StatValueArea>
                {loadingStats && weeklySignups === null && <StatInlineHint>A carregar…</StatInlineHint>}
                {!loadingStats && statsError && weeklySignups === null && <StatInlineHint $error>Erro</StatInlineHint>}
                {weeklySignups !== null && !loadingStats && <StatValue>{weeklySignups}</StatValue>}
              </StatValueArea>
            </StatTopRow>
            <StatLabel>Inscrições Esta Semana</StatLabel>
          </StatCard>
        )}

        <StatCard
          color="#FFC107"
          $clickable={true}
          role="button"
          tabIndex={0}
          onClick={goTodayEventsTarget}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              goTodayEventsTarget();
            }
          }}
        >
          <StatTopRow>
            <StatIcon color="#FFC107"><FaCalendarDay /></StatIcon>
            <StatValueArea>
              {loadingStats && totalTodayEvents === null && <StatInlineHint>A carregar…</StatInlineHint>}
              {!loadingStats && statsError && totalTodayEvents === null && <StatInlineHint $error>Erro</StatInlineHint>}
              {totalTodayEvents !== null && !loadingStats && <StatValue>{totalTodayEvents}</StatValue>}
            </StatValueArea>
          </StatTopRow>
          <StatLabel>{isFullAdmin ? 'Eventos Hoje (Total)' : 'Consultas Hoje'}</StatLabel>
          {totalTodayEvents !== null && !loadingStats && (
            <StatSubLabel>
              {isFullAdmin
                ? `Treinos: ${todayEventsCount.trainings ?? '?'} · Consultas: ${todayEventsCount.appointments ?? '?'} · Inscritos: ${todayEventsCount.enrollments ?? '?'}`
                : `Consultas: ${todayEventsCount.appointments ?? '?'}`}
            </StatSubLabel>
          )}
        </StatCard>
      </StatsOverviewContainer>
      {statsError && !loadingStats && <ErrorText style={{maxWidth: '100%', marginBottom: '20px'}}>{statsError}</ErrorText>}

      <AdminNavGrid>
        <AdminNavLinkCard to="/admin/calendario-geral">
          <h2><FaCalendarAlt />Calendário Geral</h2>
        </AdminNavLinkCard>
        <AdminNavLinkCard to="/admin/manage-users">
          <h2><FaUsers />Gerir Clientes</h2>
        </AdminNavLinkCard>
        {isFullAdmin && (
          <AdminNavLinkCard to="/admin/manage-staff">
            <h2><FaUserMd />Gerir Equipa</h2>
          </AdminNavLinkCard>
        )}
        {isFullAdmin && (
          <AdminNavLinkCard to="/admin/manage-trainings">
            <h2><FaDumbbell />Gerir Treinos</h2>
          </AdminNavLinkCard>
        )}
        <AdminNavLinkCard to="/admin/manage-appointments">
          <h2><FaCalendarCheckIcon />Gerir Consultas</h2>
        </AdminNavLinkCard>
        <AdminNavLinkCard to="/admin/availability-slots">
          <h2><FaClock />Disponibilidade</h2>
        </AdminNavLinkCard>
        <AdminNavLinkCard to="/admin/manage-payments">
          <h2><FaCreditCard />Gerir Pagamentos</h2>
        </AdminNavLinkCard>
        {isFullAdmin && (
          <AdminNavLinkCard to="/admin/manage-global-plans">
            <h2><FaCreditCard />Gerir Planos de treino</h2>
          </AdminNavLinkCard>
        )}
        {isFullAdmin && (
          <AdminNavLinkCard to="/admin/manage-exercises">
            <h2><FaRunning />Gerir Exercícios Base</h2>
          </AdminNavLinkCard>
        )}
        <AdminNavLinkCard to="/admin/appointment-requests">
          <h2><FaRegCalendarCheck />Pedidos de Consulta</h2>
        </AdminNavLinkCard>
      </AdminNavGrid>
    </PageContainer>
  );
};

export default AdminDashboardPage;