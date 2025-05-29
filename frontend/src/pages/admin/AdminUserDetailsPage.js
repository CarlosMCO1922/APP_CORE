// src/pages/admin/AdminUserDetailsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { adminGetUserById, adminGetUserTrainingsService, adminGetUserAppointmentsService } from '../../services/userService';
import { FaArrowLeft, FaUserCircle, FaDumbbell, FaCalendarCheck, FaEnvelope, FaIdCard } from 'react-icons/fa';
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
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha};
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
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  font-size: 0.9rem;
  
  p { margin: 3px 0; color: ${({ theme }) => theme.colors.textMuted}; }
  strong { color: ${({ theme }) => theme.colors.textMain}; }
  .item-header {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textMain};
    margin-bottom: 5px;
  }
`;

const LoadingText = styled.p` /* ... (pode reutilizar o seu) ... */ `;
const ErrorText = styled.p` /* ... (pode reutilizar o seu) ... */ `;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (authState.token && userId) {
      setLoading(true);
      setError('');
      try {
        const [userData, trainingsData, appointmentsData] = await Promise.all([
          adminGetUserById(userId, authState.token),
          adminGetUserTrainingsService(userId, authState.token),
          adminGetUserAppointmentsService(userId, authState.token)
        ]);
        setUser(userData);
        setUserTrainings(trainingsData);
        setUserAppointments(appointmentsData);
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
    return <PageContainer><ErrorText>{error}</ErrorText></PageContainer>;
  }
  if (!user) {
    return <PageContainer><EmptyText>Cliente não encontrado.</EmptyText></PageContainer>;
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
            <p><FaIdCard /> ID: {user.id} {user.isAdmin ? '(Admin)' : '(Cliente)'}</p>
          </UserInfo>
        </UserHeader>
        {/* Futuramente: Campo para Notas Internas aqui */}
      </UserDetailsCard>

      <SectionTitle><FaDumbbell /> Histórico de Treinos</SectionTitle>
      {userTrainings.length > 0 ? (
        <HistoryList>
          {userTrainings.map(training => (
            <HistoryItem key={`train-${training.id}`}>
              <p className="item-header">{training.name}</p>
              <p><strong>Data:</strong> {new Date(training.date).toLocaleDateString('pt-PT')} às {training.time.substring(0,5)}</p>
              <p><strong>Instrutor:</strong> {training.instructor?.firstName || 'N/A'} {training.instructor?.lastName || ''}</p>
              <p><strong>Inscritos/Capacidade:</strong> {training.participantsCount}/{training.capacity}</p>
            </HistoryItem>
          ))}
        </HistoryList>
      ) : (
        <EmptyText>Este cliente não se inscreveu em nenhum treino.</EmptyText>
      )}

      <SectionTitle><FaCalendarCheck /> Histórico de Consultas</SectionTitle>
      {userAppointments.length > 0 ? (
        <HistoryList>
          {userAppointments.map(appt => (
            <HistoryItem key={`appt-${appt.id}`}>
              <p className="item-header">Consulta ({appt.status?.replace(/_/g, ' ') || 'N/A'})</p>
              <p><strong>Data:</strong> {new Date(appt.date).toLocaleDateString('pt-PT')} às {appt.time.substring(0,5)}</p>
              <p><strong>Profissional:</strong> {appt.professional?.firstName || 'N/A'} {appt.professional?.lastName || ''}</p>
              <p><strong>Notas:</strong> {appt.notes || 'N/A'}</p>
            </HistoryItem>
          ))}
        </HistoryList>
      ) : (
        <EmptyText>Este cliente não tem consultas registadas.</EmptyText>
      )}
    </PageContainer>
  );
};

export default AdminUserDetailsPage;