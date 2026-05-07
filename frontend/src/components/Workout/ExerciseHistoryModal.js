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
  background-color: rgba(0, 0, 0, 0.68);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1300; // Z-index muito alto para ficar por cima de tudo

  @keyframes overlayIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  animation: overlayIn 140ms ease-out;
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 18px 18px 12px;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  border-top: 6px solid ${({ theme }) => theme.colors.primary};
  box-shadow: 0 18px 55px rgba(0,0,0,0.55);

  @keyframes modalIn {
    from { transform: translateY(8px) scale(0.99); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
  }
  animation: modalIn 160ms ease-out;

  /* scroll mais elegante */
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 999px; }
  &::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.6rem;
    font-weight: 900;
    letter-spacing: 0.01em;
    line-height: 1.15;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.55rem;
  cursor: pointer;
  padding: 6px;
  line-height: 1;
  &:hover {
    color: ${({ theme }) => theme.colors.textMain};
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
  padding: 14px 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  font-size: 1rem;
  border-radius: 12px;

  &:hover {
    background: ${({ theme }) => theme.colors.hoverRowBg};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const DateColumn = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.95rem;
  font-weight: 600;
`;

const PerformanceColumn = styled.span`
  font-weight: 800;
  color: ${({ theme }) => theme.colors.textMain};
  text-align: right;
  letter-spacing: 0.01em;
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

  const formatWeight = (value) => {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof n !== 'number' || Number.isNaN(n)) return null;
    return n.toFixed(2);
  };

  const formatReps = (value) => {
    const n = typeof value === 'string' ? parseInt(value, 10) : value;
    if (typeof n !== 'number' || Number.isNaN(n)) return null;
    return String(n);
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
            {data.map((log) => {
              const weight = formatWeight(log.performedWeight ?? log.weightKg);
              const reps = formatReps(log.performedReps ?? log.reps);
              return (
              <HistoryItem key={log.id}>
                <DateColumn>{formatDate(log.performedAt)}</DateColumn>
                <PerformanceColumn>
                  {weight ?? '—'} kg × {reps ?? '—'} reps
                </PerformanceColumn>
              </HistoryItem>
              );
            })}
          </HistoryList>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default ExerciseHistoryModal;