import React, { useState } from 'react';
import styled from 'styled-components';
import { FaPlus, FaLink, FaHistory } from 'react-icons/fa';
import SetRow from './SetRow'; // Reutilizamos o seu componente de série!

// --- Styled Components ---
const SupersetContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 40px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
`;

const SupersetHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.primary};
`;

const SupersetTitle = styled.h2`
  font-size: 1.3rem;
  margin: 0;
  color: ${({ theme }) => theme.colors.primary};
`;

const SetsGridHeader = styled.div`
  display: grid;
  grid-template-columns: 50px 1fr 1fr 60px;
  gap: 10px;
  padding: 0 10px;
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.7rem; font-weight: 600; text-transform: uppercase; text-align: center;
  span:first-child { text-align: left; }
`;

const ExerciseGroup = styled.div` margin-bottom: 20px; `;
const ExerciseName = styled.h3` font-size: 1.1rem; margin-bottom: 10px; color: ${({ theme }) => theme.colors.textMain};`;
const AddSetButton = styled.button` background-color: transparent; color: ${({ theme }) => theme.colors.textMuted}; padding: 10px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; margin-top: 15px; transition: all 0.2s; display: block; width: 100%; text-align: center; &:hover { background-color: ${({ theme }) => theme.colors.cardBackground}; color: ${({ theme }) => theme.colors.primary}; }`;
const LastPerformance = styled.p` font-size: 0.8rem; color: ${({ theme }) => theme.colors.textMuted}; margin-top: -10px; margin-bottom: 15px; display: flex; align-items: center; gap: 6px; `;


const SupersetCard = ({ group, trainingId, workoutPlanId, onSetComplete }) => {
  // O 'group' é um array de objetos planExercise
  const initialSetsCount = group && group.length > 0 ? group[0].sets || 1 : 1;
  const [setsCount, setSetsCount] = useState(initialSetsCount); // Controla quantas "rondas" da supersérie existem

  const handleAddRound = () => {
    setSetsCount(prev => prev + 1);
  };

  return (
    <SupersetContainer>
      <SupersetHeader>
        <FaLink size="1.5em" />
        <SupersetTitle>
          {group.map(p => p.exerciseDetails.name).join(' + ')}
        </SupersetTitle>
      </SupersetHeader>
      
      <SetsGridHeader>
        <span>Série</span><span>KG</span><span>Reps</span><span></span>
      </SetsGridHeader>

      {/* O loop agora vai renderizar o número correto de rondas */}
      {Array.from({ length: setsCount }).map((_, roundIndex) => (
        <div key={roundIndex} style={{ 
            marginBottom: '25px', 
            borderBottom: roundIndex < setsCount - 1 ? '1px solid #333' : 'none', 
            paddingBottom: '15px' 
        }}>
          {group.map((planExercise) => (
            <ExerciseGroup key={planExercise.id}>
               <SetRow
                  key={`${planExercise.id}-${roundIndex}`}
                  setId={`superset-${planExercise.id}-${roundIndex}`}
                  setNumber={roundIndex + 1}
                  planExerciseId={planExercise.id}
                  trainingId={trainingId}
                  workoutPlanId={workoutPlanId}
                  onSetComplete={onSetComplete}
                  restSeconds={planExercise.restSeconds}
                  onDeleteSet={() => { /* Lógica para apagar uma ronda inteira */ }}
                />
            </ExerciseGroup>
          ))}
        </div>
      ))}

      <AddSetButton onClick={handleAddRound}>
        <FaPlus /> Adicionar Ronda de Supersérie
      </AddSetButton>
    </SupersetContainer>
  );
};

export default SupersetCard;