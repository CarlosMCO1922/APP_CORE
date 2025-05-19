// src/pages/CalendarPage.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useAuth } from '../context/AuthContext';
import {
    getAllTrainings,
    bookTraining as bookTrainingService,
    cancelTrainingBooking as cancelTrainingBookingService
} from '../services/trainingService';
import {
    getAllAppointments,
    bookAppointment as bookAppointmentService,
    cancelAppointmentBooking as cancelAppointmentBookingService,
    clientRequestNewAppointment
} from '../services/appointmentService';
import { getAllStaffForSelection } from '../services/staffService';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

// --- Styled Components (Mantidos os mesmos da tua versão anterior) ---
const PageContainer = styled.div` background-color: #1A1A1A; color: #E0E0E0; min-height: 100vh; padding: 20px 30px; font-family: 'Inter', sans-serif; `;
const Title = styled.h1` font-size: 2.3rem; color: #D4AF37; margin-bottom: 25px; text-align: center; `;
const CalendarWrapper = styled.div`
  background-color: #252525;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  height: 80vh;

  .rbc-toolbar { margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
  .rbc-btn-group button { color: #D4AF37; background-color: #333; border: 1px solid #D4AF37; padding: 6px 12px; border-radius: 5px; margin: 0 2px; transition: background-color 0.2s, color 0.2s; cursor: pointer; &:hover, &:focus { background-color: #D4AF37; color: #1A1A1A; } }
  .rbc-toolbar button.rbc-active { background-color: #D4AF37; color: #1A1A1A; }
  .rbc-toolbar-label { color: #D4AF37; font-size: 1.6em; font-weight: bold; text-align: center; flex-grow: 1; }
  .rbc-header { border-bottom: 1px solid #4A4A4A; color: #D4AF37; padding: 10px 0; text-align: center; font-weight: 500; }
  .rbc-event, .rbc-day-slot .rbc-event { background-color: #D4AF37; color: #1A1A1A; border: none; border-radius: 4px; padding: 4px 6px; font-size: 0.85em; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
  .rbc-event.rbc-selected { background-color: #b89b2e; }
  .rbc-agenda-event-cell, .rbc-time-slot, .rbc-day-slot .rbc-time-slot { border-top: 1px solid #383838; }
  .rbc-time-gutter .rbc-timeslot-group { border-bottom: none; }
  .rbc-time-header-gutter, .rbc-time-gutter { background: #2a2a2a; }
  .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #383838; }
  .rbc-month-row + .rbc-month-row { border-top: 1px solid #383838; }
  .rbc-today { background-color: #3a3a3aAA; }
`;
const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.75); display: flex; justify-content: center; align-items: center; z-index: 1050; `;
const ModalContent = styled.div` background-color: #2C2C2C; padding: 30px 40px; border-radius: 10px; width: 100%; max-width: 550px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); position: relative; color: #E0E0E0; max-height: 90vh; overflow-y: auto;`;
const ModalTitle = styled.h2` color: #D4AF37; margin-top: 0; margin-bottom: 20px; font-size: 1.6rem; `;
const ModalDetail = styled.p` margin: 10px 0; font-size: 1rem; span { font-weight: bold; color: #D4AF37; }`;
const ModalActions = styled.div` display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; `;
const ModalButton = styled.button` background-color: ${props => props.danger ? '#D32F2F' : (props.primary ? '#D4AF37' : '#555')}; color: ${props => props.danger ? 'white' : (props.primary ? '#1A1A1A' : '#E0E0E0')}; padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; transition: background-color 0.2s ease; &:hover { background-color: ${props => props.danger ? '#C62828' : (props.primary ? '#e6c358' : '#666')}; } &:disabled { background-color: #404040; color: #777; cursor: not-allowed; } `;
const CloseButton = styled.button` position: absolute; top: 15px; right: 15px; background: transparent; border: none; color: #aaa; font-size: 1.8rem; cursor: pointer; line-height: 1; padding: 0; &:hover { color: #fff; } `;
const LoadingText = styled.p` font-size: 1.2rem; text-align: center; padding: 30px; color: #D4AF37;`;
const ErrorText = styled.p` font-size: 1.1rem; text-align: center; padding: 10px; margin-bottom:10px; color: #FF6B6B; background-color: rgba(94, 46, 46, 0.3); border: 1px solid #FF6B6B; border-radius: 8px;`;
const MessageText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #66BB6A; background-color: rgba(102,187,106,0.15); border: 1px solid #66BB6A; border-radius: 8px; margin: 15px auto; max-width: 600px;`;

const RequestModalForm = styled.form` display: flex; flex-direction: column; gap: 15px; `;
const RequestModalLabel = styled.label` font-size: 0.9rem; color: #b0b0b0; margin-bottom: 5px; display: block; `;
const RequestModalInput = styled.input` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; &:focus { outline: none; border-color: #D4AF37; } `;
const RequestModalSelect = styled.select` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; &:focus { outline: none; border-color: #D4AF37; } `;
const RequestModalTextarea = styled.textarea` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; min-height: 70px; &:focus { outline: none; border-color: #D4AF37; } `;

const initialRequestFormState = { staffId: '', date: '', time: '', notes: '' };

const EventComponent = ({ event }) => (
  <div>
    <strong>{event.title.split('(')[0].trim()}</strong>
    <div style={{ fontSize: '0.8em', opacity: 0.9, lineHeight: '1.2' }}>
      {event.resource.type === 'training' &&
        `(${event.resource.participantsCount !== undefined ? event.resource.participantsCount : event.resource.participants?.length || 0}/${event.resource.capacity}) ${event.resource.instructor?.firstName ? 'Instr: ' + event.resource.instructor.firstName.substring(0, 1) + '.' : ''}`
      }
      {event.resource.type === 'appointment' && event.resource.status !== 'disponível' && event.resource.professional?.firstName &&
        `Prof: ${event.resource.professional.firstName.substring(0, 1)}.`
      }
      {event.resource.type === 'appointment' && event.resource.status === 'disponível' &&
        `(Disponível)`
      }
      {event.resource.type === 'appointment' && event.resource.status === 'pendente_aprovacao_staff' &&
        `(Pendente)`
      }
    </div>
  </div>
);

// Estilo para o link do plano de treino dentro do modal
const ModalPlanLink = styled(Link)`
  display: block; /* Para ocupar a largura e permitir margin */
  background-color: #D4AF37;
  color: #1A1A1A;
  padding: 10px 15px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: bold;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 15px; /* Espaço acima do link */
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #e6c358;
  }
`;


const CalendarPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [myBookedTrainingIds, setMyBookedTrainingIds] = useState(new Set());
  const [myBookedAppointmentIds, setMyBookedAppointmentIds] = useState(new Set());
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestFormData, setRequestFormData] = useState(initialRequestFormState);
  const [requestFormError, setRequestFormError] = useState('');
  const [requestFormLoading, setRequestFormLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(Views.MONTH);

  const fetchPageData = useCallback(async () => {
    if (!authState.token) {
      setLoading(false); setError("Autenticação necessária para ver o calendário."); return;
    }
    try {
      setLoading(true); setError(''); setSuccessMessage('');

      const appointmentFilters = {};

      let staffPromise = Promise.resolve([]);
      if (authState.role === 'user') {
        staffPromise = getAllStaffForSelection(authState.token).catch(err => {
          console.warn("Aviso: Não foi possível buscar lista de staff para cliente.", err.message);
          return [];
        });
      }

      const [trainingsData, appointmentsData, staffDataResult] = await Promise.all([
        getAllTrainings(authState.token),
        getAllAppointments(authState.token, appointmentFilters),
        staffPromise
      ]);

      if (authState.role === 'user' && staffDataResult && staffDataResult.length > 0) {
        setProfessionals(staffDataResult.filter(s => ['physiotherapist', 'trainer', 'admin'].includes(s.role)));
      } else if (authState.role === 'user') {
        setProfessionals([]);
      }

      const bookedTrainings = new Set();
      const bookedAppointments = new Set();
      if (authState.role === 'user' && authState.user?.id) {
        trainingsData.forEach(t => t.participants?.some(p => p.id === authState.user.id) && bookedTrainings.add(t.id));
        appointmentsData.forEach(a => {
          if (a.client?.id === authState.user.id) {
            bookedAppointments.add(a.id);
          }
        });
      }
      setMyBookedTrainingIds(bookedTrainings);
      setMyBookedAppointmentIds(bookedAppointments);

      const formattedEvents = [];
      trainingsData.forEach(training => {
        const [hours, minutes] = String(training.time).split(':');
        const start = parse(`${training.date} ${hours}:${minutes}`, 'yyyy-MM-dd HH:mm', new Date());
        const end = new Date(start.getTime() + (training.durationMinutes || 45) * 60 * 1000);
        formattedEvents.push({
          id: `training-${training.id}`,
          title: `${training.name} (${training.participantsCount !== undefined ? training.participantsCount : training.participants?.length || 0}/${training.capacity})`,
          start, end, resource: { type: 'training', ...training }
        });
      });
      appointmentsData.forEach(appointment => {
        const [hours, minutes] = String(appointment.time).split(':');
        const start = parse(`${appointment.date} ${hours}:${minutes}`, 'yyyy-MM-dd HH:mm', new Date());
        const end = new Date(start.getTime() + (appointment.durationMinutes || 60) * 60 * 1000);
        let title = `Consulta: ${appointment.professional?.firstName || 'N/A'}`;
        if (appointment.client) title += ` c/ ${appointment.client.firstName}`;
        else if (appointment.status === 'disponível') title += ` (Disponível)`;
        else if (appointment.status === 'pendente_aprovacao_staff') title += ` (Pendente Prof.)`;

        formattedEvents.push({
          id: `appointment-${appointment.id}`, title, start, end,
          resource: { type: 'appointment', ...appointment }
        });
      });
      setEvents(formattedEvents);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os dados do calendário.');
      console.error("CalendarPage fetchData error:", err);
    }
    finally { setLoading(false); }
  }, [authState.token, authState.role, authState.user?.id]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleSelectEvent = (event) => { setSelectedEvent(event.resource); setShowEventModal(true); setSuccessMessage(''); setError(''); };
  const handleCloseEventModal = () => { setShowEventModal(false); setSelectedEvent(null); };

  const handleSelectSlot = useCallback((slotInfo) => {
    if (authState.role !== 'user') return;
    const selectedDate = format(slotInfo.start, 'yyyy-MM-dd');
    const selectedTime = format(slotInfo.start, 'HH:mm');
    setRequestFormData({ ...initialRequestFormState, date: selectedDate, time: selectedTime });
    setRequestFormError(''); setSuccessMessage(''); setShowRequestModal(true);
  }, [authState.role]);

  const handleCloseRequestModal = () => { setShowRequestModal(false); setRequestFormData(initialRequestFormState); setRequestFormError(''); };
  const handleRequestFormChange = (e) => { setRequestFormData({ ...requestFormData, [e.target.name]: e.target.value }); };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestFormData.staffId) { setRequestFormError("Por favor, selecione um profissional."); return; }
    setRequestFormLoading(true); setRequestFormError(''); setSuccessMessage('');
    try {
      const dataToSend = { ...requestFormData, time: requestFormData.time.length === 5 ? `${requestFormData.time}:00` : requestFormData.time };
      const response = await clientRequestNewAppointment(dataToSend, authState.token);
      setSuccessMessage(response.message || 'Pedido de consulta enviado com sucesso!');
      await fetchPageData();
      handleCloseRequestModal();
    } catch (err) {
      setRequestFormError(err.message || 'Falha ao enviar pedido de consulta.');
    } finally { setRequestFormLoading(false); }
  };

  const handleBookSelectedTraining = async () => {
    if (!selectedEvent || selectedEvent.type !== 'training') return;
    if (!window.confirm('Confirmas a inscrição neste treino?')) return;
    setActionLoading(true); setError(''); setSuccessMessage('');
    try {
      await bookTrainingService(selectedEvent.id, authState.token);
      setSuccessMessage('Inscrição no treino realizada com sucesso!');
      await fetchPageData(); handleCloseEventModal();
    } catch (err) {
      setError(err.message || 'Falha ao inscrever no treino.');
    } finally { setActionLoading(false); }
  };

  const handleCancelTrainingBooking = async () => {
    if (!selectedEvent || selectedEvent.type !== 'training') return;
    if (!window.confirm('Confirmas o cancelamento da inscrição neste treino?')) return;
    setActionLoading(true); setError(''); setSuccessMessage('');
    try {
      await cancelTrainingBookingService(selectedEvent.id, authState.token);
      setSuccessMessage('Inscrição no treino cancelada com sucesso!');
      await fetchPageData(); handleCloseEventModal();
    } catch (err) {
      setError(err.message || 'Falha ao cancelar inscrição.');
    } finally { setActionLoading(false); }
  };

  const handleBookSelectedAppointment = async () => {
    if (!selectedEvent || selectedEvent.type !== 'appointment') return;
    if (!window.confirm('Confirmas a marcação desta consulta?')) return;
    setActionLoading(true); setError(''); setSuccessMessage('');
    try {
      await bookAppointmentService(selectedEvent.id, authState.token);
      setSuccessMessage('Consulta marcada com sucesso!');
      await fetchPageData(); handleCloseEventModal();
    } catch (err) {
      setError(err.message || 'Falha ao marcar consulta.');
    } finally { setActionLoading(false); }
  };

  const handleCancelAppointmentBooking = async () => {
    if (!selectedEvent || selectedEvent.type !== 'appointment') return;
    if (!window.confirm('Confirmas o cancelamento desta consulta?')) return;
    setActionLoading(true); setError(''); setSuccessMessage('');
    try {
      await cancelAppointmentBookingService(selectedEvent.id, authState.token);
      setSuccessMessage('Consulta cancelada com sucesso!');
      await fetchPageData(); handleCloseEventModal();
    } catch (err) {
      setError(err.message || 'Falha ao cancelar consulta.');
    } finally { setActionLoading(false); }
  };

  const handleAdminManageEvent = () => {
    if (!selectedEvent) return;
    if (selectedEvent.type === 'training') navigate(`/admin/manage-trainings?edit=${selectedEvent.id}`);
    else if (selectedEvent.type === 'appointment') navigate(`/admin/manage-appointments?edit=${selectedEvent.id}`);
    handleCloseEventModal();
  };

  const handleNavigate = useCallback((newDate) => { setCurrentDate(newDate); }, []);
  const handleViewChange = useCallback((newView) => { setCurrentView(newView); }, []);

  const messages = useMemo(() => ({
    allDay: 'Dia Inteiro', previous: '‹ Anterior', next: 'Próximo ›', today: 'Hoje',
    month: 'Mês', week: 'Semana', day: 'Dia', agenda: 'Agenda',
    date: 'Data', time: 'Hora', event: 'Evento',
    noEventsInRange: 'Não há eventos neste período.',
    showMore: total => `+ Ver mais (${total})`
  }), []);

  const isAdminOrStaff = authState.role && authState.role !== 'user';
  const isClient = authState.role === 'user';

  if (loading) return <PageContainer><LoadingText>A carregar calendário...</LoadingText></PageContainer>;

  return (
    <PageContainer>
      <Title>Calendário e Marcações CORE</Title>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Link to={isAdminOrStaff ? "/admin/dashboard" : "/dashboard"} style={{ color: '#D4AF37', fontSize: '1.1rem', textDecoration: 'none' }}>
          ‹ Voltar ao Painel
        </Link>
      </div>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && !showRequestModal && !showEventModal && <MessageText>{successMessage}</MessageText>}

      <CalendarWrapper>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          view={currentView}
          date={currentDate}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          messages={messages}
          culture='pt-BR'
          onSelectEvent={handleSelectEvent}
          onSelectSlot={authState.role === 'user' ? handleSelectSlot : undefined}
          selectable={authState.role === 'user'}
          components={{ event: EventComponent }}
          popup
          timeslots={1} step={60}
          min={new Date(0, 0, 0, 7, 0, 0)}
          max={new Date(0, 0, 0, 22, 0, 0)}
        />
      </CalendarWrapper>

      {showEventModal && selectedEvent && (
        <ModalOverlay onClick={handleCloseEventModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseEventModal}>×</CloseButton>
            <ModalTitle>{selectedEvent.type === 'training' ? selectedEvent.name : `Consulta com ${selectedEvent.professional?.firstName}`}</ModalTitle>
            <ModalDetail><span>Data:</span> {new Date(selectedEvent.date).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</ModalDetail>
            <ModalDetail><span>Hora:</span> {selectedEvent.time.substring(0, 5)}</ModalDetail>
            <ModalDetail><span>Duração:</span> {selectedEvent.durationMinutes} min</ModalDetail>
            {selectedEvent.type === 'training' && (<> <ModalDetail><span>Instrutor:</span> {selectedEvent.instructor?.firstName} {selectedEvent.instructor?.lastName}</ModalDetail> <ModalDetail><span>Vagas:</span> {selectedEvent.capacity - (selectedEvent.participantsCount || selectedEvent.participants?.length || 0)} / {selectedEvent.capacity}</ModalDetail> <ModalDetail><span>Descrição:</span> {selectedEvent.description || "N/A"}</ModalDetail>
              {/* Adicionado Link para Ver Plano de Treino para Cliente */}
              {isClient && myBookedTrainingIds.has(selectedEvent.id) && (
                <ModalPlanLink to={`/treinos/${selectedEvent.id}/plano`}>
                  Ver Plano de Treino
                </ModalPlanLink>
              )}
            </>)}
            {selectedEvent.type === 'appointment' && (<> <ModalDetail><span>Profissional:</span> {selectedEvent.professional?.firstName} {selectedEvent.professional?.lastName}</ModalDetail> <ModalDetail><span>Cliente:</span> {selectedEvent.client ? `${selectedEvent.client.firstName} ${selected.client.lastName}` : (selectedEvent.status === 'disponível' ? 'Disponível para marcação' : (selectedEvent.status === 'pendente_aprovacao_staff' ? 'Pendente de Aprovação' : 'N/A'))}</ModalDetail> <ModalDetail><span>Status:</span> {selectedEvent.status?.replace(/_/g, ' ')}</ModalDetail> <ModalDetail><span>Notas:</span> {selectedEvent.notes || "N/A"}</ModalDetail> </>)}
            <ModalActions>
              <ModalButton onClick={handleCloseEventModal}>Fechar</ModalButton>
              {authState.role === 'user' && selectedEvent.type === 'training' && (myBookedTrainingIds.has(selectedEvent.id) ? <ModalButton onClick={handleCancelTrainingBooking} disabled={actionLoading} danger> {actionLoading ? 'A cancelar...' : 'Cancelar Inscrição'} </ModalButton> : (selectedEvent.capacity - (selectedEvent.participantsCount || selectedEvent.participants?.length || 0)) > 0 && <ModalButton onClick={handleBookSelectedTraining} disabled={actionLoading} primary> {actionLoading ? 'A inscrever...' : 'Inscrever-me'} </ModalButton>)}
              {authState.role === 'user' && selectedEvent.type === 'appointment' && (myBookedAppointmentIds.has(selectedEvent.id) ? <ModalButton onClick={handleCancelAppointmentBooking} disabled={actionLoading} danger> {actionLoading ? 'A cancelar...' : 'Cancelar Consulta'} </ModalButton> : selectedEvent.status === 'disponível' && !selectedEvent.userId && <ModalButton onClick={handleBookSelectedAppointment} disabled={actionLoading} primary> {actionLoading ? 'A marcar...' : 'Marcar Consulta'} </ModalButton>)}
              {isAdminOrStaff && (<ModalButton onClick={handleAdminManageEvent} primary>Gerir Evento</ModalButton>)}
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {showRequestModal && authState.role === 'user' && (
        <ModalOverlay onClick={handleCloseRequestModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseRequestModal}>×</CloseButton>
            <ModalTitle>Solicitar Nova Consulta</ModalTitle>
            {requestFormError && <ErrorText style={{ marginBottom: '15px' }}>{requestFormError}</ErrorText>}
            <RequestModalForm onSubmit={handleRequestSubmit}>
              <RequestModalLabel htmlFor="reqStaffId">Profissional*</RequestModalLabel>
              <RequestModalSelect name="staffId" id="reqStaffId" value={requestFormData.staffId} onChange={handleRequestFormChange} required>
                <option value="">Selecione um profissional...</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.firstName} {prof.lastName} ({prof.role})
                  </option>
                ))}
              </RequestModalSelect>
              <RequestModalLabel htmlFor="reqDate">Data*</RequestModalLabel>
              <RequestModalInput type="date" name="date" id="reqDate" value={requestFormData.date} onChange={handleRequestFormChange} required />
              <RequestModalLabel htmlFor="reqTime">Hora (HH:MM)*</RequestModalLabel>
              <RequestModalInput type="time" name="time" id="reqTime" value={requestFormData.time} onChange={handleRequestFormChange} required step="1800" /> {/* step 1800 = 30 min */}
              <RequestModalLabel htmlFor="reqNotes">Notas (Opcional)</RequestModalLabel>
              <RequestModalTextarea name="notes" id="reqNotes" value={requestFormData.notes} onChange={handleRequestFormChange} rows="3" />
              <ModalActions>
                <ModalButton type="button" onClick={handleCloseRequestModal} disabled={requestFormLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={requestFormLoading}>
                  {requestFormLoading ? 'A enviar pedido...' : 'Enviar Pedido de Consulta'}
                </ModalButton>
              </ModalActions>
            </RequestModalForm>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};
export default CalendarPage;