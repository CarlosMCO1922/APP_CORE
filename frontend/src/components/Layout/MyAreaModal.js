// src/components/Layout/MyAreaModal.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { FaChartLine, FaMoneyBillWave, FaCog, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import ConfirmationModal from '../Common/ConfirmationModal';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.overlayBg};
  z-index: 1100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
  
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
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 100%;
  max-height: 70vh;
  overflow-y: auto;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  padding-bottom: max(env(safe-area-inset-bottom), 20px);
  
  @keyframes slideUp {
    from {
      transform: translateY(100%);
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
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  position: sticky;
  top: 0;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  z-index: 10;
`;

const ModalTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  min-width: 44px;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  
  &:hover, &:active {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
    color: ${({ theme }) => theme.colors.textMain};
  }
`;

const MenuList = styled.div`
  padding: 10px 0;
`;

const MenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.textMain};
  transition: all 0.2s ease;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover, &:active {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
    color: ${({ theme }) => theme.colors.primary};
  }
  
  svg {
    font-size: 1.3rem;
    color: ${({ theme }) => theme.colors.primary};
    flex-shrink: 0;
  }
  
  span {
    font-size: 1rem;
    font-weight: 500;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  text-decoration: none;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  color: ${({ theme }) => theme.colors.error};
  transition: all 0.2s ease;
  border-top: 2px solid ${({ theme }) => theme.colors.cardBorder};
  border-bottom: none;
  min-height: 44px;
  cursor: pointer;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  margin-top: 8px;
  
  &:hover, &:active {
    background-color: ${({ theme }) => theme.colors.errorBg || 'rgba(255, 107, 107, 0.1)'};
    color: ${({ theme }) => theme.colors.error};
  }
  
  svg {
    font-size: 1.3rem;
    color: ${({ theme }) => theme.colors.error};
    flex-shrink: 0;
  }
  
  span {
    font-size: 1rem;
    font-weight: 500;
  }
`;

function MyAreaModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);

  if (!isOpen) return null;

  const menuItems = [
    {
      path: '/meu-progresso-detalhado',
      icon: FaChartLine,
      label: 'Progresso'
    },
    {
      path: '/meus-pagamentos',
      icon: FaMoneyBillWave,
      label: 'Pagamentos'
    },
    {
      path: '/definicoes',
      icon: FaCog,
      label: 'Definições'
    }
  ];

  const handleItemClick = (path) => {
    onClose();
    // Pequeno delay para animação suave
    setTimeout(() => {
      navigate(path);
    }, 200);
  };

  const handleLogout = () => {
    setShowLogoutConfirmModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirmModal(false);
    onClose();
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 200);
  };

  return (
    <Overlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Minha área</ModalTitle>
          <CloseButton onClick={onClose} aria-label="Fechar">
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        <MenuList>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <MenuItem
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleItemClick(item.path);
                }}
              >
                <Icon />
                <span>{item.label}</span>
              </MenuItem>
            );
          })}
          <LogoutButton onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Sair</span>
          </LogoutButton>
        </MenuList>
      </ModalContent>

      <ConfirmationModal
        isOpen={showLogoutConfirmModal}
        onClose={() => setShowLogoutConfirmModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Sair da Conta"
        message="Tem a certeza que quer sair da sua conta?"
        confirmText="Sair"
        cancelText="Cancelar"
        danger={false}
        loading={false}
      />
    </Overlay>
  );
}

export default MyAreaModal;


