// src/pages/WorkoutSummaryPage.js

import React, { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaCheckCircle, FaStopwatch, FaWeightHanging, FaListOl, FaClipboardList, FaTrophy } from 'react-icons/fa';

const PageContainer = styled.div`
  max-width: 800px;
  margin: 40px auto;
  padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
`;

const SummaryHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const SuccessIcon = styled(FaCheckCircle)`
  font-size: 4rem;
  color: ${({ theme }) => theme.colors.success};
  margin-bottom: 15px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin: 0 0 10px 0;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const StatCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 25px;
  border-radius: ${({ theme }) => theme.borderRadius};
  text-align: center;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};

  svg {
    font-size: 2rem;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 10px;
  }
  
  h3 {
    margin: 0 0 5px 0;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 500;
  }

  p {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textMain};
  }
`;

const BackButton = styled(Link)`
  display: block;
  width: fit-content;
  margin: 40px auto 0 auto;
  padding: 12px 30px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  text-decoration: none;
  font-weight: bold;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background-color 0.2s;

  &:hover {
    background-color: #e6c358;
  }
`;

const PRSection = styled.div`
  margin-top: 40px;
  h2 {
    font-size: 1.8rem;
    color: ${({ theme }) => theme.colors.primary};
    text-align: center;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
`;

const PRCard = styled.div`
  background: linear-gradient(145deg, #2f2f2f, #252525);
  border: 1px solid ${({ theme }) => theme.colors.primary};
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
  padding: 20px;
  border-radius: ${({ theme }) => theme.borderRadius};
  margin-bottom: 15px;
  text-align: center;

  p {
    margin: 0;
    font-size: 1.2rem;
    color: white;
    font-weight: 600;
  }
  
  span {
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: bold;
  }
`;

const WorkoutSummaryPage = () => {
  const location = useLocation();
  const { 
    sessionData = [], 
    duration = 0, 
    workoutName = 'Treino', 
    allPlanExercises = [], 
    personalRecords = [] 
  } = location.state || {};

  // Calcula as estatísticas usando useMemo para eficiência
  const stats = useMemo(() => {
    if (!sessionData || sessionData.length === 0) {
      return { totalSets: 0, totalVolume: 0 };
    }
    const totalVolume = sessionData.reduce((acc, set) => {
      const weight = set.performedWeight || 0;
      const reps = set.performedReps || 0;
      return acc + (weight * reps);
    }, 0);

    return {
      totalSets: sessionData.length,
      totalVolume: totalVolume.toFixed(2),
    };
  }, [sessionData]);
  
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? hours + 'h ' : ''}${minutes > 0 ? minutes + 'm ' : ''}${seconds}s`;
  };

  const getExerciseName = (planExerciseId) => {
    const exercise = allPlanExercises.find(ex => ex.id === planExerciseId);
    return exercise?.exerciseDetails?.name || 'Exercício Desconhecido';
  };

  return (
    <PageContainer>
      <SummaryHeader>
        <SuccessIcon />
        <Title>Treino Concluído!</Title>
        <Subtitle>Bom trabalho em completar o treino "{workoutName}".</Subtitle>
      </SummaryHeader>

      <StatsGrid>
        <StatCard>
          <FaStopwatch />
          <h3>Duração Total</h3>
          <p>{formatTime(duration)}</p>
        </StatCard>
        <StatCard>
          <FaWeightHanging />
          <h3>Volume Total</h3>
          <p>{stats.totalVolume} kg</p>
        </StatCard>
        <StatCard>
          <FaListOl />
          <h3>Séries Completadas</h3>
          <p>{stats.totalSets}</p>
        </StatCard>
      </StatsGrid>
      {personalRecords && personalRecords.length > 0 && (
        <PRSection>
          <h2><FaTrophy /> Novos Recordes Pessoais!</h2>
          {personalRecords.map((pr, index) => (
            <PRCard key={index}>
              <span>{getExerciseName(pr.planExerciseId)}</span>
              <p>{pr.value}</p>
            </PRCard>
          ))}
        </PRSection>
      )}
      <BackButton to="/dashboard">Voltar ao Painel</BackButton>
    </PageContainer>
  );
};

export default WorkoutSummaryPage;