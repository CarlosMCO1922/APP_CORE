import { screen, waitFor } from '@testing-library/react';
import App from './App';
import { renderWithProviders } from './test-utils/renderWithProviders';

it('redirects unauthenticated users to login and shows Entrar button', async () => {
  renderWithProviders(<App />, { route: '/dashboard' });
  expect(await screen.findByRole('button', { name: /entrar/i })).toBeInTheDocument();
});

it('navigates authenticated user to dashboard (no Entrar button)', async () => {
  window.localStorage.setItem('userToken', 'test-token');
  window.localStorage.setItem('userData', JSON.stringify({ role: 'user' }));
  renderWithProviders(<App />, { route: '/' });
  await waitFor(() => expect(screen.queryByRole('button', { name: /entrar/i })).not.toBeInTheDocument());
});
