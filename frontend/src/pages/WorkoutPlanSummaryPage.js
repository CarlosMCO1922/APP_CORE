// src/pages/WorkoutPlanSummaryPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled, { css, useTheme } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getGlobalWorkoutPlanByIdClient } from '../services/workoutPlanService'; 
import { FaArrowLeft, FaDumbbell, FaChevronRight } from 'react-icons/fa';

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

const BackButton = styled(Link)`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
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

const StartButton = styled(Link)`
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
  transition: filter 0.2s;

  &:hover {
    filter: brightness(1.1);
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
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (!authState.token) return;
      try {
        setLoading(true);
        const data = await getGlobalWorkoutPlanByIdClient(globalPlanId, authState.token);
        setPlan(data);
      } catch (err) {
        setError(err.message || 'Não foi possível carregar os detalhes do plano.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlanDetails();
  }, [globalPlanId, authState.token]);

  if (loading) return <PageContainer><LoadingText>A carregar plano...</LoadingText></PageContainer>;
  if (error) return <PageContainer><ErrorText>{error}</ErrorText></PageContainer>;
  if (!plan) return <PageContainer><p>Plano não encontrado.</p></PageContainer>;

  return (
    <PageContainer>
      <Header>
        <BackButton to="/explorar-planos"><FaArrowLeft /></BackButton>
        <Title>{plan.name}</Title>
        <div style={{width: '24px'}}></div> {/* Espaçador para centrar o título */}
      </Header>
      
      <ExerciseList>
        {plan.planExercises.sort((a,b) => a.order - b.order).map(pe => (
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
        <StartButton to={`/treino-ao-vivo/plano/${globalPlanId}`}>
          Iniciar Treino
        </StartButton>
      </Footer>
    </PageContainer>
  );
};

export default WorkoutPlanSummaryPage;