// src/pages/MyTrainingsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/userService';
import { cancelTrainingBooking } from '../services/trainingService';
import { FaRunning, FaTrashAlt, FaArrowLeft, FaRegClock } from 'react-icons/fa';
import moment from 'moment';

const PageContainer = styled.div`
  max-width: 900px;
  margin: 20px auto;
  padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
`;

const Title = styled.h1`
  font-size: 2.2rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 25px;
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
  &:hover { background-color: #c62828; }
  &:disabled { background-color: #555; cursor: not-allowed; }
`;

const LoadingText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.primary};`;
const ErrorText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.error};`;
const MessageText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.success};`;
const EmptyText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.textMuted}; padding: 20px;`;


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
      const futureTrainings = (data.trainings || []).filter(t => moment(`${t.date} ${t.time}`).isAfter(moment()));
      setTrainings(futureTrainings.sort((a,b) => new Date(a.date) - new Date(b.date)));
    } catch (err) {
      setError(err.message || 'Erro ao carregar treinos.');
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
      await fetchBookings();
    } catch (err) {
      setError(err.message || "Erro ao cancelar inscrição.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <PageContainer>
      <BackLink to="/dashboard"><FaArrowLeft /> Voltar ao Painel</BackLink>
      <Title><FaRunning />Meus Treinos Inscritos</Title>
      {loading && <LoadingText>A carregar...</LoadingText>}
      {error && <ErrorText>{error}</ErrorText>}
      {message && <MessageText>{message}</MessageText>}
      {!loading && trainings.length === 0 && <EmptyText>Não tem inscrições em treinos futuros.</EmptyText>}
      
      <TrainingList>
        {trainings.map(training => (
          <TrainingCard key={training.id}>
            <Info>
              <h3>{training.name}</h3>
              <p><FaRegClock /> {moment(training.date).format('dddd, D [de] MMMM [de] YYYY')} às {training.time.substring(0, 5)}</p>
            </Info>
            <CancelButton onClick={() => handleCancel(training.id)} disabled={cancellingId === training.id}>
              {cancellingId === training.id ? 'A cancelar...' : <><FaTrashAlt /> Cancelar Inscrição</>}
            </CancelButton>
          </TrainingCard>
        ))}
      </TrainingList>
    </PageContainer>
  );
};

export default MyTrainingsPage;