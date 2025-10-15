// src/components/Workout/SetRow.js - VERSÃO POLIDA E INTUITIVA
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { logExercisePerformanceService, updateExercisePerformanceService } from '../../services/progressService';
import { FaCheck, FaTrashAlt, FaPencilAlt } from 'react-icons/fa';
import { useSwipeable } from 'react-swipeable';
import { useWorkout } from '../../context/WorkoutContext';

// --- Keyframes para animação de shake (se a ação falhar ou for inválida) ---
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
  background-color: #D32F2F;
  border-radius: ${({ theme }) => theme.borderRadius};
  z-index: 1;
`;


const ActionText = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
`;

const SwipeableContent = styled.div`
  display: grid;
  grid-template-columns: 50px 1fr 1fr 60px;
  align-items: center;
  gap: 10px;
  padding: 4px 10px;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border: 2px solid ${({ theme, isCompleted }) => isCompleted ? theme.colors.success : theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  position: relative;
  z-index: 2;
  cursor: grab;
  transition: transform 0.3s ease-out;
  transform: translateX(${({ transformX }) => transformX}px);
`;

const SetLabel = styled.span`
  font-weight: 700;
  font-size: 1.1rem;
  color: ${({ theme, isCompleted }) => isCompleted ? theme.colors.primary : theme.colors.textMuted};
  text-align: left;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg}; /* MUDOU */
  border: 1px solid ${({ theme }) => theme.colors.buttonSecondaryBg}; /* MUDOU */
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  text-align: center;
  font-size: 1rem;
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button, &::-webkit-inner-spin-button {
    -webkit-appearance: none; margin: 0;
  }
`;

const CompletedText = styled.span`
    text-align: center;
    font-size: 1rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.textMain};
`;

const ActionButton = styled.button`
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:disabled {
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 10px;
  
  &:hover {
    transform: scale(1.1);
  }
`;

// --- Componente SetRow ---
const SetRow = ({ setNumber, planExerciseId, onSetComplete, lastWeight, lastReps }) => {
    const { activeWorkout, updateSetData } = useWorkout();

    const setData = activeWorkout.setsData[`${planExerciseId}-${setNumber}`] || {};
    const weight = setData.performedWeight ?? lastWeight ?? '';
    const reps = setData.performedReps ?? lastReps ?? '';
    const isCompleted = setData.isCompleted || false;

    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            // Se já estiver apagado ou se for a última série, não permite apagar
            if (transformX === -100 || !onDeleteSet) return;
            onDeleteSet();
        },
        onSwiping: (eventData) => {
            // Limita o swipe para a esquerda até 100px
            if (eventData.dir === 'Left' && eventData.deltaX < -30) {
                 setTransformX(Math.max(-100, eventData.deltaX));
            }
        },
        onSwiped: () => {
            // Volta à posição inicial se não deslizar o suficiente
            setTransformX(0);
        },
        trackMouse: true,
        preventDefaultTouchmoveEvent: true,
    });

    const handleComplete = () => {
        if (!weight || !reps) {
            alert("Preencha o peso e as repetições.");
            return;
        }
        const currentSetData = { ...setData, performedWeight: weight, performedReps: reps };
        updateSetData(planExerciseId, setNumber, 'isCompleted', true);
        onSetComplete(currentSetData);
    };
    
    const handleEdit = () => {
        updateSetData(planExerciseId, setNumber, 'isCompleted', false);
    };

    return (
          <SwipeableRowContainer>
            <ActionBackground>
                <FaTrashAlt size="1.5em" />
            </ActionBackground>
            <SwipeableContent {...swipeHandlers} transformX={transformX} isCompleted={isCompleted}>
                <SetLabel>{setNumber}</SetLabel>
                <Input type="number" placeholder="-" 
                    value={weight} 
                    onChange={e => updateSetData(planExerciseId, setNumber, 'performedWeight', e.target.value)} 
                    disabled={isCompleted} 
                />
                <Input type="number" placeholder="-" 
                    value={reps} 
                    onChange={e => updateSetData(planExerciseId, setNumber, 'performedReps', e.target.value)} 
                    disabled={isCompleted} 
                />
                <ActionButton onClick={isCompleted ? handleEdit : handleComplete} disabled={!weight || !reps}>
                    {isCompleted ? <FaPencilAlt /> : <FaCheck />}
                </ActionButton>
            </SwipeableContent>
          </SwipeableRowContainer>
    );
};

export default SetRow;