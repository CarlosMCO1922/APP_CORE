// frontend/src/pages/SessionHistoryPage.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getSessionsHistoryService, getSessionDetailsService } from '../services/sessionService';
import { FaChevronLeft, FaClock, FaDumbbell, FaCalendarAlt, FaTimes, FaChartLine } from 'react-icons/fa';

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.pageBackground};
  padding-bottom: 80px;
`;

const Header = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 10;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  margin-right: 12px;
  display: flex;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0;
`;

const Content = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const SessionCard = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
`;

const SessionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const SessionName = styled.h3`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0 0 4px 0;
`;

const SessionDate = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SessionStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: ${({ theme }) => theme.colors.pageBackground};
  border-radius: 8px;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.borderRadius};
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: ${({ theme }) => theme.colors.cardBackground};
  z-index: 1;
`;

const ModalTitle = styled.h2`
  font-size: 1.3rem;
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const ExerciseGroup = styled.div`
  margin-bottom: 24px;
`;

const ExerciseName = styled.h4`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0 0 12px 0;
`;

const SetsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SetRow = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 1fr;
  gap: 12px;
  padding: 8px;
  background: ${({ theme }) => theme.colors.pageBackground};
  border-radius: 6px;
  font-size: 0.9rem;
`;

const SetNumber = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 600;
`;

const SetValue = styled.div`
  color: ${({ theme }) => theme.colors.textMain};
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const SessionHistoryPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSessionsHistoryService(authState.token, {
        limit: 50,
        offset: 0,
      });
      setSessions(response.sessions || []);
    } catch (err) {
      console.error('Erro ao carregar sessões:', err);
      setError('Erro ao carregar histórico de treinos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = async (sessionId) => {
    try {
      setLoadingDetails(true);
      const details = await getSessionDetailsService(sessionId, authState.token);
      setSelectedSession(details);
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      alert('Erro ao carregar detalhes da sessão.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <PageContainer>
      <Header>
        <HeaderTop>
          <BackButton onClick={() => navigate(-1)}>
            <FaChevronLeft />
          </BackButton>
          <Title>Histórico de Treinos</Title>
        </HeaderTop>
      </Header>

      <Content>
        {loading && <LoadingMessage>A carregar histórico...</LoadingMessage>}
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        {!loading && !error && sessions.length === 0 && (
          <EmptyState>
            <EmptyIcon><FaChartLine /></EmptyIcon>
            <p>Ainda não tens treinos concluídos.</p>
            <p>Completa o teu primeiro treino para veres o histórico aqui!</p>
          </EmptyState>
        )}
        
        {!loading && !error && sessions.length > 0 && sessions.map((session) => (
          <SessionCard key={session.id} onClick={() => handleSessionClick(session.id)}>
            <SessionHeader>
              <div>
                <SessionName>{session.workoutPlanName}</SessionName>
                <SessionDate>
                  <FaCalendarAlt /> {formatDate(session.completedAt)}
                </SessionDate>
              </div>
            </SessionHeader>
            
            <SessionStats>
              <StatItem>
                <StatLabel>Duração</StatLabel>
                <StatValue>
                  {session.totalDurationSeconds 
                    ? formatDuration(session.totalDurationSeconds)
                    : '-'}
                </StatValue>
              </StatItem>
              
              <StatItem>
                <StatLabel>Séries</StatLabel>
                <StatValue>{session.totalSets || 0}</StatValue>
              </StatItem>
              
              <StatItem>
                <StatLabel>Volume</StatLabel>
                <StatValue>
                  {session.totalVolume 
                    ? `${Math.round(session.totalVolume)}kg`
                    : '-'}
                </StatValue>
              </StatItem>
            </SessionStats>
          </SessionCard>
        ))}
      </Content>

      {/* Modal de Detalhes */}
      {selectedSession && (
        <Modal onClick={() => setSelectedSession(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{selectedSession.workoutPlanName}</ModalTitle>
              <CloseButton onClick={() => setSelectedSession(null)}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            
            <ModalBody>
              <SessionDate style={{ marginBottom: '20px' }}>
                <FaCalendarAlt /> {formatDate(selectedSession.completedAt)}
              </SessionDate>
              
              <SessionStats style={{ marginBottom: '24px' }}>
                <StatItem>
                  <StatLabel><FaClock /></StatLabel>
                  <StatValue>
                    {selectedSession.totalDurationSeconds 
                      ? formatDuration(selectedSession.totalDurationSeconds)
                      : '-'}
                  </StatValue>
                </StatItem>
                
                <StatItem>
                  <StatLabel>Séries</StatLabel>
                  <StatValue>{selectedSession.totalSets || 0}</StatValue>
                </StatItem>
                
                <StatItem>
                  <StatLabel><FaDumbbell /></StatLabel>
                  <StatValue>
                    {selectedSession.totalVolume 
                      ? `${Math.round(selectedSession.totalVolume)}kg`
                      : '-'}
                  </StatValue>
                </StatItem>
              </SessionStats>
              
              {loadingDetails && <LoadingMessage>A carregar detalhes...</LoadingMessage>}
              
              {!loadingDetails && selectedSession.exercises && selectedSession.exercises.map((exercise) => (
                <ExerciseGroup key={exercise.planExerciseId}>
                  <ExerciseName>{exercise.exerciseName}</ExerciseName>
                  <SetsList>
                    {exercise.sets.map((set, idx) => (
                      <SetRow key={idx}>
                        <SetNumber>Série {set.setNumber}</SetNumber>
                        <SetValue>{set.performedWeight}kg</SetValue>
                        <SetValue>{set.performedReps} reps</SetValue>
                      </SetRow>
                    ))}
                  </SetsList>
                </ExerciseGroup>
              ))}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

export default SessionHistoryPage;
