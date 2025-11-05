// src/context/NotificationContext.js
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext'; 
import { useToast } from '../components/Toast/ToastProvider';
import {
  getMyNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService
} from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { authState } = useAuth();
  const { addToast } = useToast();
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
      if (page === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const merged = [...prev];
          data.notifications.forEach(n => { if (!existingIds.has(n.id)) merged.push(n); });
          return merged;
        });
      }
      setUnreadCount(data.unreadCount);
      setTotalNotifications(data.totalNotifications);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message || 'Falha ao buscar notificações.');
      console.error("NotificationContext fetchNotifications error:", err);
      addToast('Falha ao carregar notificações.', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [authState.token, addToast]);

  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchNotifications(1, 10, 'unread');
    } else {
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
      addToast('Todas as notificações foram marcadas como lidas.', { type: 'success' });
      fetchNotifications(1, 10, 'unread');
    } catch (err) {
      console.error("Erro ao marcar todas as notificações como lidas:", err);
      addToast('Falha ao marcar todas como lidas.', { type: 'error' });
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
    hasUnread: unreadCount > 0,
    refreshNotifications: () => fetchNotifications(1, 10, 'unread'),
    loadMore: () => {
      if (!isLoading && currentPage < totalPages) return fetchNotifications(currentPage + 1, 10, 'unread');
    }
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};