import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import MyPaymentsPage from '../../pages/MyPaymentsPage';

import * as paymentService from '../../services/paymentService';

test('MyPaymentsPage shows empty state when no payments', async () => {
  window.localStorage.setItem('userToken', 't');
  window.localStorage.setItem('userData', JSON.stringify({ role: 'user' }));
  jest.spyOn(paymentService, 'clientGetMyPayments').mockResolvedValueOnce([]);
  renderWithProviders(<MyPaymentsPage />, { route: '/meus-pagamentos' });
  await waitFor(() => expect(screen.getByText(/Ainda não tens pagamentos registados/i)).toBeInTheDocument(), { timeout: 2000 });
});
