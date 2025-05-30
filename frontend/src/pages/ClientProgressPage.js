// src/pages/ClientProgressPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/userService'; // Para listar treinos inscritos
import { getWorkoutPlansByTrainingId } from '../services/workoutPlanService'; // Para buscar o plano do treino
import { logExercisePerformanceService, getMyPerformanceForWorkoutPlanService } from '../services/progressService';
import { FaRunning, FaClipboardList, FaSave, FaArrowLeft, FaEdit, FaCheckCircle } from 'react-icons/fa';
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

const LoadingText = styled.p` /* ... (pode copiar do DashboardPage.js) ... */ `;
const ErrorText = styled.p` /* ... (pode copiar do DashboardPage.js) ... */ `;
const EmptyText = styled.p` /* ... (pode copiar do DashboardPage.js) ... */ `;

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
`;

const ExerciseLogItem = styled.div`
  background-color: #2C2C2C;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
`;

const ExerciseName = styled.h4`
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 0;
  margin-bottom: 10px;
`;

const PrescribedDetails = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 10px;
  font-style: italic;
`;

const LogInputGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
  align-items: flex-end;
`;

const LogLabel = styled.label`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 3px;
  display: block;
`;

const LogInput = styled.input`
  width: 100%;
  padding: 8px 10px;
  background-color: #333;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.9rem;
`;

const LogTextarea = styled.textarea`
  width: 100%;
  padding: 8px 10px;
  background-color: #333;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.9rem;
  min-height: 60px;
  resize: vertical;
`;
const LogButton = styled.button`
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

// Estilo para histórico de performance
const PerformanceHistoryItem = styled.div`
  font-size: 0.8rem;
  color: #aaa;
  margin-top: 5px;
  padding-left: 10px;
  border-left: 2px solid #444;
`;

const PageSuccessMessage = styled.p`
  ${MessageBaseStyles} // Se usar um estilo base
  color: ${({ theme }) => theme.colors.success || '#28a745'}; // Fallback color
  background-color: ${({ theme }) => theme.colors.successBg || 'rgba(40, 167, 69, 0.1)'}; // Fallback color
  border-color: ${({ theme }) => theme.colors.success || '#28a745'}; // Fallback color
`;


const ClientProgressPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();

  const [myTrainings, setMyTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null); // Guarda o ID do treino
  const [selectedTrainingName, setSelectedTrainingName] = useState('');
  const [workoutPlans, setWorkoutPlans] = useState([]); // Planos do treino selecionado
  const [performanceLogs, setPerformanceLogs] = useState({}); // Objeto: { planExerciseId: [{log}, {log}] }
  const [currentPerformanceInputs, setCurrentPerformanceInputs] = useState({}); // { planExerciseId: { performedReps: '', performedWeight: '', notes: '' ... } }

  const [loadingTrainings, setLoadingTrainings] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Buscar treinos inscritos pelo cliente
  useEffect(() => {
    if (authState.token) {
      setLoadingTrainings(true);
      getMyBookings(authState.token)
        .then(data => {
          // Filtrar apenas treinos futuros ou recentes para registo de progresso
          const now = new Date();
          const relevantTrainings = (data.trainings || []).filter(t => {
            const trainingDate = new Date(`<span class="math-inline">\{t\.date\}T</span>{t.time}`);
            // Exemplo: permitir log para treinos dos últimos 7 dias ou futuros
            // return trainingDate <= now && now.getTime() - trainingDate.getTime() < 7 * 24 * 60 * 60 * 1000 || trainingDate > now;
            return true; // Por agora, todos os treinos inscritos
          });
          setMyTrainings(relevantTrainings);
        })
        .catch(err => setError('Falha ao buscar seus treinos inscritos: ' + err.message))
        .finally(() => setLoadingTrainings(false));
    }
  }, [authState.token]);

  // Buscar planos e logs de performance quando um treino é selecionado
  useEffect(() => {
    if (selectedTraining && authState.token) {
      setLoadingPlans(true);
      setLoadingPerformance(true);
      setWorkoutPlans([]); // Limpa planos anteriores
      setPerformanceLogs({}); // Limpa logs anteriores
      setCurrentPerformanceInputs({}); // Limpa inputs anteriores

      const trainingDetails = myTrainings.find(t => t.id === selectedTraining);
      if (trainingDetails) setSelectedTrainingName(trainingDetails.name);


      Promise.all([
        getWorkoutPlansByTrainingId(selectedTraining, authState.token),
        // Por agora, vamos buscar o histórico de performance por plano quando o plano é selecionado
        // ou podemos buscar todos os logs de um treino, mas a API foi desenhada para plano
      ])
      .then(([plansData]) => {
        setWorkoutPlans(plansData || []);
        // Para cada plano, buscar o histórico de performance
        (plansData || []).forEach(plan => {
          getMyPerformanceForWorkoutPlanService(selectedTraining, plan.id, authState.token)
            .then(performanceData => {
              // Agrupar performance por planExerciseId
              const logsByExercise = {};
              (performanceData || []).forEach(perf => {
                if (!logsByExercise[perf.planExerciseId]) {
                  logsByExercise[perf.planExerciseId] = [];
                }
                logsByExercise[perf.planExerciseId].push(perf);
              });
              setPerformanceLogs(prevLogs => ({ ...prevLogs, ...logsByExercise }));
            })
            .catch(err => console.error(`Falha ao buscar performance para plano ${plan.id}:`, err));
        });
      })
      .catch(err => setError('Falha ao buscar planos de treino: ' + err.message))
      .finally(() => {
        setLoadingPlans(false);
        setLoadingPerformance(false); // Assumimos que a performance é carregada com os planos
      });
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
    if (!inputs || (!inputs.performedReps && !inputs.performedWeight && !inputs.performedDurationSeconds)) {
      setError("Preencha pelo menos um campo de desempenho (reps, peso ou duração).");
      return;
    }
    setError(''); setSuccessMessage('');
    try {
      const performanceData = {
        trainingId: selectedTraining,
        workoutPlanId: workoutPlanId,
        planExerciseId: planExerciseId,
        performedAt: new Date().toISOString().split('T')[0], // Usar data atual para o log
        performedReps: inputs.performedReps ? parseInt(inputs.performedReps) : null,
        performedWeight: inputs.performedWeight ? parseFloat(inputs.performedWeight) : null,
        performedDurationSeconds: inputs.performedDurationSeconds ? parseInt(inputs.performedDurationSeconds) : null,
        notes: inputs.notes || null,
        // setNumber: Podes adicionar lógica para séries se necessário
      };
      const result = await logExercisePerformanceService(performanceData, authState.token);
      setSuccessMessage(result.message || "Desempenho registado!");
      // Atualizar logs locais
      setPerformanceLogs(prevLogs => {
        const updatedLogs = { ...prevLogs };
        if (!updatedLogs[planExerciseId]) updatedLogs[planExerciseId] = [];
        updatedLogs[planExerciseId].push(result.performance); // Adiciona o novo log
        return updatedLogs;
      });
      // Limpar inputs para este exercício
      setCurrentPerformanceInputs(prev => ({
        ...prev,
        [planExerciseId]: {}
      }));

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
                    <p>Data: {new Date(training.date).toLocaleDateString('pt-PT')} às {training.time.substring(0,5)}</p>
                    <p>Instrutor: {training.instructor?.firstName} {training.instructor?.lastName}</p>
                  </div>
                  <SelectTrainingButton onClick={(e) => { e.stopPropagation(); setSelectedTraining(training.id); }}>
                    Registar/Ver Progresso
                  </SelectTrainingButton>
                </TrainingCard>
              ))}
            </TrainingSelectorGrid>
          ) : (
            <EmptyText>Não está inscrito em nenhum treino relevante para registo de progresso ou não há treinos futuros/recentes.</EmptyText>
          )}
        </>
      ) : (
        <>
          <SectionTitle>A Registar Progresso para: {selectedTrainingName}</SectionTitle>
          <button onClick={() => setSelectedTraining(null)} style={{marginBottom: '20px'}}>Mudar Treino</button>
          {loadingPlans && <LoadingText>A carregar plano de treino...</LoadingText>}
          {!loadingPlans && workoutPlans.length === 0 && <EmptyText>Este treino não tem um plano definido.</EmptyText>}

          {workoutPlans.map(plan => (
            <WorkoutPlanDisplay key={plan.id}>
              <h3>Plano: {plan.name} (Ordem: {plan.order + 1})</h3>
              {plan.notes && <p><i>Notas do Plano: {plan.notes}</i></p>}
              {(plan.planExercises || []).sort((a,b) => a.order - b.order).map(planEx => (
                <ExerciseLogItem key={planEx.id}>
                  <ExerciseName>{planEx.exerciseDetails?.name || 'Exercício Desconhecido'}</ExerciseName>
                  <PrescribedDetails>
                    Prescrito:
                    {planEx.sets && ` Séries: ${planEx.sets} `}
                    {planEx.reps && ` Reps: ${planEx.reps} `}
                    {planEx.durationSeconds && ` Duração: ${planEx.durationSeconds}s `}
                    {planEx.restSeconds !== null && ` Descanso: ${planEx.restSeconds}s`}
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
                      <LogInput type="number" step="0.1" id={`weight-${planEx.id}`} placeholder="Ex: 50.5"
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

                  {/* Mostrar Histórico para este exercício específico */}
                  {performanceLogs[planEx.id] && performanceLogs[planEx.id].length > 0 && (
                    <div style={{marginTop: '15px'}}>
                        <h5 style={{fontSize: '0.9rem', color: theme.colors.textMuted}}>Seu Histórico para este Exercício:</h5>
                        {performanceLogs[planEx.id].sort((a,b) => new Date(b.performedAt) - new Date(a.performedAt)).slice(0,3).map(log => ( // Mostrar os 3 mais recentes
                            <PerformanceHistoryItem key={log.id}>
                                {new Date(log.performedAt).toLocaleDateString('pt-PT')}:
                                {log.performedReps && ` Reps: ${log.performedReps}`}
                                {log.performedWeight && ` Peso: ${log.performedWeight}kg`}
                                {log.performedDurationSeconds && ` Duração: ${log.performedDurationSeconds}s`}
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