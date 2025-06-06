// src/context/NotificationContext.js
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext'; 
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
      if (page === 1) {
        setNotifications(data.notifications);
      } else {
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
    refreshNotifications: () => fetchNotifications(1, 10, 'unread') 
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};