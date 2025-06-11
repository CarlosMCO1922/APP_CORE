// src/pages/ClientProgressPage.js
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/userService';
import { getWorkoutPlansByTrainingId, getGlobalWorkoutPlanByIdClient } from '../services/workoutPlanService';
import {
    logExercisePerformanceService,
    getMyPerformanceForWorkoutPlanService,
    getMyPerformanceHistoryForExerciseService,
    deleteExercisePerformanceLogService
} from '../services/progressService';
import {
    FaRunning, FaClipboardList, FaSave, FaArrowLeft,
    FaHistory, FaTimes, FaDumbbell, FaTrash, FaChartLine,
    FaWeightHanging, FaStopwatch, FaCalendarCheck, FaChartBar, FaPlus, FaCheck
} from 'react-icons/fa';
import { theme } from '../theme';
import ExerciseProgressChart from '../components/ExerciseProgressChart';

// --- Styled Components (Preservando os teus e adicionando os novos) ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 25px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
`;

const HeaderContainer = styled.div`
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const Title = styled.h1`
  font-size: clamp(2rem, 5vw, 2.8rem);
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 0 10px 0;
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
  padding: 9px 16px;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background-color 0.2s, color 0.2s;
  font-size: 0.95rem;
  &:hover {
    background-color: ${({ theme }) => theme.colors.cardBackground};
    color: #fff;
  }
`;

const MessageBaseStyles = css`
  text-align: center; padding: 12px 18px; margin: 20px auto;
  border-radius: ${({ theme }) => theme.borderRadius};
  border-width: 1px; border-style: solid; max-width: 600px;
  font-size: 0.9rem; font-weight: 500;
`;
const LoadingText = styled.p`${MessageBaseStyles} color: ${({ theme }) => theme.colors.primary}; border-color: transparent; background: transparent; font-style: italic;`;
const ErrorText = styled.p`${MessageBaseStyles} color: ${({ theme }) => theme.colors.error}; background-color: ${({ theme }) => theme.colors.errorBg}; border-color: ${({ theme }) => theme.colors.error};`;
const EmptyText = styled.p`${MessageBaseStyles} color: ${({ theme }) => theme.colors.textMuted}; font-style: italic; border-color: transparent; background-color: rgba(0,0,0,0.05); padding: 30px 15px;`;
const PageSuccessMessage = styled.p`${MessageBaseStyles} color: ${({ theme }) => theme.colors.success || '#28a745'}; background-color: ${({ theme }) => theme.colors.successBg || 'rgba(40, 167, 69, 0.1)'}; border-color: ${({ theme }) => theme.colors.success || '#28a745'};`;

const SectionTitle = styled.h2`
    font-size: 1.6rem; color: ${({ theme }) => theme.colors.primary};
    margin-top: 30px; margin-bottom: 20px; padding-bottom: 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha || 'rgba(255,255,255,0.1)'};
`;
const TrainingSelectorGrid = styled.div`
    display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px; margin-bottom: 30px;
`;
const TrainingCard = styled.div`
    background-color: ${({ theme }) => theme.colors.cardBackground};
    padding: 20px; border-radius: ${({ theme }) => theme.borderRadius};
    box-shadow: ${({ theme }) => theme.boxShadow};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
    display: flex; flex-direction: column; justify-content: space-between;
    &:hover { transform: translateY(-5px); box-shadow: 0 8px 15px rgba(0,0,0,0.2); }
    h3 { margin-top: 0; color: ${({ theme }) => theme.colors.primary}; }
    p { font-size: 0.9rem; color: ${({ theme }) => theme.colors.textMuted}; margin-bottom: 5px; }
`;
const SelectTrainingButton = styled.button`
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textDark || '#212529'};
    padding: 10px 15px; border: none; border-radius: ${({ theme }) => theme.borderRadius};
    cursor: pointer; font-weight: 600; margin-top: 15px;
    transition: background-color 0.2s;
    &:hover { background-color: ${({ theme }) => theme.colors.primaryHover || '#e6c358'}; }
`;

// <<< ALTERAÇÃO AQUI: Novos Styled Components para a interface de treino ao vivo >>>
const fadeIn = keyframes` from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;

const FinishWorkoutButton = styled.button`
  background-color: ${({ theme }) => theme.colors.success};
  color: white; border: none; border-radius: 20px;
  padding: 10px 20px; font-weight: bold; cursor: pointer;
`;
const ExerciseTitle = styled.h2`
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1.8rem; text-align: center; margin-bottom: 10px;
`;
const PrescribedText = styled.p`
    text-align: center; color: ${({ theme }) => theme.colors.textMuted};
    font-style: italic; margin-top: 0; margin-bottom: 30px;
`;
const SetList = styled.div`
  display: flex; flex-direction: column; gap: 15px;
  animation: ${fadeIn} 0.5s ease-out;
`;
const SetRow = styled.div`
  display: grid; grid-template-columns: 40px 1fr 1fr 60px;
  gap: 10px; align-items: center;
  background-color: ${({ theme, isCompleted }) => isCompleted ? '#2A2A2A' : theme.colors.cardBackground};
  padding: 10px 15px; border-radius: 8px;
  border-left: 5px solid ${({ theme, isCompleted }) => isCompleted ? theme.colors.success : theme.colors.primary};
  opacity: ${({ isCompleted }) => isCompleted ? 0.8 : 1};
  transition: all 0.3s ease;
`;
const SetNumber = styled.div`
  font-weight: bold; font-size: 1.2rem;
  color: ${({ theme, isCompleted }) => isCompleted ? theme.colors.success : theme.colors.textMuted};
  text-align: center;
`;
const InputGroup = styled.div`
  display: flex; flex-direction: column;
  label { font-size: 0.7rem; color: ${({ theme }) => theme.colors.textMuted}; margin-bottom: 4px; text-transform: uppercase; }
  input {
    background-color: ${({ theme }) => theme.colors.inputBg}; border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    color: white; border-radius: 5px; padding: 10px; text-align: center;
    font-size: 1.1rem; font-weight: 500; width: 100%; -moz-appearance: textfield;
    &::-webkit-outer-spin-button, &::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  }
`;
const CheckButton = styled.button`
  width: 45px; height: 45px; border-radius: 50%;
  border: 2px solid ${({ theme, isCompleted }) => isCompleted ? theme.colors.success : theme.colors.cardBorder};
  background-color: ${({ theme, isCompleted }) => isCompleted ? theme.colors.success : 'transparent'};
  color: ${({ theme, isCompleted }) => isCompleted ? 'white' : theme.colors.textMuted};
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; transition: all 0.2s;
  &:hover { border-color: ${({ theme }) => theme.colors.success}; }
`;
const AddSetButton = styled.button`
  width: 100%; padding: 15px; background-color: transparent;
  border: 2px dashed ${({ theme }) => theme.colors.cardBorder};
  color: ${({ theme }) => theme.colors.textMuted}; border-radius: 8px;
  font-weight: bold; cursor: pointer; margin-top: 20px; transition: all 0.2s;
  &:hover { border-color: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.primary}; }
`;
const ExerciseNav = styled.div`
  display: flex; justify-content: space-between; margin-top: 40px;
`;
const NavButton = styled.button`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.primary}; border: 1px solid ${({ theme }) => theme.colors.primary};
  padding: 10px 20px; border-radius: 20px; font-weight: bold; cursor: pointer; transition: all 0.2s;
  &:hover { background-color: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.textDark}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; background-color: transparent; color: #666; border-color: #444; }
`;
const RestTimerContainer = styled.div`
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 15px 30px; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.5);
  z-index: 1100; display: flex; align-items: center; gap: 15px; animation: ${fadeIn} 0.3s ease-out;
  p { margin: 0; font-size: 1.5rem; font-weight: bold; min-width: 80px; text-align: center; }
  button { background-color: rgba(0,0,0,0.2); color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; }
`;
// --- Fim dos Styled Components ---

// <<< ALTERAÇÃO AQUI: A página agora tem dois modos: "selection" e "workout" >>>
const ClientProgressPage = () => {
    const { authState } = useAuth();
    const navigate = useNavigate();
    const { globalPlanId } = useParams();

    // Estados para o modo de seleção (o que já tinhas)
    const [myTrainings, setMyTrainings] = useState([]);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [selectedTrainingName, setSelectedTrainingName] = useState('');
    const [loadingTrainings, setLoadingTrainings] = useState(!globalPlanId);
    
    // Estados para o modo de treino "ao vivo"
    const [workoutPlan, setWorkoutPlan] = useState(null);
    const [loadingPlan, setLoadingPlan] = useState(!!globalPlanId);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [setsState, setSetsState] = useState({});
    
    // Estados do temporizador
    const [restTime, setRestTime] = useState(60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const timerRef = useRef(null);
    const audioRef = useRef(null);
    
    // Estados de feedback e erro
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch inicial para a seleção de treinos (se não vier de um plano livre)
    const fetchBookedTrainings = useCallback(async () => {
        if (authState.token && !globalPlanId) {
            setLoadingTrainings(true);
            try {
                const data = await getMyBookings(authState.token);
                setMyTrainings(data.trainings || []);
            } catch (err) {
                setError('Falha ao buscar seus treinos inscritos: ' + err.message);
            } finally {
                setLoadingTrainings(false);
            }
        }
    }, [authState.token, globalPlanId]);

    useEffect(() => {
        fetchBookedTrainings();
    }, [fetchBookedTrainings]);
    
    // Lógica para carregar o plano de treino quando um treino é selecionado ou um plano livre é usado
    const loadWorkoutData = useCallback(async () => {
      const planIdToLoad = selectedTraining || globalPlanId;
      if (!planIdToLoad || !authState.token) return;

      setLoadingPlan(true);
      setError('');
      setSuccessMessage('');
      setWorkoutPlan(null);

      try {
        let planData;
        if(globalPlanId) {
            planData = await getGlobalWorkoutPlanByIdClient(globalPlanId, authState.token);
            setSelectedTrainingName(`Plano Livre: ${planData.name}`);
        } else {
            const plans = await getWorkoutPlansByTrainingId(selectedTraining, authState.token);
            if (plans && plans.length > 0) {
              // Por agora, assumimos o primeiro plano do treino. A lógica pode ser expandida aqui.
              planData = plans[0]; 
            }
            const trainingDetails = myTrainings.find(t => t.id === selectedTraining);
            if (trainingDetails) setSelectedTrainingName(trainingDetails.name);
        }

        if (planData) {
            setWorkoutPlan(planData);
            initializeSets(planData.planExercises);
            setCurrentExerciseIndex(0);
        } else {
            setError("Este treino não tem um plano definido.");
        }
      } catch (err) {
        setError(err.message || "Não foi possível carregar os detalhes deste plano.");
      } finally {
        setLoadingPlan(false);
      }
    }, [selectedTraining, globalPlanId, authState.token, myTrainings]);

    useEffect(() => {
      loadWorkoutData();
    }, [loadWorkoutData]);
    
    // Lógica do Temporizador
    useEffect(() => {
        if (isTimerRunning && restTime > 0) {
            timerRef.current = setInterval(() => { setRestTime(prev => prev - 1); }, 1000);
        } else if (restTime === 0) {
            clearInterval(timerRef.current);
            setIsTimerRunning(false);
            if (audioRef.current) {
                audioRef.current.play().catch(e => console.log("Erro ao tocar som:", e));
            }
            // Não resetamos o tempo aqui, ele será redefinido no próximo set
        }
        return () => clearInterval(timerRef.current);
    }, [isTimerRunning, restTime]);

    const initializeSets = (exercises) => {
        const initialState = {};
        if (exercises?.length) {
            exercises.forEach(ex => {
                initialState[ex.id] = Array.from({ length: ex.sets || 3 }, () => ({
                    reps: ex.reps || '', weight: '', completed: false,
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
        if (!workoutPlan?.id) return;
        const performanceData = {
            trainingId: selectedTraining || 0, // 0 ou um ID placeholder para planos livres
            workoutPlanId: workoutPlan.id,
            planExerciseId,
            performedAt: new Date().toISOString(),
            performedReps: setData.reps ? parseInt(setData.reps) : null,
            performedWeight: setData.weight ? parseFloat(setData.weight) : null,
        };
        try {
            await logExercisePerformanceService(performanceData, authState.token);
        } catch (error) {
            console.error("Falha ao registar série:", error);
            // Poderia mostrar um erro ao utilizador aqui
        }
    }, [authState.token, workoutPlan, selectedTraining]);

    const toggleSetCompleted = useCallback((exId, setIndex) => {
        const newSets = JSON.parse(JSON.stringify(setsState));
        const currentSet = newSets[exId]?.[setIndex];
        if (currentSet) {
            currentSet.completed = !currentSet.completed;
            setSetsState(newSets); // Atualiza a UI imediatamente

            if (currentSet.completed) {
                logPerformance(exId, currentSet);
                // Inicia o temporizador com o descanso definido no plano, ou 60s por defeito
                const prescribedRest = workoutPlan?.planExercises[currentExerciseIndex]?.restSeconds;
                setRestTime(prescribedRest > 0 ? prescribedRest : 60);
                setIsTimerRunning(true);
            } else {
                clearInterval(timerRef.current);
                setIsTimerRunning(false);
                // Lógica para apagar o registo seria aqui, mas é mais complexo. Por agora, apenas desmarca.
            }
        }
    }, [setsState, logPerformance, workoutPlan, currentExerciseIndex]);

    const addSet = (exId) => {
        const newSets = { ...setsState };
        if (newSets[exId]) {
            const lastSet = newSets[exId][newSets[exId].length - 1] || { reps: '', weight: '' };
            newSets[exId].push({ ...lastSet, weight: lastSet.weight || '', completed: false });
            setSetsState(newSets);
        }
    };

    const clearSelection = () => {
        if (globalPlanId) {
            navigate('/meu-progresso');
        } else {
            setSelectedTraining(null);
            setWorkoutPlan(null);
        }
    };

    const currentExercise = workoutPlan?.planExercises[currentExerciseIndex];
    const hasActiveSelection = selectedTraining || globalPlanId;

    if (!hasActiveSelection) {
        return (
            <PageContainer>
                <BackLink to="/dashboard"><FaArrowLeft /> Voltar ao Painel</BackLink>
                <HeaderContainer>
                    <Title><FaClipboardList /> Registar Progresso Pessoal</Title>
                </HeaderContainer>
                {loadingTrainings && <LoadingText>A carregar seus treinos...</LoadingText>}
                {error && <ErrorText>{error}</ErrorText>}

                {!loadingTrainings && (
                    <>
                        <SectionTitle>Selecione um Treino Agendado</SectionTitle>
                        {myTrainings.length > 0 ? (
                            <TrainingSelectorGrid>
                            {myTrainings.map(training => (
                                <TrainingCard key={training.id} onClick={() => setSelectedTraining(training.id)}>
                                <h3>{training.name}</h3>
                                <p>Data: {new Date(training.date).toLocaleDateString('pt-PT')} às {training.time ? training.time.substring(0, 5) : 'N/A'}</p>
                                <SelectTrainingButton onClick={(e) => { e.stopPropagation(); setSelectedTraining(training.id); }}>
                                    Registar Progresso
                                </SelectTrainingButton>
                                </TrainingCard>
                            ))}
                            </TrainingSelectorGrid>
                        ) : (<EmptyText>Não está inscrito em nenhum treino.</EmptyText>)}
                        
                        <SectionTitle>Ou escolha um Plano Livre</SectionTitle>
                        <SelectTrainingButton as={Link} to="/explorar-planos" style={{ textDecoration: 'none', display: 'inline-block', width: 'auto' }}>
                            Explorar Planos de Treino
                        </SelectTrainingButton>
                    </>
                )}
            </PageContainer>
        );
    }
    
    if (loadingPlan) return <PageContainer><LoadingText>A carregar plano de treino...</LoadingText></PageContainer>;
    if (error) return <PageContainer><ErrorText>{error}</ErrorText></PageContainer>;
    if (!workoutPlan) return <PageContainer><EmptyText>Plano de treino não encontrado ou inválido.</EmptyText></PageContainer>;

    return (
        <PageContainer>
            <audio ref={audioRef} src="/timer_end.mp3" preload="auto" />
            <Header>
                <BackLink to="#" onClick={clearSelection}><FaArrowLeft /></BackLink>
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