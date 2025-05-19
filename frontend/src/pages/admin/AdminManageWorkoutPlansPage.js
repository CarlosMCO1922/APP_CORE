// src/pages/admin/AdminManageWorkoutPlansPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import {
    getWorkoutPlansByTrainingId,
    createWorkoutPlanForTraining,
    updateWorkoutPlan,
    deleteWorkoutPlan,
    addExerciseToPlan,
    updateExerciseInPlan,
    removeExerciseFromPlan
} from '../../services/workoutPlanService';
import { getAllTrainings } from '../../services/trainingService'; // Para obter o nome do treino
import { getAllExercises } from '../../services/exerciseService'; // Para popular a seleção de exercícios

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: #1A1A1A;
  color: #E0E0E0;
  min-height: 100vh;
  padding: 20px 40px;
  font-family: 'Inter', sans-serif;
`;

const MainTitle = styled.h1`
  font-size: 2rem;
  color: #D4AF37;
  margin-bottom: 5px;
`;

const TrainingInfo = styled.p`
  font-size: 1.1rem;
  color: #b0b0b0;
  margin-bottom: 20px;
`;

const LoadingText = styled.p` font-size: 1.1rem; text-align: center; padding: 20px; color: #D4AF37;`;
const ErrorText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #FF6B6B; background-color: rgba(255,107,107,0.15); border: 1px solid #FF6B6B; border-radius: 8px; margin: 15px auto; max-width: 700px;`;
const MessageText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #66BB6A; background-color: rgba(102,187,106,0.15); border: 1px solid #66BB6A; border-radius: 8px; margin: 15px auto; max-width: 700px;`;

const PlanSection = styled.div`
  background-color: #252525;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
`;

const PlanHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #383838;
  h2 {
    color: #D4AF37;
    font-size: 1.5rem;
    margin: 0;
  }
`;

const ActionButton = styled.button`
  margin-left: 10px;
  padding: ${props => props.small ? '6px 10px' : '8px 12px'};
  font-size: ${props => props.small ? '0.8rem' : '0.85rem'};
  border-radius: 5px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease;
  background-color: ${props => props.danger ? '#D32F2F' : (props.secondary ? '#555' : '#D4AF37')};
  color: ${props => props.danger ? 'white' : (props.secondary ? '#E0E0E0' : '#1A1A1A')};
  font-weight: 500;
  &:hover {
    background-color: ${props => props.danger ? '#C62828' : (props.secondary ? '#666' : '#e6c358')};
  }
  &:disabled {
    background-color: #404040;
    color: #777;
    cursor: not-allowed;
  }
`;

const CreateButtonStyled = styled.button`
  background-color: #D4AF37; color: #1A1A1A; padding: 10px 20px;
  border-radius: 8px; font-weight: bold; border: none; cursor: pointer;
  transition: background-color 0.2s ease; margin-bottom: 20px;
  font-size: 0.95rem;
  &:hover { background-color: #e6c358; }
`;

const ExerciseList = styled.ul`
  list-style: none;
  padding-left: 0;
  margin-top: 15px;
`;

const ExerciseItem = styled.li`
  background-color: #2C2C2C;
  padding: 12px 15px;
  border-radius: 6px;
  margin-bottom: 10px;
  border-left: 3px solid #b89b2e; /* Dourado mais escuro */
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;

  .exercise-info {
    flex-grow: 1;
    p { margin: 4px 0; font-size: 0.9rem; line-height: 1.4;}
    strong { color: #E0E0E0; font-weight: 600; }
    em { color: #a0a0a0; font-size: 0.85rem; display: block; margin-top: 3px;}
    .exercise-media { margin-top: 8px; }
    img { width: 80px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 10px; border: 1px solid #444; }
    /* Adicionar estilos para vídeo se necessário */
  }
  .exercise-actions { 
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
    button { margin-left: 0; width: 100%; } /* Botões ocupam toda a largura disponível */
  }
  @media (min-width: 600px) {
    .exercise-actions {
        flex-direction: row;
        align-items: center;
        button { width: auto; }
    }
  }
`;

const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1050; padding: 20px;`;
const ModalContent = styled.div` background-color: #2C2C2C; padding: 25px 35px; border-radius: 10px; width: 100%; max-width: 600px; box-shadow: 0 8px 25px rgba(0,0,0,0.5); position: relative; max-height: 90vh; overflow-y: auto; `;
const ModalTitle = styled.h2` color: #D4AF37; margin-top: 0; margin-bottom: 20px; font-size: 1.5rem; text-align: center;`;
const ModalForm = styled.form` display: flex; flex-direction: column; gap: 12px; `;
const ModalLabel = styled.label` font-size: 0.9rem; color: #b0b0b0; margin-bottom: 3px; display: block; font-weight: 500;`;
const ModalInput = styled.input` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; &:focus { outline: none; border-color: #D4AF37; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const ModalTextarea = styled.textarea` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; min-height: 70px; resize: vertical; &:focus { outline: none; border-color: #D4AF37; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const ModalSelect = styled.select` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; &:focus { outline: none; border-color: #D4AF37; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const ModalActions = styled.div` display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; `;
const ModalButton = styled.button`
  padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer;
  font-weight: 500; transition: background-color 0.2s ease;
  background-color: ${props => props.primary ? '#D4AF37' : '#555'};
  color: ${props => props.primary ? '#1A1A1A' : '#E0E0E0'};
  &:hover { background-color: ${props => props.primary ? '#e6c358' : '#666'}; }
  &:disabled { background-color: #404040; color: #777; cursor: not-allowed; }
`;
const CloseButton = styled.button` 
  position: absolute; top: 12px; right: 15px; 
  background: transparent; border: none; 
  color: #aaa; font-size: 1.8rem; cursor: pointer;
  line-height: 1; padding: 0;
  &:hover { color: #fff; } 
`;
const NoItemsText = styled.p` font-size: 0.95rem; color: #888; text-align: center; padding: 15px 0; font-style: italic; `;

const initialWorkoutPlanForm = { name: '', order: 0, notes: '' };
const initialExercisePlanForm = {
  exerciseId: '', sets: '', reps: '',
  durationSeconds: '', restSeconds: '', order: 0, notes: ''
};

function AdminManageWorkoutPlansPage() {
  const { trainingId } = useParams();
  const { authState } = useAuth();
  // const navigate = useNavigate(); // Descomentar se precisar de navegação programática

  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [trainingName, setTrainingName] = useState('');

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [currentPlanData, setCurrentPlanData] = useState(initialWorkoutPlanForm);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [planFormLoading, setPlanFormLoading] = useState(false);
  const [planModalError, setPlanModalError] = useState('');

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [isEditingExercise, setIsEditingExercise] = useState(false);
  const [currentExerciseData, setCurrentExerciseData] = useState(initialExercisePlanForm);
  const [currentExercisePlanId, setCurrentExercisePlanId] = useState(null);
  const [selectedPlanIdForExercise, setSelectedPlanIdForExercise] = useState(null);
  const [exerciseFormLoading, setExerciseFormLoading] = useState(false);
  const [exerciseModalError, setExerciseModalError] = useState('');

  const fetchTrainingDetails = useCallback(async () => {
    if (authState.token && trainingId) {
        try {
            // Assumindo que getAllTrainings retorna uma lista e podemos encontrar o treino por ID
            // ou idealmente ter uma função getTrainingById no trainingService
            const allTrainingsData = await getAllTrainings(authState.token);
            const currentTraining = allTrainingsData.find(t => t.id === parseInt(trainingId));
            if (currentTraining) {
                setTrainingName(currentTraining.name);
            } else {
                setTrainingName(`ID ${trainingId} (não encontrado)`);
            }
        } catch (err) {
            console.error("Erro ao buscar nome do treino:", err);
            setTrainingName(`ID ${trainingId}`);
        }
    }
  }, [authState.token, trainingId]);


  const fetchWorkoutPlans = useCallback(async () => {
    if (authState.token && trainingId) {
      try {
        setLoading(true);
        setError(''); setSuccessMessage('');
        const plans = await getWorkoutPlansByTrainingId(trainingId, authState.token);
        setWorkoutPlans(plans || []);
      } catch (err) {
        setError(err.message || 'Erro ao carregar planos de treino.');
        setWorkoutPlans([]);
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token, trainingId]);

  const fetchAllExercises = useCallback(async () => {
    if (authState.token) {
        try {
            const exercisesData = await getAllExercises(authState.token);
            setAllExercises(exercisesData || []);
        } catch (err) {
            console.error("Erro ao buscar lista de exercícios base:", err);
            setError(prev => `${prev}\nErro ao carregar lista de exercícios disponíveis.`);
            setAllExercises([]);
        }
    }
  }, [authState.token]);

  useEffect(() => {
    fetchTrainingDetails();
    fetchWorkoutPlans();
    fetchAllExercises();
  }, [fetchTrainingDetails, fetchWorkoutPlans, fetchAllExercises]);

  const handleOpenCreatePlanModal = () => {
    setIsEditingPlan(false);
    setCurrentPlanData({...initialWorkoutPlanForm, order: workoutPlans.length}); // Sugere a próxima ordem
    setCurrentPlanId(null);
    setPlanModalError('');
    setShowPlanModal(true);
  };

  const handleOpenEditPlanModal = (plan) => {
    setIsEditingPlan(true);
    setCurrentPlanData({ name: plan.name, order: plan.order, notes: plan.notes || '' });
    setCurrentPlanId(plan.id);
    setPlanModalError('');
    setShowPlanModal(true);
  };
  
  const handlePlanFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentPlanData(prev => ({ ...prev, [name]: name === 'order' ? parseInt(value, 10) || 0 : value }));
  };

  const handlePlanFormSubmit = async (e) => {
    e.preventDefault();
    setPlanFormLoading(true); setPlanModalError(''); setError(''); setSuccessMessage('');
    try {
      if (isEditingPlan) {
        await updateWorkoutPlan(currentPlanId, currentPlanData, authState.token);
        setSuccessMessage('Plano de treino atualizado!');
      } else {
        await createWorkoutPlanForTraining(trainingId, currentPlanData, authState.token);
        setSuccessMessage('Plano de treino criado!');
      }
      fetchWorkoutPlans();
      setShowPlanModal(false);
    } catch (err) {
      setPlanModalError(err.message || 'Erro ao guardar plano.');
    } finally {
      setPlanFormLoading(false);
    }
  };
  
  const handleDeletePlan = async (planIdToDelete) => {
      if (!window.confirm('Tem certeza que deseja eliminar este plano de treino e todos os seus exercícios?')) return;
      setError(''); setSuccessMessage('');
      try {
          await deleteWorkoutPlan(planIdToDelete, authState.token);
          setSuccessMessage('Plano de treino eliminado.');
          fetchWorkoutPlans();
      } catch (err) {
          setError(err.message || 'Erro ao eliminar plano.');
      }
  };

  const handleOpenAddExerciseModal = (planId) => {
      setSelectedPlanIdForExercise(planId);
      setIsEditingExercise(false);
      const targetPlan = workoutPlans.find(p => p.id === planId);
      const nextOrder = targetPlan && targetPlan.planExercises ? targetPlan.planExercises.length : 0;
      setCurrentExerciseData({...initialExercisePlanForm, order: nextOrder});
      setCurrentExercisePlanId(null);
      setExerciseModalError('');
      setShowExerciseModal(true);
  };

  const handleOpenEditExerciseModal = (exerciseInPlan) => {
      setSelectedPlanIdForExercise(exerciseInPlan.workoutPlanId);
      setIsEditingExercise(true);
      setCurrentExerciseData({
          exerciseId: exerciseInPlan.exerciseId,
          sets: exerciseInPlan.sets === null ? '' : exerciseInPlan.sets,
          reps: exerciseInPlan.reps === null ? '' : exerciseInPlan.reps,
          durationSeconds: exerciseInPlan.durationSeconds === null ? '' : exerciseInPlan.durationSeconds,
          restSeconds: exerciseInPlan.restSeconds === null ? '' : exerciseInPlan.restSeconds,
          order: exerciseInPlan.order,
          notes: exerciseInPlan.notes || ''
      });
      setCurrentExercisePlanId(exerciseInPlan.id);
      setExerciseModalError('');
      setShowExerciseModal(true);
  };

  const handleExerciseFormChange = (e) => {
    const { name, value } = e.target;
    const isNumericField = ['sets', 'durationSeconds', 'restSeconds', 'order', 'exerciseId'].includes(name);
    const processedValue = isNumericField && value !== '' ? parseInt(value, 10) : value;
    setCurrentExerciseData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleExerciseFormSubmit = async (e) => {
      e.preventDefault();
      if (!currentExerciseData.exerciseId) {
        setExerciseModalError('Por favor, selecione um exercício.');
        return;
      }
      setExerciseFormLoading(true); setExerciseModalError(''); setError(''); setSuccessMessage('');
      
      const dataToSend = {...currentExerciseData};
      ['sets', 'durationSeconds', 'restSeconds'].forEach(field => {
          if (dataToSend[field] === '' || dataToSend[field] === null || isNaN(dataToSend[field])) {
            dataToSend[field] = null; // Backend espera null para campos numéricos opcionais vazios
          } else {
            dataToSend[field] = parseInt(dataToSend[field], 10);
          }
      });
      if (dataToSend.order === '' || dataToSend.order === null || isNaN(dataToSend.order)) {
          dataToSend.order = 0; // Default order
      } else {
          dataToSend.order = parseInt(dataToSend.order, 10);
      }
      
      try {
          if (isEditingExercise) {
              await updateExerciseInPlan(currentExercisePlanId, dataToSend, authState.token);
              setSuccessMessage('Exercício atualizado no plano!');
          } else {
              await addExerciseToPlan(selectedPlanIdForExercise, dataToSend, authState.token);
              setSuccessMessage('Exercício adicionado ao plano!');
          }
          fetchWorkoutPlans();
          setShowExerciseModal(false);
      } catch (err) {
          setExerciseModalError(err.message || 'Erro ao guardar exercício no plano.');
      } finally {
          setExerciseFormLoading(false);
      }
  };

  const handleDeleteExerciseFromPlan = async (exercisePlanIdToDelete) => {
      if (!window.confirm('Tem certeza que deseja remover este exercício do plano?')) return;
      setError(''); setSuccessMessage('');
      try {
          await removeExerciseFromPlan(exercisePlanIdToDelete, authState.token);
          setSuccessMessage('Exercício removido do plano.');
          fetchWorkoutPlans();
      } catch (err) {
          setError(err.message || 'Erro ao remover exercício.');
      }
  };

  if (loading) return <PageContainer><LoadingText>A carregar detalhes do plano de treino...</LoadingText></PageContainer>;

  return (
    <PageContainer>
      <MainTitle>Gerir Planos para o Treino</MainTitle>
      <TrainingInfo>{trainingName || `ID do Treino: ${trainingId}`}</TrainingInfo>
      <Link to="/admin/manage-trainings" style={{color: '#D4AF37', marginBottom: '20px', display: 'inline-block', textDecoration: 'none'}}>
        ‹ Voltar para Gestão de Treinos
      </Link>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

      <CreateButtonStyled onClick={handleOpenCreatePlanModal}>Adicionar Novo Plano de Treino</CreateButtonStyled>

      {workoutPlans.length > 0 ? workoutPlans.map(plan => (
        <PlanSection key={plan.id}>
          <PlanHeader>
            <h2>{plan.name} (Ordem: {plan.order})</h2>
            <div>
              <ActionButton secondary onClick={() => handleOpenEditPlanModal(plan)}>Editar Plano</ActionButton>
              <ActionButton danger onClick={() => handleDeletePlan(plan.id)}>Eliminar Plano</ActionButton>
            </div>
          </PlanHeader>
          {plan.notes && <p style={{color: '#a0a0a0', fontStyle: 'italic', marginBottom: '15px'}}>Notas do plano: {plan.notes}</p>}
          
          <ActionButton 
            primary 
            small 
            onClick={() => handleOpenAddExerciseModal(plan.id)} 
            style={{marginBottom: '15px', backgroundColor: '#007bff', color: 'white'}}
          >
            Adicionar Exercício a Este Plano
          </ActionButton>

          <ExerciseList>
            {plan.planExercises && plan.planExercises.length > 0 ? plan.planExercises.sort((a,b) => a.order - b.order).map(item => (
              <ExerciseItem key={item.id}>
                <div className="exercise-info">
                  <p><strong>{item.exerciseDetails?.name || 'Exercício Desconhecido'}</strong> (Ordem: {item.order})</p>
                  {item.exerciseDetails?.imageUrl && 
                    <div className="exercise-media"><img src={item.exerciseDetails.imageUrl} alt={item.exerciseDetails.name} /></div>
                  }
                  {item.sets && <p><span>Séries:</span> {item.sets}</p>}
                  {item.reps && <p><span>Reps:</span> {item.reps}</p>}
                  {item.durationSeconds && <p><span>Duração:</span> {item.durationSeconds}s</p>}
                  {item.restSeconds !== null && item.restSeconds >= 0 && <p><span>Descanso:</span> {item.restSeconds}s</p>}
                  {item.notes && <p><em>Notas: {item.notes}</em></p>}
                </div>
                <div className="exercise-actions">
                  <ActionButton secondary small onClick={() => handleOpenEditExerciseModal(item)}>Editar</ActionButton>
                  <ActionButton danger small onClick={() => handleDeleteExerciseFromPlan(item.id)}>Remover</ActionButton>
                </div>
              </ExerciseItem>
            )) : <NoItemsText>Nenhum exercício neste plano ainda.</NoItemsText>}
          </ExerciseList>
        </PlanSection>
      )) : (
        <NoItemsText>Nenhum plano de treino definido para este treino. Crie um!</NoItemsText>
      )}

      {showPlanModal && (
        <ModalOverlay onClick={() => setShowPlanModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <CloseButton onClick={() => setShowPlanModal(false)}>&times;</CloseButton>
            <ModalTitle>{isEditingPlan ? 'Editar Plano de Treino' : 'Criar Novo Plano de Treino'}</ModalTitle>
            {planModalError && <ErrorText>{planModalError}</ErrorText>}
            <ModalForm onSubmit={handlePlanFormSubmit}>
              <ModalLabel htmlFor="planName">Nome do Plano*</ModalLabel>
              <ModalInput type="text" name="name" id="planName" value={currentPlanData.name} onChange={handlePlanFormChange} required />
              <ModalLabel htmlFor="planOrder">Ordem*</ModalLabel>
              <ModalInput type="number" name="order" id="planOrder" value={currentPlanData.order} onChange={handlePlanFormChange} required min="0" />
              <ModalLabel htmlFor="planNotes">Notas (Opcional)</ModalLabel>
              <ModalTextarea name="notes" id="planNotes" value={currentPlanData.notes} onChange={handlePlanFormChange} />
              <ModalActions>
                <ModalButton type="button" onClick={() => setShowPlanModal(false)} disabled={planFormLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={planFormLoading}>
                  {planFormLoading ? 'A guardar...' : (isEditingPlan ? 'Guardar Alterações' : 'Criar Plano')}
                </ModalButton>
              </ModalActions>
            </ModalForm>
          </ModalContent>
        </ModalOverlay>
      )}

      {showExerciseModal && (
          <ModalOverlay onClick={() => setShowExerciseModal(false)}>
              <ModalContent onClick={e => e.stopPropagation()}>
                  <CloseButton onClick={() => setShowExerciseModal(false)}>&times;</CloseButton>
                  <ModalTitle>{isEditingExercise ? 'Editar Exercício no Plano' : 'Adicionar Exercício ao Plano'}</ModalTitle>
                  {exerciseModalError && <ErrorText>{exerciseModalError}</ErrorText>}
                  <ModalForm onSubmit={handleExerciseFormSubmit}>
                      <ModalLabel htmlFor="exerciseId">Exercício*</ModalLabel>
                      <ModalSelect name="exerciseId" id="exerciseId" value={currentExerciseData.exerciseId} onChange={handleExerciseFormChange} required>
                          <option value="">Selecione um exercício</option>
                          {allExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({ex.muscleGroup || 'N/A'})</option>)}
                      </ModalSelect>
                      
                      <ModalLabel htmlFor="exOrder">Ordem no Plano*</ModalLabel>
                      <ModalInput type="number" name="order" id="exOrder" value={currentExerciseData.order} onChange={handleExerciseFormChange} required min="0" />

                      <ModalLabel htmlFor="exSets">Séries</ModalLabel>
                      <ModalInput type="number" name="sets" id="exSets" value={currentExerciseData.sets} onChange={handleExerciseFormChange} min="0" placeholder="Ex: 3 (deixe em branco se não aplicável)"/>
                      
                      <ModalLabel htmlFor="exReps">Repetições</ModalLabel>
                      <ModalInput type="text" name="reps" id="exReps" value={currentExerciseData.reps} onChange={handleExerciseFormChange} placeholder="Ex: 10-12 ou 30s"/>
                      
                      <ModalLabel htmlFor="exDurationSeconds">Duração (segundos)</ModalLabel>
                      <ModalInput type="number" name="durationSeconds" id="exDurationSeconds" value={currentExerciseData.durationSeconds} onChange={handleExerciseFormChange} min="0" placeholder="Ex: 60 (deixe em branco se não aplicável)"/>

                      <ModalLabel htmlFor="exRestSeconds">Descanso (segundos)</ModalLabel>
                      <ModalInput type="number" name="restSeconds" id="exRestSeconds" value={currentExerciseData.restSeconds} onChange={handleExerciseFormChange} min="0" placeholder="Ex: 30 (deixe em branco se não aplicável)"/>

                      <ModalLabel htmlFor="exNotes">Notas do Exercício</ModalLabel>
                      <ModalTextarea name="notes" id="exNotes" value={currentExerciseData.notes} onChange={handleExerciseFormChange} />

                      <ModalActions>
                          <ModalButton type="button" onClick={() => setShowExerciseModal(false)} disabled={exerciseFormLoading}>Cancelar</ModalButton>
                          <ModalButton type="submit" primary disabled={exerciseFormLoading}>
                              {exerciseFormLoading ? 'A guardar...' : (isEditingExercise ? 'Guardar Alterações' : 'Adicionar Exercício')}
                          </ModalButton>
                      </ModalActions>
                  </ModalForm>
              </ModalContent>
          </ModalOverlay>
      )}
    </PageContainer>
  );
}

export default AdminManageWorkoutPlansPage;