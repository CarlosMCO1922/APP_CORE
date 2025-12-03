// src/pages/MyTrainingsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/userService';
import { cancelTrainingBooking } from '../services/trainingService';
import { FaRunning, FaTrashAlt, FaRegClock } from 'react-icons/fa';
import BackArrow from '../components/BackArrow';
import moment from 'moment';
import 'moment/locale/pt';
import ConfirmationModal from '../components/Common/ConfirmationModal';

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
  &:hover:not(:disabled) { background-color: ${({ theme }) => theme.colors.error}; opacity: 0.9; }
  &:disabled { background-color: ${({ theme }) => theme.colors.disabledBg}; cursor: not-allowed; }
`;

const LoadingText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.primary};`;
const ErrorText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.error}; background-color: ${({theme}) => theme.colors.errorBg}; border: 1px solid ${({theme}) => theme.colors.error}; padding: 10px; border-radius: 5px;`;
const MessageText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.success}; background-color: ${({theme}) => theme.colors.successBg}; border: 1px solid ${({theme}) => theme.colors.success}; padding: 10px; border-radius: 5px;`;
const EmptyText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.textMuted}; padding: 20px; background-color: ${({ theme }) => theme.colors.cardBackground}; border-radius: 8px;`;

const MyTrainingsPage = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [trainingToCancel, setTrainingToCancel] = useState(null);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [trainingToCancel, setTrainingToCancel] = useState(null);
  const { authState } = useAuth();

  const fetchBookings = useCallback(async () => {
    if (!authState.token) return;
    setLoading(true);
    try {
      const data = await getMyBookings(authState.token);
      // Remover duplicados baseado no ID do treino
      const seenIds = new Set();
      const uniqueTrainings = (data.trainings || []).filter(t => {
        if (seenIds.has(t.id)) return false;
        seenIds.add(t.id);
        return true;
      });
      
      const futureTrainings = uniqueTrainings
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

  const handleCancel = (trainingId) => {
    setTrainingToCancel(trainingId);
    setShowCancelConfirmModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!trainingToCancel) return;
    setCancellingId(trainingToCancel);
    setMessage('');
    setError('');
    setShowCancelConfirmModal(false);
    try {
      const response = await cancelTrainingBooking(trainingToCancel, authState.token);
      setMessage(response.message);
      setTrainingToCancel(null);
      fetchBookings(); // Re-busca a lista para atualizar a UI
    } catch (err) {
      setError(err.message || "Erro ao cancelar inscrição.");
      setTrainingToCancel(null);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <PageContainer>
      <div style={{ marginBottom: '20px' }}>
        <BackArrow to="/dashboard" />
      </div>
      <Header>
        <Title><FaRunning />Treinos Inscrito</Title>
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

      <ConfirmationModal
        isOpen={showCancelConfirmModal}
        onClose={() => {
          if (cancellingId === null) {
            setShowCancelConfirmModal(false);
            setTrainingToCancel(null);
          }
        }}
        onConfirm={handleCancelConfirm}
        title="Cancelar Inscrição"
        message="Tem a certeza que quer cancelar a sua inscrição neste treino?"
        confirmText="Confirmar"
        cancelText="Cancelar"
        danger={true}
        loading={cancellingId !== null}
      />
    </PageContainer>
  );
};

export default MyTrainingsPage;