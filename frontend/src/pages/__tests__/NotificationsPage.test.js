import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import NotificationsPage from '../../pages/NotificationsPage';

// Mock NotificationContext hook to control data and capture calls
jest.mock('../../context/NotificationContext', () => {
  const actual = jest.requireActual('../../context/NotificationContext');
  return { ...actual, useNotifications: jest.fn() };
});

// Mock service used for bulk mark selected
jest.mock('../../services/notificationService', () => ({
  markNotificationAsReadService: jest.fn(async () => ({}))
}));

import { useNotifications } from '../../context/NotificationContext';
import { markNotificationAsReadService } from '../../services/notificationService';

const baseNotifications = [
  { id: 1, message: 'Nova consulta disponível', isRead: false, createdAt: new Date().toISOString() },
  { id: 2, message: 'Treino marcado', isRead: true, createdAt: new Date().toISOString() }
];

const makeHook = (overrides = {}) => ({
  notifications: baseNotifications,
  unreadCount: 1,
  currentPage: 1,
  totalPages: 3,
  isLoading: false,
  error: '',
  fetchNotifications: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  refreshNotifications: jest.fn(),
  loadMore: jest.fn(),
  ...overrides,
});

describe('NotificationsPage interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('changes filter to Unread and fetches with status', async () => {
    const hook = makeHook();
    useNotifications.mockReturnValue(hook);

    renderWithProviders(<NotificationsPage />, { route: '/notificacoes' });

    const select = await screen.findByLabelText(/Filtro de estado/i);
    fireEvent.change(select, { target: { value: 'unread' } });

    await waitFor(() => {
      expect(hook.fetchNotifications).toHaveBeenCalledWith(1, expect.any(Number), 'unread');
    });
  });

  test('bulk mark selected as read calls service for unchecked items', async () => {
    const hook = makeHook();
    useNotifications.mockReturnValue(hook);

    // ensure token exists
    window.localStorage.setItem('userToken', 't');
    window.localStorage.setItem('userData', JSON.stringify({ role: 'user' }));

    renderWithProviders(<NotificationsPage />, { route: '/notificacoes' });

    // Select first (unread) notification
    const firstCheckbox = await screen.findByLabelText(/Selecionar notificação 1/i);
    fireEvent.click(firstCheckbox);

    const bulkBtn = screen.getByRole('button', { name: /Marcar selecionadas/i });
    fireEvent.click(bulkBtn);

    await waitFor(() => {
      expect(markNotificationAsReadService).toHaveBeenCalledWith(1, expect.anything());
    });
  });

  test('mark all read button triggers context action', async () => {
    const hook = makeHook();
    useNotifications.mockReturnValue(hook);

    renderWithProviders(<NotificationsPage />, { route: '/notificacoes' });

    const allBtn = await screen.findByRole('button', { name: /Marcar todas como lidas/i });
    fireEvent.click(allBtn);

    await waitFor(() => {
      expect(hook.markAllNotificationsAsRead).toHaveBeenCalled();
    });
  });

  test('opening an unread notification calls markNotificationAsRead', async () => {
    const hook = makeHook();
    useNotifications.mockReturnValue(hook);

    renderWithProviders(<NotificationsPage />, { route: '/notificacoes' });

    const notifItemText = await screen.findByText(/Nova consulta disponível/i);
    // Click on the container div (the text is inside clickable area)
    fireEvent.click(notifItemText);

    await waitFor(() => {
      expect(hook.markNotificationAsRead).toHaveBeenCalledWith(1);
    });
  });
});
