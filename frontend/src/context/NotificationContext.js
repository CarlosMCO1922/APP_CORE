// src/context/NotificationContext.js
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext'; // Para aceder ao token e status de autenticação
import {
  getMyNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService
} from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { authState } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async (page = 1, limit = 10, status = null) => {
    if (!authState.token) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await getMyNotificationsService(authState.token, page, limit, status);
      // Se for a primeira página de "todos" ou "não lidos", atualiza a lista principal e contagem.
      // Se for uma página específica de "lidos" ou outra página de "não lidos", pode querer tratar diferente.
      // Por simplicidade, se for a primeira página, atualiza tudo.
      if (page === 1) {
        setNotifications(data.notifications);
      } else {
        // Para paginação, se quiser adicionar à lista existente (load more)
        // setNotifications(prev => [...prev, ...data.notifications]);
        // Ou substituir se for uma página diferente
        setNotifications(data.notifications);
      }
      setUnreadCount(data.unreadCount);
      setTotalNotifications(data.totalNotifications);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message || 'Falha ao buscar notificações.');
      console.error("NotificationContext fetchNotifications error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authState.token]);

  // Fetch inicial de notificações não lidas quando o utilizador está autenticado
  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchNotifications(1, 10, 'unread'); // Ou buscar todas e depois contar as não lidas no frontend
    } else {
      // Limpar notificações se o utilizador fizer logout
      setNotifications([]);
      setUnreadCount(0);
      setTotalNotifications(0);
      setCurrentPage(1);
      setTotalPages(1);
    }
  }, [authState.isAuthenticated, fetchNotifications]);


  const markNotificationAsRead = async (notificationId) => {
    if (!authState.token) return;
    try {
      await markNotificationAsReadService(notificationId, authState.token);
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prevCount => (prevCount > 0 ? prevCount - 1 : 0));
    } catch (err) {
      console.error("Erro ao marcar notificação como lida:", err);
      // Pode querer mostrar um erro para o utilizador
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!authState.token || unreadCount === 0) return;
    try {
      await markAllNotificationsAsReadService(authState.token);
      setNotifications(prevNotifications =>
        prevNotifications.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      // Talvez re-fetch para garantir consistência se a lista mostrada for apenas não lidas
      fetchNotifications(1, 10, 'unread');
    } catch (err) {
      console.error("Erro ao marcar todas as notificações como lidas:", err);
    }
  };

  const value = {
    notifications,
    unreadCount,
    totalNotifications,
    currentPage,
    totalPages,
    isLoading,
    error,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshNotifications: () => fetchNotifications(1, 10, 'unread') // Exemplo de refresh
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};