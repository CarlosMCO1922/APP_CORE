// src/pages/ClientProgressPage.js
import React, { useEffect, useState, useCallback, useMemo } from 'react'; // useMemo não está a ser usado, pode ser removido se não for adicionado mais tarde
import { Link, useNavigate } from 'react-router-dom'; // useParams não está a ser usado aqui, mas pode ser no futuro se a rota incluir :trainingId
import styled, { css } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/userService';
import { getWorkoutPlansByTrainingId } from '../services/workoutPlanService';
import { logExercisePerformanceService, getMyPerformanceForWorkoutPlanService } from '../services/progressService';
import { FaRunning, FaClipboardList, FaSave, FaArrowLeft, FaEdit, FaCheckCircle } from 'react-icons/fa'; // FaEdit, FaCheckCircle não estão a ser usados
import { theme } from '../theme';

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
  border-color: transparent; /* Ou uma borda subtil */
  background-color: rgba(0,0,0,0.05); /* Um fundo muito leve se desejar */
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

  h3 { /* Estilo para o nome do plano */
    color: ${({ theme }) => theme.colors.secondary || theme.colors.primary}; /* Usar secondary se existir, senão primary */
    font-size: 1.3rem;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha};
  }
  p > i { /* Estilo para notas do plano */
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
  background-color: #2C2C2C; // Um pouco mais escuro que o cardBackground para contraste
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px; // Mais espaço entre exercícios
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
  margin-bottom: 15px; // Mais espaço
  font-style: italic;
  line-height: 1.4;
  padding: 8px;
  background-color: rgba(0,0,0,0.1);
  border-radius: 4px;
`;

const LogInputGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); // Ajustado minmax
  gap: 15px; // Aumentado gap
  margin-bottom: 15px;
  align-items: flex-end;
`;

const LogLabel = styled.label`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 5px; // Mais espaço
  display: block;
  font-weight: 500;
`;

const LogInput = styled.input`
  width: 100%;
  padding: 10px 12px; // Aumentado padding
  background-color: #383838; // Cor de fundo ligeiramente diferente
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
  min-height: 70px; // Ajustado
  resize: vertical;
  margin-bottom: 10px; // Espaço antes do botão
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  }
`;
const LogButton = styled.button`
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
  padding: 10px 18px; // Aumentado padding
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
  font-size: 0.85rem; /* Aumentado */
  color: #b0b0b0; /* Cor mais clara para melhor leitura */
  margin-top: 8px;
  padding: 8px 10px; /* Adicionado padding */
  border-left: 2px solid #444;
  background-color: rgba(0,0,0,0.05); /* Fundo subtil */
  border-radius: 0 4px 4px 0;
  line-height: 1.5;
`;

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
  const [loadingPlansAndProgress, setLoadingPlansAndProgress] = useState(false); // Estado combinado
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      if(!inputs || (inputs.performedReps === '' && inputs.performedWeight === '' && inputs.performedDurationSeconds === '' && inputs.notes === '')) {
        setError("Preencha pelo menos um campo de desempenho (reps, peso, duração ou notas) ou as notas não podem estar vazias sozinhas se for o único campo.");
        return;
      }
       if (!inputs || (!inputs.performedReps && !inputs.performedWeight && !inputs.performedDurationSeconds && !inputs.notes)) {
         setError("Preencha pelo menos um campo de desempenho (reps, peso ou duração) ou adicione notas.");
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
          [planExerciseId]: newLogsForExercise.sort((a,b) => new Date(b.performedAt) - new Date(a.performedAt))
        };
      });
      setCurrentPerformanceInputs(prev => ({ ...prev, [planExerciseId]: {} }));

    } catch (err) {
      setError("Falha ao registar desempenho: " + err.message);
    }
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
                        <h5 style={{fontSize: '0.9rem', color: theme.colors.textMuted, marginBottom: '5px'}}>Seu Histórico para este Exercício (Mais Recentes):</h5>
                        {performanceLogs[planEx.id]
                            .sort((a,b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()) // Garante ordenação correta
                            .slice(0,3) // Mostrar os 3 mais recentes
                            .map(log => (
                                <PerformanceHistoryItem key={log.id}>
                                    {new Date(log.performedAt).toLocaleDateString('pt-PT')}:
                                    {log.performedReps !== null ? ` Reps: ${log.performedReps}` : ''}
                                    {log.performedWeight !== null ? ` Peso: ${log.performedWeight}kg` : ''}
                                    {log.performedDurationSeconds !== null ? ` Duração: ${log.performedDurationSeconds}s` : ''}
                                    {log.notes && ` (Notas: ${log.notes})`}
                                </PerformanceHistoryItem>
                        ))}
                    </div>
                  )}
                </ExerciseLogItem>
              ))}
            </WorkoutPlanDisplay>
          ))}
        </>
      )}
    </PageContainer>
  );
};

export default ClientProgressPage;