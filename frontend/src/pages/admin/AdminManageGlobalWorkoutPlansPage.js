// src/pages/admin/AdminManageGlobalWorkoutPlansPage.js
import React, { useEffect, useState, useCallback, useMemo} from 'react';
import { Link } from 'react-router-dom';
import BackArrow from '../../components/BackArrow';
import styled, { useTheme, css } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import {
    adminGetAllGlobalWorkoutPlans,
    adminGetGlobalWorkoutPlanById,
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
    FaTimes, FaSave, FaLayerGroup, FaPlusCircle, FaImage, FaVideo, FaEye, FaGripVertical, FaDumbbell
} from 'react-icons/fa';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import SearchableSelect from '../../components/Common/SearchableSelect';
import { sortPlanExercises } from '../../utils/exerciseOrderUtils';



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

/* --- Vista de preview do plano (só leitura) --- */
const PreviewModalOverlay = styled(ModalOverlay)`
  align-items: flex-start;
  padding: 24px 16px 40px;
  overflow-y: auto;
`;
const PreviewModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker};
  padding: 0;
  border-radius: 12px;
  width: 100%;
  max-width: 560px;
  margin: 0 auto 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  overflow: hidden;
  position: relative;
`;
const PreviewHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  background-color: ${({ theme }) => theme.colors.cardBackground};
`;
const PreviewTitle = styled.h2`
  margin: 0 0 6px 0;
  font-size: 1.35rem;
  color: ${({ theme }) => theme.colors.primary};
`;
const PreviewMeta = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;
const PreviewNotes = styled.p`
  margin: 12px 0 0 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMain};
  line-height: 1.5;
  white-space: pre-wrap;
`;
const PreviewCloseBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
  &:hover { color: ${({ theme }) => theme.colors.textMain}; }
`;
const PreviewBody = styled.div`
  padding: 20px 24px 24px;
  max-height: 65vh;
  overflow-y: auto;
`;
const PreviewBlock = styled.div`
  margin-bottom: 20px;
  &:last-child { margin-bottom: 0; }
`;
const PreviewBlockTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;
const PreviewExerciseCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  &:last-child { margin-bottom: 0; }
`;
const PreviewExerciseIcon = styled.div`
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.primary}22;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
`;
const PreviewExerciseInfo = styled.div`
  flex: 1;
  min-width: 0;
`;
const PreviewExerciseName = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textMain};
  margin-bottom: 4px;
`;
const PreviewExerciseMeta = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 6px;
`;
const PreviewExerciseParams = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMain};
  span { color: ${({ theme }) => theme.colors.textMuted}; }
`;
const PreviewEmpty = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.95rem;
  padding: 24px 0;
  margin: 0;
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
  const [showDeleteSupersetConfirmModal, setShowDeleteSupersetConfirmModal] = useState(false);
  const [showDeletePlanConfirmModal, setShowDeletePlanConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewPlan, setPreviewPlan] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

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
            internalOrder: ex.internalOrder !== null && ex.internalOrder !== undefined ? ex.internalOrder : 0,
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

  const handleOpenPreviewModal = useCallback(async (plan) => {
    setShowPreviewModal(true);
    setPreviewPlan(null);
    setPreviewError('');
    setPreviewLoading(true);
    try {
      const data = await adminGetGlobalWorkoutPlanById(plan.id, authState.token);
      const ordered = data.planExercises && Array.isArray(data.planExercises)
        ? { ...data, planExercises: sortPlanExercises(data.planExercises) }
        : data;
      setPreviewPlan(ordered);
    } catch (err) {
      setPreviewError(err.message || 'Erro ao carregar o plano.');
    } finally {
      setPreviewLoading(false);
    }
  }, [authState.token]);

  const handleClosePreviewModal = useCallback(() => {
    setShowPreviewModal(false);
    setPreviewPlan(null);
    setPreviewError('');
  }, []);

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
      // Ordenar por internalOrder dentro do grupo
      remainingInGroup.sort((a, b) => {
        const internalOrderA = a.internalOrder !== null && a.internalOrder !== undefined ? a.internalOrder : 0;
        const internalOrderB = b.internalOrder !== null && b.internalOrder !== undefined ? b.internalOrder : 0;
        return internalOrderA - internalOrderB;
      });
      // Atualizar internalOrder sequencialmente
      remainingInGroup.forEach((ex, index) => {
          ex.internalOrder = index;
      });
      setCurrentPlanData(prev => ({ ...prev, exercises: updatedExercises }));
    };
  
    const handleRemoveSupersetGroup = (supersetGroup) => {
      setItemToDelete({ type: 'superset', group: supersetGroup });
      setShowDeleteSupersetConfirmModal(true);
    };

    const handleRemoveSupersetGroupConfirm = () => {
      if (!itemToDelete || itemToDelete.type !== 'superset') return;
      const supersetGroup = itemToDelete.group;
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
      setItemToDelete(null);
      setShowDeleteSupersetConfirmModal(false);
    };

  const planExercisesGrouped = useMemo(() => {
        if (!currentPlanData.exercises) return [];
        const groups = new Map();
        const sortedExercises = [...currentPlanData.exercises].sort((a, b) => {
            // Primeiro por supersetGroup (bloco), depois por internalOrder (ordem dentro do bloco)
            if (a.supersetGroup !== b.supersetGroup) {
                return (a.supersetGroup || 0) - (b.supersetGroup || 0);
            }
            const internalOrderA = a.internalOrder !== null && a.internalOrder !== undefined ? a.internalOrder : 0;
            const internalOrderB = b.internalOrder !== null && b.internalOrder !== undefined ? b.internalOrder : 0;
            return internalOrderA - internalOrderB;
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
            // Encontrar os grupos usando o blockKey (droppableId)
            const sourceBlockKey = source.droppableId;
            const destBlockKey = destination.droppableId;
            
            // Encontrar os índices dos grupos no planExercisesGrouped
            let sourceGroupIndex = -1;
            let destGroupIndex = -1;
            
            planExercisesGrouped.forEach((group, idx) => {
                const blockKey = group[0].supersetGroup ? `group-${group[0].supersetGroup}` : `group-single-${group[0].id || group[0].tempId}`;
                if (blockKey === sourceBlockKey) sourceGroupIndex = idx;
                if (blockKey === destBlockKey) destGroupIndex = idx;
            });
            
            if (sourceGroupIndex === -1 || destGroupIndex === -1) return;
            
            const sourceGroup = planExercisesGrouped[sourceGroupIndex];
            const destGroup = planExercisesGrouped[destGroupIndex];
            const exerciseToMove = sourceGroup[source.index];
            
            // Remover o exercício da lista original
            const exerciseIndexToRemove = newExercises.findIndex(ex => (ex.id || ex.tempId) === (exerciseToMove.id || exerciseToMove.tempId));
            if (exerciseIndexToRemove !== -1) {
                newExercises.splice(exerciseIndexToRemove, 1);
            }

            // Atualizar o supersetGroup do exercício movido
            const targetSupersetGroup = destGroup[0].supersetGroup;
            const updatedExercise = { ...exerciseToMove, supersetGroup: targetSupersetGroup };
            
            // Encontrar a posição correta para inserir
            let targetIndex;
            if (destination.index >= destGroup.length) {
                // Inserir no final do grupo de destino
                const lastExerciseInDest = destGroup[destGroup.length - 1];
                const lastIndex = newExercises.findIndex(ex => (ex.id || ex.tempId) === (lastExerciseInDest.id || lastExerciseInDest.tempId));
                targetIndex = lastIndex !== -1 ? lastIndex + 1 : newExercises.length;
            } else {
                // Inserir antes do exercício no índice de destino
                const siblingExercise = destGroup[destination.index];
                const siblingIndex = newExercises.findIndex(ex => (ex.id || ex.tempId) === (siblingExercise.id || siblingExercise.tempId));
                targetIndex = siblingIndex !== -1 ? siblingIndex : newExercises.length;
            }
            
            newExercises.splice(targetIndex, 0, updatedExercise);

            // Agrupar por supersetGroup e atualizar order e internalOrder
            const finalGrouped = {};
            newExercises.forEach(ex => {
                const groupKey = ex.supersetGroup !== null && ex.supersetGroup !== undefined ? ex.supersetGroup : 'single';
                if(!finalGrouped[groupKey]) finalGrouped[groupKey] = [];
                finalGrouped[groupKey].push(ex);
            });

            // Atualizar order (bloco) e internalOrder (ordem dentro do bloco)
            let blockOrder = 0;
            const finalReorderedExercises = [];
            
            Object.keys(finalGrouped).sort((a, b) => {
                // Ordenar grupos: 'single' no final, depois por valor numérico
                if (a === 'single') return 1;
                if (b === 'single') return -1;
                return parseInt(a) - parseInt(b);
            }).forEach(groupKey => {
                const group = finalGrouped[groupKey];
                // Atualizar order para todos os exercícios do grupo
                group.forEach((ex, index) => {
                    ex.order = blockOrder;
                    ex.internalOrder = index; // Atualizar internalOrder sequencialmente dentro do grupo
                    finalReorderedExercises.push(ex);
                });
                blockOrder++;
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
                internalOrder: ex.internalOrder !== null && ex.internalOrder !== undefined ? parseInt(ex.internalOrder) : 0,
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

  const handleDeletePlan = (planId) => {
    setItemToDelete({ type: 'plan', id: planId });
    setShowDeletePlanConfirmModal(true);
  };

  const handleDeletePlanConfirm = async () => {
    if (!itemToDelete || itemToDelete.type !== 'plan') return;
    setDeleteLoading(true);
    setError(''); 
    setSuccessMessage('');
    setShowDeletePlanConfirmModal(false);
    try {
      await adminDeleteGlobalWorkoutPlan(itemToDelete.id, authState.token);
      setSuccessMessage('Plano de treino eliminado com sucesso.');
      setItemToDelete(null);
      fetchAllData();
    } catch (err) {
      setError(err.message || 'Erro ao eliminar plano de treino.');
      setItemToDelete(null);
    } finally {
      setDeleteLoading(false);
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
          <Title><FaClipboardList /> Planos de Treino Modelo</Title>
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
                    <ActionButton title="Visualizar plano" onClick={() => handleOpenPreviewModal(plan)}><FaEye /></ActionButton>
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
                                                            <SearchableSelect
                                                              id={`exId-${ex.originalIndex}`}
                                                              name="exerciseId"
                                                              value={ex.exerciseId || ''}
                                                              onChange={(e) => handleExerciseChangeInPlan(ex.originalIndex, 'exerciseId', e.target.value)}
                                                              options={allExercises}
                                                              placeholder="Selecione..."
                                                              getOptionLabel={(option) => option.name}
                                                              getOptionValue={(option) => option.id}
                                                              searchable={true}
                                                              required={true}
                                                            />
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

      {/* Modal de visualização do plano (vista admin, só leitura) */}
      {showPreviewModal && (
        <PreviewModalOverlay onClick={handleClosePreviewModal}>
          <PreviewModalContent onClick={(e) => e.stopPropagation()}>
            <PreviewCloseBtn onClick={handleClosePreviewModal} aria-label="Fechar">&times;</PreviewCloseBtn>
            {previewLoading ? (
              <PreviewBody>
                <PreviewEmpty>A carregar plano...</PreviewEmpty>
              </PreviewBody>
            ) : previewError ? (
              <PreviewBody>
                <ErrorText>{previewError}</ErrorText>
              </PreviewBody>
            ) : previewPlan ? (
              <>
                <PreviewHeader>
                  <PreviewTitle>{previewPlan.name}</PreviewTitle>
                  <PreviewMeta>
                    {previewPlan.planExercises?.length || 0} exercício(s)
                    {previewPlan.isVisible && ' · Visível na biblioteca'}
                  </PreviewMeta>
                  {previewPlan.notes && <PreviewNotes>{previewPlan.notes}</PreviewNotes>}
                </PreviewHeader>
                <PreviewBody>
                  {(!previewPlan.planExercises || previewPlan.planExercises.length === 0) ? (
                    <PreviewEmpty>Este plano ainda não tem exercícios.</PreviewEmpty>
                  ) : (
                    (() => {
                      const sorted = sortPlanExercises(previewPlan.planExercises);
                      const groups = [];
                      let current = [];
                      sorted.forEach((ex) => {
                        const sameBlock = current.length > 0 && current[0].order === ex.order && (current[0].supersetGroup == null) === (ex.supersetGroup == null) && current[0].supersetGroup === ex.supersetGroup;
                        if (sameBlock) current.push(ex);
                        else {
                          current = [ex];
                          groups.push(current);
                        }
                      });
                      return groups.map((block, idx) => (
                        <PreviewBlock key={idx}>
                          <PreviewBlockTitle>
                            Bloco {idx + 1}{block.length > 1 ? ' (Superset)' : ''}
                          </PreviewBlockTitle>
                          {block.map((pe) => (
                            <PreviewExerciseCard key={pe.id}>
                              <PreviewExerciseIcon><FaDumbbell /></PreviewExerciseIcon>
                              <PreviewExerciseInfo>
                                <PreviewExerciseName>{pe.exerciseDetails?.name || 'Exercício'}</PreviewExerciseName>
                                {pe.exerciseDetails?.muscleGroup && (
                                  <PreviewExerciseMeta>{pe.exerciseDetails.muscleGroup}</PreviewExerciseMeta>
                                )}
                                <PreviewExerciseParams>
                                  {pe.sets != null && pe.sets !== '' && <span>Séries: <strong>{pe.sets}</strong></span>}
                                  {pe.reps != null && pe.reps !== '' && <span>Reps: <strong>{pe.reps}</strong></span>}
                                  {pe.durationSeconds != null && pe.durationSeconds !== '' && <span>Duração: <strong>{pe.durationSeconds}s</strong></span>}
                                  {pe.restSeconds != null && pe.restSeconds !== '' && <span>Descanso: <strong>{pe.restSeconds}s</strong></span>}
                                </PreviewExerciseParams>
                                {pe.notes && <PreviewExerciseMeta style={{ marginTop: 6 }}>{pe.notes}</PreviewExerciseMeta>}
                              </PreviewExerciseInfo>
                            </PreviewExerciseCard>
                          ))}
                        </PreviewBlock>
                      ));
                    })()
                  )}
                </PreviewBody>
              </>
            ) : null}
          </PreviewModalContent>
        </PreviewModalOverlay>
      )}

      <ConfirmationModal
        isOpen={showDeleteSupersetConfirmModal}
        onClose={() => {
          setShowDeleteSupersetConfirmModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleRemoveSupersetGroupConfirm}
        title="Eliminar Bloco de Superset"
        message="Tem a certeza que quer eliminar este bloco e todos os seus exercícios?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger={true}
        loading={false}
      />

      <ConfirmationModal
        isOpen={showDeletePlanConfirmModal}
        onClose={() => {
          if (!deleteLoading) {
            setShowDeletePlanConfirmModal(false);
            setItemToDelete(null);
          }
        }}
        onConfirm={handleDeletePlanConfirm}
        title="Eliminar Plano de Treino"
        message="Tem a certeza que quer eliminar este plano de treino? Esta ação não pode ser desfeita."
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger={true}
        loading={deleteLoading}
      />
    </PageContainer>
  );
};

export default AdminManageGlobalWorkoutPlansPage;