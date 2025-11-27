// src/pages/UserCalendarPage.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import 'moment/locale/pt';

import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/userService';
import { cancelTrainingBooking } from '../services/trainingService';
import { cancelAppointmentBooking } from '../services/appointmentService';

import BackArrow from '../components/BackArrow';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 25px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
`;


const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.2rem);
  color: ${({ theme }) => theme.colors.primary};
`;

const CalendarWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: clamp(20px, 3vw, 30px);
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  height: 80vh;

  .rbc-toolbar {
    margin-bottom: 20px;
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;
    padding-bottom: 12px; border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  }
  .rbc-btn-group button { color: ${({ theme }) => theme.colors.textMuted}; background: ${({ theme }) => theme.colors.buttonSecondaryBg}; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
  .rbc-btn-group button:hover, .rbc-toolbar button.rbc-active { background: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.textDark}; border-color: ${({ theme }) => theme.colors.primary}; }
  .rbc-toolbar-label { color: ${({ theme }) => theme.colors.primary}; font-weight: 600; font-size: clamp(1.2rem, 3vw, 1.6rem); }

  .rbc-header { border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder}; color: ${({ theme }) => theme.colors.textMuted}; background: ${({ theme }) => theme.colors.cardBackground}; text-transform: capitalize; }
  .rbc-time-slot, .rbc-day-slot .rbc-time-slot { border-top: 1px dotted ${({ theme }) => theme.colors.cardBorder}; }
  .rbc-time-header-gutter, .rbc-time-gutter { background: ${({ theme }) => theme.colors.background}; border-right: 1px solid ${({ theme }) => theme.colors.cardBorder}; }
  .rbc-day-bg + .rbc-day-bg { border-left: 1px solid ${({ theme }) => theme.colors.cardBorder}80; }
  .rbc-today { background-color: ${({ theme }) => theme.colors.primaryFocusRing}; }

  .rbc-event, .rbc-day-slot .rbc-event { border: none; border-radius: 6px; padding: 4px 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.35); }
`;

const LoadingText = styled.p`
  text-align: center; color: ${({ theme }) => theme.colors.primary};
`;
const ErrorText = styled.p`
  text-align: center; color: ${({ theme }) => theme.colors.error}; background: ${({ theme }) => theme.colors.errorBg}; border: 1px solid ${({ theme }) => theme.colors.error}; padding: 10px; border-radius: 8px;
`;
const NoItemsText = styled.p`
  text-align: center; color: ${({ theme }) => theme.colors.textMuted};
`;

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center; z-index: 2000;
`;
const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 10px; width: 100%; max-width: 520px; padding: 22px;
`;
const ModalTitle = styled.h3`
  margin: 0 0 10px 0; color: ${({ theme }) => theme.colors.primary};
`;
const ModalText = styled.p`
  margin: 6px 0; color: ${({ theme }) => theme.colors.textMuted};
`;
const ModalActions = styled.div`
  display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px;
`;
const ModalButton = styled.button`
  background: ${p => p.danger ? p.theme.colors.error : (p.primary ? p.theme.colors.primary : p.theme.colors.buttonSecondaryBg)};
  color: ${p => p.danger || p.primary ? 'white' : p.theme.colors.textMain};
  border: none; border-radius: 6px; padding: 10px 14px; cursor: pointer; font-weight: 600;
  &:disabled { opacity: .6; cursor: not-allowed; }
`;
const ModalLink = styled(Link)`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 6px;
  padding: 10px 14px;
  text-decoration: none;
  font-weight: 600;
`;

export default function UserCalendarPage() {
  const theme = useTheme();
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState({ trainings: [], appointments: [] });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const fetchData = useCallback(async () => {
    if (!authState.token) return;
    setLoading(true);
    setError('');
    try {
      const data = await getMyBookings(authState.token);
      setBookings({
        trainings: data.trainings || [],
        appointments: data.appointments || [],
      });
    } catch (e) {
      setError(e.message || 'Não foi possível carregar o calendário.');
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const events = useMemo(() => {
    const makeDate = (date, time) => moment(`${date}T${time}`, moment.ISO_8601, true).isValid()
      ? moment(`${date}T${time}`).toDate()
      : new Date(`${date}T${time}`);

    const trainingEvents = (bookings.trainings || []).map(t => {
      const start = makeDate(t.date, t.time);
      const end = moment(start).add(t.durationMinutes || 60, 'minutes').toDate();
      return {
        id: `train-${t.id}`,
        title: t.name || 'Treino',
        start,
        end,
        resource: { type: 'training', raw: t },
        allDay: false,
      };
    });

    const appointmentEvents = (bookings.appointments || []).map(a => {
      const start = makeDate(a.date, a.time);
      const end = moment(start).add(a.durationMinutes || 60, 'minutes').toDate();
      return {
        id: `appt-${a.id}`,
        title: a.title || 'Consulta',
        start,
        end,
        resource: { type: 'appointment', raw: a },
        allDay: false,
      };
    });

    return [...trainingEvents, ...appointmentEvents];
  }, [bookings]);

  const onSelectEvent = useCallback((evt) => {
    setSelectedEvent(evt);
    setModalMessage('');
    setModalOpen(true);
  }, []);

  const handleCancel = useCallback(async () => {
    if (!selectedEvent) return;
    try {
      setActionLoading(true);
      const type = selectedEvent.resource?.type;
      if (type === 'training') {
        await cancelTrainingBooking(selectedEvent.resource.raw.id, authState.token);
      } else if (type === 'appointment') {
        await cancelAppointmentBooking(selectedEvent.resource.raw.id, authState.token);
      }
      setModalMessage('Cancelado com sucesso.');
      await fetchData();
    } catch (e) {
      setModalMessage(e.message || 'Falhou ao cancelar.');
    } finally {
      setActionLoading(false);
    }
  }, [selectedEvent, authState.token, fetchData]);

  const eventPropGetter = useCallback((event) => {
    const type = event.resource?.type;
    const base = {
      style: {
        backgroundColor: theme.colors.primary,
        color: theme.colors.textDark,
        borderRadius: 6,
        border: 'none',
      }
    };
    if (type === 'appointment') {
      base.style.backgroundColor = '#2e7d32'; // green-ish for appointments
    }
    return base;
  }, [theme]);

  return (
    <PageContainer>
      <Header>
        <BackArrow to="/dashboard" />
        <Title>Treinos/Consultas</Title>
      </Header>

      {error && <ErrorText>{error}</ErrorText>}

      <CalendarWrapper>
        {loading ? (
          <LoadingText>A carregar…</LoadingText>
        ) : events.length === 0 ? (
          <NoItemsText>Sem treinos ou consultas.</NoItemsText>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            defaultView={Views.WEEK}
            step={30}
            messages={{
              month: 'Mês', week: 'Semana', day: 'Dia', today: 'Hoje', agenda: 'Agenda',
              previous: 'Anterior', next: 'Seguinte', noEventsInRange: 'Sem eventos neste intervalo.'
            }}
            eventPropGetter={eventPropGetter}
            onSelectEvent={onSelectEvent}
            tooltipAccessor={(e) => {
              const r = e.resource?.raw || {};
              const who = r.instructor?.firstName || r.professional?.firstName || '';
              return `${e.title} · ${moment(e.start).format('DD/MM HH:mm')} - ${moment(e.end).format('HH:mm')}${who ? ` · ${who}` : ''}`;
            }}
          />
        )}
      </CalendarWrapper>

      {modalOpen && selectedEvent && (
        <ModalOverlay onClick={() => setModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>{selectedEvent.title}</ModalTitle>
            <ModalText><strong>Quando:</strong> {moment(selectedEvent.start).format('dddd, D/MM/YYYY HH:mm')} - {moment(selectedEvent.end).format('HH:mm')}</ModalText>
            {selectedEvent.resource?.raw?.instructor && (
              <ModalText><strong>Instrutor:</strong> {selectedEvent.resource.raw.instructor.firstName}</ModalText>
            )}
            {selectedEvent.resource?.raw?.professional && (
              <ModalText><strong>Profissional:</strong> {selectedEvent.resource.raw.professional.firstName} {selectedEvent.resource.raw.professional.lastName || ''}</ModalText>
            )}
            {modalMessage && <ModalText style={{ color: modalMessage.includes('sucesso') ? '#4caf50' : '#ff6b6b' }}>{modalMessage}</ModalText>}
            {(() => {
              const now = new Date();
              const st = selectedEvent.resource?.raw?.status;
              const finalStatuses = ['cancelada_pelo_cliente','cancelada_pelo_staff','rejeitada_pelo_staff','concluída','não_compareceu'];
              const canCancel = selectedEvent.start > now && (!st || !finalStatuses.includes(st));
              return (
                <>
                  {!canCancel && (
                    <ModalText style={{ color: '#FF6B6B' }}>
                      Cancelamento indisponível: evento passado ou com estado finalizado.
                    </ModalText>
                  )}
                  <ModalActions>
                    <ModalButton onClick={() => setModalOpen(false)}>Fechar</ModalButton>
                    {selectedEvent.resource?.type === 'training' && (
                      <ModalLink to={`/treinos/${selectedEvent.resource.raw.id}/plano`}>Ver Plano</ModalLink>
                    )}
                    {canCancel && (
                      <ModalButton danger onClick={handleCancel} disabled={actionLoading}>
                        {actionLoading ? 'A cancelar...' : 'Cancelar marcação'}
                      </ModalButton>
                    )}
                  </ModalActions>
                </>
              );
            })()}
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
}
