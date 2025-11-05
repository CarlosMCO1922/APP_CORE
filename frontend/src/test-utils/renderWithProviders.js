import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { CustomThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { WorkoutProvider } from '../context/WorkoutContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ToastProvider } from '../components/Toast/ToastProvider';

export const renderWithProviders = (ui, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <CustomThemeProvider>
        <AuthProvider>
          <WorkoutProvider>
            <ToastProvider>
              <NotificationProvider>
                {ui}
              </NotificationProvider>
            </ToastProvider>
          </WorkoutProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </MemoryRouter>
  );
};
