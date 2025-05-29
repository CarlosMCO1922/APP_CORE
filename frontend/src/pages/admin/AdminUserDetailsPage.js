// src/pages/admin/AdminUserDetailsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { adminGetUserById, adminGetUserTrainingsService, adminGetUserAppointmentsService } from '../../services/userService';
import { adminGetAllPayments } from '../../services/paymentService'; // Para buscar pagamentos
import { FaArrowLeft, FaUserCircle, FaDumbbell, FaCalendarCheck, FaEnvelope, FaIdCard, FaMoneyBillWave } from 'react-icons/fa';
import { theme } from '../../theme'; // Garanta que tem o theme importado

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 25px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 25px;
  padding: 9px 16px;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background-color 0.2s, color 0.2s;
  &:hover {
    background-color: ${({ theme }) => theme.colors.cardBackground};
    color: #fff;
  }
`;

const UserDetailsCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: clamp(20px, 3vw, 30px);
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  margin-bottom: 30px;
`;

const UserHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};

  svg {
    font-size: 3rem;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const UserInfo = styled.div`
  h1 {
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    color: ${({ theme }) => theme.colors.primary};
    margin: 0 0 5px 0;
  }
  p {
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.textMuted};
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 30px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha || 'rgba(255,255,255,0.1)'};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const HistoryList = styled.ul`
  list-style: none;
  padding: 0;
`;

const HistoryItem = styled.li`
  background-color: #2C2C2C;
  padding: 12px 18px;
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 4px solid ${({ theme, itemType }) => {
    if (itemType === 'training') return theme.colors.primary;
    if (itemType === 'appointment') return theme.colors.success || '#66BB6A'; // Adicionando fallback
    if (itemType === 'payment') return theme.colors.info || '#00A9FF'; // Adicionando fallback
    return theme.colors.textMuted;
  }};
  font-size: 0.9rem;

  p { margin: 3px 0; color: ${({ theme }) => theme.colors.textMuted}; }
  strong { color: ${({ theme }) => theme.colors.textMain}; }
  .item-header {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textMain};
    margin-bottom: 5px;
    font-size: 1rem;
  }
  .payment-status {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: capitalize;
    color: white;
    &.pendente { background-color: ${({ theme }) => theme.colors.warning || '#FFA000'}; }
    &.pago { background-color: ${({ theme }) => theme.colors.success || '#66BB6A'}; }
    &.cancelado, &.rejeitado { background-color: ${({ theme }) => theme.colors.error || '#FF6B6B'}; }
  }
`;

const LoadingText = styled.p`
  text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.primary};
  padding: 20px; font-style: italic;
`;
const ErrorText = styled.p`
  text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.error};
  padding: 15px; background-color: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius}; margin: 20px 0;
`;
const EmptyText = styled.p`
  text-align: center; font-size: 0.9rem; color: ${({ theme }) => theme.colors.textMuted};
  padding: 20px; background-color: rgba(0,0,0,0.1); border-radius: 8px;
`;


const AdminUserDetailsPage = () => {
  const { userId } = useParams();
  const { authState } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userTrainings, setUserTrainings] = useState([]);
  const [userAppointments, setUserAppointments] = useState([]);
  const [userPayments, setUserPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (authState.token && userId) {
      setLoading(true);
      setError('');
      try {
        const [userData, trainingsData, appointmentsData, paymentsData] = await Promise.all([
          adminGetUserById(userId, authState.token),
          adminGetUserTrainingsService(userId, authState.token),
          adminGetUserAppointmentsService(userId, authState.token),
          adminGetAllPayments({ userId: userId }, authState.token)
        ]);
        setUser(userData);
        setUserTrainings(trainingsData || []); // Garantir que é array
        setUserAppointments(appointmentsData || []); // Garantir que é array
        setUserPayments(paymentsData || []); // Garantir que é array

      } catch (err) {
        console.error("Erro ao buscar detalhes do utilizador:", err);
        setError(err.message || 'Não foi possível carregar os detalhes do utilizador.');
      } finally {
        setLoading(false);
      }
    }
  }, [userId, authState.token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <PageContainer><LoadingText>A carregar detalhes do cliente...</LoadingText></PageContainer>;
  }
  if (error) {
    return <PageContainer><BackLink to="/admin/manage-users"><FaArrowLeft /> Voltar</BackLink><ErrorText>{error}</ErrorText></PageContainer>;
  }
  if (!user) {
    return <PageContainer><BackLink to="/admin/manage-users"><FaArrowLeft /> Voltar</BackLink><EmptyText>Cliente não encontrado.</EmptyText></PageContainer>;
  }

  return (
    <PageContainer>
      <BackLink to="/admin/manage-users"><FaArrowLeft /> Voltar à Lista de Clientes</BackLink>
      
      <UserDetailsCard>
        <UserHeader>
          <FaUserCircle />
          <UserInfo>
            <h1>{user.firstName} {user.lastName}</h1>
            <p><FaEnvelope /> {user.email}</p>
            <p><FaIdCard /> ID: {user.id} {user.isAdmin ? '(Perfil Admin App)' : '(Cliente)'}</p>
          </UserInfo>
        </UserHeader>
        {/* Futuramente: Campo para Notas Internas aqui */}
      </UserDetailsCard>

      <SectionTitle><FaDumbbell /> Histórico de Treinos</SectionTitle>
      {userTrainings.length > 0 ? (
        <HistoryList>
          {userTrainings.map(training => (
            <HistoryItem key={`train-${training.id}`} itemType="training">
              <p className="item-header">{training.name}</p>
              <p><strong>Data:</strong> {new Date(training.date).toLocaleDateString('pt-PT')} às {training.time ? training.time.substring(0,5) : 'N/A'}</p>
              <p><strong>Instrutor:</strong> {training.instructor?.firstName || 'N/A'} {training.instructor?.lastName || ''}</p>
              <p><strong>Inscritos/Capacidade:</strong> {training.participantsCount !== undefined ? training.participantsCount : (training.participants?.length || 0)}/{training.capacity}</p>
            </HistoryItem>
          ))}
        </HistoryList>
      ) : (
        <EmptyText>Este cliente não tem histórico de treinos.</EmptyText>
      )}

      <SectionTitle><FaCalendarCheck /> Histórico de Consultas</SectionTitle>
      {userAppointments.length > 0 ? (
        <HistoryList>
          {userAppointments.map(appt => (
            <HistoryItem key={`appt-${appt.id}`} itemType="appointment">
              <p className="item-header">Consulta ({appt.status?.replace(/_/g, ' ') || 'N/A'})</p>
              <p><strong>Data:</strong> {new Date(appt.date).toLocaleDateString('pt-PT')} às {appt.time ? appt.time.substring(0,5) : 'N/A'}</p>
              <p><strong>Profissional:</strong> {appt.professional?.firstName || 'N/A'} {appt.professional?.lastName || ''}</p>
              <p><strong>Notas:</strong> {appt.notes || 'N/A'}</p>
            </HistoryItem>
          ))}
        </HistoryList>
      ) : (
        <EmptyText>Este cliente não tem histórico de consultas.</EmptyText>
      )}

      <SectionTitle><FaMoneyBillWave /> Histórico de Pagamentos</SectionTitle>
      {userPayments.length > 0 ? (
        <HistoryList>
          {userPayments.map(payment => (
            <HistoryItem key={`payment-${payment.id}`} itemType="payment">
              <p className="item-header">{payment.description || payment.category?.replace(/_/g, ' ') || 'Pagamento'}</p>
              <p><strong>ID Pag.:</strong> {payment.id}</p>
              <p><strong>Data:</strong> {new Date(payment.paymentDate).toLocaleDateString('pt-PT')}</p>
              <p><strong>Valor:</strong> {Number(payment.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</p>
              <p><strong>Status:</strong> <span className={`payment-status ${payment.status?.toLowerCase()}`}>{payment.status?.replace(/_/g, ' ') || 'N/A'}</span></p>
              {payment.referenceMonth && <p><strong>Mês Ref.:</strong> {payment.referenceMonth}</p>}
            </HistoryItem>
          ))}
        </HistoryList>
      ) : (
        <EmptyText>Este cliente não tem histórico de pagamentos.</EmptyText>
      )}
    </PageContainer>
  );
};

export default AdminUserDetailsPage;