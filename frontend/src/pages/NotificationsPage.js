// src/pages/NotificationsPage.js
import React, { useEffect, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FaBell, FaCheckDouble, FaArrowLeft, FaExternalLinkAlt, FaRegClock } from 'react-icons/fa';



// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 25px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
`;

const Title = styled.h1`
  font-size: clamp(2rem, 5vw, 2.8rem);
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 25px;
  padding: 9px 16px;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background-color 0.2s, color 0.2s;
  font-size: 0.95rem;

  &:hover {
    background-color: ${({ theme }) => theme.colors.cardBackground};
    color: ${({ theme }) => theme.colors.textMain};
  }
`;

const NotificationListContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: clamp(15px, 3vw, 25px);
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const NotificationItem = styled.div`
  background-color: ${props => props.$isRead ? props.theme.colors.cardBackground : props.theme.colors.cardBackgroundDarker};
  padding: 15px;
  margin-bottom: 12px;
  border-radius: 8px;
  /* LINHA 70 CORRIGIDA */
  border-left: 4px solid ${props => props.$isRead ? props.theme.colors.textMuted : props.theme.colors.primary};
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
    border-left-color: ${({ theme }) => theme.colors.primary};
  }

  p {
    margin: 0 0 8px 0;
    font-size: 0.9rem;
    line-height: 1.5;
    /* LINHA 87 CORRIGIDA */
    color: ${props => props.$isRead ? props.theme.colors.textMuted : props.theme.colors.textMain};
  }

  small {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.textMuted};
    display: flex;
    align-items: center;
    gap: 5px;
  }
`;

const MarkAllReadButtonStyled = styled.button`
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  color: ${({ theme }) => theme.colors.textMain};
  padding: 8px 15px;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: background-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 25px;
  gap: 10px;

  button {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textDark};
    padding: 8px 15px;
    border: none;
    border-radius: ${({ theme }) => theme.borderRadius};
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.primaryHover};
    }
    &:disabled {
      background-color: ${({ theme }) => theme.colors.disabledBg};
      color: ${({ theme }) => theme.colors.disabledText};
      cursor: not-allowed;
    }
  }
  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.9rem;
  }
`;

const LoadingText = styled.p`
  text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.primary};
  padding: 20px; font-style: italic;
`;
const ErrorText = styled.p`
  text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.error};
  padding: 15px; background-color: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius}; margin: 20px 0;
`;
const EmptyStateText = styled.p`
  text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.textMuted};
  padding: 30px 15px; background-color: rgba(0,0,0,0.1);
  border-radius: ${({ theme }) => theme.borderRadius};
`;

const NotificationsPage = () => {
  const theme = useTheme();
  const { authState } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    currentPage,
    totalPages,
    isLoading,
    error,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotifications();

  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchNotifications(1, ITEMS_PER_PAGE, null);
    }
  }, [authState.isAuthenticated, fetchNotifications]);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchNotifications(newPage, ITEMS_PER_PAGE, null);
    }
  };

  const handleMarkAllReadClick = async () => {
      await markAllNotificationsAsRead();
      fetchNotifications(currentPage, ITEMS_PER_PAGE, null);
  };

  return (
    <PageContainer>
      <BackLink to={authState.role === 'user' ? "/dashboard" : "/admin/dashboard"}>
        ‹
      </BackLink>
      <HeaderContainer>
        <Title><FaBell /> Minhas Notificações</Title>
        {notifications.length > 0 && unreadCount > 0 && (
          <MarkAllReadButtonStyled onClick={handleMarkAllReadClick} disabled={isLoading || unreadCount === 0}>
            <FaCheckDouble /> Marcar todas como lidas ({unreadCount})
          </MarkAllReadButtonStyled>
        )}
      </HeaderContainer>

      {isLoading && notifications.length === 0 && <LoadingText>A carregar notificações...</LoadingText>}
      {error && <ErrorText>{error}</ErrorText>}

      {!isLoading && !error && notifications.length === 0 && (
        <EmptyStateText>Não tem notificações de momento.</EmptyStateText>
      )}

      {!error && notifications.length > 0 && (
        <NotificationListContainer>
          {notifications.map(notif => (
            <NotificationItem
              key={notif.id}
              $isRead={notif.isRead}
              onClick={() => handleNotificationClick(notif)}
              title={notif.isRead ? "Lida" : "Não lida. Clique para ler e aceder."}
            >
              <p>{notif.message}</p>
              <small>
                <FaRegClock /> {new Date(notif.createdAt).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}
                {notif.type && ` - Tipo: ${notif.type.replace(/_/g, ' ').toLowerCase()}`}
                {notif.link && <FaExternalLinkAlt style={{marginLeft: 'auto', color: theme.colors.primary}} title="Ir para"/>}
              </small>
            </NotificationItem>
          ))}
        </NotificationListContainer>
      )}

      {totalPages > 1 && (
        <PaginationControls>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || isLoading}>
            Anterior
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages || isLoading}>
            Próxima
          </button>
        </PaginationControls>
      )}
    </PageContainer>
  );
};

export default NotificationsPage;