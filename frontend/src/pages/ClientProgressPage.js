// src/pages/ClientProgressPage.js
import React, { useEffect, useState, useCallback, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/userService';
import { getWorkoutPlansByTrainingId } from '../services/workoutPlanService';
import {
    logExercisePerformanceService,
    getMyPerformanceForWorkoutPlanService,
    getMyPerformanceHistoryForExerciseService
} from '../services/progressService';
import {
    FaRunning, FaClipboardList, FaSave, FaArrowLeft, FaEdit,
    FaCheckCircle, FaHistory, FaTimes, FaRegClock, FaExternalLinkAlt // Adicionado FaRegClock e FaExternalLinkAlt
} from 'react-icons/fa';
import { theme } from '../theme'; // Garanta que o theme está corretamente importado

// --- Styled Components (Completos) ---
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
    color: ${({ theme }) => theme.colors.textDark};
    padding: 10px 15px;
    border: none;
    border-radius: ${({ theme }) => theme.borderRadius};
    cursor: pointer;
    font-weight: 600;
    margin-top: 15px;
    transition: background-color 0.2s;
    &:hover {
        background-color: #e6c358;
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
    background-color: rgba(0,0,0,0.1);
    padding: 10px;
    border-radius: 5px;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.textMuted};
    margin-bottom: 15px;
  }
`;

const ExerciseLogItem = styled.div`
  background-color: #2C2C2C;
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
  background-color: rgba(0,0,0,0.1);
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
  background-color: #383838;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.9rem;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  }
`;

const LogTextarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  background-color: #383838;
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
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
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
    background-color: #555;
    cursor: not-allowed;
  }
`;

const PerformanceHistoryItem = styled.div`
  font-size: 0.85rem;
  color: #b0b0b0;
  margin-top: 8px;
  padding: 8px 10px;
  border-left: 2px solid #444;
  background-color: rgba(0,0,0,0.05);
  border-radius: 0 4px 4px 0;
  line-height: 1.5;
`;

const ModalOverlayStyled = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.88); display: flex;
  justify-content: center; align-items: center;
  z-index: 1050; padding: 20px;
`;

const ModalContentStyled = styled.div`
  background-color: #2A2A2A;
  padding: clamp(20px, 3vw, 30px);
  border-radius: 10px; width: 100%;
  max-width: 700px;
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
`;

const CloseModalButtonStyled = styled.button`
  background: transparent; border: none;
  color: #aaa; font-size: 1.8rem; cursor: pointer;
  padding: 5px; line-height: 1;
  &:hover { color: white; }
`;

const FullHistoryTableContainer = styled.div`
  overflow-y: auto;
  max-height: 60vh;
  margin-bottom: 15px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: #383838; border-radius: 3px; }
  &::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }
  &::-webkit-scrollbar-thumb:hover { background: #666; }
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
    background-color: #333;
    color: ${({ theme }) => theme.colors.primary};
    position: sticky;
    top: 0;
    z-index: 1;
  }
  tbody tr:nth-child(even) {
    background-color: #272727;
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
// --- Fim Styled Components ---


const ClientProgressPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();

  const [myTrainings, setMyTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [selectedTrainingName, setSelectedTrainingName] = useState('');
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [performanceLogs, setPerformanceLogs] = useState({});
  const [currentPerformanceInputs, setCurrentPerformanceInputs] = useState({});

  const [loadingTrainings, setLoadingTrainings] = useState(true);
  const [loadingPlansAndProgress, setLoadingPlansAndProgress] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [showFullHistoryModal, setShowFullHistoryModal] = useState(false);
  const [selectedExerciseForHistory, setSelectedExerciseForHistory] = useState(null);
  const [fullHistoryLogs, setFullHistoryLogs] = useState([]);
  const [loadingFullHistory, setLoadingFullHistory] = useState(false);
  const [fullHistoryError, setFullHistoryError] = useState('');

  useEffect(() => {
    if (authState.token) {
      setLoadingTrainings(true);
      getMyBookings(authState.token)
        .then(data => {
          setMyTrainings(data.trainings || []);
        })
        .catch(err => setError('Falha ao buscar seus treinos inscritos: ' + err.message))
        .finally(() => setLoadingTrainings(false));
    }
  }, [authState.token]);

  useEffect(() => {
    if (selectedTraining && authState.token) {
      setLoadingPlansAndProgress(true);
      setError('');
      setSuccessMessage('');
      setWorkoutPlans([]);
      setPerformanceLogs({});
      setCurrentPerformanceInputs({});

      const trainingDetails = myTrainings.find(t => t.id === selectedTraining);
      if (trainingDetails) {
        setSelectedTrainingName(trainingDetails.name);
      }

      getWorkoutPlansByTrainingId(selectedTraining, authState.token)
        .then(async (plansData) => {
          const plans = plansData || [];
          setWorkoutPlans(plans);

          if (plans.length > 0) {
            const performancePromises = plans.map(plan =>
              getMyPerformanceForWorkoutPlanService(selectedTraining, plan.id, authState.token)
                .catch(err => {
                  console.error(`Falha ao buscar performance para plano ${plan.id}:`, err);
                  return [];
                })
            );
            const performancesForAllPlans = await Promise.all(performancePromises);
            const allLogsByExercise = {};
            performancesForAllPlans.forEach(planPerformances => {
              (planPerformances || []).forEach(perf => {
                if (!allLogsByExercise[perf.planExerciseId]) {
                  allLogsByExercise[perf.planExerciseId] = [];
                }
                if (!allLogsByExercise[perf.planExerciseId].find(p => p.id === perf.id)) {
                    allLogsByExercise[perf.planExerciseId].push(perf);
                }
              });
            });
            setPerformanceLogs(allLogsByExercise);
          }
        })
        .catch(err => {
          setError('Falha ao buscar planos de treino ou progresso: ' + err.message);
          setWorkoutPlans([]);
          setPerformanceLogs({});
        })
        .finally(() => setLoadingPlansAndProgress(false));
    } else {
      setWorkoutPlans([]);
      setPerformanceLogs({});
      setSelectedTrainingName('');
    }
  }, [selectedTraining, authState.token, myTrainings]);

  const handlePerformanceInputChange = (planExerciseId, field, value) => {
    setCurrentPerformanceInputs(prev => ({
      ...prev,
      [planExerciseId]: {
        ...(prev[planExerciseId] || {}),
        [field]: value
      }
    }));
  };

  const handleLogPerformance = async (planExerciseId, workoutPlanId) => {
    if (!selectedTraining) return;
    const inputs = currentPerformanceInputs[planExerciseId];
    if (!inputs || (inputs.performedReps === undefined && inputs.performedWeight === undefined && inputs.performedDurationSeconds === undefined)) {
      if(!inputs || (inputs.performedReps === '' && inputs.performedWeight === '' && inputs.performedDurationSeconds === '' && (inputs.notes === undefined || inputs.notes === ''))) {
        setError("Preencha pelo menos um campo de desempenho (reps, peso, duração) ou adicione notas.");
        return;
      }
    }

    setError(''); setSuccessMessage('');
    try {
      const performanceData = {
        trainingId: selectedTraining,
        workoutPlanId: workoutPlanId,
        planExerciseId: planExerciseId,
        performedAt: new Date().toISOString().split('T')[0],
        performedReps: inputs.performedReps ? parseInt(inputs.performedReps) : null,
        performedWeight: inputs.performedWeight ? parseFloat(inputs.performedWeight) : null,
        performedDurationSeconds: inputs.performedDurationSeconds ? parseInt(inputs.performedDurationSeconds) : null,
        notes: inputs.notes || null,
      };
      const result = await logExercisePerformanceService(performanceData, authState.token);
      setSuccessMessage(result.message || "Desempenho registado!");

      setPerformanceLogs(prevLogs => {
        const newLogsForExercise = [...(prevLogs[planExerciseId] || []), result.performance];
        return {
          ...prevLogs,
          [planExerciseId]: newLogsForExercise.sort((a,b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())
        };
      });
      setCurrentPerformanceInputs(prev => ({ ...prev, [planExerciseId]: {} }));

    } catch (err) {
      setError("Falha ao registar desempenho: " + err.message);
    }
  };

  const handleOpenFullHistoryModal = async (planExercise) => {
    if (!planExercise || !planExercise.id || !planExercise.exerciseDetails?.name) return;

    setSelectedExerciseForHistory({
        id: planExercise.id,
        name: planExercise.exerciseDetails.name
    });
    setShowFullHistoryModal(true);
    setLoadingFullHistory(true);
    setFullHistoryError('');
    setFullHistoryLogs([]);
    try {
      const historyData = await getMyPerformanceHistoryForExerciseService(planExercise.id, authState.token);
      setFullHistoryLogs(historyData || []);
    } catch (err) {
      console.error("Erro ao buscar histórico completo do exercício:", err);
      setFullHistoryError(err.message || "Falha ao carregar histórico completo.");
    } finally {
      setLoadingFullHistory(false);
    }
  };

  const handleCloseFullHistoryModal = () => {
    setShowFullHistoryModal(false);
    setSelectedExerciseForHistory(null);
    setFullHistoryLogs([]);
    setFullHistoryError('');
  };

  if (loadingTrainings) return <PageContainer><LoadingText>A carregar seus treinos...</LoadingText></PageContainer>;

  return (
    <PageContainer>
      <BackLink to="/dashboard"><FaArrowLeft /> Voltar ao Painel</BackLink>
      <HeaderContainer>
        <Title><FaClipboardList /> Registar Progresso Pessoal</Title>
      </HeaderContainer>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <PageSuccessMessage>{successMessage}</PageSuccessMessage>}

      {!selectedTraining ? (
        <>
          <SectionTitle>Selecione um Treino para Registar Progresso</SectionTitle>
          {myTrainings.length > 0 ? (
            <TrainingSelectorGrid>
              {myTrainings.map(training => (
                <TrainingCard key={training.id} onClick={() => setSelectedTraining(training.id)}>
                  <div>
                    <h3>{training.name}</h3>
                    <p>Data: {new Date(training.date).toLocaleDateString('pt-PT')} às {training.time ? training.time.substring(0,5) : 'N/A'}</p>
                    <p>Instrutor: {training.instructor?.firstName} {training.instructor?.lastName}</p>
                  </div>
                  <SelectTrainingButton onClick={(e) => { e.stopPropagation(); setSelectedTraining(training.id); }}>
                    Registar/Ver Progresso
                  </SelectTrainingButton>
                </TrainingCard>
              ))}
            </TrainingSelectorGrid>
          ) : (
            <EmptyText>Não está inscrito em nenhum treino ou não há treinos disponíveis para registo.</EmptyText>
          )}
        </>
      ) : (
        <>
          <SectionTitle>A Registar Progresso para: {selectedTrainingName}</SectionTitle>
          <SelectTrainingButton onClick={() => setSelectedTraining(null)} style={{marginBottom: '20px', backgroundColor: theme.colors.buttonSecondaryBg, color: theme.colors.textMain}}>Mudar Treino</SelectTrainingButton>

          {loadingPlansAndProgress && <LoadingText>A carregar plano e progresso...</LoadingText>}
          {!loadingPlansAndProgress && workoutPlans.length === 0 && <EmptyText>Este treino não tem um plano definido.</EmptyText>}

          {workoutPlans.map(plan => (
            <WorkoutPlanDisplay key={plan.id}>
              <h3>Plano: {plan.name} (Bloco: {plan.order + 1})</h3>
              {plan.notes && <p><i>Notas do Plano: {plan.notes}</i></p>}
              {(plan.planExercises || []).sort((a,b) => a.order - b.order).map(planEx => (
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
                  <LogButton onClick={() => handleLogPerformance(planEx.id, plan.id)}>
                    <FaSave /> Registar Desempenho
                  </LogButton>

                  {performanceLogs[planEx.id] && performanceLogs[planEx.id].length > 0 && (
                    <div style={{marginTop: '15px'}}>
                        <h5 style={{fontSize: '0.9rem', color: theme.colors.textMuted, marginBottom: '5px'}}>Seu Histórico (Mais Recentes):</h5>
                        {performanceLogs[planEx.id]
                            .sort((a,b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())
                            .slice(0,3)
                            .map(log => (
                                <PerformanceHistoryItem key={log.id}>
                                    {new Date(log.performedAt).toLocaleDateString('pt-PT')}:
                                    {log.performedReps !== null ? ` Reps: ${log.performedReps}` : ''}
                                    {log.performedWeight !== null ? ` Peso: ${log.performedWeight}kg` : ''}
                                    {log.performedDurationSeconds !== null ? ` Duração: ${log.performedDurationSeconds}s` : ''}
                                    {log.notes && ` (Notas: ${log.notes})`}
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

      {showFullHistoryModal && selectedExerciseForHistory && (
        <ModalOverlayStyled onClick={handleCloseFullHistoryModal}>
          <ModalContentStyled onClick={(e) => e.stopPropagation()}>
            <ModalHeaderStyled>
              <ModalTitleStyled>Histórico Completo: {selectedExerciseForHistory.name}</ModalTitleStyled>
              <CloseModalButtonStyled onClick={handleCloseFullHistoryModal}><FaTimes /></CloseModalButtonStyled>
            </ModalHeaderStyled>

            {loadingFullHistory && <LoadingText>A carregar histórico...</LoadingText>}
            {fullHistoryError && <ErrorText>{fullHistoryError}</ErrorText>}

            {!loadingFullHistory && !fullHistoryError && fullHistoryLogs.length === 0 && (
              <EmptyText>Nenhum registo de desempenho encontrado para este exercício.</EmptyText>
            )}

            {!loadingFullHistory && !fullHistoryError && fullHistoryLogs.length > 0 && (
              <FullHistoryTableContainer>
                <FullHistoryTable>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Reps</th>
                      <th>Peso (kg)</th>
                      <th>Duração (s)</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullHistoryLogs.sort((a,b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()).map(log => (
                      <tr key={log.id}>
                        <td>{new Date(log.performedAt).toLocaleDateString('pt-PT')}</td>
                        <td>{log.performedReps ?? '-'}</td>
                        <td>{log.performedWeight ?? '-'}</td>
                        <td>{log.performedDurationSeconds ?? '-'}</td>
                        <td>{log.notes ? <span className="notes">{log.notes}</span> : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </FullHistoryTable>
              </FullHistoryTableContainer>
            )}
             <ModalActions style={{marginTop: '10px', paddingTop: '10px'}}>
                <SelectTrainingButton // Reutilizando SelectTrainingButton para consistência, ou crie ModalButton secondary
                    onClick={handleCloseFullHistoryModal}
                    style={{backgroundColor: theme.colors.buttonSecondaryBg, color: theme.colors.textMain}}
                >
                    Fechar
                </SelectTrainingButton>
             </ModalActions>
          </ModalContentStyled>
        </ModalOverlayStyled>
      )}

    </PageContainer>
  );
};

export default ClientProgressPage;