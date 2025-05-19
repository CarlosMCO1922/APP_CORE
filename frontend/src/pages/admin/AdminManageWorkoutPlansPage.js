// src/pages/admin/AdminManageWorkoutPlansPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // Removido useNavigate se não for usado diretamente aqui
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
import { getAllTrainings } // Usado para obter nome do treino
    from '../../services/trainingService';
import { getAllExercises } from '../../services/exerciseService';

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
  div { /* Container para os botões de ação do plano */
    display: flex;
    gap: 10px;
  }
`;

const ActionButton = styled.button`
  margin-left: ${props => props.small ? '0' : '10px'}; // Ajustar margem para botões pequenos
  padding: ${props => props.small ? '6px 10px' : '8px 12px'};
  font-size: ${props => props.small ? '0.8rem' : '0.85rem'};
  border-radius: 5px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease;
  background-color: ${props => props.danger ? '#D32F2F' : (props.secondary ? '#555' : (props.primary ? '#D4AF37' : '#007bff' ))}; // Adicionado primary
  color: ${props => props.danger || props.plans ? 'white' : (props.secondary ? '#E0E0E0' : '#1A1A1A')};
  font-weight: 500;
  &:hover {
    background-color: ${props => props.danger ? '#C62828' : (props.secondary ? '#666' : (props.primary ? '#e6c358' : '#0056b3'))};
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
  border-left: 3px solid #b89b2e;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;

  .exercise-info {
    flex-grow: 1;
    p { margin: 4px 0; font-size: 0.9rem; line-height: 1.4;}
    strong { color: #E0E0E0; font-weight: 600; }
    em { color: #a0a0a0; font-size: 0.85rem; display: block; margin-top: 3px;}
  }
  .exercise-media-buttons {
    margin-top: 10px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap; /* Para quebrar em mobile se necessário */
  }
  .exercise-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
    flex-shrink: 0; /* Para não encolher */
    button { margin-left: 0; width: 100%; }
  }
  @media (min-width: 768px) { /* Ajustar breakpoint se necessário */
    .exercise-actions {
        flex-direction: row;
        align-items: center;
        button { width: auto; margin-left: 8px; }
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

  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaModalContent, setMediaModalContent] = useState({ type: '', src: '', alt: '' });

  const fetchTrainingDetails = useCallback(async () => {
    if (authState.token && trainingId) {
      try {
        const allTrainingsData = await getAllTrainings(authState.token); // Assumes this returns array with full details
        const currentTraining = allTrainingsData.find(t => t.id === parseInt(trainingId));
        if (currentTraining) {
          setTrainingName(currentTraining.name);
        } else {
          setTrainingName(`ID de Treino ${trainingId} (Nome não encontrado)`);
        }
      } catch (err) {
        console.error("Erro ao buscar nome do treino:", err);
        setTrainingName(`ID de Treino: ${trainingId}`);
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

  const fetchAllExercisesList = useCallback(async () => { // Renomeado para evitar conflito
    if (authState.token) {
      try {
        const exercisesData = await getAllExercises(authState.token);
        setAllExercises(exercisesData || []);
      } catch (err) {
        console.error("Erro ao buscar lista de exercícios base:", err);
        setError(prev => `${prev ? prev + '\n' : ''}Erro ao carregar lista de exercícios.`);
        setAllExercises([]);
      }
    }
  }, [authState.token]);

  useEffect(() => {
    fetchTrainingDetails();
    fetchWorkoutPlans();
    fetchAllExercisesList();
  }, [fetchTrainingDetails, fetchWorkoutPlans, fetchAllExercisesList]);


  const handleOpenCreatePlanModal = () => {
    setIsEditingPlan(false);
    setCurrentPlanData({ ...initialWorkoutPlanForm, order: workoutPlans.length });
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
    setCurrentExerciseData({ ...initialExercisePlanForm, order: nextOrder });
    setCurrentExercisePlanId(null);
    setExerciseModalError('');
    setShowExerciseModal(true);
  };

  const handleOpenEditExerciseModal = (exerciseInPlan) => {
    setSelectedPlanIdForExercise(exerciseInPlan.workoutPlanId);
    setIsEditingExercise(true);
    setCurrentExerciseData({
      exerciseId: exerciseInPlan.exerciseId,
      sets: exerciseInPlan.sets === null || exerciseInPlan.sets === undefined ? '' : exerciseInPlan.sets,
      reps: exerciseInPlan.reps === null || exerciseInPlan.reps === undefined ? '' : exerciseInPlan.reps,
      durationSeconds: exerciseInPlan.durationSeconds === null || exerciseInPlan.durationSeconds === undefined ? '' : exerciseInPlan.durationSeconds,
      restSeconds: exerciseInPlan.restSeconds === null || exerciseInPlan.restSeconds === undefined ? '' : exerciseInPlan.restSeconds,
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
    const processedValue = (isNumericField && value !== '' && !isNaN(value)) ? parseInt(value, 10) : (isNumericField && value === '' ? '' : value) ;
    setCurrentExerciseData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleExerciseFormSubmit = async (e) => {
    e.preventDefault();
    if (!currentExerciseData.exerciseId) {
      setExerciseModalError('Por favor, selecione um exercício.');
      return;
    }
    setExerciseFormLoading(true); setExerciseModalError(''); setError(''); setSuccessMessage('');

    const dataToSend = { ...currentExerciseData };
    ['sets', 'durationSeconds', 'restSeconds'].forEach(field => {
      if (dataToSend[field] === '' || dataToSend[field] === null || isNaN(dataToSend[field])) {
        dataToSend[field] = null;
      } else {
        dataToSend[field] = parseInt(dataToSend[field], 10);
      }
    });
    if (dataToSend.order === '' || dataToSend.order === null || isNaN(dataToSend.order)) {
      dataToSend.order = 0;
    } else {
        dataToSend.order = parseInt(dataToSend.order, 10);
    }
    if (dataToSend.exerciseId === '') dataToSend.exerciseId = null;


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

  const handleOpenMediaModal = (type, src, altText = 'Visualização do exercício') => {
    if (!src) return;
    setMediaModalContent({ type, src, alt: altText });
    setShowMediaModal(true);
  };

  const handleCloseMediaModal = () => {
    setShowMediaModal(false);
    if (mediaModalContent.type === 'video') {
      const videoElement = document.getElementById('media-modal-video');
      if (videoElement) {
        videoElement.pause();
      }
    }
    setMediaModalContent({ type: '', src: '', alt: '' });
  };


  if (loading) return <PageContainer><LoadingText>A carregar detalhes do plano de treino...</LoadingText></PageContainer>;

  return (
    <PageContainer>
      <MainTitle>Gerir Planos para o Treino</MainTitle>
      <TrainingInfo>{trainingName || `ID do Treino: ${trainingId}`}</TrainingInfo>
      <Link to="/admin/manage-trainings" style={{ color: '#D4AF37', marginBottom: '20px', display: 'inline-block', textDecoration: 'none' }}>
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
          {plan.notes && <p style={{ color: '#a0a0a0', fontStyle: 'italic', marginBottom: '15px' }}>Notas do plano: {plan.notes}</p>}

          <ActionButton
            primary
            small
            onClick={() => handleOpenAddExerciseModal(plan.id)}
            style={{ marginBottom: '15px' }} // Ajustado para ficar mais consistente
          >
            Adicionar Exercício a Este Plano
          </ActionButton>

          <ExerciseList>
            {plan.planExercises && plan.planExercises.length > 0 ? plan.planExercises.sort((a, b) => a.order - b.order).map(item => (
              <ExerciseItem key={item.id}>
                <div className="exercise-info">
                  <p><strong>{item.exerciseDetails?.name || 'Exercício Desconhecido'}</strong> (Ordem: {item.order})</p>
                  {item.exerciseDetails?.imageUrl &&
                    <div className="exercise-media-buttons">
                        <ActionButton
                            small
                            secondary
                            onClick={() => handleOpenMediaModal('image', item.exerciseDetails.imageUrl, item.exerciseDetails.name)}
                        >
                            Ver Imagem
                        </ActionButton>
                    </div>
                  }
                  {item.exerciseDetails?.videoUrl &&
                    <div className="exercise-media-buttons" style={{marginTop: item.exerciseDetails?.imageUrl ? '5px': '10px'}}>
                        <ActionButton
                            small
                            secondary
                            onClick={() => handleOpenMediaModal('video', item.exerciseDetails.videoUrl, item.exerciseDetails.name)}
                        >
                            Ver Vídeo
                        </ActionButton>
                    </div>
                  }
                  {item.sets && <p><span>Séries:</span> {item.sets}</p>}
                  {item.reps && <p><span>Reps:</span> {item.reps}</p>}
                  {item.durationSeconds ? <p><span>Duração:</span> {item.durationSeconds}s</p> : null}
                  {item.restSeconds !== null && item.restSeconds >= 0 ? <p><span>Descanso:</span> {item.restSeconds}s</p> : null}
                  {item.notes && <p><em>Notas: {item.notes}</em></p>}
                </div>
                <div className="exercise-actions">
                  <ActionButton secondary small onClick={() => handleOpenEditExerciseModal(item)}>Editar Ex.</ActionButton>
                  <ActionButton danger small onClick={() => handleDeleteExerciseFromPlan(item.id)}>Remover Ex.</ActionButton>
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
              <ModalLabel htmlFor="exerciseIdSel">Exercício*</ModalLabel>
              <ModalSelect name="exerciseId" id="exerciseIdSel" value={currentExerciseData.exerciseId} onChange={handleExerciseFormChange} required>
                <option value="">Selecione um exercício</option>
                {allExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({ex.muscleGroup || 'N/A'})</option>)}
              </ModalSelect>

              <ModalLabel htmlFor="exOrder">Ordem no Plano*</ModalLabel>
              <ModalInput type="number" name="order" id="exOrder" value={currentExerciseData.order} onChange={handleExerciseFormChange} required min="0" />

              <ModalLabel htmlFor="exSets">Séries</ModalLabel>
              <ModalInput type="number" name="sets" id="exSets" value={currentExerciseData.sets} onChange={handleExerciseFormChange} min="0" placeholder="Ex: 3 (opcional)" />

              <ModalLabel htmlFor="exReps">Repetições</ModalLabel>
              <ModalInput type="text" name="reps" id="exReps" value={currentExerciseData.reps} onChange={handleExerciseFormChange} placeholder="Ex: 10-12 ou 30s (opcional)" />

              <ModalLabel htmlFor="exDurationSeconds">Duração (segundos)</ModalLabel>
              <ModalInput type="number" name="durationSeconds" id="exDurationSeconds" value={currentExerciseData.durationSeconds} onChange={handleExerciseFormChange} min="0" placeholder="Ex: 60 (opcional)" />

              <ModalLabel htmlFor="exRestSeconds">Descanso (segundos)</ModalLabel>
              <ModalInput type="number" name="restSeconds" id="exRestSeconds" value={currentExerciseData.restSeconds} onChange={handleExerciseFormChange} min="0" placeholder="Ex: 30 (opcional)" />

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

      {/* Modal para Visualizar Imagem/Vídeo */}
      {showMediaModal && mediaModalContent.src && (
        <ModalOverlay onClick={handleCloseMediaModal} style={{ zIndex: 1060 }}>
          <ModalContent
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: mediaModalContent.type === 'image' ? '80vw' : '700px',
              width: mediaModalContent.type === 'video' ? '80vw' : 'auto',
              maxHeight: '90vh',
              padding: mediaModalContent.type === 'video' ? '20px' : '5px',
              backgroundColor: '#181818',
              display: 'flex', flexDirection: 'column', justifyContent: 'center'
            }}
          >
            <CloseButton
              onClick={handleCloseMediaModal}
              style={{ top: '10px', right: '10px', color: 'white', fontSize: '1.5rem', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '35px', height: '35px', lineHeight: '35px', textAlign: 'center', zIndex: 1061 }}
            >
              &times;
            </CloseButton>

            {mediaModalContent.type === 'image' && (
              <img
                src={mediaModalContent.src}
                alt={mediaModalContent.alt}
                style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(90vh - 40px)', margin: 'auto', borderRadius: '4px' }}
              />
            )}
            {mediaModalContent.type === 'video' && (
              <video
                id="media-modal-video"
                src={mediaModalContent.src}
                controls
                autoPlay
                style={{ display: 'block', width: '100%', maxHeight: 'calc(90vh - 70px)', borderRadius: '4px' }}
                onError={(e) => {
                  console.error("Erro ao carregar vídeo:", mediaModalContent.src, e);
                  setMediaModalContent(prev => ({ ...prev, type: 'video_error' }));
                }}
              >
                O teu navegador não suporta o elemento de vídeo. Podes tentar descarregar <a href={mediaModalContent.src} download style={{color: '#D4AF37'}}>aqui</a>.
              </video>
            )}
            {mediaModalContent.type === 'video_error' && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
                <p style={{ color: '#FF6B6B' }}>Não foi possível carregar o vídeo.</p>
                <p>URL: <a href={mediaModalContent.src} target="_blank" rel="noopener noreferrer" style={{ color: '#D4AF37' }}>{mediaModalContent.src}</a></p>
              </div>
            )}
          </ModalContent>
        </ModalOverlay>
      )}

    </PageContainer>
  );
}

export default AdminManageWorkoutPlansPage;