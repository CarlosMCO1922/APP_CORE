// src/components/Workout/ExerciseLiveCard.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus } from 'react-icons/fa';
import SetRow from './SetRow';
import { useWorkout } from '../../context/WorkoutContext';

// --- Styled Components ---
const CardContainer = styled.div` margin-bottom: 40px; `;
const CardHeader = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; `;
const ExerciseName = styled.h2` color: ${({ theme }) => theme.colors.textMain}; font-size: 1.05rem; margin: 0; `;
const SetsGridHeader = styled.div` display: grid; grid-template-columns: 50px 1fr 1fr 60px; gap: 10px; padding: 0 10px; margin-bottom: 8px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; text-align: center; span:first-child { text-align: left; }`;
const AddSetButton = styled.button` background-color: transparent; color: ${({ theme }) => theme.colors.textMuted}; padding: 10px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; margin-top: 15px; transition: all 0.2s; display: block; width: 100%; text-align: center; &:hover { background-color: ${({ theme }) => theme.colors.cardBackground}; color: ${({ theme }) => theme.colors.primary}; }`;
// Removido: texto de último desempenho e botão de histórico duplicado

const ExerciseLiveCard = ({ 
  planExercise, 
  exerciseName,
  trainingId, 
  workoutPlanId,
  onSetComplete, 
  lastPerformance,
}) => {
  const [sets, setSets] = useState([]);
  const { exercisePlaceholders } = useWorkout();
  
  // Obter placeholders para este exercício - tentar ambos os campos
  const planExerciseId = planExercise?.planExerciseId ?? planExercise?.id;
  // Tentar ambos os IDs possíveis para garantir compatibilidade
  const placeholders = exercisePlaceholders[planExerciseId] || exercisePlaceholders[planExercise?.id] || exercisePlaceholders[planExercise?.planExerciseId] || [];
  
  // Debug: log se não encontrar placeholders mas existirem no contexto
  if (placeholders.length === 0 && Object.keys(exercisePlaceholders).length > 0) {
    console.log('ExerciseLiveCard: Não encontrou placeholders para planExerciseId:', planExerciseId, 'Disponíveis:', Object.keys(exercisePlaceholders));
  }

  useEffect(() => {
    const initialSets = Array.from({ length: planExercise.sets || 1 }, (_, i) => ({ id: `initial-${i}` }));
    setSets(initialSets);
  }, [planExercise.sets]);

  const handleAddSet = () => setSets(prev => [...prev, { id: Date.now() }]);

  const handleDeleteSet = (indexToDelete) => {
    if (sets.length <= 1) {
        alert("Não pode remover todas as séries.");
        return;
    }
    setSets(prev => prev.filter((_, index) => index !== indexToDelete));
  };

  // Só mostrar o nome se exerciseName for explicitamente fornecido (para superseries)
  // Se for null, não mostrar nada (exercício único já tem nome no header)
  const displayName = exerciseName || null;

  return (
    <CardContainer>
      {displayName && (
        <CardHeader>
          <ExerciseName>{displayName}</ExerciseName>
        </CardHeader>
      )}
      
      <SetsGridHeader><span>Série</span><span>KG</span><span>Reps</span><span></span></SetsGridHeader>
      
      <div>
        {sets.map((set, index) => {
          // Obter placeholder para esta série (série 1 → índice 0, série 2 → índice 1, etc.)
          const placeholder = placeholders[index] || { weight: null, reps: null };
          return (
            <SetRow
              key={set.id}
              setNumber={index + 1}
              planExerciseId={planExercise?.planExerciseId ?? planExercise?.id}
              trainingId={trainingId} 
              workoutPlanId={workoutPlanId} 
              onSetComplete={onSetComplete}
              restSeconds={planExercise.restSeconds}
              onDeleteSet={() => handleDeleteSet(index)} 
              lastWeight={lastPerformance?.performedWeight}
              lastReps={lastPerformance?.performedReps}
              placeholderWeight={placeholder.weight}
              placeholderReps={placeholder.reps}
              prescribedReps={planExercise.reps}
            />
          );
        })}
      </div>

      <AddSetButton onClick={handleAddSet}><FaPlus /> Adicionar Série ({planExercise.restSeconds || 90}s)</AddSetButton>
    </CardContainer>
  );
};

export default ExerciseLiveCard;