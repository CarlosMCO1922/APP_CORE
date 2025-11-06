// src/pages/admin/AdminManageGlobalWorkoutPlansPage.js
import React, { useEffect, useState, useCallback, useMemo} from 'react';
import { Link } from 'react-router-dom';
import BackArrow from '../../components/BackArrow';
import styled, { useTheme, css } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import {
    adminGetAllGlobalWorkoutPlans,
    adminCreateGlobalWorkoutPlan,
    adminUpdateGlobalWorkoutPlan,
    adminDeleteGlobalWorkoutPlan,
    adminAssignPlanToTraining,
    addExerciseToGlobalPlan,
    updateExerciseInGlobalPlan,
    removeExerciseFromGlobalPlan
} from '../../services/workoutPlanService';
import { getAllExercises } from '../../services/exerciseService'; 
import { getAllTrainings } from '../../services/trainingService'; 
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    FaClipboardList, FaPlus, FaEdit, FaTrashAlt, FaLink, FaUnlink, FaListOl,
    FaArrowLeft, FaTimes, FaSave, FaLayerGroup, FaPlusCircle, FaImage, FaVideo, FaEye, FaGripVertical 
} from 'react-icons/fa';



// --- Styled Components ---
const PageContainer = styled.div`
  padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
  background-color: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
`;

const MessageBaseStyles = css`
  text-align: center;
  padding: 12px;
  margin: 15px 0;
  border-radius: 8px;
  border-width: 1px;
  border-style: solid;
  font-size: 1rem;
  font-weight: 500;
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
  &:hover { background-color: ${({ theme }) => theme.colors.primaryHover}; }
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
const CloseModalButton = styled.button`
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
    background-color: ${({ theme }) => theme.colors.tableHeaderBg}; /* Um pouco mais escuro que o cardBackground */
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }
  tbody tr:hover {
    background-color: ${({ theme }) => theme.colors.hoverRowBg};
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
    color: ${({ theme }) => theme.colors.textMain}; // Ou uma cor de hover do tema
  }

  &.delete {
    color: ${({ theme }) => theme.colors.error};
    &:hover {
      color: ${({ theme }) => theme.colors.error}; // Uma variação mais escura ou clara
      opacity: 0.8;
    }
  }
`;

const ExercisesInSection = styled.div` margin-top: 15px; padding-top: 15px; border-top: 1px solid ${({ theme }) => theme.colors.cardBorder}; `;

const PlanEditorContainer = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const SupersetGroupContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border: 1px dashed ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
`;

const SupersetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  h4 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primary};
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const ExerciseEntry = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker};
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
`;

const ExerciseFieldsGrid = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr; /* Ordem | Exercício */
  gap: 15px;
  margin-bottom: 10px;

  @media (min-width: 600px) {
    grid-template-columns: 80px 1fr 1fr 1fr 1fr; /* Ordem | Exercício | Séries | Reps | Descanso */
  }
`;

const ErrorText = styled.p`
    ${MessageBaseStyles}
    color: ${({ theme }) => theme.colors.error};
    background-color: ${({ theme }) => theme.colors.errorBg};
    border-color: ${({ theme }) => theme.colors.error};
`;

const MessageText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.success};
  background-color: ${({ theme }) => theme.colors.successBg};
  border-color: ${({ theme }) => theme.colors.success};
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 10px;
  color: ${({ theme }) => theme.colors.disabledText};
  cursor: grab;
  &:active { cursor: grabbing; }
`;

const initialPlanState = { name: '', notes: '', isVisible: false, exercises: [] };
const initialExerciseState = { exerciseId: '', order: 0, sets: '', reps: '', durationSeconds: '', restSeconds: '', notes: '' };

const AdminManageGlobalWorkoutPlansPage = () => {
  const theme = useTheme();
  const { authState } = useAuth();
  const [plans, setPlans] = useState([]);
  const [allExercises, setAllExercises] = useState([]); 
  const [allTrainings, setAllTrainings] = useState([]); 
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
        getAllExercises(authState.token), 
        getAllTrainings(authState.token)
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
        exercises: plan.planExercises ? plan.planExercises.map(ex => ({
            id: ex.id,
            exerciseId: ex.exerciseDetails.id,
            order: ex.order,
            supersetGroup: ex.supersetGroup, 
            sets: ex.sets || '',
            reps: ex.reps || '',
            restSeconds: ex.restSeconds || '',
            notes: ex.notes || ''
        })) : []
    });
    setShowPlanModal(true);
    setError('');
    setSuccessMessage('');
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

  const handleExerciseChangeInPlan = (originalIndex, field, value) => {
    const updatedExercises = [...currentPlanData.exercises];
    updatedExercises[originalIndex] = { ...updatedExercises[originalIndex], [field]: value };
    setCurrentPlanData(prev => ({ ...prev, exercises: updatedExercises }));
  };

  const handleAddExerciseToCurrentPlan = () => {
    setCurrentPlanData(prev => ({
      ...prev,
      exercises: [...prev.exercises, { ...initialExerciseState, order: prev.exercises.length }]
    }));
  };

  const handleAddExerciseToGroup = (supersetGroup) => {
    // A lista de exercícios existente
    const currentExercises = currentPlanData.exercises;
    
    // Filtra os exercícios que pertencem a este grupo para saber a ordem interna
    const exercisesInGroup = currentExercises.filter(ex => ex.supersetGroup === supersetGroup);
    const nextInternalOrder = exercisesInGroup.length;
    
    // O 'order' do bloco é a ordem do primeiro exercício do grupo
    const blockOrder = (exercisesInGroup.length > 0) ? exercisesInGroup[0].order : (planExercisesGrouped.length);

    const newExercise = {
      // Usar um ID temporário robusto com base no tempo e um número aleatório
      tempId: `new_${Date.now()}_${Math.random()}`, 
      exerciseId: '',
      // Atribui o 'order' do bloco
      order: blockOrder,
      // Ordem interna dentro da superset
      internalOrder: nextInternalOrder, 
      supersetGroup: supersetGroup,
      sets: '', 
      reps: '', 
      restSeconds: '', 
      notes: ''
    };
        
    setCurrentPlanData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
  };

  const handleAddSupersetGroup = () => {
    const nextBlockOrder = planExercisesGrouped.length;
    // O ID da superset deve ser único. Usar o tempo é uma boa forma.
    const newSupersetId = Date.now(); 

    setCurrentPlanData(prev => ({
        ...prev,
        exercises: [...prev.exercises, {
            tempId: `new_${Date.now()}_${Math.random()}`,
            exerciseId: '',
            order: nextBlockOrder, // A ordem do novo bloco
            internalOrder: 0,
            supersetGroup: newSupersetId, // ID único para a nova superset
            sets: '', reps: '', restSeconds: '', notes: ''
        }]
    }));
  };
  
    const handleRemoveExerciseFromCurrentPlan = (originalIndex) => {
      const exerciseToRemove = currentPlanData.exercises[originalIndex];
      let updatedExercises = currentPlanData.exercises.filter((_, i) => i !== originalIndex);
      const remainingInGroup = updatedExercises.filter(ex => ex.supersetGroup === exerciseToRemove.supersetGroup);
      remainingInGroup.sort((a, b) => a.order - b.order);
      remainingInGroup.forEach((ex, index) => {
          ex.order = index;
      });
      setCurrentPlanData(prev => ({ ...prev, exercises: updatedExercises }));
    };
  
    const handleRemoveSupersetGroup = (supersetGroup) => {
      if (!window.confirm("Tem a certeza que quer eliminar este bloco e todos os seus exercícios?")) return;
      let remainingExercises = currentPlanData.exercises.filter(ex => ex.supersetGroup !== supersetGroup);
      
      const remappedGroups = {};
      let nextGroupIndex = 0;
      remainingExercises.sort((a, b) => a.supersetGroup - b.supersetGroup).forEach(ex => {
          if (remappedGroups[ex.supersetGroup] === undefined) {
              remappedGroups[ex.supersetGroup] = nextGroupIndex++;
          }
          ex.supersetGroup = remappedGroups[ex.supersetGroup];
      });
      setCurrentPlanData(prev => ({ ...prev, exercises: remainingExercises }));
    };

  const planExercisesGrouped = useMemo(() => {
        if (!currentPlanData.exercises) return [];
        const groups = new Map();
        const sortedExercises = [...currentPlanData.exercises].sort((a, b) => {
            if (a.supersetGroup !== b.supersetGroup) {
                return a.supersetGroup - b.supersetGroup;
            }
            return a.order - b.order;
        });
        sortedExercises.forEach((ex, index) => {
          const group = ex.supersetGroup;
          if (!groups.has(group)) {
            groups.set(group, []);
          }
        groups.get(group).push({ ...ex, originalIndex: index });
      });
        
    return Array.from(groups.values());
  }, [currentPlanData.exercises]);

  const handleOnDragEnd = (result) => {
        const { source, destination, type } = result;
        if (!destination) return;

        let newExercises = Array.from(currentPlanData.exercises);

        if (type === 'GROUP') { // Arrastar um Bloco
            const reorderedGroups = [...planExercisesGrouped];
            const [movedGroup] = reorderedGroups.splice(source.index, 1);
            reorderedGroups.splice(destination.index, 0, movedGroup);

            const flattenedAndReordered = reorderedGroups.flat();
            const finalExercises = [];
            const groupMapping = {};
            let currentGroupIndex = 0;
            
            flattenedAndReordered.forEach(ex => {
                const originalExercise = newExercises.find(e => (e.id || e.tempId) === (ex.id || ex.tempId));
                if (groupMapping[ex.supersetGroup] === undefined) {
                    groupMapping[ex.supersetGroup] = currentGroupIndex++;
                }
                finalExercises.push({ ...originalExercise, supersetGroup: groupMapping[ex.supersetGroup] });
            });

            setCurrentPlanData(prev => ({ ...prev, exercises: finalExercises }));
            return;
        }

        if (type === 'EXERCISE') { 
            const sourceGroupIndex = parseInt(source.droppableId.replace('block-', ''));
            const destGroupIndex = parseInt(destination.droppableId.replace('block-', ''));
            
            const sourceGroup = planExercisesGrouped[sourceGroupIndex];
            const exerciseToMove = sourceGroup.find((_, index) => index === source.index);
            
          
            newExercises.splice(exerciseToMove.originalIndex, 1);

           
            const updatedExercise = { ...exerciseToMove, supersetGroup: planExercisesGrouped[destGroupIndex][0].supersetGroup };
            
            
            const groupToInsertInto = planExercisesGrouped[destGroupIndex];
            let targetIndex;
            if (destination.index >= groupToInsertInto.length) {
                const lastExercise = groupToInsertInto[groupToInsertInto.length - 1];
                targetIndex = lastExercise ? newExercises.findIndex(ex => (ex.id || ex.tempId) === (lastExercise.id || lastExercise.tempId)) + 1 : newExercises.length;
            } else {
                const siblingExercise = groupToInsertInto[destination.index];
                targetIndex = newExercises.findIndex(ex => (ex.id || ex.tempId) === (siblingExercise.id || siblingExercise.tempId));
            }
            newExercises.splice(targetIndex, 0, updatedExercise);

            const finalGrouped = {};
            newExercises.forEach(ex => {
                if(!finalGrouped[ex.supersetGroup]) finalGrouped[ex.supersetGroup] = [];
                finalGrouped[ex.supersetGroup].push(ex);
            });
            const finalReorderedExercises = Object.values(finalGrouped).flat().map((ex, index) => {
                const group = finalGrouped[ex.supersetGroup];
                ex.order = group.findIndex(gEx => (gEx.id || gEx.tempId) === (ex.id || ex.tempId));
                return ex;
            });

            setCurrentPlanData(prev => ({...prev, exercises: finalReorderedExercises}));
        }
    };


  const handleSavePlan = async (e) => {
        e.preventDefault();
        setFormLoading(true); setError(''); setSuccessMessage('');

        const planPayload = {
            name: currentPlanData.name,
            notes: currentPlanData.notes,
            isVisible: currentPlanData.isVisible,
            exercises: currentPlanData.exercises.map(ex => ({
                id: isNaN(parseInt(ex.id)) ? null : ex.id, 
                exerciseId: parseInt(ex.exerciseId),
                order: parseInt(ex.order) || 0,
                supersetGroup: parseInt(ex.supersetGroup) || 0,
                sets: ex.sets ? parseInt(ex.sets) : null,
                reps: ex.reps || null,
                restSeconds: ex.restSeconds ? parseInt(ex.restSeconds) : null,
                notes: ex.notes || null,
            })).filter(ex => ex.exerciseId), 
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
      setLoading(true); 
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
      <HeaderContainer>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackArrow to="/admin/dashboard" />
          <Title><FaClipboardList /> Gestão de Planos de Treino Modelo</Title>
        </div>
        <CreateButton onClick={handleOpenCreateModal}><FaPlus /> Criar Novo Plano</CreateButton>
      </HeaderContainer>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

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
                  <td>{plan.isVisible ? <FaEye color={theme.colors.success} /> : <FaEye color={theme.colors.disabledColor} />}</td>
                  <td>{plan.notes?.substring(0, 50) || '-'}{plan.notes && plan.notes.length > 50 ? '...' : ''}</td>
                  <td>
                    <ActionButton title="Editar Plano e Exercícios" onClick={() => handleOpenEditModal(plan)}><FaEdit /></ActionButton>
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
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseModalButton onClick={handleCloseModal}><FaTimes /></CloseModalButton>
            <ModalTitle>{isEditingPlan ? 'Editar Plano de Treino Modelo' : 'Criar Novo Plano de Treino Modelo'}</ModalTitle>
            {error && <ErrorText>{error}</ErrorText>}
            
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
                  onChange={handlePlanFormChange}
                />
                <ModalLabel htmlFor="planIsVisible" style={{ marginBottom: 0, cursor: 'pointer' }}>
                  Visível para Clientes na Biblioteca de Planos
                </ModalLabel>
              </ModalCheckboxContainer>
              
              <PlanEditorContainer>
                <h4 style={{color: theme.colors.primary, marginBottom: '10px'}}>Exercícios do Plano</h4>

                {/* --- INÍCIO DA ESTRUTURA DRAG-AND-DROP CORRIGIDA --- */}
                <DragDropContext onDragEnd={handleOnDragEnd}>
                  <Droppable droppableId="all-superset-blocks" type="GROUP">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {planExercisesGrouped.map((group, groupIndex) => {
                          // Define a chave única e estável para o bloco
                          const blockKey = group[0].supersetGroup ? `group-${group[0].supersetGroup}` : `group-single-${group[0].id || group[0].tempId}`;
                          
                          return (
                            <Draggable key={blockKey} draggableId={blockKey} index={groupIndex}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps}>
                                  <SupersetGroupContainer>
                                    <SupersetHeader {...provided.dragHandleProps}>
                                      <h4><FaGripVertical style={{ marginRight: '8px' }} /> Bloco {groupIndex + 1} ({group.length > 1 ? 'Superset' : 'Exercício Único'})</h4>
                                      <ActionButton danger type="button" onClick={() => handleRemoveSupersetGroup(group[0].supersetGroup)}>
                                        <FaTrashAlt />
                                      </ActionButton>
                                    </SupersetHeader>

                                    <Droppable droppableId={blockKey} type="EXERCISE">
                                      {(providedDroppable) => (
                                        <div {...providedDroppable.droppableProps} ref={providedDroppable.innerRef}>
                                          {group.map((ex, exerciseIndex) => {
                                            // Define a chave única e estável para o exercício
                                            const exerciseKey = String(ex.id || ex.tempId);
                                            
                                            return (
                                              <Draggable key={exerciseKey} draggableId={exerciseKey} index={exerciseIndex}>
                                                {(providedDraggable) => (
                                                  <div ref={providedDraggable.innerRef} {...providedDraggable.draggableProps}>
                                                    <ExerciseEntry>
                                                      <DragHandle {...providedDraggable.dragHandleProps}>
                                                        <FaGripVertical />
                                                      </DragHandle>
                                                      <div style={{flexGrow: 1}}>
                                                        <ExerciseFieldsGrid>
                                                          <div style={{gridColumn: 'span 5'}}>
                                                            <ModalLabel htmlFor={`exId-${ex.originalIndex}`}>Exercício</ModalLabel>
                                                            <ModalSelect id={`exId-${ex.originalIndex}`} value={ex.exerciseId} onChange={(e) => handleExerciseChangeInPlan(ex.originalIndex, 'exerciseId', e.target.value)} required>
                                                              <option value="">Selecione...</option>
                                                              {allExercises.map(baseEx => <option key={baseEx.id} value={baseEx.id}>{baseEx.name}</option>)}
                                                            </ModalSelect>
                                                          </div>
                                                        </ExerciseFieldsGrid>
                                                        <ExerciseFieldsGrid>
                                                          <div><ModalLabel>Séries</ModalLabel><ModalInput type="number" value={ex.sets} onChange={(e) => handleExerciseChangeInPlan(ex.originalIndex, 'sets', e.target.value)} placeholder="Ex: 3" /></div>
                                                          <div><ModalLabel>Reps</ModalLabel><ModalInput type="text" value={ex.reps} onChange={(e) => handleExerciseChangeInPlan(ex.originalIndex, 'reps', e.target.value)} placeholder="Ex: 8-12" /></div>
                                                          <div><ModalLabel>Descanso (s)</ModalLabel><ModalInput type="number" value={ex.restSeconds} onChange={(e) => handleExerciseChangeInPlan(ex.originalIndex, 'restSeconds', e.target.value)} placeholder="Ex: 60" /></div>
                                                        </ExerciseFieldsGrid>
                                                      </div>
                                                      <ActionButton title="Remover Exercício" danger type="button" onClick={() => handleRemoveExerciseFromCurrentPlan(ex.originalIndex)}><FaTimes /></ActionButton>
                                                    </ExerciseEntry>
                                                  </div>
                                                )}
                                              </Draggable>
                                            );
                                          })}
                                          {providedDroppable.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                    <ActionButton primary type="button" onClick={() => handleAddExerciseToGroup(group[0].supersetGroup)} style={{marginTop: '10px'}}>
                                      <FaPlus /> Adicionar Exercício a este Bloco
                                    </ActionButton>
                                  </SupersetGroupContainer>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                {/* --- FIM DA ESTRUTURA DRAG-AND-DROP --- */}

                <ActionButton secondary type="button" onClick={handleAddSupersetGroup} style={{marginTop: '10px', width: '100%'}}>
                    <FaPlusCircle /> Adicionar Novo Bloco (Superset ou Exercício Único)
                </ActionButton>
              </PlanEditorContainer>

              <ModalActions>
                <ModalButton type="button" onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}><FaSave /> {formLoading ? 'A guardar...' : 'Guardar Plano'}</ModalButton>
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
            {error && <ErrorText>{error}</ErrorText>}
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
                <ModalButton type="button" onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
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