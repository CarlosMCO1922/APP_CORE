// src/pages/WorkoutSummaryPage.js
import React, { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaCheckCircle, FaStopwatch, FaWeightHanging, FaListOl, FaClipboardList, FaTrophy, FaDumbbell} from 'react-icons/fa';

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

const DetailsSection = styled.div`
  margin-top: 40px;
  h2 {
    font-size: 1.8rem; color: ${({ theme }) => theme.colors.primary};
    text-align: center; margin-bottom: 20px;
  }
`;
const ExerciseSummaryCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px; border-radius: ${({ theme }) => theme.borderRadius};
  margin-bottom: 15px;
  h3 {
    margin: 0 0 15px 0; font-size: 1.2rem; color: white; display: flex; align-items: center; gap: 10px;
  }
`;
const SetsTable = styled.div`
  display: flex; flex-direction: column; gap: 8px;
`;
const SetRowSummary = styled.div`
  display: grid; grid-template-columns: 50px 1fr 1fr;
  text-align: center; font-size: 0.95rem; padding: 8px 5px;
  border-radius: 4px;
  background-color: #333;
  span:first-child { color: ${({ theme }) => theme.colors.textMuted}; font-weight: bold; text-align: left; padding-left: 10px;}
  span { color: ${({ theme }) => theme.colors.textMain}; }
`;
const SetsTableHeader = styled(SetRowSummary)`
  background-color: transparent; font-weight: 600; color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8rem; text-transform: uppercase;
`;

const WorkoutSummaryPage = () => {
  const location = useLocation();
  const { 
    sessionData, duration, workoutName, totalVolume, personalRecords, allPlanExercises 
  } = location.state || {};

  const getExerciseName = (planExerciseId) => {
    // A função find pode falhar se allPlanExercises for nulo. Adicionar uma salvaguarda.
    if (!allPlanExercises) return 'Exercício Desconhecido';
    const exercise = allPlanExercises.find(ex => ex.id === planExerciseId);
    return exercise?.exerciseDetails?.name || 'Exercício Desconhecido';
  };
  
  const setsByExercise = useMemo(() => {
    // Se não houver dados, retorna um objeto vazio para não dar erro
    if (!sessionData) return {}; 
    
    return sessionData.reduce((acc, set) => {
      // Usamos o planExerciseId como chave para ser mais robusto que o nome
      const exerciseId = set.planExerciseId;
      if (!acc[exerciseId]) {
        acc[exerciseId] = {
          name: getExerciseName(exerciseId),
          sets: []
        };
      }
      acc[exerciseId].sets.push(set);
      return acc;
    }, {});
  }, [sessionData, allPlanExercises]);


  if (!sessionData) {
    return ( <PageContainer><p>Não há dados da sessão de treino para mostrar.</p></PageContainer> );
  }
  
  
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? hours + 'h ' : ''}${minutes > 0 ? minutes + 'm ' : ''}${seconds}s`;
  };


   return (
    <PageContainer>
        <SummaryHeader>
            <SuccessIcon />
            <Title>Treino Concluído!</Title>
            <Subtitle>Bom trabalho ao completar o treino "{workoutName}".</Subtitle>
        </SummaryHeader>

        <StatsGrid>
            <StatCard><h3>Duração Total</h3><p>{formatTime(duration)}</p></StatCard>
            <StatCard><h3>Volume Total</h3><p>{totalVolume.toFixed(2)} kg</p></StatCard>
            <StatCard><h3>Séries Completadas</h3><p>{sessionData.length}</p></StatCard>
        </StatsGrid>

        {personalRecords && personalRecords.length > 0 && (
            <PRSection>
                <h2><FaTrophy /> Novos Recordes Pessoais!</h2>
                {personalRecords.map((pr, index) => (
                    <PRCard key={index}>
                        <span>{getExerciseName(pr.planExerciseId)} - {pr.type}</span>
                        <p>{pr.value}</p>
                    </PRCard>
                ))}
            </PRSection>
        )}
      
        <DetailsSection>
            <h2>Detalhes do Treino</h2>
            {Object.values(setsByExercise).map(({ name, sets }) => (
                <ExerciseSummaryCard key={name}>
                    <h3><FaDumbbell /> {name}</h3>
                    <SetsTableHeader><span>Série</span><span>Peso (KG)</span><span>Reps</span></SetsTableHeader>
                    <SetsTable>
                        {sets.map((set, index) => (
                            <SetRowSummary key={index}>
                                <span>{set.setNumber}</span>
                                <span>{set.performedWeight}</span>
                                <span>{set.performedReps}</span>
                            </SetRowSummary>
                        ))}
                    </SetsTable>
                </ExerciseSummaryCard>
            ))}
        </DetailsSection>
        <BackButton to="/dashboard">Voltar ao Painel</BackButton>
    </PageContainer>
  );
};

export default WorkoutSummaryPage;