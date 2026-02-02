// src/pages/admin/AdminManageWorkoutPlansPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import BackArrow from '../../components/BackArrow';
import { useAuth } from '../../context/AuthContext';
import {
    getWorkoutPlansByTrainingId,
    adminGetAllGlobalWorkoutPlans,
    adminAssignPlanToTraining,
    adminRemovePlanFromTraining,
} from '../../services/workoutPlanService';
import { getAllTrainings } from '../../services/trainingService';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import { sortPlanExercises } from '../../utils/exerciseOrderUtils';

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 20px 40px;
  font-family: ${({ theme }) => theme.fonts.main};
`;

const MainTitle = styled.h1`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 5px;
`;

const TrainingInfo = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 20px;
`;


const LoadingText = styled.p` font-size: 1.1rem; text-align: center; padding: 20px; color: ${({ theme }) => theme.colors.primary};`;
const ErrorText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: ${({ theme }) => theme.colors.error}; background-color: ${({ theme }) => theme.colors.errorBg}; border: 1px solid ${({ theme }) => theme.colors.error}; border-radius: 8px; margin: 15px auto; max-width: 700px;`;
const MessageText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: ${({ theme }) => theme.colors.success}; background-color: ${({ theme }) => theme.colors.successBg}; border: 1px solid ${({ theme }) => theme.colors.success}; border-radius: 8px; margin: 15px auto; max-width: 700px;`;

const PlanSection = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: ${({ theme }) => theme.boxShadow};
`;

const PlanHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  h2 {
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.5rem;
    margin: 0;
  }
  div { /* Container para os botões de ação do plano */
    display: flex;
    gap: 10px;
  }
`;

const ActionButton = styled.button`
  margin-left: ${props => props.small || props.noMarginLeft ? '0' : '10px'};
  padding: ${props => props.small ? '6px 10px' : '8px 12px'};
  font-size: ${props => props.small ? '0.8rem' : '0.85rem'};
  border-radius: 5px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease;
  background-color: ${props => props.danger ? props.theme.colors.error : (props.secondary ? props.theme.colors.buttonSecondaryBg : props.theme.colors.primary)};
  color: ${props => props.danger ? 'white' : (props.secondary ? props.theme.colors.textMain : props.theme.colors.textDark)};
  font-weight: 500;
  &:hover {
    background-color: ${props => props.danger ? props.theme.colors.error : (props.secondary ? props.theme.colors.buttonSecondaryHoverBg : props.theme.colors.primaryHover)};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.disabledBg};
    color: ${({ theme }) => theme.colors.disabledText};
    cursor: not-allowed;
  }
`;

const CreateButtonStyled = styled.button`
  background-color: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.textDark}; padding: 10px 20px;
  border-radius: 8px; font-weight: bold; border: none; cursor: pointer;
  transition: background-color 0.2s ease; margin-bottom: 20px;
  font-size: 0.95rem;
  &:hover { background-color: ${({ theme }) => theme.colors.primaryHover}; }
`;

const ExerciseList = styled.ul`
  list-style: none;
  padding-left: 0;
  margin-top: 15px;
`;

const NotesText = styled.p` color: ${({ theme }) => theme.colors.textMuted}; font-style: italic; margin-bottom: 15px;`;

const ExerciseItem = styled.li`
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker};
  padding: 12px 15px;
  border-radius: 6px;
  margin-bottom: 10px;
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;

  .exercise-info {
    flex-grow: 1;
    p { margin: 4px 0; font-size: 0.9rem; line-height: 1.4;}
    strong { color: ${({ theme }) => theme.colors.textMain}; font-weight: 600; }
    em { color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.85rem; display: block; margin-top: 3px;}
  }
  .exercise-media-buttons {
    margin-top: 8px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .exercise-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
    flex-shrink: 0;
    button { margin-left: 0; width: 100%; }
  }
  @media (min-width: 768px) {
    .exercise-actions {
        flex-direction: row;
        align-items: center;
        button { width: auto; margin-left: 8px; }
    }
  }
`;

const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: ${({ theme }) => theme.colors.overlayBg}; display: flex; justify-content: center; align-items: center; z-index: 1050; padding: 20px;`;
const ModalContent = styled.div` background-color: ${({ theme }) => theme.colors.cardBackgroundDarker}; padding: 25px 35px; border-radius: 10px; width: 100%; max-width: 600px; box-shadow: 0 8px 25px rgba(0,0,0,0.5); position: relative; max-height: 90vh; overflow-y: auto; `;
const ModalTitle = styled.h2` color: ${({ theme }) => theme.colors.primary}; margin-top: 0; margin-bottom: 20px; font-size: 1.5rem; text-align: center;`;
const ModalForm = styled.form` display: flex; flex-direction: column; gap: 12px; `;
const ModalLabel = styled.label` font-size: 0.9rem; color: ${({ theme }) => theme.colors.textMuted}; margin-bottom: 3px; display: block; font-weight: 500;`;
const ModalInput = styled.input` padding: 10px 12px; background-color: ${({ theme }) => theme.colors.inputBg}; border: 1px solid ${({ theme }) => theme.colors.inputBorder}; border-radius: 6px; color: ${({ theme }) => theme.colors.inputText}; font-size: 0.95rem; width: 100%; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing}; } `;
const ModalTextarea = styled.textarea` padding: 10px 12px; background-color: ${({ theme }) => theme.colors.inputBg}; border: 1px solid ${({ theme }) => theme.colors.inputBorder}; border-radius: 6px; color: ${({ theme }) => theme.colors.inputText}; font-size: 0.95rem; width: 100%; min-height: 70px; resize: vertical; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing}; } `;
const ModalSelect = styled.select` padding: 10px 12px; background-color: ${({ theme }) => theme.colors.inputBg}; border: 1px solid ${({ theme }) => theme.colors.inputBorder}; border-radius: 6px; color: ${({ theme }) => theme.colors.inputText}; font-size: 0.95rem; width: 100%; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing}; } `;
const ModalActions = styled.div` display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; `;
const ModalButton = styled.button`
  padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer;
  font-weight: 500; transition: background-color 0.2s ease;
  background-color: ${props => props.primary ? props.theme.colors.primary : props.theme.colors.buttonSecondaryBg};
  color: ${props => props.primary ? props.theme.colors.textDark : props.theme.colors.textMain};
  &:hover { background-color: ${props => props.primary ? props.theme.colors.primaryHover : props.theme.colors.buttonSecondaryHoverBg}; }
  &:disabled { background-color: ${({ theme }) => theme.colors.disabledBg}; color: ${({ theme }) => theme.colors.disabledText}; cursor: not-allowed; }
`;
const CloseButton = styled.button`
  position: absolute; top: 12px; right: 15px;
  background: transparent; border: none;
  color: ${({ theme }) => theme.colors.textMuted}; font-size: 1.8rem; cursor: pointer;
  line-height: 1; padding: 0;
  &:hover { color: ${({ theme }) => theme.colors.textMain}; }
`;

const ModalCheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 10px; // Ajusta conforme necessário
  margin-bottom: 15px; // Ajusta conforme necessário
  gap: 8px;
`;

const ModalCheckbox = styled.input`
  width: auto;
  height: auto;
  accent-color: ${({ theme }) => theme.colors.primary};
  transform: scale(1.3); // Opcional, para o tornar mais visível
  cursor: pointer;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary}80;
    outline-offset: 2px;
  }
`;

const NoItemsText = styled.p` font-size: 0.95rem; color: ${({ theme }) => theme.colors.textMuted}; text-align: center; padding: 15px 0; font-style: italic; `;

function AdminManageWorkoutPlansPage() {
  const { trainingId } = useParams();
  const { authState } = useAuth();

  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [trainingName, setTrainingName] = useState('');

  const [showDeletePlanConfirmModal, setShowDeletePlanConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showSelectPlanModal, setShowSelectPlanModal] = useState(false);
  const [globalPlans, setGlobalPlans] = useState([]);
  const [loadingGlobalPlans, setLoadingGlobalPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [assigningPlan, setAssigningPlan] = useState(false);
  const [selectPlanModalError, setSelectPlanModalError] = useState('');

  const fetchTrainingDetails = useCallback(async () => {
    if (authState.token && trainingId) {
      try {
        const allTrainingsData = await getAllTrainings(authState.token);
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

  useEffect(() => {
    fetchTrainingDetails();
    fetchWorkoutPlans();
  }, [fetchTrainingDetails, fetchWorkoutPlans]);

  const handleOpenCreatePlanModal = async () => {
    // Abrir modal de seleção de planos
    setShowSelectPlanModal(true);
    setSelectedPlanId('');
    setError(''); // Limpar erros da página
    setSelectPlanModalError(''); // Limpar erros do modal
    setLoadingGlobalPlans(true);
    try {
      const plans = await adminGetAllGlobalWorkoutPlans(authState.token);
      setGlobalPlans(plans || []);
    } catch (err) {
      console.error('Erro ao carregar planos globais:', err);
      setSelectPlanModalError(err.message || 'Erro ao carregar planos globais.');
      setGlobalPlans([]);
    } finally {
      setLoadingGlobalPlans(false);
    }
  };

  const handleCloseSelectPlanModal = () => {
    setShowSelectPlanModal(false);
    setSelectedPlanId('');
    setSelectPlanModalError(''); // Limpar erros do modal ao fechar
  };

  const handleSelectExistingPlan = async () => {
    if (!selectedPlanId) {
      setSelectPlanModalError('Por favor, selecione um plano.');
      return;
    }
    setAssigningPlan(true);
    setSelectPlanModalError('');
    setError('');
    setSuccessMessage('');
    try {
      await adminAssignPlanToTraining(selectedPlanId, trainingId, workoutPlans.length, authState.token);
      setSuccessMessage('Plano associado ao treino com sucesso!');
      handleCloseSelectPlanModal();
      fetchWorkoutPlans();
    } catch (err) {
      console.error('Erro ao associar plano ao treino:', err);
      setSelectPlanModalError(err.message || 'Erro ao associar plano ao treino.');
    } finally {
      setAssigningPlan(false);
    }
  };

  const handleDeletePlan = (planIdToDelete) => {
    setItemToDelete({ type: 'plan', id: planIdToDelete });
    setShowDeletePlanConfirmModal(true);
  };

  const handleDeletePlanConfirm = async () => {
    if (!itemToDelete || itemToDelete.type !== 'plan') return;
    setDeleteLoading(true);
    setError(''); 
    setSuccessMessage('');
    setShowDeletePlanConfirmModal(false);
    try {
      await adminRemovePlanFromTraining(itemToDelete.id, trainingId, authState.token);
      setSuccessMessage('Plano removido do treino.');
      setItemToDelete(null);
      fetchWorkoutPlans();
    } catch (err) {
      setError(err.message || 'Erro ao remover plano do treino.');
      setItemToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  /** Ordena planos por orderInTraining (vindo da API) */
  const sortedPlans = [...workoutPlans].sort((a, b) => {
    const orderA = a.orderInTraining != null ? a.orderInTraining : 0;
    const orderB = b.orderInTraining != null ? b.orderInTraining : 0;
    return orderA - orderB;
  });

  if (loading) return <PageContainer><LoadingText>A carregar detalhes do plano de treino...</LoadingText></PageContainer>;

  return (
    <PageContainer>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackArrow to="/admin/manage-trainings" />
        <MainTitle>Planos de treino</MainTitle>
      </div>
      <TrainingInfo>{trainingName || `ID do Treino: ${trainingId}`}</TrainingInfo>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

      <CreateButtonStyled onClick={handleOpenCreatePlanModal}>Adicionar Novo Plano de Treino</CreateButtonStyled>

      {sortedPlans.length > 0 ? sortedPlans.map(plan => (
        <PlanSection key={plan.id}>
          <PlanHeader>
            <h2>{plan.name}</h2>
            <div>
              <ActionButton
                as={Link}
                to="/admin/global-workout-plans"
                secondary
                style={{ textDecoration: 'none' }}
              >
                Editar plano modelo
              </ActionButton>
              <ActionButton danger onClick={() => handleDeletePlan(plan.id)}>
                Remover do treino
              </ActionButton>
            </div>
          </PlanHeader>
          {plan.notes && <NotesText>Notas do plano: {plan.notes}</NotesText>}

          <ExerciseList>
            {plan.planExercises && plan.planExercises.length > 0 ? sortPlanExercises(plan.planExercises).map((item) => (
              <ExerciseItem key={item.id}>
                <div className="exercise-info">
                  <p><strong>{item.exerciseDetails?.name || 'Exercício Desconhecido'}</strong></p>
                  {item.sets !== null && item.sets !== undefined && <p><span>Séries:</span> {item.sets}</p>}
                  {item.reps && <p><span>Reps:</span> {item.reps}</p>}
                  {item.durationSeconds != null && item.durationSeconds !== undefined && <p><span>Duração:</span> {item.durationSeconds}s</p>}
                  {item.restSeconds != null && item.restSeconds >= 0 && <p><span>Descanso:</span> {item.restSeconds}s</p>}
                  {item.notes && <p><em>Notas: {item.notes}</em></p>}
                </div>
              </ExerciseItem>
            )) : <NoItemsText>Nenhum exercício neste plano.</NoItemsText>}
          </ExerciseList>
        </PlanSection>
      )) : (
        <NoItemsText>Nenhum plano de treino definido para este treino. Crie um!</NoItemsText>
      )}

      {/* Modal para Selecionar Plano Existente ou Criar Novo */}
      {showSelectPlanModal && (
        <ModalOverlay onClick={handleCloseSelectPlanModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <CloseButton onClick={handleCloseSelectPlanModal}>&times;</CloseButton>
            <ModalTitle>Adicionar Plano de Treino</ModalTitle>
            {selectPlanModalError && <ErrorText>{selectPlanModalError}</ErrorText>}
            
            {loadingGlobalPlans ? (
              <LoadingText>A carregar planos disponíveis...</LoadingText>
            ) : (
              <>
                <ModalLabel htmlFor="selectPlan">Selecionar Plano Existente</ModalLabel>
                {globalPlans.length > 0 ? (
                  <>
                    <ModalSelect
                      id="selectPlan"
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                    >
                      <option value="">-- Selecione um plano --</option>
                      {globalPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} {plan.notes ? `(${plan.notes})` : ''}
                        </option>
                      ))}
                    </ModalSelect>
                    <ModalActions>
                      <ModalButton 
                        type="button" 
                        onClick={handleSelectExistingPlan} 
                        primary 
                        disabled={!selectedPlanId || assigningPlan}
                      >
                        {assigningPlan ? 'A associar...' : 'Associar Plano ao Treino'}
                      </ModalButton>
                    </ModalActions>
                  </>
                ) : (
                  <NoItemsText>Nenhum plano modelo disponível. Crie planos em &quot;Planos de Treino Modelo&quot;.</NoItemsText>
                )}
              </>
            )}
            
            <ModalActions style={{ marginTop: '20px' }}>
              <ModalButton type="button" onClick={handleCloseSelectPlanModal}>Cancelar</ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      <ConfirmationModal
        isOpen={showDeletePlanConfirmModal}
        onClose={() => {
          if (!deleteLoading) {
            setShowDeletePlanConfirmModal(false);
            setItemToDelete(null);
          }
        }}
        onConfirm={handleDeletePlanConfirm}
        title="Remover plano do treino"
        message="Este plano deixa de estar associado a este treino. O plano modelo continua disponível em Planos de Treino Modelo."
        confirmText="Remover"
        cancelText="Cancelar"
        danger={true}
        loading={deleteLoading}
      />
    </PageContainer>
  );
}

export default AdminManageWorkoutPlansPage;