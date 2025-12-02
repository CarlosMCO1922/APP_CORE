// src/components/Workout/SetRow.js
import React, { useState } from 'react'; // Importar apenas o useState
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { logExercisePerformanceService, updateExercisePerformanceService } from '../../services/progressService';
import { FaCheck, FaTrashAlt, FaPencilAlt, FaTimes } from 'react-icons/fa';
import { useSwipeable } from 'react-swipeable';
import { useWorkout } from '../../context/WorkoutContext';
import { useTheme } from 'styled-components';

const SWIPE_DISTANCE = -200; // Aumentado para um deslize mais longo
const SWIPE_THRESHOLD = -100;

// --- Styled Components (sem alterações) ---
const SwipeableRowContainer = styled.div`
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;
  border-radius: ${({ theme }) => theme.borderRadius};
`;

const ActionBackground = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  display: ${({ isVisible }) => isVisible ? 'flex' : 'none'};
  align-items: center;
  justify-content: flex-end; /* Ícone fica à direita */
  padding-right: 30px;
  color: white;
  background-color: ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius};
  z-index: 1;
`;

const SwipeableContent = styled.div`
  display: grid;
  grid-template-columns: 50px 1fr 1fr 60px;
  align-items: center;
  gap: 10px;
  padding: 4px 10px;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border: 2px solid ${({ theme, isCompleted }) => 
    isCompleted 
      ? theme.colors.success // Verde quando completo
      : theme.colors.cardBorder // Cinza neutro quando pendente
  };
  border-radius: ${({ theme }) => theme.borderRadius};
  position: relative;
  z-index: 2;
  cursor: grab;
  transition: all 0.3s ease-out;
  transform: translateX(${({ transformX }) => transformX}px);
  box-shadow: ${({ theme, isCompleted }) => 
    isCompleted 
      ? `0 2px 8px rgba(102, 187, 106, 0.2)` // Sombra verde suave quando completo
      : 'none'
  };
`;

const SetLabel = styled.span`
  font-weight: 700;
  font-size: 1.1rem;
  color: ${({ theme, isCompleted }) => 
    isCompleted 
      ? theme.colors.primary // Dourado quando completo para destacar
      : theme.colors.textMuted // Cinza quando pendente
  };
  text-align: left;
  transition: color 0.2s ease;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background-color: ${({ theme, disabled }) => 
    disabled 
      ? theme.colors.disabledBg 
      : theme.colors.buttonSecondaryBg
  };
  border: 1px solid ${({ theme, disabled }) => 
    disabled 
      ? theme.colors.disabledBg 
      : theme.colors.buttonSecondaryBg
  };
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme, disabled }) => 
    disabled 
      ? theme.colors.disabledText 
      : theme.colors.textMain
  };
  text-align: center;
  font-size: 1rem;
  transition: all 0.2s ease;
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button, &::-webkit-inner-spin-button {
    -webkit-appearance: none; margin: 0;
  }
  
  &:focus:not(:disabled) {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing};
  }
`;

const ActionButton = styled.button`
  background-color: ${({ theme, isCompleted }) => 
    isCompleted 
      ? theme.colors.primary // Dourado quando completo (botão editar) - usa cor primária do tema
      : theme.colors.primary // Dourado também quando não completo (botão finalizar) - chama atenção
  };
  color: ${({ theme, isCompleted }) => 
    isCompleted 
      ? theme.colors.textDark // Texto escuro quando completo (contraste com dourado)
      : theme.colors.textDark // Texto escuro quando não completo
  };
  border: ${({ theme, isCompleted }) => 
    isCompleted 
      ? `2px solid ${theme.colors.success}` // Contorno verde quando completo
      : 'none' // Sem contorno quando pendente
  };
  font-size: 1.1rem;
  cursor: pointer;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: ${({ theme, isCompleted }) => 
    isCompleted 
      ? `0 2px 6px rgba(102, 187, 106, 0.3)` // Sombra verde quando completo
      : `0 2px 6px rgba(252, 181, 53, 0.2)` // Sombra dourada quando pendente
  };
  
  svg {
    font-size: 1.1rem !important;
    width: 1.1rem !important;
    height: 1.1rem !important;
    
    @media (max-width: 768px) {
      font-size: ${({ isCompleted }) => isCompleted ? '2.4rem !important' : '1.1rem !important'};
      width: ${({ isCompleted }) => isCompleted ? '2.4rem !important' : '1.1rem !important'};
      height: ${({ isCompleted }) => isCompleted ? '2.4rem !important' : '1.1rem !important'};
    }
    
    @media (max-width: 480px) {
      font-size: ${({ isCompleted }) => isCompleted ? '2.6rem !important' : '1.1rem !important'};
      width: ${({ isCompleted }) => isCompleted ? '2.6rem !important' : '1.1rem !important'};
      height: ${({ isCompleted }) => isCompleted ? '2.6rem !important' : '1.1rem !important'};
    }
  }
  
  @media (max-width: 768px) {
    width: ${({ isCompleted }) => isCompleted ? '60px' : '44px'} !important;
    height: ${({ isCompleted }) => isCompleted ? '60px' : '44px'} !important;
    min-width: ${({ isCompleted }) => isCompleted ? '60px' : '44px'} !important;
    min-height: ${({ isCompleted }) => isCompleted ? '60px' : '44px'} !important;
  }
  
  @media (max-width: 480px) {
    width: ${({ isCompleted }) => isCompleted ? '64px' : '44px'} !important;
    height: ${({ isCompleted }) => isCompleted ? '64px' : '44px'} !important;
    min-width: ${({ isCompleted }) => isCompleted ? '64px' : '44px'} !important;
    min-height: ${({ isCompleted }) => isCompleted ? '64px' : '44px'} !important;
  }
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: ${({ theme, isCompleted }) => 
      isCompleted 
        ? `0 3px 10px rgba(102, 187, 106, 0.4)` // Sombra verde mais intensa
        : `0 3px 10px rgba(252, 181, 53, 0.3)` // Sombra dourada mais intensa
    };
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.disabledBg};
    color: ${({ theme }) => theme.colors.disabledText};
    border: none;
    box-shadow: none;
    transform: none;
  }
`;

const DeleteButton = styled.button`
  height: 100%;
  width: 200px; /* Deve corresponder à SWIPE_DISTANCE */
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1rem;
  font-weight: bold;
  
  &:hover {
    opacity: 0.9; /* leve escurecimento ao passar o rato */
  }
`;

const DeleteModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.overlayBg};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
`;

const DeleteModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 25px;
  border-radius: 10px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.6);
  position: relative;
  color: ${({ theme }) => theme.colors.textMain};
  border-top: 3px solid ${({ theme }) => theme.colors.error};
`;

const DeleteModalTitle = styled.h3`
  color: ${({ theme }) => theme.colors.textMain};
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.2rem;
  font-weight: 600;
`;

const DeleteModalText = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 20px;
  line-height: 1.6;
`;

const DeleteModalActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DeleteModalButton = styled.button`
  padding: 12px 20px;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  ${props => props.danger ? `
    background-color: ${props.theme.colors.error};
    color: white;
    &:hover {
      opacity: 0.9;
    }
  ` : props.secondary ? `
    background-color: ${props.theme.colors.buttonSecondaryBg};
    color: ${props.theme.colors.textMain};
    &:hover {
      background-color: ${props.theme.colors.buttonSecondaryHoverBg};
    }
  ` : `
    background-color: ${props.theme.colors.primary};
    color: ${props.theme.colors.textDark};
    &:hover {
      opacity: 0.9;
    }
  `}
`;

const CloseModalButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 5px;
  transition: color 0.2s;
  
  &:hover {
    color: ${({ theme }) => theme.colors.textMain};
  }
`;

const PrescribedRepsNote = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  margin-bottom: 6px;
  padding-left: 10px;
`;

// --- Componente SetRow ---
// ALTERADO: Adicionado 'onDeleteSet' às props recebidas
const SetRow = ({ setNumber, planExerciseId, onSetComplete = () => {}, lastWeight, lastReps, onDeleteSet = () => {}, prescribedReps = null }) => {
    const { activeWorkout, updateSetData } = useWorkout();
    const theme = useTheme();
    
    // ALTERADO: Adicionado o estado para controlar a posição do swipe
    const [transformX, setTransformX] = useState(0);
    const [hasShownConfirm, setHasShownConfirm] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const setData = activeWorkout.setsData[`${planExerciseId}-${setNumber}`] || {};
    const weight = setData.performedWeight ?? lastWeight ?? '';
    const reps = setData.performedReps ?? lastReps ?? '';
    const isCompleted = setData.isCompleted || false;

    const swipeHandlers = useSwipeable({
        onSwiping: (eventData) => {
            // Permite deslizar apenas para a esquerda e limita a distância
            if (eventData.deltaX < 0) {
                const newX = Math.max(SWIPE_DISTANCE, eventData.deltaX);
                setTransformX(newX);
                
                // Se chegou ao máximo e ainda não mostrou confirmação, mostra imediatamente
                if (newX <= SWIPE_DISTANCE && !hasShownConfirm && !showDeleteModal) {
                    setHasShownConfirm(true);
                    handleDeleteClick();
                }
            }
        },
        onSwiped: (eventData) => {
            // Ao largar, decide se fica aberto ou fechado
            if (eventData.deltaX < SWIPE_THRESHOLD) {
                setTransformX(SWIPE_DISTANCE); // Fica aberto
            } else {
                setTransformX(0); // Volta a fechar
                setHasShownConfirm(false); // Reset para permitir novo swipe
            }
        },
        trackMouse: true,
        preventDefaultTouchmoveEvent: true,
    });

    const handleComplete = () => {
      if (!weight || !reps) {
        alert("Preencha o peso e as repetições.");
        return;
      }
      const currentSetData = { ...setData, performedWeight: weight, performedReps: reps, planExerciseId, setNumber };
      updateSetData(planExerciseId, setNumber, 'isCompleted', true);
      setIsEditing(false);

      if (typeof onSetComplete === 'function') {
        onSetComplete(currentSetData);
      } else {
        console.warn('SetRow: onSetComplete não é função', onSetComplete);
      }
    };
    
    const handleEdit = () => {
        setIsEditing(true);
        updateSetData(planExerciseId, setNumber, 'isCompleted', false);
    };

    const handleDeleteClick = () => {
      setShowDeleteModal(true);
      setTransformX(0); // Fecha o swipe quando abre o modal
      setHasShownConfirm(false);
    };

    const handleConfirmDelete = () => {
      if (typeof onDeleteSet === 'function') {
        onDeleteSet();
        setShowDeleteModal(false);
        setTransformX(0);
      } else {
        console.warn('SetRow: onDeleteSet não é função', onDeleteSet);
        setShowDeleteModal(false);
      }
    };

    const handleCancelDelete = () => {
      setShowDeleteModal(false);
      setTransformX(0);
      setHasShownConfirm(false);
    };

    return (
        <>
            {prescribedReps && (
                <PrescribedRepsNote>
                    Reps prescritas: {prescribedReps}
                </PrescribedRepsNote>
            )}
            <SwipeableRowContainer onClick={() => transformX !== 0 && !showDeleteModal && setTransformX(0)}>
                <ActionBackground isVisible={transformX < 0}>
                    <DeleteButton onClick={handleDeleteClick}>
                        <FaTrashAlt /> Apagar
                    </DeleteButton>
                </ActionBackground>
                <SwipeableContent {...swipeHandlers} transformX={transformX} isCompleted={isCompleted}>
                    <SetLabel isCompleted={isCompleted}>{setNumber}</SetLabel>
                    <Input 
                        type="number" 
                        placeholder="-" 
                        value={weight} 
                        disabled={isCompleted && !isEditing}
                        onChange={e => updateSetData(planExerciseId, setNumber, 'performedWeight', e.target.value)} 
                    />
                    <Input 
                        type="number" 
                        placeholder="-" 
                        value={reps} 
                        disabled={isCompleted && !isEditing}
                        onChange={e => updateSetData(planExerciseId, setNumber, 'performedReps', e.target.value)} 
                    />
                <ActionButton onClick={isCompleted ? handleEdit : handleComplete} disabled={!weight || !reps} isCompleted={isCompleted}>
                    {isCompleted ? <FaPencilAlt /> : <FaCheck />}
                </ActionButton>
            </SwipeableContent>
        </SwipeableRowContainer>

            {showDeleteModal && (
                <DeleteModalOverlay onClick={handleCancelDelete}>
                    <DeleteModalContent onClick={(e) => e.stopPropagation()}>
                        <CloseModalButton onClick={handleCancelDelete}>
                            <FaTimes />
                        </CloseModalButton>
                        <DeleteModalTitle>Apagar Série</DeleteModalTitle>
                        <DeleteModalText>
                            Tem a certeza que quer apagar esta série? Esta ação não pode ser desfeita.
                        </DeleteModalText>
                        <DeleteModalActions>
                            <DeleteModalButton danger onClick={handleConfirmDelete}>
                                <FaTrashAlt /> Apagar
                            </DeleteModalButton>
                            <DeleteModalButton secondary onClick={handleCancelDelete}>
                                Cancelar
                            </DeleteModalButton>
                        </DeleteModalActions>
                    </DeleteModalContent>
                </DeleteModalOverlay>
            )}
        </>
    );
};

export default SetRow;