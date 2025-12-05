// src/pages/ClientProgressPage.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styled, { css, useTheme } from 'styled-components';
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
    FaRunning, FaClipboardList, FaSave,
    FaHistory, FaTimes, FaDumbbell, FaTrash, FaChartLine,
    FaWeightHanging, FaStopwatch, FaCalendarCheck, FaChartBar
} from 'react-icons/fa';
import BackArrow from '../components/BackArrow';
import ConfirmationModal from '../components/Common/ConfirmationModal';
import { sortPlanExercises } from '../utils/exerciseOrderUtils';
import ExerciseProgressChart from '../components/ExerciseProgressChart';

// --- Styled Components ---
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


const MessageBaseStyles = css`
  text-align: center;
  padding: 12px 18px;
  margin: 20px auto;
  border-radius: ${({ theme }) => theme.borderRadius};
  border-width: 1px;
  border-style: solid;
  max-width: 600px;
  font-size: 0.9rem;
  font-weight: 500;
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

const EmptyText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  border-color: transparent;
  background-color: rgba(0,0,0,0.05);
  padding: 30px 15px;
`;

const PageSuccessMessage = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.success || '#28a745'};
  background-color: ${({ theme }) => theme.colors.successBg || 'rgba(40, 167, 69, 0.1)'};
  border-color: ${({ theme }) => theme.colors.success || '#28a745'};
`;

const SectionTitle = styled.h2`
    font-size: 1.6rem;
    color: ${({ theme }) => theme.colors.primary};
    margin-top: 30px;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha || 'rgba(255,255,255,0.1)'};
`;

const TrainingSelectorGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
`;

const TrainingCard = styled.div`
    background-color: ${({ theme }) => theme.colors.cardBackground};
    padding: 20px;
    border-radius: ${({ theme }) => theme.borderRadius};
    box-shadow: ${({ theme }) => theme.boxShadow};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 15px rgba(0,0,0,0.2);
    }

    h3 {
        margin-top: 0;
        color: ${({ theme }) => theme.colors.primary};
    }
    p {
        font-size: 0.9rem;
        color: ${({ theme }) => theme.colors.textMuted};
        margin-bottom: 5px;
    }
`;

const SelectTrainingButton = styled.button`
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textDark || '#212529'};
    padding: 10px 15px;
    border: none;
    border-radius: ${({ theme }) => theme.borderRadius};
    cursor: pointer;
    font-weight: 600;
    margin-top: 15px;
    transition: background-color 0.2s;
    &:hover {
        background-color: ${({ theme }) => theme.colors.primaryHover || '#e6c358'};
    }
`;

const WorkoutPlanDisplay = styled.div`
  margin-top: 20px;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: clamp(15px, 3vw, 25px);
  border-radius: 12px; 
  box-shadow: ${({ theme }) => theme.boxShadow};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  margin-bottom: 20px;

  h3 {
    color: ${({ theme }) => theme.colors.secondary || theme.colors.primary};
    font-size: 1.3rem;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha};
  }
  p > i {
    display: block;
    background-color: ${({ theme }) => theme.colors.cardBackground};
    padding: 10px;
    border-radius: 5px;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.textMuted};
    margin-bottom: 15px;
  }
`;

const ExerciseLogItem = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker || '#2C2C2C'};
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
`;

const ExerciseName = styled.h4`
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 0;
  margin-bottom: 10px;
`;

const PrescribedDetails = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 15px;
  font-style: italic;
  line-height: 1.4;
  padding: 8px;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-radius: 4px;
`;

const LogInputGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
  align-items: flex-end;
`;

const LogLabel = styled.label`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 5px;
  display: block;
  font-weight: 500;
`;

const LogInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  background-color: ${({ theme }) => theme.colors.inputBg || '#383838'};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.9rem;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusShadow || 'rgba(212, 175, 55, 0.2)'};
  }
`;

const LogTextarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  background-color: ${({ theme }) => theme.colors.inputBg || '#383838'};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.9rem;
  min-height: 70px;
  resize: vertical;
  margin-bottom: 10px;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusShadow || 'rgba(212, 175, 55, 0.2)'};
  }
`;

const LogButton = styled.button`
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
  padding: 10px 18px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  transition: background-color 0.2s;
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.successDark || '#388E3C'};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.disabledBg || '#555'};
    cursor: not-allowed;
  }
`;

const PerformanceHistoryItem = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 8px;
  padding: 8px 10px;
  border-left: 2px solid ${({ theme }) => theme.colors.cardBorderDarker || '#444'};
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-radius: 0 4px 4px 0;
  line-height: 1.5;
  display: flex;
  justify-content: space-between;
  align-items: center;

  span.log-details {
    flex-grow: 1;
  }
`;

const DeleteIcon = styled(FaTrash)`
  cursor: pointer;
  color: ${({ theme }) => theme.colors.error || 'red'};
  margin-left: 10px;
  font-size: 0.9em;
  transition: color 0.2s;
  &:hover {
    color: ${({ theme }) => theme.colors.error};
    opacity: 0.85;
  }
`;

const ModalOverlayStyled = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: ${({ theme }) => theme.colors.overlayBg}; display: flex;
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
  color: ${({ theme }) => theme.colors.textMuted}; font-size: 1.8rem; cursor: pointer;
  padding: 5px; line-height: 1;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.textMain}; }
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
  padding: 10px 14px; background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.inputText}; font-size: 0.95rem;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing}; }
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

const calculateAggregateStats = (performanceLogs, workoutPlans, allPlanExercises) => {
    if (!performanceLogs || Object.keys(performanceLogs).length === 0) {
        return null;
    }

    let totalSetsLogged = 0;
    let totalRepsLogged = 0;
    let totalDurationLoggedSeconds = 0;
    const exerciseWeights = {};
    const exerciseLoggedCount = {};
    let distinctExercisesPrescribed = 0;
    let totalVolume = 0; 

    const prescribedExerciseIds = new Set();
    (allPlanExercises || []).forEach(planEx => prescribedExerciseIds.add(planEx.id));
    distinctExercisesPrescribed = prescribedExerciseIds.size;

    Object.values(performanceLogs).flat().forEach(log => {
        totalSetsLogged++;
        if (log.performedReps) totalRepsLogged += log.performedReps;
        if (log.performedDurationSeconds) totalDurationLoggedSeconds += log.performedDurationSeconds;

        if (log.performedReps && log.performedWeight) {
            totalVolume += (log.performedReps * log.performedWeight);
        }

        if (log.performedWeight && log.planExerciseId) {
            const exName = (allPlanExercises || []).find(pe => pe.id === log.planExerciseId)?.exerciseDetails?.name || 'Exercício Desconhecido';
            if (!exerciseWeights[log.planExerciseId]) {
                exerciseWeights[log.planExerciseId] = { sum: 0, count: 0, name: exName };
            }
            exerciseWeights[log.planExerciseId].sum += log.performedWeight;
            exerciseWeights[log.planExerciseId].count++;
        }
        if(log.planExerciseId) {
            exerciseLoggedCount[log.planExerciseId] = (exerciseLoggedCount[log.planExerciseId] || 0) + 1;
        }
    });

    const averageWeights = {};
    for (const planExId in exerciseWeights) {
        const data = exerciseWeights[planExId];
        if (data.count > 0) {
            averageWeights[data.name] = data.sum / data.count;
        }
    }

    const exercisesAttempted = Object.keys(exerciseLoggedCount).length;
    let consistency = 0;
    if (distinctExercisesPrescribed > 0) {
        consistency = (exercisesAttempted / distinctExercisesPrescribed) * 100;
    }

    return {
        totalSetsLogged,
        totalRepsLogged,
        totalDurationLoggedSeconds,
        averageWeights,
        exercisesAttempted,
        distinctExercisesPrescribed,
        consistency: parseFloat(consistency.toFixed(1)),
        totalVolume: parseFloat(totalVolume.toFixed(2)),
    };
};

const ClientProgressPage = () => {
    const theme = useTheme();
    const { authState } = useAuth();
    const navigate = useNavigate();
    const { globalPlanId } = useParams();

    const [myTrainings, setMyTrainings] = useState([]);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [selectedTrainingName, setSelectedTrainingName] = useState('');
    const [workoutPlans, setWorkoutPlans] = useState([]);
    const [performanceLogs, setPerformanceLogs] = useState({});
    const [currentPerformanceInputs, setCurrentPerformanceInputs] = useState({});

    const [loadingTrainings, setLoadingTrainings] = useState(!globalPlanId);
    const [loadingPlansAndProgress, setLoadingPlansAndProgress] = useState(!!globalPlanId);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [showFullHistoryModal, setShowFullHistoryModal] = useState(false);
    const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState(null);
    const [fullHistoryLogs, setFullHistoryLogs] = useState([]);
    const [loadingFullHistory, setLoadingFullHistory] = useState(false);
    const [fullHistoryError, setFullHistoryError] = useState('');

    const [statsStartDate, setStatsStartDate] = useState('');
    const [statsEndDate, setStatsEndDate] = useState('');

    const [chartMetric, setChartMetric] = useState('performedWeight');
    const [loadingStatistics, setLoadingStatistics] = useState(false);
    const [isSubmittingPerformance, setIsSubmittingPerformance] = useState(false);
    const [isDeletingLog, setIsDeletingLog] = useState(false);
    const [showDeleteLogModal, setShowDeleteLogModal] = useState(false);
    const [deleteLogData, setDeleteLogData] = useState(null); 

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
    
    useEffect(() => {
        const fetchGlobalPlan = async () => {
            if (globalPlanId && authState.token) {
                setLoadingPlansAndProgress(true);
                setError('');
                try {
                    const planData = await getGlobalWorkoutPlanByIdClient(globalPlanId, authState.token);
                    setWorkoutPlans([planData]);
                    setSelectedTrainingName(`Plano Livre: ${planData.name}`);
                    setSelectedTraining(null);
                    
                    const allExercises = planData.planExercises || [];
                    const performancePromises = allExercises.map(ex => 
                        getMyPerformanceHistoryForExerciseService(ex.id, authState.token).catch(() => [])
                    );
                    const allPerformances = (await Promise.all(performancePromises)).flat();
                    const logsByExercise = {};
                    allPerformances.forEach(p => {
                        if (!logsByExercise[p.planExerciseId]) logsByExercise[p.planExerciseId] = [];
                        logsByExercise[p.planExerciseId].push(p);
                    });
                    setPerformanceLogs(logsByExercise);
                } catch (err) {
                    setError(err.message || "Não foi possível carregar os detalhes deste plano.");
                } finally {
                    setLoadingPlansAndProgress(false);
                }
            }
        };
        fetchGlobalPlan();
    }, [globalPlanId, authState.token]);

    useEffect(() => {
        const fetchPlansForTraining = async () => {
            if (selectedTraining && authState.token) {
                setLoadingPlansAndProgress(true);
                setError(''); setWorkoutPlans([]); setPerformanceLogs({});
                const trainingDetails = myTrainings.find(t => t.id === selectedTraining);
                if (trainingDetails) setSelectedTrainingName(trainingDetails.name);
                try {
                    const plansData = await getWorkoutPlansByTrainingId(selectedTraining, authState.token);
                    setWorkoutPlans(plansData || []);
                    if (plansData && plansData.length > 0) {
                        const performancePromises = plansData.map(plan => 
                            getMyPerformanceForWorkoutPlanService(selectedTraining, plan.id, authState.token).catch(() => [])
                        );
                        const performancesForAllPlans = (await Promise.all(performancePromises)).flat();
                        const aggregatedLogs = {};
                        performancesForAllPlans.forEach(p => {
                            if (!aggregatedLogs[p.planExerciseId]) aggregatedLogs[p.planExerciseId] = [];
                            aggregatedLogs[p.planExerciseId].push(p);
                        });
                        setPerformanceLogs(aggregatedLogs);
                    }
                } catch (err) {
                    setError('Falha ao buscar planos ou progresso: ' + err.message);
                } finally {
                    setLoadingPlansAndProgress(false);
                }
            }
        };
        fetchPlansForTraining();
    }, [selectedTraining, authState.token, myTrainings]);

    const trainingStatistics = useMemo(() => {
        if (!performanceLogs || Object.keys(performanceLogs).length === 0) {
            return null;
        }

        let logsForStats = Object.values(performanceLogs).flat();
        
        if (statsStartDate && statsEndDate) {
            const start = new Date(statsStartDate);
            const end = new Date(statsEndDate);
            end.setHours(23, 59, 59, 999); 

            logsForStats = logsForStats.filter(log => {
                const logDate = new Date(log.performedAt);
                return logDate >= start && logDate <= end;
            });
        }
        
        if (logsForStats.length === 0) return null;

        const filteredLogsByExerciseId = {};
        logsForStats.forEach(log => {
            if (!filteredLogsByExerciseId[log.planExerciseId]) {
                filteredLogsByExerciseId[log.planExerciseId] = [];
            }
            filteredLogsByExerciseId[log.planExerciseId].push(log);
        });

        const allPlanExercisesFromPlans = workoutPlans.reduce((acc, plan) => acc.concat(plan.planExercises || []), []);
        
        return calculateAggregateStats(filteredLogsByExerciseId, workoutPlans, allPlanExercisesFromPlans);

    }, [performanceLogs, statsStartDate, statsEndDate, workoutPlans]);

    const handlePerformanceInputChange = (planExerciseId, field, value) => { 
      setCurrentPerformanceInputs(prev => ({
        ...prev,
        [planExerciseId]: { ...(prev[planExerciseId] || {}), [field]: value }
      }));
    };

    const handleLogPerformance = async (planExerciseId, workoutPlanId) => {
      if (isSubmittingPerformance) return;
      const inputs = currentPerformanceInputs[planExerciseId];
      if (!inputs || ((!inputs.performedReps) && (!inputs.performedWeight) && (!inputs.performedDurationSeconds) && (!inputs.notes || !inputs.notes.trim())) ) {
        setError("Preencha pelo menos um campo de desempenho ou adicione notas.");
        return;
      }
      setIsSubmittingPerformance(true);
      setError(''); setSuccessMessage('');
      try {
        const performanceData = {
          trainingId: selectedTraining,
          workoutPlanId: workoutPlanId,
          planExerciseId: planExerciseId,
          performedAt: new Date().toISOString(),
          performedReps: inputs.performedReps ? parseInt(inputs.performedReps) : null,
          performedWeight: inputs.performedWeight ? parseFloat(inputs.performedWeight) : null,
          performedDurationSeconds: inputs.performedDurationSeconds ? parseInt(inputs.performedDurationSeconds) : null,
          notes: inputs.notes || null,
        };
        const result = await logExercisePerformanceService(performanceData, authState.token);
        setSuccessMessage("Desempenho registado!");
        setPerformanceLogs(prev => {
          const newLogs = { ...prev };
          if (!newLogs[planExerciseId]) newLogs[planExerciseId] = [];
          newLogs[planExerciseId].unshift(result.performance);
          return newLogs;
        });
        setCurrentPerformanceInputs(prev => ({ ...prev, [planExerciseId]: {} }));
      } catch (err) {
        setError("Falha ao registar desempenho: " + err.message);
      } finally {
        setIsSubmittingPerformance(false);
      }
    };
    
    const handleDeletePerformanceLog = (logId, planExerciseId) => {
        setDeleteLogData({ logId, planExerciseId });
        setShowDeleteLogModal(true);
    };

    const handleDeleteLogConfirm = async () => {
        if (!deleteLogData || isDeletingLog) return;
        const { logId, planExerciseId } = deleteLogData;
        setIsDeletingLog(true);
        setShowDeleteLogModal(false);
        try {
            await deleteExercisePerformanceLogService(logId, authState.token);
            setSuccessMessage("Registo eliminado.");
            setPerformanceLogs(prev => {
                const newLogs = { ...prev };
                if (newLogs[planExerciseId]) {
                    newLogs[planExerciseId] = newLogs[planExerciseId].filter(log => log.id !== logId);
                }
                return newLogs;
            });
            if(showFullHistoryModal) {
              setFullHistoryLogs(prev => prev.filter(log => log.id !== logId));
            }
            setDeleteLogData(null);
        } catch(err) {
            setError("Falha ao eliminar registo: " + err.message);
        } finally {
            setIsDeletingLog(false);
        }
    };

    const handleOpenFullHistoryModal = async (planExercise) => {
        if (!planExercise?.id || !planExercise.exerciseDetails?.name) return;
        setSelectedExerciseForHistory({ id: planExercise.id, name: planExercise.exerciseDetails.name });
        setShowFullHistoryModal(true);
        setLoadingFullHistory(true);
        try {
            const historyData = await getMyPerformanceHistoryForExerciseService(planExercise.id, authState.token);
            setFullHistoryLogs(historyData || []);
        } catch (err) {
            setFullHistoryError(err.message || "Falha ao carregar histórico.");
        } finally {
            setLoadingFullHistory(false);
        }
    };

    const handleCloseFullHistoryModal = () => {
      setShowFullHistoryModal(false);
      setSelectedExerciseForHistory(null);
      setFullHistoryLogs([]);
      setFullHistoryError('');
      setChartMetric('performedWeight');
    };
    
    const clearSelection = () => {
      if (globalPlanId) {
        navigate('/meu-progresso');
      } else {
        setSelectedTraining(null);
      }
    };

    const hasActiveSelection = selectedTraining || globalPlanId;

    if (loadingTrainings) {
        return <PageContainer><LoadingText>A carregar seus treinos...</LoadingText></PageContainer>;
    }

    return (
        <PageContainer>
            <div style={{ marginBottom: '20px' }}>
              <BackArrow to="/dashboard" />
            </div>
            <HeaderContainer>
                <Title><FaClipboardList /> Registar Progresso Pessoal</Title>
            </HeaderContainer>

            {error && <ErrorText>{error}</ErrorText>}
            {successMessage && <PageSuccessMessage>{successMessage}</PageSuccessMessage>}

            {!hasActiveSelection ? (
                 <>
                    <SectionTitle>Selecione um Treino Agendado</SectionTitle>
                    {myTrainings.length > 0 ? (
                        <TrainingSelectorGrid>
                        {myTrainings.map(training => (
                            <TrainingCard key={training.id} onClick={() => setSelectedTraining(training.id)}>
                            <h3>{training.name}</h3>
                            <p>Data: {new Date(training.date).toLocaleDateString('pt-PT')} às {training.time ? training.time.substring(0, 5) : 'N/A'}</p>
                            <SelectTrainingButton as={Link} to={`/treino-ao-vivo/treino/${training.id}`}>
                                Iniciar Treino
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
            ) : (
                <>
                    <SectionTitle>A Registar para: {selectedTrainingName}</SectionTitle>
                    <SelectTrainingButton onClick={clearSelection} style={{ marginBottom: '20px', backgroundColor: theme.colors.buttonSecondaryBg, color: theme.colors.textMain }}>
                        Mudar Treino/Plano
                    </SelectTrainingButton>

                    {loadingPlansAndProgress ? <LoadingText>A carregar plano e progresso...</LoadingText> : (
                        <>
                            {workoutPlans.length === 0 && <EmptyText>Este item não tem um plano de treino definido.</EmptyText>}
                            
                            <StatisticsSection>
                                <h3><FaChartBar /> Estatísticas de Desempenho</h3>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap' }}>
                                    <FilterGroup>
                                        <FilterLabel htmlFor="statsStartDate">De:</FilterLabel>
                                        <FilterInput type="date" id="statsStartDate" value={statsStartDate} onChange={e => setStatsStartDate(e.target.value)} />
                                    </FilterGroup>
                                    <FilterGroup>
                                        <FilterLabel htmlFor="statsEndDate">Até:</FilterLabel>
                                        <FilterInput type="date" id="statsEndDate" value={statsEndDate} onChange={e => setStatsEndDate(e.target.value)} />
                                    </FilterGroup>
                                    <FilterButton secondary onClick={() => { setStatsStartDate(''); setStatsEndDate(''); }}>Limpar Filtro</FilterButton>
                                </div>
                                
                                {loadingPlansAndProgress ? <LoadingText>A calcular...</LoadingText> : !trainingStatistics ? (
                                    <EmptyText>Não há dados de desempenho no período selecionado para exibir estatísticas.</EmptyText>
                                ) : (
                                    <StatsGrid>
                                        <StatCard><h4 style={{display: 'flex', alignItems: 'center'}}><FaClipboardList style={{marginRight: '8px'}}/> Séries Registadas</h4><p>{trainingStatistics.totalSetsLogged}</p></StatCard>
                                        <StatCard><h4 style={{display: 'flex', alignItems: 'center'}}><FaRunning style={{marginRight: '8px'}} /> Repetições Totais</h4><p>{trainingStatistics.totalRepsLogged}</p></StatCard>
                                        <StatCard><h4 style={{display: 'flex', alignItems: 'center'}}><FaDumbbell style={{marginRight: '8px'}} /> Volume Total</h4><p>{trainingStatistics.totalVolume} kg</p></StatCard>
                                        <StatCard><h4 style={{display: 'flex', alignItems: 'center'}}><FaStopwatch style={{marginRight: '8px'}} /> Duração Total</h4><p>{Math.floor(trainingStatistics.totalDurationLoggedSeconds / 60)}m {trainingStatistics.totalDurationLoggedSeconds % 60}s</p></StatCard>
                                        {trainingStatistics.consistency !== undefined && 
                                            <StatCard>
                                                <h4 style={{display: 'flex', alignItems: 'center'}}><FaCalendarCheck style={{marginRight: '8px'}}/> Consistência</h4>
                                                <p>{trainingStatistics.exercisesAttempted} de {trainingStatistics.distinctExercisesPrescribed} ({trainingStatistics.consistency}%)</p>
                                            </StatCard>
                                        }
                                    </StatsGrid>
                                )}
                            </StatisticsSection>

                            {workoutPlans.map(plan => (
                                <WorkoutPlanDisplay key={plan.id}>
                                  <h3>Plano: {plan.name} {plan.order !== undefined ? `(Bloco: ${plan.order + 1})` : ''}</h3>
                                  {plan.notes && <p><i>Notas do Plano: {plan.notes}</i></p>}
                                  {(() => {
                                    const { sortPlanExercises } = require('../utils/exerciseOrderUtils');
                                    return sortPlanExercises(plan.planExercises || []);
                                  })().map(planEx => (
                                      <ExerciseLogItem key={planEx.id}>
                                          <ExerciseName>{planEx.exerciseDetails?.name || 'Exercício Desconhecido'}</ExerciseName>
                                          <PrescribedDetails>
                                            Prescrito:
                                            {planEx.sets ? ` Séries: ${planEx.sets}` : ''}
                                            {planEx.reps ? ` Reps: ${planEx.reps}` : ''}
                                            {planEx.durationSeconds ? ` Duração: ${planEx.durationSeconds}s` : ''}
                                            {planEx.restSeconds !== null ? ` Descanso: ${planEx.restSeconds}s` : ''}
                                            {planEx.notes && ` (Notas Instrutor: ${planEx.notes})`}
                                          </PrescribedDetails>
                                          <LogInputGroup>
                                            <div>
                                              <LogLabel htmlFor={`reps-${planEx.id}`}>Reps Feitas</LogLabel>
                                              <LogInput type="number" id={`reps-${planEx.id}`} placeholder="Ex: 10"
                                                value={currentPerformanceInputs[planEx.id]?.performedReps || ''}
                                                onChange={e => handlePerformanceInputChange(planEx.id, 'performedReps', e.target.value)} />
                                            </div>
                                            <div>
                                              <LogLabel htmlFor={`weight-${planEx.id}`}>Peso (kg)</LogLabel>
                                              <LogInput type="number" step="0.01" id={`weight-${planEx.id}`} placeholder="Ex: 50.5"
                                                value={currentPerformanceInputs[planEx.id]?.performedWeight || ''}
                                                onChange={e => handlePerformanceInputChange(planEx.id, 'performedWeight', e.target.value)} />
                                            </div>
                                            <div>
                                              <LogLabel htmlFor={`duration-${planEx.id}`}>Duração (s)</LogLabel>
                                              <LogInput type="number" id={`duration-${planEx.id}`} placeholder="Ex: 60"
                                                value={currentPerformanceInputs[planEx.id]?.performedDurationSeconds || ''}
                                                onChange={e => handlePerformanceInputChange(planEx.id, 'performedDurationSeconds', e.target.value)} />
                                            </div>
                                          </LogInputGroup>
                                          <div>
                                            <LogLabel htmlFor={`notes-${planEx.id}`}>Notas Pessoais</LogLabel>
                                            <LogTextarea id={`notes-${planEx.id}`} placeholder="Como se sentiu, observações..."
                                              value={currentPerformanceInputs[planEx.id]?.notes || ''}
                                              onChange={e => handlePerformanceInputChange(planEx.id, 'notes', e.target.value)} />
                                          </div>
                                          <LogButton onClick={() => handleLogPerformance(planEx.id, plan.id)} disabled={isSubmittingPerformance}>
                                            <FaSave /> {isSubmittingPerformance ? 'A registar...' : 'Registar Desempenho'}
                                          </LogButton>
                                          {performanceLogs[planEx.id] && performanceLogs[planEx.id].length > 0 && (
                                            <div style={{marginTop: '15px'}}>
                                                <h5 style={{fontSize: '0.9rem', color: theme.colors.textMuted, marginBottom: '5px'}}>Seu Histórico (Mais Recentes):</h5>
                                                {performanceLogs[planEx.id].slice(0,3).map(log => (
                                                    <PerformanceHistoryItem key={log.id}>
                                                        <span className="log-details">
                                                            {new Date(log.performedAt).toLocaleDateString('pt-PT')}:
                                                            {log.performedReps !== null ? ` Reps: ${log.performedReps}` : ''}
                                                            {log.performedWeight !== null ? ` Peso: ${log.performedWeight}kg` : ''}
                                                            {log.performedDurationSeconds !== null ? ` Duração: ${log.performedDurationSeconds}s` : ''}
                                                            {log.notes && ` (Notas: ${log.notes})`}
                                                        </span>
                                                        <DeleteIcon onClick={() => handleDeletePerformanceLog(log.id, planEx.id)} title="Eliminar este registo"/>
                                                    </PerformanceHistoryItem>
                                                ))}
                                                <ViewHistoryButton onClick={() => handleOpenFullHistoryModal(planEx)}>
                                                    <FaHistory /> Ver Histórico Completo
                                                </ViewHistoryButton>
                                            </div>
                                          )}
                                          {(!performanceLogs[planEx.id] || performanceLogs[planEx.id].length === 0) && (
                                             <p style={{fontSize: '0.8rem', color: theme.colors.textMuted, marginTop: '10px'}}>Ainda não há registos para este exercício.</p>
                                          )}
                                      </ExerciseLogItem>
                                  ))}
                                </WorkoutPlanDisplay>
                            ))}
                        </>
                    )}
                </>
            )}

            {showFullHistoryModal && selectedExerciseForHistory && (
                <ModalOverlayStyled onClick={handleCloseFullHistoryModal}>
                    <ModalContentStyled onClick={(e) => e.stopPropagation()}>
                        <ModalHeaderStyled>
                        <ModalTitleStyled><FaHistory /> Histórico Completo: {selectedExerciseForHistory.name}</ModalTitleStyled>
                        <CloseModalButtonStyled onClick={handleCloseFullHistoryModal}><FaTimes /></CloseModalButtonStyled>
                        </ModalHeaderStyled>

                        {loadingFullHistory ? <LoadingText>A carregar histórico...</LoadingText> : fullHistoryError ? <ErrorText>{fullHistoryError}</ErrorText> : fullHistoryLogs.length === 0 ? (
                        <EmptyText>Nenhum registo de desempenho encontrado para este exercício.</EmptyText>
                        ) : (
                        <>
                            <FullHistoryTableContainer>
                            <FullHistoryTable>
                                <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Reps</th>
                                    <th>Peso (kg)</th>
                                    <th>Duração (s)</th>
                                    <th>Notas</th>
                                    <th>Ações</th> 
                                </tr>
                                </thead>
                                <tbody>
                                {fullHistoryLogs.map(log => ( 
                                    <tr key={log.id}>
                                    <td>{new Date(log.performedAt).toLocaleDateString('pt-PT')}</td>
                                    <td>{log.performedReps ?? '-'}</td>
                                    <td>{log.performedWeight ?? '-'}</td>
                                    <td>{log.performedDurationSeconds ?? '-'}</td>
                                    <td>{log.notes ? <span className="notes">{log.notes}</span> : '-'}</td>
                                    <td> 
                                        <DeleteIcon onClick={() => handleDeletePerformanceLog(log.id, selectedExerciseForHistory.id)} title="Eliminar este registo"/>
                                    </td>
                                    </tr>
                                ))}
                                </tbody>
                            </FullHistoryTable>
                            </FullHistoryTableContainer>

                            <div style={{ marginTop: '25px', borderTop: `1px solid ${theme.colors.cardBorderAlpha || 'rgba(255,255,255,0.1)'}`, paddingTop: '15px' }}>
                                <h4 style={{color: theme.colors.primary, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaChartLine /> Gráfico de Progressão
                                </h4>
                                <ChartMetricSelectorContainer>
                                    <label htmlFor="chartMetricSelectModal">Visualizar Métrica:</label>
                                    <select 
                                        id="chartMetricSelectModal" 
                                        value={chartMetric} 
                                        onChange={(e) => setChartMetric(e.target.value)}
                                    >
                                        <option value="performedWeight">Peso Levantado</option>
                                        <option value="performedReps">Repetições</option>
                                        <option value="volume">Volume (Reps x Peso)</option>
                                        <option value="performedDurationSeconds">Duração (s)</option>
                                    </select>
                                </ChartMetricSelectorContainer>
                                <ExerciseProgressChart 
                                    historyLogs={fullHistoryLogs} 
                                    metric={chartMetric} 
                                    theme={theme} 
                                />
                            </div>
                        </>
                        )}
                         <ModalActions style={{marginTop: '20px', paddingTop: '15px', borderTop: `1px solid ${theme.colors.cardBorderAlpha || 'rgba(255,255,255,0.1)'}`}}>
                            <SelectTrainingButton onClick={handleCloseFullHistoryModal} style={{backgroundColor: theme.colors.buttonSecondaryBg || '#6c757d', color: theme.colors.textMain}}>
                                Fechar
                            </SelectTrainingButton>
                         </ModalActions>
                    </ModalContentStyled>
                </ModalOverlayStyled>
            )}

            <ConfirmationModal
                isOpen={showDeleteLogModal}
                onClose={() => {
                    setShowDeleteLogModal(false);
                    setDeleteLogData(null);
                }}
                onConfirm={handleDeleteLogConfirm}
                title="Eliminar Registo"
                message="Tem a certeza que quer eliminar este registo?"
                confirmText="Eliminar"
                cancelText="Cancelar"
                danger={true}
                loading={isDeletingLog}
            />
        </PageContainer>
    );
};

export default ClientProgressPage;
