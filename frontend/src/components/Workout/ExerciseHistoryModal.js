import React from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';

// --- Styled Components para o Modal ---

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1300; // Z-index muito alto para ficar por cima de tudo
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 25px;
  border-radius: ${({ theme }) => theme.borderRadius};
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  border-top: 4px solid ${({ theme }) => theme.colors.primary};
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.4rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const HistoryList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const HistoryItem = styled.li`
  display: flex;
  justify-content: space-between;
  padding: 12px 5px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  font-size: 1rem;

  &:last-child {
    border-bottom: none;
  }
`;

const DateColumn = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
`;

const PerformanceColumn = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMain};
`;

const LoadingText = styled.p`
  text-align: center;
  padding: 20px;
  color: ${({ theme }) => theme.colors.primary};
`;

const NoDataText = styled.p`
  text-align: center;
  padding: 20px;
  color: ${({ theme }) => theme.colors.textMuted};
`;


// --- Componente do Modal ---

const ExerciseHistoryModal = ({ isOpen, onClose, data, isLoading, exerciseName }) => {
  if (!isOpen) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Histórico de {exerciseName}</h2>
          <CloseButton onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>

        {isLoading ? (
          <LoadingText>A carregar histórico...</LoadingText>
        ) : !data || data.length === 0 ? (
          <NoDataText>Nenhum registo encontrado para este exercício.</NoDataText>
        ) : (
          <HistoryList>
            {data.map(log => (
              <HistoryItem key={log.id}>
                <DateColumn>{formatDate(log.performedAt)}</DateColumn>
                <PerformanceColumn>
                  {(log.performedWeight ?? log.weightKg)} kg x {(log.performedReps ?? log.reps)} reps
                </PerformanceColumn>
              </HistoryItem>
            ))}
          </HistoryList>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default ExerciseHistoryModal;