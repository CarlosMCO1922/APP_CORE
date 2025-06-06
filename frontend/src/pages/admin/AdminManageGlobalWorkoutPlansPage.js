// src/pages/admin/AdminManageGlobalWorkoutPlansPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import {
    adminGetAllGlobalWorkoutPlans,
    adminCreateGlobalWorkoutPlan,
    adminUpdateGlobalWorkoutPlan,
    adminDeleteGlobalWorkoutPlan,
    adminAssignPlanToTraining,
    // Funções para gerir exercícios DENTRO de um plano global
    addExerciseToGlobalPlan,
    updateExerciseInGlobalPlan,
    removeExerciseFromGlobalPlan
} from '../../services/workoutPlanService';
import { getAllExercises } from '../../services/exerciseService'; // Para popular select de exercícios
import { getAllTrainings } from '../../services/trainingService'; // Para popular select de treinos para associação
import {
    FaClipboardList, FaPlus, FaEdit, FaTrashAlt, FaLink, FaUnlink, FaListOl,
    FaArrowLeft, FaTimes, FaSave, FaImage, FaVideo, FaEye // Adicionado FaEye
} from 'react-icons/fa';
import { theme } from '../../theme';

// --- Styled Components (Adapta e reutiliza da tua app) ---
const PageContainer = styled.div`
  padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
  background-color: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
`;

const CreateButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 10px 18px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
  &:hover { background-color: #e6c358; }
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
const CloseModalButton = styled.button`
  position: absolute; top: 12px; right: 15px;
  background: transparent; border: none;
  color: #aaa; font-size: 1.8rem; cursor: pointer;
  line-height: 1; padding: 0;
  &:hover { color: #fff; }
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

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  margin-bottom: 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  &:hover {
    text-decoration: underline;
  }
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  margin-top: 20px;
  border-radius: ${({ theme }) => theme.borderRadius || '8px'};
  box-shadow: ${({ theme }) => theme.boxShadow || '0 2px 10px rgba(0,0,0,0.2)'};
  background-color: ${({ theme }) => theme.colors.cardBackground || '#252525'};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder || '#383838'};
    padding: 12px 15px;
    text-align: left;
    font-size: 0.9rem;
    vertical-align: middle;
  }
  th {
    background-color: #303030; /* Um pouco mais escuro que o cardBackground */
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }
  tbody tr:hover {
    background-color: ${({ theme }) => theme.colors.cardBackgroundHover || '#2a2a2a'};
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  margin: 0 5px;
  font-size: 1rem; // Ou o tamanho que preferires
  padding: 5px;
  transition: color 0.2s;

  &:hover {
    color: #fff; // Ou uma cor de hover do tema
  }

  &.delete {
    color: ${({ theme }) => theme.colors.error};
    &:hover {
      color: ${({ theme }) => theme.colors.error}; // Uma variação mais escura ou clara
      opacity: 0.8;
    }
  }
`;

const ExercisesInSection = styled.div` margin-top: 15px; padding-top: 15px; border-top: 1px solid #4A4A4A; `;
const ExerciseEntry = styled.div` background-color: #383838; padding: 10px; border-radius: 6px; margin-bottom:10px; display: flex; justify-content: space-between; align-items: flex-start;`;
const ExerciseFieldsGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 10px;`;

const initialPlanState = { name: '', notes: '', isVisible: false, exercises: [] };
const initialExerciseState = { exerciseId: '', order: 0, sets: '', reps: '', durationSeconds: '', restSeconds: '', notes: '' };

const AdminManageGlobalWorkoutPlansPage = () => {
  const { authState } = useAuth();
  const [plans, setPlans] = useState([]);
  const [allExercises, setAllExercises] = useState([]); // Para o select de exercícios
  const [allTrainings, setAllTrainings] = useState([]); // Para associar planos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [currentPlanData, setCurrentPlanData] = useState(initialPlanState);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [planToAssign, setPlanToAssign] = useState(null);
  const [selectedTrainingToAssign, setSelectedTrainingToAssign] = useState('');
  const [assignOrder, setAssignOrder] = useState(0);


  const fetchAllData = useCallback(async () => {
    if (!authState.token) return;
    setLoading(true);
    try {
      const [plansData, exercisesData, trainingsData] = await Promise.all([
        adminGetAllGlobalWorkoutPlans(authState.token),
        getAllExercises(authState.token), // Assumindo que admin pode ver todos para seleção
        getAllTrainings(authState.token) // Para o modal de associação
      ]);
      setPlans(plansData || []);
      setAllExercises(exercisesData || []);
      setAllTrainings(trainingsData || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleOpenCreateModal = () => {
    setIsEditingPlan(false);
    setCurrentPlanData(initialPlanState);
    setShowPlanModal(true);
    setError(''); setSuccessMessage('');
  };

  const handleOpenEditModal = (plan) => {
    setIsEditingPlan(true);
    setCurrentPlanData({
      id: plan.id,
      name: plan.name || '',
      notes: plan.notes || '',
      isVisible: plan.isVisible || false,
      exercises: plan.planExercises ? plan.planExercises.map(ex => ({ // Mapeia para o formato do estado
          id: ex.id, // ID do WorkoutPlanExercise
          exerciseId: ex.exerciseDetails.id, // ID do Exercise base
          order: ex.order,
          sets: ex.sets || '',
          reps: ex.reps || '',
          durationSeconds: ex.durationSeconds || '',
          restSeconds: ex.restSeconds || '',
          notes: ex.notes || ''
      })) : []
    });
    setShowPlanModal(true);
    setError(''); setSuccessMessage('');
  };

  const handleCloseModal = () => {
    setShowPlanModal(false);
    setCurrentPlanData(initialPlanState);
    setShowAssignModal(false);
    setPlanToAssign(null);
    setSelectedTrainingToAssign('');
  };

  const handlePlanFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentPlanData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleExerciseChangeInPlan = (index, field, value) => {
    const updatedExercises = [...currentPlanData.exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setCurrentPlanData(prev => ({ ...prev, exercises: updatedExercises }));
  };

  const handleAddExerciseToCurrentPlan = () => {
    setCurrentPlanData(prev => ({
      ...prev,
      exercises: [...prev.exercises, { ...initialExerciseState, order: prev.exercises.length }]
    }));
  };

  const handleRemoveExerciseFromCurrentPlan = (index) => {
    const updatedExercises = currentPlanData.exercises.filter((_, i) => i !== index);
    // Reajusta a ordem
    const reorderedExercises = updatedExercises.map((ex, idx) => ({ ...ex, order: idx }));
    setCurrentPlanData(prev => ({ ...prev, exercises: reorderedExercises }));
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError(''); setSuccessMessage('');

    const planPayload = {
      name: currentPlanData.name,
      notes: currentPlanData.notes,
      isVisible: currentPlanData.isVisible,
      exercises: currentPlanData.exercises.map(ex => ({ // Garante que envia apenas os campos necessários
          exerciseId: ex.exerciseId,
          order: parseInt(ex.order) || 0,
          sets: ex.sets ? parseInt(ex.sets) : null,
          reps: ex.reps || null,
          durationSeconds: ex.durationSeconds ? parseInt(ex.durationSeconds) : null,
          restSeconds: ex.restSeconds ? parseInt(ex.restSeconds) : null,
          notes: ex.notes || null,
      })),
    };

    try {
      if (isEditingPlan) {
        await adminUpdateGlobalWorkoutPlan(currentPlanData.id, planPayload, authState.token);
        setSuccessMessage('Plano de treino atualizado com sucesso!');
      } else {
        await adminCreateGlobalWorkoutPlan(planPayload, authState.token);
        setSuccessMessage('Plano de treino criado com sucesso!');
      }
      fetchAllData();
      handleCloseModal();
    } catch (err) {
      setError(err.message || 'Erro ao guardar plano de treino.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Tem a certeza que quer eliminar este plano de treino? Esta ação não pode ser desfeita.')) {
      setLoading(true); // ou um loading específico para delete
      setError(''); setSuccessMessage('');
      try {
        await adminDeleteGlobalWorkoutPlan(planId, authState.token);
        setSuccessMessage('Plano de treino eliminado com sucesso.');
        fetchAllData();
      } catch (err) {
        setError(err.message || 'Erro ao eliminar plano de treino.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenAssignModal = (plan) => {
    setPlanToAssign(plan);
    setSelectedTrainingToAssign('');
    setAssignOrder(0);
    setShowAssignModal(true);
    setError(''); setSuccessMessage('');
  };

  const handleAssignPlanSubmit = async (e) => {
    e.preventDefault();
    if (!planToAssign || !selectedTrainingToAssign) {
      setError("Selecione um treino para associar o plano.");
      return;
    }
    setFormLoading(true); setError(''); setSuccessMessage('');
    try {
      await adminAssignPlanToTraining(planToAssign.id, selectedTrainingToAssign, parseInt(assignOrder) || 0, authState.token);
      setSuccessMessage(`Plano "${planToAssign.name}" associado ao treino ID ${selectedTrainingToAssign} com sucesso!`);
      // Não precisa de fetchAllData() aqui, pois a lista de planos globais não muda.
      handleCloseModal();
    } catch (err) {
      setError(err.message || 'Erro ao associar plano ao treino.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading && plans.length === 0) return <PageContainer><p>A carregar planos de treino...</p></PageContainer>;

  return (
    <PageContainer>
      <BackLink to="/admin/dashboard"><FaArrowLeft /> Voltar ao Painel Admin</BackLink>
      <HeaderContainer>
        <Title><FaClipboardList /> Gestão de Planos de Treino Modelo</Title>
        <CreateButton onClick={handleOpenCreateModal}><FaPlus /> Criar Novo Plano</CreateButton>
      </HeaderContainer>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

      {plans.length > 0 ? (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Nº Exercícios</th>
                <th>Visível?</th>
                <th>Notas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id}>
                  <td>{plan.name}</td>
                  <td>{plan.planExercises?.length || 0}</td>
                  <td>{plan.isVisible ? 'Sim' : 'Não'}</td>
                  <td>{plan.notes?.substring(0, 50) || '-'}{plan.notes && plan.notes.length > 50 ? '...' : ''}</td>
                  <td>
                    <ActionButton title="Editar Plano" onClick={() => handleOpenEditModal(plan)}><FaEdit /></ActionButton>
                    <ActionButton title="Gerir Exercícios do Plano" onClick={() => handleOpenEditModal(plan)}><FaListOl /></ActionButton> {/* Reutiliza o modal de edição para gerir exercícios */}
                    <ActionButton title="Associar a Treino" onClick={() => handleOpenAssignModal(plan)}><FaLink /></ActionButton>
                    <ActionButton title="Eliminar Plano" className="delete" onClick={() => handleDeletePlan(plan.id)}><FaTrashAlt /></ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      ) : (
        !loading && <p>Nenhum plano de treino modelo encontrado. Crie um novo!</p>
      )}

      {/* Modal para Criar/Editar Plano de Treino e seus Exercícios */}
      {showPlanModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent large onClick={(e) => e.stopPropagation()}>
            <CloseModalButton onClick={handleCloseModal}><FaTimes /></CloseModalButton>
            <ModalTitle>{isEditingPlan ? 'Editar Plano de Treino Modelo' : 'Criar Novo Plano de Treino Modelo'}</ModalTitle>
            {error && <p style={{color: 'red'}}>{error}</p>}
            <ModalForm onSubmit={handleSavePlan}>
              <ModalLabel htmlFor="planName">Nome do Plano*</ModalLabel>
              <ModalInput type="text" name="name" id="planName" value={currentPlanData.name} onChange={handlePlanFormChange} required />
              <ModalLabel htmlFor="planNotes">Notas do Plano</ModalLabel>
              <ModalTextarea name="notes" id="planNotes" value={currentPlanData.notes} onChange={handlePlanFormChange} />
              <ModalCheckboxContainer>
                <ModalCheckbox
                  type="checkbox"
                  name="isVisible"
                  id="planIsVisible"
                  checked={currentPlanData.isVisible || false}
                  onChange={(e) => setCurrentPlanData(prev => ({ ...prev, isVisible: e.target.checked }))}
                />
                <ModalLabel htmlFor="planIsVisible" style={{ marginBottom: 0, cursor: 'pointer' }}>
                  Visível para Clientes na Biblioteca de Planos
                </ModalLabel>
              </ModalCheckboxContainer>
              <ExercisesInSection>
                <h4 style={{color: theme.colors.primary, marginBottom: '10px'}}>Exercícios do Plano:</h4>
                {currentPlanData.exercises.map((ex, index) => (
                  <ExerciseEntry key={index}>
                    <div style={{flexGrow: 1, marginRight: '10px'}}>
                      <ExerciseFieldsGrid>
                        <div>
                          <ModalLabel htmlFor={`exOrder-${index}`}>Ordem*</ModalLabel>
                          <ModalInput type="number" id={`exOrder-${index}`} value={ex.order} onChange={(e) => handleExerciseChangeInPlan(index, 'order', e.target.value)} required />
                        </div>
                        <div style={{gridColumn: 'span 2'}}>
                          <ModalLabel htmlFor={`exId-${index}`}>Exercício*</ModalLabel>
                          <ModalSelect id={`exId-${index}`} value={ex.exerciseId} onChange={(e) => handleExerciseChangeInPlan(index, 'exerciseId', e.target.value)} required>
                            <option value="">Selecione um exercício</option>
                            {allExercises.map(baseEx => <option key={baseEx.id} value={baseEx.id}>{baseEx.name}</option>)}
                          </ModalSelect>
                        </div>
                      </ExerciseFieldsGrid>
                      <ExerciseFieldsGrid>
                        <div><ModalLabel htmlFor={`exSets-${index}`}>Séries</ModalLabel><ModalInput type="number" id={`exSets-${index}`} value={ex.sets} onChange={(e) => handleExerciseChangeInPlan(index, 'sets', e.target.value)} /></div>
                        <div><ModalLabel htmlFor={`exReps-${index}`}>Reps</ModalLabel><ModalInput type="text" id={`exReps-${index}`} value={ex.reps} onChange={(e) => handleExerciseChangeInPlan(index, 'reps', e.target.value)} /></div>
                        <div><ModalLabel htmlFor={`exDuration-${index}`}>Duração (s)</ModalLabel><ModalInput type="number" id={`exDuration-${index}`} value={ex.durationSeconds} onChange={(e) => handleExerciseChangeInPlan(index, 'durationSeconds', e.target.value)} /></div>
                        <div><ModalLabel htmlFor={`exRest-${index}`}>Descanso (s)</ModalLabel><ModalInput type="number" id={`exRest-${index}`} value={ex.restSeconds} onChange={(e) => handleExerciseChangeInPlan(index, 'restSeconds', e.target.value)} /></div>
                      </ExerciseFieldsGrid>
                      <div>
                        <ModalLabel htmlFor={`exNotes-${index}`}>Notas do Exercício</ModalLabel>
                        <ModalTextarea id={`exNotes-${index}`} value={ex.notes} onChange={(e) => handleExerciseChangeInPlan(index, 'notes', e.target.value)} style={{minHeight: '50px'}} />
                      </div>
                    </div>
                    <ActionButton title="Remover Exercício" className="delete" type="button" onClick={() => handleRemoveExerciseFromCurrentPlan(index)}><FaTrashAlt /></ActionButton>
                  </ExerciseEntry>
                ))}
                <ModalButton type="button" onClick={handleAddExerciseToCurrentPlan} style={{marginTop: '10px', backgroundColor: theme.colors.buttonSecondaryBg, color: theme.colors.textMain}}>
                  <FaPlus /> Adicionar Exercício ao Plano
                </ModalButton>
              </ExercisesInSection>

              <ModalActions>
                <ModalButton type="button" secondary onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}><FaSave /> {formLoading ? 'A guardar...' : 'Guardar Plano Modelo'}</ModalButton>
              </ModalActions>
            </ModalForm>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal para Associar Plano a Treino */}
      {showAssignModal && planToAssign && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseModalButton onClick={handleCloseModal}><FaTimes /></CloseModalButton>
            <ModalTitle>Associar "{planToAssign.name}" a um Treino</ModalTitle>
            {error && <p style={{color: 'red'}}>{error}</p>}
            <ModalForm onSubmit={handleAssignPlanSubmit}>
              <ModalLabel htmlFor="assignTrainingId">Selecione o Treino*</ModalLabel>
              <ModalSelect id="assignTrainingId" value={selectedTrainingToAssign} onChange={(e) => setSelectedTrainingToAssign(e.target.value)} required>
                <option value="">Escolha um treino...</option>
                {allTrainings.map(training => (
                  <option key={training.id} value={training.id}>{training.name} (Data: {new Date(training.date).toLocaleDateString('pt-PT')})</option>
                ))}
              </ModalSelect>
              <ModalLabel htmlFor="assignOrder">Ordem do Plano neste Treino (0 para primeiro)</ModalLabel>
              <ModalInput type="number" id="assignOrder" value={assignOrder} onChange={(e) => setAssignOrder(e.target.value)} min="0" />
              <ModalActions>
                <ModalButton type="button" secondary onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}><FaLink /> {formLoading ? 'A associar...' : 'Associar Plano'}</ModalButton>
              </ModalActions>
            </ModalForm>
          </ModalContent>
        </ModalOverlay>
      )}

    </PageContainer>
  );
};

export default AdminManageGlobalWorkoutPlansPage;