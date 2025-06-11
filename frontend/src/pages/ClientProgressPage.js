import React, { useEffect, useState, useCallback, useMemo, useRef, Fragment } from 'react';
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
  &:hover { background-color: ${({ theme }) => theme.colors.cardBackground}; color: #fff; }
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

// <<< NOVOS/ATUALIZADOS STYLED COMPONENTS PARA A INTERFACE DE TREINO AO VIVO >>>
const fadeIn = keyframes` from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;

const WorkoutLiveContainer = styled.div`
  animation: ${fadeIn} 0.5s ease-out;
`;
const WorkoutHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
`;
const FinishWorkoutButton = styled.button`
  background-color: ${({ theme }) => theme.colors.success};
  color: white; border: none; border-radius: 20px;
  padding: 10px 20px; font-weight: bold; font-size: 0.9rem; cursor: pointer;
  transition: background-color 0.2s;
  &:hover { background-color: ${({ theme }) => theme.colors.successDark || '#5cb85c'}; }
`;
const ExerciseTitle = styled.h3`
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1.8rem; text-align: center; margin-bottom: 10px;
`;
const PrescribedText = styled.p`
    text-align: center; color: ${({ theme }) => theme.colors.textMuted};
    font-style: italic; margin-top: 0; margin-bottom: 30px;
`;
const SetList = styled.div`
  display: flex; flex-direction: column; gap: 15px;
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
    color: ${({ theme }) => theme.colors.textMain};
    border-radius: 5px; padding: 10px; text-align: center;
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

const ModalOverlayStyled = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.88); display: flex;
  justify-content: center; align-items: center;
  z-index: 1050; padding: 20px;
`;

const ModalContentStyled = styled.div`
  background-color: ${({ theme }) => theme.colors.modalBg || '#2A2A2A'};
  padding: clamp(20px, 3vw, 30px);
  border-radius: 10px; width: 100%;
  max-width: 750px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.6);
  position: relative; color: ${({ theme }) => theme.colors.textMain};
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
`;

const ModalHeaderStyled = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  padding-bottom: 15px;
  margin-bottom: 15px;
`;

const ModalTitleStyled = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
  font-size: clamp(1.3rem, 3vw, 1.6rem);
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseModalButtonStyled = styled.button`
  background: transparent; border: none;
  color: #aaa; font-size: 1.8rem; cursor: pointer;
  padding: 5px; line-height: 1;
  transition: color 0.2s;
  &:hover { color: white; }
`;

const FullHistoryTableContainer = styled.div`
  overflow-y: auto;
  max-height: 50vh;
  margin-bottom: 15px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: ${({ theme }) => theme.colors.scrollbarTrack || '#383838'}; border-radius: 3px; }
  &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colors.scrollbarThumb || '#555'}; border-radius: 3px; }
  &::-webkit-scrollbar-thumb:hover { background: ${({ theme }) => theme.colors.scrollbarThumbHover || '#666'}; }
`;

const FullHistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;

  th, td {
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha || 'rgba(255,255,255,0.05)'};
    padding: 8px 10px;
    text-align: left;
  }
  th {
    background-color: ${({ theme }) => theme.colors.tableHeaderBg || '#333'};
    color: ${({ theme }) => theme.colors.primary};
    position: sticky;
    top: 0;
    z-index: 1;
  }
  tbody tr:nth-child(even) {
    background-color: ${({ theme }) => theme.colors.tableRowEvenBg || '#272727'};
  }
  td {
    color: ${({ theme }) => theme.colors.textMuted};
    span.notes {
      display: block;
      font-style: italic;
      font-size: 0.8rem;
      color: #999;
      white-space: pre-wrap;
    }
  }
`;

const ViewHistoryButton = styled.button`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.info || '#17a2b8'};
  border: 1px solid ${({ theme }) => theme.colors.info || '#17a2b8'};
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.75rem;
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.info || '#17a2b8'};
    color: white;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const ModalLabel = styled.label`
  font-size: 0.85rem; color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 4px; display: block; font-weight: 500;
`;


const ModalInput = styled.input`
  padding: 10px 14px; background-color: #333;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); }
`;

const StatisticsSection = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: clamp(15px, 3vw, 25px);
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  margin-top: 30px;
  margin-bottom: 20px;

  h3 {
    color: ${({ theme }) => theme.colors.secondary || theme.colors.primary};
    font-size: 1.3rem;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha};
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
`;

const StatCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker || '#2C2C2C'}; 
  padding: 15px;
  border-radius: 8px;
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  
  h4 {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};
    margin-top: 0;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }
  
  p {
    font-size: 1.2rem;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.textMain};
    margin: 0;
  }
`;

const ChartMetricSelectorContainer = styled.div`
  margin: 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  
  label {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.9rem;
  }

  select {
    padding: 8px 12px;
    background-color: ${({ theme }) => theme.colors.inputBg || '#383838'};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    border-radius: ${({ theme }) => theme.borderRadius};
    color: ${({ theme }) => theme.colors.textMain};
    font-size: 0.9rem;
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FilterLabel = styled.label`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 3px;
`;

const FilterInput = styled.input`
  padding: 9px 12px;
  background-color: #333;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.9rem;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FilterButton = styled.button`
  background-color: ${({ theme, secondary }) => secondary ? theme.colors.buttonSecondaryBg : theme.colors.primary};
  color: ${({ theme, secondary }) => secondary ? theme.colors.textMain : theme.colors.textDark};
  padding: 9px 15px;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: background-color 0.2s ease;
  height: 38px;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;

const ClientProgressPage = () => {
    const { authState } = useAuth();
    const navigate = useNavigate();
    const { globalPlanId } = useParams();

    // <<< ESTADOS DO TEU FICHEIRO ORIGINAL, PARA SELEÇÃO E DADOS >>>
    const [myTrainings, setMyTrainings] = useState([]);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [selectedTrainingName, setSelectedTrainingName] = useState('');
    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [performanceLogs, setPerformanceLogs] = useState({});
    const [loadingTrainings, setLoadingTrainings] = useState(!globalPlanId);
    const [loadingPlansAndProgress, setLoadingPlansAndProgress] = useState(!!globalPlanId);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showFullHistoryModal, setShowFullHistoryModal] = useState(false);
    const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState(null);
    const [fullHistoryLogs, setFullHistoryLogs] = useState([]);
    const [loadingFullHistory, setLoadingFullHistory] = useState(false);
    const [fullHistoryError, setFullHistoryError] = useState('');
    const [trainingStatistics, setTrainingStatistics] = useState(null);

    // <<< NOVOS ESTADOS PARA A INTERFACE DE TREINO AO VIVO >>>
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [setsState, setSetsState] = useState({});
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [restTime, setRestTime] = useState(60);
    const timerRef = useRef(null);
    const audioRef = useRef(null);

    // <<< LÓGICA PRESERVADA: Fetch inicial para a seleção de treinos >>>
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

    // <<< LÓGICA ALTERADA: Carrega o plano de treino (de um treino agendado ou livre) >>>
    const loadWorkoutData = useCallback(async () => {
      const planIdToLoad = selectedTraining || globalPlanId;
      if (!planIdToLoad || !authState.token) return;

      setLoadingPlansAndProgress(true);
      setError('');
      try {
        let planData;
        if(globalPlanId) {
            planData = await getGlobalWorkoutPlanByIdClient(globalPlanId, authState.token);
            setSelectedTrainingName(`Plano Livre: ${planData.name}`);
        } else {
            const plans = await getWorkoutPlansByTrainingId(selectedTraining, authState.token);
            planData = (plans && plans.length > 0) ? plans[0] : null;
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
        setLoadingPlansAndProgress(false);
      }
    }, [selectedTraining, globalPlanId, authState.token, myTrainings]);

    useEffect(() => {
        if (selectedTraining || globalPlanId) {
            loadWorkoutData();
        }
    }, [selectedTraining, globalPlanId, loadWorkoutData]);

    // <<< NOVA LÓGICA: Controlo do Temporizador >>>
    useEffect(() => {
        if (isTimerRunning && restTime > 0) {
            timerRef.current = setInterval(() => { setRestTime(prev => prev - 1); }, 1000);
        } else if (restTime === 0) {
            clearInterval(timerRef.current);
            setIsTimerRunning(false);
            if (audioRef.current) {
                audioRef.current.play().catch(e => console.log("Erro ao tocar som:", e));
            }
        }
        return () => clearInterval(timerRef.current);
    }, [isTimerRunning, restTime]);
    
    // <<< NOVA LÓGICA: Funções para a interface de treino ao vivo >>>
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
            trainingId: selectedTraining, // Pode ser null para planos livres
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
            setError("Falha ao registar série. Tente novamente.");
        }
    }, [authState.token, workoutPlan, selectedTraining]);

    const toggleSetCompleted = useCallback((exId, setIndex) => {
        const newSets = JSON.parse(JSON.stringify(setsState));
        const currentSet = newSets[exId]?.[setIndex];
        if (currentSet) {
            currentSet.completed = !currentSet.completed;
            setSetsState(newSets);

            if (currentSet.completed) {
                if(!currentSet.reps && !currentSet.weight) {
                  alert("Por favor, preencha o peso ou as repetições antes de completar a série.");
                  currentSet.completed = false; // Desfaz
                  setSetsState(newSets);
                  return;
                }
                logPerformance(exId, currentSet);
                const prescribedRest = workoutPlan?.planExercises[currentExerciseIndex]?.restSeconds;
                setRestTime(prescribedRest > 0 ? prescribedRest : 60);
                setIsTimerRunning(true);
            } else {
                clearInterval(timerRef.current);
                setIsTimerRunning(false);
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
      if (globalPlanId) { navigate('/meu-progresso'); } 
      else { setSelectedTraining(null); setWorkoutPlan(null); }
    };

    const currentExercise = workoutPlan?.planExercises[currentExerciseIndex];
    const hasActiveSelection = selectedTraining || globalPlanId;

    // <<< Renderização Condicional: Mostra Seleção OU Treino Ao Vivo >>>
    return (
        <PageContainer>
            <audio ref={audioRef} src="/timer_end.mp3" preload="auto" />
            <BackLink to="/dashboard"><FaArrowLeft /> Voltar ao Painel</BackLink>
            <HeaderContainer>
                <Title><FaClipboardList /> Registar Progresso Pessoal</Title>
            </HeaderContainer>

            {error && <ErrorText>{error}</ErrorText>}
            {successMessage && <PageSuccessMessage>{successMessage}</PageSuccessMessage>}

            {!hasActiveSelection ? (
                // <<< TUA VIEW ORIGINAL DE SELEÇÃO DE TREINO >>>
                <Fragment>
                    {loadingTrainings && <LoadingText>A carregar seus treinos...</LoadingText>}
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
                                        Registar/Ver Progresso
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
                </Fragment>
            ) : (
                // <<< NOVA VIEW DE TREINO AO VIVO >>>
                <Fragment>
                    {loadingPlan && <LoadingText>A carregar plano de treino...</LoadingText>}
                    {!loadingPlan && workoutPlan && (
                        <WorkoutLiveContainer>
                            <WorkoutHeader>
                                <SelectTrainingButton onClick={clearSelection} style={{ backgroundColor: theme.colors.buttonSecondaryBg, color: theme.colors.textMain }}>Mudar Treino</SelectTrainingButton>
                                <FinishWorkoutButton onClick={() => navigate('/dashboard')}>Terminar Treino</FinishWorkoutButton>
                            </WorkoutHeader>
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
                        </WorkoutLiveContainer>
                    )}
                </Fragment>
            )}

            {isTimerRunning && (
                <RestTimerContainer>
                    <FaStopwatch />
                    <p>{String(Math.floor(restTime / 60)).padStart(2, '0')}:{String(restTime % 60).padStart(2, '0')}</p>
                    <button onClick={() => setRestTime(prev => prev + 10)}>+10s</button>
                    <button onClick={() => { clearInterval(timerRef.current); setIsTimerRunning(false); }}>Saltar</button>
                </RestTimerContainer>
            )}

            {/* As tuas funcionalidades de estatísticas e histórico podem ser adicionadas aqui, se quiseres que apareçam durante o treino ao vivo */}
        </PageContainer>
    );
};

export default ClientProgressPage;