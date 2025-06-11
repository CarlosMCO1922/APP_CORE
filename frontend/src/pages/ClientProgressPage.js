// src/pages/ClientProgressPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getGlobalWorkoutPlanByIdClient } from '../services/workoutPlanService';
import { logExercisePerformanceService } from '../services/progressService';
import { FaArrowLeft, FaCheck, FaPlus, FaStopwatch } from 'react-icons/fa';

// --- Styled Components para a Nova Interface ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

const FinishWorkoutButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background-color: #e6c358;
  }
`;

const ExerciseTitle = styled.h1`
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1.8rem;
  text-align: center;
  margin-bottom: 10px;
`;

const PrescribedText = styled.p`
    text-align: center;
    color: ${({ theme }) => theme.colors.textMuted};
    font-style: italic;
    margin-top: 0;
    margin-bottom: 30px;
`;

const SetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  animation: ${fadeIn} 0.5s ease-out;
`;

const SetRow = styled.div`
  display: grid;
  grid-template-columns: 40px 1fr 1fr 60px;
  gap: 10px;
  align-items: center;
  background-color: ${({ theme, isCompleted }) => isCompleted ? '#2A2A2A' : theme.colors.cardBackground};
  padding: 10px 15px;
  border-radius: 8px;
  border-left: 5px solid ${({ theme, isCompleted }) => isCompleted ? theme.colors.success : theme.colors.primary};
  opacity: ${({ isCompleted }) => isCompleted ? 0.8 : 1};
  transition: all 0.3s ease;
`;

const SetNumber = styled.div`
  font-weight: bold;
  font-size: 1.2rem;
  color: ${({ theme, isCompleted }) => isCompleted ? theme.colors.success : theme.colors.textMuted};
  text-align: center;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  label {
    font-size: 0.7rem;
    color: ${({ theme }) => theme.colors.textMuted};
    margin-bottom: 4px;
    text-transform: uppercase;
  }
  input {
    background-color: ${({ theme }) => theme.colors.inputBg};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    color: white;
    border-radius: 5px;
    padding: 10px;
    text-align: center;
    font-size: 1.1rem;
    font-weight: 500;
    width: 100%;
    -moz-appearance: textfield;
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
`;

const CheckButton = styled.button`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: 2px solid ${({ theme, isCompleted }) => isCompleted ? theme.colors.success : theme.colors.cardBorder};
  background-color: ${({ theme, isCompleted }) => isCompleted ? theme.colors.success : 'transparent'};
  color: ${({ theme, isCompleted }) => isCompleted ? 'white' : theme.colors.textMuted};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.colors.success};
  }
`;

const AddSetButton = styled.button`
  width: 100%;
  padding: 15px;
  background-color: transparent;
  border: 2px dashed ${({ theme }) => theme.colors.cardBorder};
  color: ${({ theme }) => theme.colors.textMuted};
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ExerciseNav = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
`;

const NavButton = styled.button`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textDark};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background-color: transparent;
    color: #666;
    border-color: #444;
  }
`;

const LoadingText = styled.p`
  text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.primary};
`;

const RestTimerContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 15px 30px;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.5);
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 15px;
  animation: ${fadeIn} 0.3s ease-out;

  p {
    margin: 0;
    font-size: 1.5rem;
    font-weight: bold;
    min-width: 80px;
    text-align: center;
  }
  
  button {
    background-color: rgba(0,0,0,0.2);
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 5px;
    cursor: pointer;
  }
`;


const ClientProgressPage = () => {
    const { authState } = useAuth();
    const navigate = useNavigate();
    const { globalPlanId } = useParams();

    const [workoutPlan, setWorkoutPlan] = useState(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [setsState, setSetsState] = useState({});
    const [loading, setLoading] = useState(true);
    
    // Estados para o temporizador de descanso
    const [restTime, setRestTime] = useState(60); // 60 segundos por defeito
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef(null);
    const audioRef = useRef(null);

    // Carrega o plano de treino
    useEffect(() => {
        const fetchPlan = async () => {
            if (!globalPlanId || !authState.token) {
                setLoading(false); return;
            }
            setLoading(true);
            try {
                const planData = await getGlobalWorkoutPlanByIdClient(globalPlanId, authState.token);
                setWorkoutPlan(planData);
                initializeSets(planData.planExercises);
            } catch (err) {
                console.error("Erro ao carregar o plano de treino:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, [globalPlanId, authState.token]);

    // Lógica do Temporizador
    useEffect(() => {
        if (isTimerRunning && restTime > 0) {
            timerRef.current = setInterval(() => {
                setRestTime(prev => prev - 1);
            }, 1000);
        } else if (restTime === 0) {
            clearInterval(timerRef.current);
            setIsTimerRunning(false);
            // Toca o som
            if (audioRef.current) {
                audioRef.current.play().catch(e => console.log("Erro ao tocar som:", e));
            }
            // Reset para a próxima vez
            setRestTime(60);
        }
        return () => clearInterval(timerRef.current);
    }, [isTimerRunning, restTime]);

    const initializeSets = (exercises) => {
        const initialState = {};
        if (exercises?.length) {
            exercises.forEach(ex => {
                initialState[ex.id] = Array.from({ length: ex.sets || 3 }, () => ({
                    reps: ex.reps || '',
                    weight: '',
                    completed: false,
                }));
            });
        }
        setSetsState(initialState);
    };

    const handleSetChange = (exId, setIndex, field, value) => {
        const newSets = { ...setsState };
        if(newSets[exId]?.[setIndex]) {
            newSets[exId][setIndex][field] = value;
            setSetsState(newSets);
        }
    };

    const logPerformance = useCallback(async (planExerciseId, setData) => {
        const performanceData = {
            workoutPlanId: workoutPlan?.id,
            planExerciseId,
            performedAt: new Date().toISOString(),
            performedReps: setData.reps ? parseInt(setData.reps) : null,
            performedWeight: setData.weight ? parseFloat(setData.weight) : null,
        };
        try {
            await logExercisePerformanceService(performanceData, authState.token);
        } catch (error) {
            console.error("Falha ao registar série:", error);
        }
    }, [authState.token, workoutPlan?.id]);

    const toggleSetCompleted = useCallback((exId, setIndex) => {
        const newSets = JSON.parse(JSON.stringify(setsState));
        const currentSet = newSets[exId]?.[setIndex];
        if (currentSet) {
            currentSet.completed = !currentSet.completed;
            
            if (currentSet.completed) {
                logPerformance(exId, currentSet);
                // Inicia o temporizador
                setRestTime(workoutPlan?.planExercises[currentExerciseIndex]?.restSeconds || 60);
                setIsTimerRunning(true);
            } else {
                // Se desmarcar, pára o temporizador
                clearInterval(timerRef.current);
                setIsTimerRunning(false);
            }
            setSetsState(newSets);
        }
    }, [setsState, logPerformance, workoutPlan, currentExerciseIndex]);

    const addSet = (exId) => {
        const newSets = { ...setsState };
        if (newSets[exId]) {
            const lastSet = newSets[exId][newSets[exId].length - 1] || { reps: '', weight: '' };
            newSets[exId].push({ ...lastSet, completed: false });
            setSetsState(newSets);
        }
    };

    const currentExercise = workoutPlan?.planExercises[currentExerciseIndex];

    if (loading) return <PageContainer><LoadingText>A carregar plano de treino...</LoadingText></PageContainer>;
    if (!workoutPlan) return <PageContainer><p>Plano de treino não encontrado ou inválido.</p></PageContainer>;

    return (
        <PageContainer>
            <audio ref={audioRef} src="/timer_end.mp3" preload="auto"></audio>
            <Header>
                <BackLink to="/explorar-planos"><FaArrowLeft /></BackLink>
                <FinishWorkoutButton onClick={() => navigate('/dashboard')}>Terminar Treino</FinishWorkoutButton>
            </Header>
            
            {currentExercise && (
                <>
                    <ExerciseTitle>{currentExercise.exerciseDetails?.name}</ExerciseTitle>
                    <PrescribedText>
                        Prescrito: {currentExercise.sets || 'N/A'} séries de {currentExercise.reps || 'N/A'} reps com {currentExercise.restSeconds || 'N/A'}s de descanso.
                    </PrescribedText>

                    <SetList>
                        {setsState[currentExercise.id]?.map((set, index) => (
                            <SetRow key={index} isCompleted={set.completed}>
                                <SetNumber isCompleted={set.completed}>{index + 1}</SetNumber>
                                <InputGroup>
                                    <label>PESO (KG)</label>
                                    <input type="number" value={set.weight} onChange={e => handleSetChange(currentExercise.id, index, 'weight', e.target.value)} placeholder={index > 0 ? (setsState[currentExercise.id][index - 1].weight || '0') : '0'} />
                                </InputGroup>
                                <InputGroup>
                                    <label>REPS</label>
                                    <input type="number" value={set.reps} onChange={e => handleSetChange(currentExercise.id, index, 'reps', e.target.value)} placeholder={currentExercise.reps || '0'}/>
                                </InputGroup>
                                <CheckButton isCompleted={set.completed} onClick={() => toggleSetCompleted(currentExercise.id, index)}>
                                    <FaCheck />
                                </CheckButton>
                            </SetRow>
                        ))}
                    </SetList>

                    <AddSetButton onClick={() => addSet(currentExercise.id)}>+ Adicionar Série</AddSetButton>

                    <ExerciseNav>
                        <NavButton onClick={() => setCurrentExerciseIndex(p => p - 1)} disabled={currentExerciseIndex === 0}>Anterior</NavButton>
                        <NavButton onClick={() => setCurrentExerciseIndex(p => p + 1)} disabled={currentExerciseIndex >= (workoutPlan.planExercises.length - 1)}>Próximo</NavButton>
                    </ExerciseNav>
                </>
            )}

            {isTimerRunning && (
                <RestTimerContainer>
                    <FaStopwatch />
                    <p>{String(Math.floor(restTime / 60)).padStart(2, '0')}:{String(restTime % 60).padStart(2, '0')}</p>
                    <button onClick={() => setRestTime(prev => prev + 10)}>+10s</button>
                    <button onClick={() => { clearInterval(timerRef.current); setIsTimerRunning(false); }}>Saltar</button>
                </RestTimerContainer>
            )}
        </PageContainer>
    );
};

export default ClientProgressPage;