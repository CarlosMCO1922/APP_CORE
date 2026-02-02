// src/components/Workout/ExerciseLiveCard.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus } from 'react-icons/fa';
import SetRow from './SetRow';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';

// --- Styled Components ---
const CardContainer = styled.div` margin-bottom: 40px; `;
const CardHeader = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; `;
const ExerciseName = styled.h2` color: ${({ theme }) => theme.colors.textMain}; font-size: 1.05rem; margin: 0; `;
const LastMaterialHint = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 10px 0;
  font-style: italic;
`;
const MaterialLabel = styled.label`
  display: block;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 6px;
  font-weight: 500;
`;
const MaterialInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.9rem;
  margin-bottom: 12px;
  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing};
  }
`;
const SetsGridHeader = styled.div` display: grid; grid-template-columns: 50px 1fr 1fr 60px; gap: 10px; padding: 0 10px; margin-bottom: 8px; color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; text-align: center; span:first-child { text-align: left; }`;
const AddSetButton = styled.button` background-color: transparent; color: ${({ theme }) => theme.colors.textMuted}; padding: 10px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; margin-top: 15px; transition: all 0.2s; display: block; width: 100%; text-align: center; &:hover { background-color: ${({ theme }) => theme.colors.cardBackground}; color: ${({ theme }) => theme.colors.primary}; }`;

const ExerciseLiveCard = ({ 
  planExercise, 
  exerciseName,
  trainingId, 
  workoutPlanId,
  onSetComplete, 
  lastPerformance,
}) => {
  const [sets, setSets] = useState([]);
  const { exercisePlaceholders, reloadPlaceholdersForActiveWorkout, activeWorkout, updateSetData } = useWorkout();
  const { authState } = useAuth();

  const planExerciseId = planExercise?.planExerciseId ?? planExercise?.id;
  const firstSetKey = planExerciseId ? `${planExerciseId}-1` : null;
  const savedMaterial = activeWorkout?.setsData?.[firstSetKey]?.materialUsed ?? lastPerformance?.materialUsed ?? '';
  const [materialUsed, setMaterialUsed] = useState(savedMaterial);

  useEffect(() => {
    const next = activeWorkout?.setsData?.[firstSetKey]?.materialUsed ?? lastPerformance?.materialUsed ?? '';
    setMaterialUsed(prev => (next !== undefined && next !== null ? next : prev));
  }, [firstSetKey, activeWorkout?.setsData, lastPerformance?.materialUsed]);
  
  // Tentar ambos os IDs possíveis para garantir compatibilidade
  const placeholders = exercisePlaceholders[planExerciseId] || exercisePlaceholders[planExercise?.id] || exercisePlaceholders[planExercise?.planExerciseId] || [];
  
  // Recarregar placeholders quando o exercício é visualizado (se não existirem ou estiverem vazios)
  useEffect(() => {
    if (planExerciseId && activeWorkout && authState.token && (!placeholders || placeholders.length === 0)) {
      // Recarregar placeholders apenas para este exercício
      if (reloadPlaceholdersForActiveWorkout) {
        reloadPlaceholdersForActiveWorkout(planExerciseId);
      }
    }
  }, [planExerciseId, activeWorkout?.id]); // Recarregar quando exercício ou treino muda

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

  const handleMaterialChange = (e) => {
    const value = e.target.value;
    setMaterialUsed(value);
    if (planExerciseId && updateSetData) {
      updateSetData(planExerciseId, 1, 'materialUsed', value);
    }
  };

  return (
    <CardContainer>
      {displayName && (
        <CardHeader>
          <ExerciseName>{displayName}</ExerciseName>
        </CardHeader>
      )}

      {lastPerformance?.materialUsed && (
        <LastMaterialHint>Da última vez usaste: {lastPerformance.materialUsed}</LastMaterialHint>
      )}

      <MaterialLabel htmlFor={`material-${planExerciseId}`}>Material / Observações (opcional)</MaterialLabel>
      <MaterialInput
        id={`material-${planExerciseId}`}
        type="text"
        placeholder="Ex.: Haltere 12kg, elástico vermelho..."
        value={materialUsed}
        onChange={handleMaterialChange}
      />
      
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