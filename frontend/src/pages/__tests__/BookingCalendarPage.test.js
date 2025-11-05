import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import BookingCalendarPage from '../../pages/BookingCalendarPage';

import * as staffService from '../../services/staffService';
import * as apptService from '../../services/appointmentService';

// Render with query param type=appointment
const renderWithRoute = (ui) => renderWithProviders(ui, { route: '/agendar?type=appointment' });

test('BookingCalendarPage loads professionals and shows message before selection', async () => {
  window.localStorage.setItem('userToken', 't');
  window.localStorage.setItem('userData', JSON.stringify({ role: 'user' }));
  jest.spyOn(staffService, 'getAllStaffForSelection').mockResolvedValueOnce([
    { id: '1', firstName: 'Ana', lastName: 'Silva', role: 'physiotherapist' }
  ]);
  jest.spyOn(apptService, 'getAvailableSlotsForProfessional').mockResolvedValueOnce(['09:00', '14:00']);

  renderWithRoute(<BookingCalendarPage />);
  // Initially loads staff and renders selector
  const select = await screen.findByLabelText(/Selecione o Profissional/i);
  expect(select).toBeInTheDocument();
  // Select professional
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
// After selecting, slots will be loaded (mock returns two slots)
  await waitFor(() => expect(screen.getByText('09:00')).toBeInTheDocument());
  expect(screen.getByText('14:00')).toBeInTheDocument();
});
