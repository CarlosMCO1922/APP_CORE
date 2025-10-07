// src/pages/LiveWorkoutSessionPage.js - VERSÃO "STRONG"
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { getWorkoutPlansByTrainingId, getGlobalWorkoutPlanByIdClient } from '../services/workoutPlanService';
import { FaArrowLeft, FaStopwatch, FaFlagCheckered } from 'react-icons/fa';
import ExerciseLiveCard from '../components/Workout/ExerciseLiveCard';
import RestTimer from '../components/Workout/RestTimer';
import SupersetCard from '../components/Workout/SupersetCard';
import { checkPersonalRecordsService } from '../services/progressService'; 

// --- Styled Components ---
const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 80px clamp(15px, 4vw, 40px) 120px; /* Padding para não ficar debaixo do header/footer */
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
`;

const SessionHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px clamp(15px, 4vw, 40px);
  position: fixed;
  top: 60px; /* Altura da sua Navbar principal */
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 900;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  max-width: 800px;
  margin: 0 auto;
`;

const SessionTitle = styled.h1`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0;
  text-align: center;
  font-weight: 600;
`;

const SessionTimer = styled.div`
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1.5rem;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

const Footer = styled.div`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 15px;
    background-color: ${({ theme }) => theme.colors.background};
    box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
    z-index: 1101; // Z-index alto
    display: flex;
    gap: 10px;
    justify-content: center;
`;

const FinishWorkoutButton = styled.button`
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
  width: 100%;
  max-width: 400px;
  padding: 15px 20px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: filter 0.2s;
  &:hover { filter: brightness(1.1); }
`;

const FooterButton = styled.button`
  flex: 1;
  padding: 15px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: filter 0.2s;

  &:hover { filter: brightness(1.1); }
`;

const FinishButton = styled(FooterButton)`
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
`;

const CancelButton = styled(FooterButton)`
  background-color: ${({ theme }) => theme.colors.error};
  color: white;
`;

const LoadingText = styled.p` text-align: center; color: ${({ theme }) => theme.colors.primary}; padding: 40px; font-size: 1.2rem; `;
const ErrorText = styled.p` text-align: center; color: ${({ theme }) => theme.colors.error}; padding: 20px; background-color: ${({theme}) => theme.colors.errorBg}; border: 1px solid ${({theme}) => theme.colors.error}; border-radius: 8px; `;

const LiveWorkoutSessionPage = () => {
  const { globalPlanId, trainingId } = useParams();
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { activeWorkout, finishWorkout, cancelWorkout, logSet, setIsMinimized } = useWorkout();
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionName, setSessionName] = useState('Sessão de Treino');
  const [sessionStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeRestTimer, setActiveRestTimer] = useState({ active: false, duration: 90, key: 0 });
  const [completedSets, setCompletedSets] = useState([]);
  const [isSelectionModeActive, setSelectionModeActive] = useState(false);
  const [supersetSelection, setSupersetSelection] = useState([]);
  const [supersetGroups, setSupersetGroups] = useState([]);

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

  useEffect(() => { fetchPlan(); }, [fetchPlan]);
  
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [sessionStartTime]);

  useEffect(() => {
    if (!activeWorkout) return;
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [activeWorkout]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? String(hours).padStart(2, '0') + ':' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

   const handleSetComplete = (performanceData, restDuration) => {
    // A lógica de logSet agora vive no contexto, se quisermos. 
    // Ou simplesmente atualizamos o progresso aqui.
    // Vamos chamar o logSet do contexto para centralizar
    logSet(performanceData); 
    const duration = restDuration ?? 90;
    setActiveRestTimer({ active: true, duration: duration, key: Date.now() });
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
            navigate('/treino/resumo', { state: { sessionData: completedSets, duration: elapsedTime, workoutName: sessionName, personalRecords: [] } });
        }
    }
  };

  const handleStartSuperset = (exerciseId) => {
    setSelectionModeActive(true);
    setSupersetSelection([exerciseId]); // Começa a seleção com o exercício que foi clicado
  };

  const handleToggleExerciseSelection = (exerciseId) => {
    if (!supersetSelection.includes(exerciseId)) {
        setSupersetSelection(prev => [...prev, exerciseId]); // Seleciona
    }
  };

  const handleConfirmSuperset = () => {
    if (supersetSelection.length > 1) {
      setSupersetGroups(prev => [...prev, supersetSelection]);
    }
    // Reset
    setSelectionModeActive(false);
    setSupersetSelection([]);
  };

  const handleCancelSuperset = () => {
    setSelectionModeActive(false);
    setSupersetSelection([]);
  }

const exerciseBlocks = useMemo(() => {
    // O workoutPlan pode ser um array, pegamos o primeiro.
    const currentPlan = Array.isArray(workoutPlan) ? workoutPlan[0] : workoutPlan;
    const exercises = currentPlan?.planExercises;

    if (!exercises || exercises.length === 0) return [];

    // Usamos um objeto para agrupar exercícios pelo 'supersetGroup'
    const groups = exercises.reduce((acc, exercise) => {
      // Usamos o nome de campo correto: supersetGroup
      const blockId = exercise.supersetGroup;
      if (!acc[blockId]) {
        acc[blockId] = [];
      }
      acc[blockId].push(exercise);
      return acc;
    }, {});

    // Convertemos o objeto de grupos num array de arrays, já ordenado pelas chaves
    return Object.values(groups);
  }, [workoutPlan]);

  const handleShowHistory = async (exerciseId) => {
    setLoadingHistory(true);
    setIsHistoryModalOpen(true);
    try {
      // Esta função no seu service irá chamar o novo endpoint do backend
      const data = await getExerciseHistoryService(exerciseId);
      setHistoryData(data);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      setHistoryData([]); // Para mostrar uma mensagem de erro no modal
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!activeWorkout) return null; 
  if (loading) return <PageContainer><LoadingText>A carregar sessão...</LoadingText></PageContainer>;
  if (error) return <PageContainer><ErrorText>{error}</ErrorText></PageContainer>;

  return (
    <>
      <SessionHeader>
        <BackLink to="/dashboard" title="Sair do Treino"><FaArrowLeft /></BackLink>
        <button onClick={() => setIsMinimized(true)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'white'}}><FaChevronDown /></button>
        <SessionTimer><FaStopwatch /> {formatTime(elapsedTime)}</SessionTimer>
      </SessionHeader>

      <PageContainer>
        <SessionTitle>{activeWorkout.name}</SessionTitle>

      
      {activeWorkout.planExercises.sort((a,b) => a.order - b.order).map(exercise => (
          <div key={exercise.id}>
            <button onClick={() => handleShowHistory(exercise.exerciseDetails.id)} title="Ver Histórico">📊</button>
            <ExerciseLiveCard
              planExercise={exercise}
              onSetComplete={handleSetComplete}
            />
            <button 
              onClick={() => handleShowHistory(planExercise.exerciseDetails.id)} 
              title="Ver Histórico do Exercício"
              style={{position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'grey', cursor: 'pointer', fontSize: '1.2rem'}}
            >
              <FaHistory />
            </button>
          </div>
        ))}
      
      <Footer>
        <CancelButton onClick={cancelWorkout}><FaTimes /> Cancelar Sessão</CancelButton>
        <FinishButton onClick={finishWorkout}>Concluir Treino</FinishButton>
      </Footer>
      
      </PageContainer>
      
      {isHistoryModalOpen && (
        <ExerciseHistoryModal 
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          data={historyData}
          isLoading={loadingHistory}
          exerciseName={historyData?.[0]?.exercise?.name || ''}
        />
      )}

      {activeRestTimer.active && ( <RestTimer key={activeRestTimer.key} duration={activeRestTimer.duration} onFinish={() => setActiveRestTimer({ ...activeRestTimer, active: false })} /> )}
    </>
  );
};

export default LiveWorkoutSessionPage;