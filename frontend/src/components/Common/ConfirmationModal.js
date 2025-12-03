// src/components/Common/ConfirmationModal.js
import React from 'react';
import styled from 'styled-components';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.overlayBg || 'rgba(0, 0, 0, 0.75)'};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.modalBg || theme.colors.cardBackground || '#2A2A2A'};
  border-radius: 10px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
  position: relative;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border-top: 3px solid ${({ theme, danger }) => 
    danger ? (theme.colors.error || '#e74c3c') : (theme.colors.primary || '#4CAF50')
  };
  
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 15px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder || 'rgba(255, 255, 255, 0.1)'};
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMain || '#FFFFFF'};
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted || '#999'};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  min-width: 32px;
  min-height: 32px;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.cardBorder || 'rgba(255, 255, 255, 0.1)'};
    color: ${({ theme }) => theme.colors.textMain || '#FFFFFF'};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  color: ${({ theme }) => theme.colors.textMain || '#FFFFFF'};
  line-height: 1.6;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  
  svg {
    font-size: 1.5rem;
    color: ${({ theme, danger }) => 
      danger ? (theme.colors.error || '#e74c3c') : (theme.colors.warning || '#f39c12')
    };
    flex-shrink: 0;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 15px 20px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder || 'rgba(255, 255, 255, 0.1)'};
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  min-width: 100px;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  ${props => {
    if (props.primary) {
      return `
        background-color: ${props.theme.colors.primary || '#4CAF50'};
        color: white;
        &:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `;
    }
    if (props.danger) {
      return `
        background-color: ${props.theme.colors.error || '#e74c3c'};
        color: white;
        &:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `;
    }
    return `
      background-color: ${props.theme.colors.buttonSecondaryBg || '#555'};
      color: ${props.theme.colors.textMain || '#FFFFFF'};
      &:hover:not(:disabled) {
        background-color: ${props.theme.colors.buttonSecondaryBgHover || '#666'};
      }
    `;
  }}
`;

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirmar ação',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false,
  loading = false
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent onClick={(e) => e.stopPropagation()} danger={danger}>
        <ModalHeader>
          <ModalTitle>
            <IconContainer danger={danger}>
              <FaExclamationTriangle />
            </IconContainer>
            {title}
          </ModalTitle>
          <CloseButton onClick={onClose} disabled={loading}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          {message}
        </ModalBody>
        <ModalActions>
          <ModalButton onClick={onClose} disabled={loading}>
            {cancelText}
          </ModalButton>
          <ModalButton 
            onClick={handleConfirm} 
            primary={!danger} 
            danger={danger}
            disabled={loading}
          >
            {loading ? 'A processar...' : confirmText}
          </ModalButton>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ConfirmationModal;

