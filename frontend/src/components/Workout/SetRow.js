// src/components/Workout/SetRow.js
import React, { useState } from 'react'; // Importar apenas o useState
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { logExercisePerformanceService, updateExercisePerformanceService } from '../../services/progressService';
import { FaCheck, FaTrashAlt, FaPencilAlt } from 'react-icons/fa';
import { useSwipeable } from 'react-swipeable';
import { useWorkout } from '../../context/WorkoutContext';

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
  display: flex;
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
  background-color: ${({ theme, isCompleted }) => 
    isCompleted 
      ? theme.colors.successBg || 'rgba(102,187,106,0.1)' // Leve tom verde quando completo
      : theme.colors.cardBackground
  };
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

// --- Componente SetRow ---
// ALTERADO: Adicionado 'onDeleteSet' às props recebidas
const SetRow = ({ setNumber, planExerciseId, onSetComplete = () => {}, lastWeight, lastReps, onDeleteSet = () => {} }) => {
    const { activeWorkout, updateSetData } = useWorkout();
    
    // ALTERADO: Adicionado o estado para controlar a posição do swipe
    const [transformX, setTransformX] = useState(0);
    const [hasShownConfirm, setHasShownConfirm] = useState(false);

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
                if (newX <= SWIPE_DISTANCE && !hasShownConfirm) {
                    setHasShownConfirm(true);
                    handleDeleteConfirm();
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

      if (typeof onSetComplete === 'function') {
        onSetComplete(currentSetData);
      } else {
        console.warn('SetRow: onSetComplete não é função', onSetComplete);
      }
    };
    
    const handleEdit = () => {
        updateSetData(planExerciseId, setNumber, 'isCompleted', false);
    };

    const handleDeleteConfirm = () => {
      if (window.confirm("Tem a certeza que quer apagar esta série?")) {
        if (typeof onDeleteSet === 'function') {
          onDeleteSet();
          setTransformX(0); // Fecha após confirmar
        } else {
          console.warn('SetRow: onDeleteSet não é função', onDeleteSet);
        }
      } else {
        // Se cancelar, fecha o swipe
        setTransformX(0);
        setHasShownConfirm(false);
      }
    };

    return (
        <SwipeableRowContainer onClick={() => transformX !== 0 && setTransformX(0)}>
            <ActionBackground>
                <DeleteButton onClick={handleDeleteConfirm}>
                    <FaTrashAlt /> Apagar
                </DeleteButton>
            </ActionBackground>
            <SwipeableContent {...swipeHandlers} transformX={transformX} isCompleted={isCompleted}>
                <SetLabel isCompleted={isCompleted}>{setNumber}</SetLabel>
                <Input type="number" placeholder="-" 
                    value={weight} 
                    onChange={e => updateSetData(planExerciseId, setNumber, 'performedWeight', e.target.value)} 
                />
                <Input type="number" placeholder="-" 
                    value={reps} 
                    onChange={e => updateSetData(planExerciseId, setNumber, 'performedReps', e.target.value)} 
                />
                <ActionButton onClick={isCompleted ? handleEdit : handleComplete} disabled={!weight || !reps} isCompleted={isCompleted}>
                    {isCompleted ? <FaPencilAlt /> : <FaCheck />}
                </ActionButton>
            </SwipeableContent>
        </SwipeableRowContainer>
    );
};

export default SetRow;