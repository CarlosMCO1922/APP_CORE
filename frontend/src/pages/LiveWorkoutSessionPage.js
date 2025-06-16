// src/pages/LiveWorkoutSessionPage.js

import React, { useState, useEffect, useCallback, useMemo} from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getWorkoutPlansByTrainingId, getGlobalWorkoutPlanByIdClient } from '../services/workoutPlanService';
import { FaArrowLeft, FaStopwatch, FaFlagCheckered, FaLayerGroup} from 'react-icons/fa';
import ExerciseLiveCard from '../components/Workout/ExerciseLiveCard';
import RestTimer from '../components/Workout/RestTimer';
import { checkPersonalRecordsService } from '../services/progressService'; 

// --- Styled Components ---
const PageContainer = styled.div`
  max-width: 800px;
  margin: 20px auto;
  padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
`;

const SessionHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const SessionTitle = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 0 20px 0;
  text-align: center;
`;

const SessionTimer = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 8px 15px;
  border-radius: ${({ theme }) => theme.borderRadius};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

const LoadingText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.primary}; padding: 40px; font-size: 1.2rem;`;
const ErrorText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.error}; padding: 20px; background-color: ${({theme}) => theme.colors.errorBg}; border: 1px solid ${({theme}) => theme.colors.error}; border-radius: 8px;`;

const FinishWorkoutButton = styled.button`
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
  width: 100%;
  max-width: 300px;
  padding: 12px 20px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 40px auto 0 auto;

  &:hover {
    background-color: #5cb85c;
  }
`;

// <<< NOVO STYLED COMPONENT PARA OS BLOCOS >>>
const SupersetBlock = styled.div`
  background-color: #202020;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 15px;
  margin-bottom: 30px;
  
  & > h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 15px 0;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

// --- Componente Principal ---

const LiveWorkoutSessionPage = () => {
  const { globalPlanId, trainingId } = useParams();
  const { authState } = useAuth();
  const navigate = useNavigate();

  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionName, setSessionName] = useState('Sessão de Treino');

  const [sessionStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  const [activeRestTimer, setActiveRestTimer] = useState({ active: false, duration: 90, key: 0 });
  const [completedSets, setCompletedSets] = useState([]);

    const fetchPlan = useCallback(async () => {
    if (!authState.token) return;
    setLoading(true);
    setError('');
    try {
        let finalPlanData;
        if (trainingId) {
            const plans = await getWorkoutPlansByTrainingId(trainingId, authState.token);
            if (!plans || plans.length === 0) throw new Error("Este treino não tem um plano associado.");
            finalPlanData = plans[0]; 
            setSessionName(finalPlanData.trainingSessions[0]?.name || "Treino Agendado");
        } else if (globalPlanId) {
            finalPlanData = await getGlobalWorkoutPlanByIdClient(globalPlanId, authState.token);
            setSessionName(finalPlanData.name);
        } else {
            throw new Error("Nenhum plano de treino especificado.");
        }
        setWorkoutPlan(finalPlanData);

    } catch (err) {
        setError(err.message || 'Não foi possível carregar o plano de treino.');
        setWorkoutPlan(null); 
    } finally {
        setLoading(false);
    }
  }, [globalPlanId, trainingId, authState.token]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);
  
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [sessionStartTime]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? String(hours).padStart(2, '0') + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleSetComplete = (performanceData, restDuration) => {
    setCompletedSets(prev => [...prev, performanceData]);
    const duration = restDuration !== null && restDuration !== undefined ? restDuration : 90;
    setActiveRestTimer({ active: true, duration: duration, key: prev => prev.key + 1 });
  };

  const handleLogDeleted = (deletedLogId) => {
    setCompletedSets(prev => prev.filter(set => set.id !== deletedLogId));
  };
  
  const handleFinishWorkout = async () => {
    if (window.confirm("Tens a certeza que queres terminar o treino?")) {
        try {
            const prData = await checkPersonalRecordsService(completedSets, authState.token); 
            const allPlanExercises = workoutPlan?.planExercises || [];
            
            navigate('/treino/resumo', {
                state: {
                    sessionData: completedSets,
                    duration: elapsedTime,
                    workoutName: sessionName,
                    allPlanExercises: allPlanExercises,
                    personalRecords: prData.records || []
                }
            });
        } catch (error) {
            console.error("Erro ao finalizar treino e verificar PRs:", error);
            navigate('/treino/resumo', {
                state: {
                    sessionData: completedSets,
                    duration: elapsedTime,
                    workoutName: sessionName,
                    personalRecords: []
                }
            });
        }
    }
  };

  const groupedExercises = useMemo(() => {
    if (!workoutPlan?.planExercises) return [];

    const groups = new Map();
    const sortedPlanExercises = [...workoutPlan.planExercises].sort((a, b) => {
        if (a.supersetGroup !== b.supersetGroup) return a.supersetGroup - b.supersetGroup;
        return a.order - b.order;
    });

    sortedPlanExercises.forEach(ex => {
      const groupKey = ex.supersetGroup;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey).push(ex);
    });

    return Array.from(groups.values());
  }, [workoutPlan]);

  if (loading) return <PageContainer><LoadingText>A carregar sessão de treino...</LoadingText></PageContainer>;
  if (error) return <PageContainer><ErrorText>{error}</ErrorText></PageContainer>;

  return (
    <>
      <PageContainer>
        <SessionHeader>
          <BackLink to="/meu-progresso" title="Voltar (o progresso não será guardado)"><FaArrowLeft /></BackLink>
          <SessionTimer><FaStopwatch /> {formatTime(elapsedTime)}</SessionTimer>
        </SessionHeader>

        <SessionTitle>{sessionName}</SessionTitle>
        <div>
          {groupedExercises.map((group, index) => (
            <SupersetBlock key={index}>
              <h3>
                <FaLayerGroup /> 
                Bloco {index + 1} {group.length > 1 ? '(Superset)' : ''}
              </h3>
              {group.map(exercise => (
                  <ExerciseLiveCard
                    key={exercise.id}
                    planExercise={exercise}
                    trainingId={trainingId}
                    workoutPlanId={workoutPlan.id}
                    onSetComplete={handleSetComplete}
                    onLogDeleted={handleLogDeleted}
                  />
              ))}
            </SupersetBlock>
          ))}
        </div>
        <FinishWorkoutButton onClick={handleFinishWorkout}>
            <FaFlagCheckered /> Concluir Treino
        </FinishWorkoutButton>
      </PageContainer>
      
      {activeRestTimer.active && (
        <RestTimer
          key={activeRestTimer.key}
          duration={activeRestTimer.duration}
          onFinish={() => setActiveRestTimer({ active: false, duration: 0, key: activeRestTimer.key })}
        />
      )}
    </>
  );
};

export default LiveWorkoutSessionPage;