// src/pages/WorkoutPlanSummaryPage.js
import { logger } from '../utils/logger';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled, { css, useTheme } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getGlobalWorkoutPlanByIdClient } from '../services/workoutPlanService'; 
import { FaDumbbell, FaChevronRight } from 'react-icons/fa';
import BackArrow from '../components/BackArrow';
import { useWorkout } from '../context/WorkoutContext';
import { sortPlanExercises, ensurePlanExercisesOrdered } from '../utils/exerciseOrderUtils';

// --- Styled Components ---
const PageContainer = styled.div`
  max-width: 700px;
  margin: 20px auto;
  padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
`;


const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0;
  text-align: center;
  flex-grow: 1;
`;

const ExerciseList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};
  overflow: hidden;
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

const ExerciseItem = styled.li`
  padding: 15px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:last-child {
    border-bottom: none;
  }

  .info {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .details h4 {
    margin: 0 0 4px 0;
    font-size: 1.1rem;
    color: ${({ theme }) => theme.colors.textMain};
  }
  
  .details p {
    margin: 0;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const IconWrapper = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.5rem;
`;

const Footer = styled.div`
  position: sticky;
  bottom: 0;
  padding: 20px;
  background-color: ${({ theme }) => theme.colors.background};
  margin: 30px -20px -20px -20px; /* Expande para preencher o padding da página */
`;

const StartButton = styled.button`
  display: block;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
  text-align: center;
  padding: 15px;
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: filter 0.2s, opacity 0.2s;
  position: relative;

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    filter: none;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
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

const WorkoutPlanSummaryPage = () => {
  const { globalPlanId } = useParams();
  const { authState } = useAuth();
  const { startWorkout } = useWorkout();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (!authState.token) return;
      try {
        setLoading(true);
        const data = await getGlobalWorkoutPlanByIdClient(globalPlanId, authState.token);
        // GARANTIR que os exercícios estão ordenados corretamente usando função utilitária
        const orderedPlan = ensurePlanExercisesOrdered(data);
        setPlan(orderedPlan);
      } catch (err) {
        setError(err.message || 'Não foi possível carregar os detalhes do plano.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlanDetails();
  }, [globalPlanId, authState.token]);

  const handleStartWorkout = useCallback(async () => {
    if (!plan || isStarting) return;
    
    setIsStarting(true);
    try {
      // Pequeno delay para evitar múltiplos cliques
      await new Promise(resolve => setTimeout(resolve, 300));
      logger.log('DADOS DO PLANO ENVIADOS PARA O TREINO:', JSON.stringify(plan, null, 2));
      await startWorkout(plan);
    } catch (err) {
      logger.error('Erro ao iniciar treino:', err);
      setError('Erro ao iniciar treino. Tente novamente.');
    } finally {
      setIsStarting(false);
    }
  }, [plan, isStarting, startWorkout]);

  if (loading) return <PageContainer><LoadingText>A carregar plano...</LoadingText></PageContainer>;
  if (error) return <PageContainer><ErrorText>{error}</ErrorText></PageContainer>;
  if (!plan) return <PageContainer><p>Plano não encontrado.</p></PageContainer>;

  return (
    <PageContainer>
      <Header>
        <BackArrow to="/explorar-planos" />
        <Title>{plan.name}</Title>
        <div style={{width: '24px'}}></div> {/* Espaçador para centrar o título */}
      </Header>
      
      <ExerciseList>
        {sortPlanExercises(plan.planExercises).map((pe, idx) => (
          <ExerciseItem key={pe.id}>
            <div className="info">
              <IconWrapper><FaDumbbell /></IconWrapper>
              <div className="details">
                <h4>{pe.sets} x {pe.exerciseDetails.name}</h4>
                <p>{pe.exerciseDetails.muscleGroup}</p>
              </div>
            </div>
            <FaChevronRight color="#555" />
          </ExerciseItem>
        ))}
      </ExerciseList>

      <Footer>
        <StartButton onClick={handleStartWorkout} disabled={isStarting || loading}>
          {isStarting ? 'A iniciar...' : 'Iniciar Treino'}
        </StartButton>
      </Footer>
    </PageContainer>
  );
};

export default WorkoutPlanSummaryPage;