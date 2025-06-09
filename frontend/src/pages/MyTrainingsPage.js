// src/pages/MyTrainingsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/userService';
import { cancelTrainingBooking } from '../services/trainingService';
import { FaRunning, FaTrashAlt, FaArrowLeft, FaRegClock } from 'react-icons/fa';
import moment from 'moment';
import 'moment/locale/pt';

const PageContainer = styled.div`
  max-width: 900px;
  margin: 20px auto;
  padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
`;

const Header = styled.div`
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const Title = styled.h1`
  font-size: 2.2rem;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 25px;
  &:hover { text-decoration: underline; }
`;

const TrainingList = styled.ul`
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const TrainingCard = styled.li`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 15px 20px;
  border-radius: 8px;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
`;

const Info = styled.div`
  h3 { margin: 0 0 5px 0; font-size: 1.1rem; }
  p { margin: 0; font-size: 0.9rem; color: ${({ theme }) => theme.colors.textMuted}; }
`;

const CancelButton = styled.button`
  background-color: ${({ theme }) => theme.colors.error};
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background-color 0.2s;
  &:hover:not(:disabled) { background-color: #c62828; }
  &:disabled { background-color: #555; cursor: not-allowed; }
`;

const LoadingText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.primary};`;
const ErrorText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.error}; background-color: ${({theme}) => theme.colors.errorBg}; border: 1px solid ${({theme}) => theme.colors.error}; padding: 10px; border-radius: 5px;`;
const MessageText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.success}; background-color: ${({theme}) => theme.colors.successBg}; border: 1px solid ${({theme}) => theme.colors.success}; padding: 10px; border-radius: 5px;`;
const EmptyText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.textMuted}; padding: 20px; background-color: #2c2c2c; border-radius: 8px;`;

const MyTrainingsPage = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const { authState } = useAuth();

  const fetchBookings = useCallback(async () => {
    if (!authState.token) return;
    setLoading(true);
    try {
      const data = await getMyBookings(authState.token);
      const futureTrainings = (data.trainings || [])
        .filter(t => moment(`${t.date}T${t.time}`).isAfter(moment()))
        .sort((a,b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
      setTrainings(futureTrainings);
    } catch (err) {
      setError(err.message || 'Erro ao carregar os seus treinos.');
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (trainingId) => {
    if (!window.confirm("Tem a certeza que quer cancelar a sua inscrição neste treino?")) return;
    setCancellingId(trainingId);
    setMessage('');
    setError('');
    try {
      const response = await cancelTrainingBooking(trainingId, authState.token);
      setMessage(response.message);
      fetchBookings(); // Re-busca a lista para atualizar a UI
    } catch (err) {
      setError(err.message || "Erro ao cancelar inscrição.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <PageContainer>
      <BackLink to="/dashboard"><FaArrowLeft /> Voltar ao Painel</BackLink>
      <Header>
        <Title><FaRunning />Meus Treinos Inscritos</Title>
      </Header>
      
      {loading && <LoadingText>A carregar...</LoadingText>}
      {error && <ErrorText>{error}</ErrorText>}
      {message && <MessageText>{message}</MessageText>}
      
      {!loading && trainings.length === 0 && <EmptyText>Não tem inscrições em treinos futuros.</EmptyText>}
      
      {!loading && trainings.length > 0 && (
        <TrainingList>
          {trainings.map(training => (
            <TrainingCard key={training.id}>
              <Info>
                <h3>{training.name}</h3>
                <p>
                  <FaRegClock style={{marginRight: '6px'}}/> 
                  {moment(`${training.date}T${training.time}`).locale('pt').format('dddd, D [de] MMMM [de] YYYY [às] HH:mm')}
                </p>
              </Info>
              <CancelButton onClick={() => handleCancel(training.id)} disabled={cancellingId === training.id}>
                {cancellingId === training.id ? 'A cancelar...' : <><FaTrashAlt /> Cancelar Inscrição</>}
              </CancelButton>
            </TrainingCard>
          ))}
        </TrainingList>
      )}
    </PageContainer>
  );
};

export default MyTrainingsPage;