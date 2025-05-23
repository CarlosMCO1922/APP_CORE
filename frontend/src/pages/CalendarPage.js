// src/pages/CalendarPage.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
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
import {
    FaArrowLeft, FaTimes, FaUsers, FaUserMd, FaExternalLinkAlt,
    FaCalendarPlus, FaInfoCircle, FaExclamationTriangle,
    FaCalendarDay, FaClock, FaUserCircle, FaStickyNote, FaVideo, FaImage
} from 'react-icons/fa';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const initialRequestFormState = { staffId: '', date: '', time: '', notes: '' };

// --- Styled Components (mantidos e ajustados) ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 25px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: clamp(2.2rem, 5vw, 3rem);
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 10px;
  font-weight: 700;
  letter-spacing: -0.5px;
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 25px;
  padding: 9px 16px;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background-color 0.2s, color 0.2s, transform 0.15s ease;
  font-size: 0.95rem;

  &:hover {
    background-color: ${({ theme }) => theme.colors.cardBackground};
    color: #fff;
    transform: translateY(-2px);
  }
  svg {
    margin-right: 5px;
  }
`;

const CalendarWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: clamp(20px, 3vw, 30px);
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  height: 80vh; 

  .rbc-toolbar {
    margin-bottom: 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    padding-bottom: 20px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  }

  .rbc-btn-group button {
    color: ${({ theme }) => theme.colors.textMuted};
    background-color: #2f2f2f;
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    padding: 9px 16px;
    border-radius: 6px;
    margin: 0 3px;
    transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem;

    &:hover, &:focus {
      background-color: ${({ theme }) => theme.colors.primary};
      color: ${({ theme }) => theme.colors.textDark};
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 2px 8px ${({ theme }) => theme.colors.primary}50;
    }
  }

  .rbc-toolbar button.rbc-active {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textDark};
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 8px ${({ theme }) => theme.colors.primary}70;
  }

  .rbc-toolbar-label {
    color: ${({ theme }) => theme.colors.primary};
    font-size: clamp(1.5rem, 4vw, 2rem);
    font-weight: 600;
    text-align: center;
    flex-grow: 1;
  }

  .rbc-header {
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
    border-left: 1px solid ${({ theme }) => theme.colors.cardBorder}60;
    &:first-child { border-left: none; }
    color: ${({ theme }) => theme.colors.textMuted};
    padding: 10px 0;
    text-align: center;
    font-weight: 500;
    font-size: 0.85rem;
    text-transform: capitalize;
    background-color: #282828;
  }
  
  /* Estilo base do evento será controlado pelo eventPropGetter, mas podemos ter defaults */
  .rbc-event, .rbc-day-slot .rbc-event {
    color: ${({ theme }) => theme.colors.textDark}; /* Cor de texto padrão para eventos */
    border: none; 
    border-radius: 5px; 
    padding: 4px 7px;
    font-size: 0.8rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    transition: background-color 0.2s, transform 0.15s ease-out, box-shadow 0.15s ease-out;
    overflow: hidden;
    cursor: pointer;
    
    &:hover {
        opacity: 0.85; /* Ajusta a opacidade no hover em vez da cor de fundo, já que ela é dinâmica */
        transform: translateY(-2px) scale(1.03);
        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
    }
  }
  
  .rbc-event-label {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .rbc-event-content { 
    display: none;
  }

  .rbc-event.rbc-selected {
    /* A cor de fundo será definida por eventPropGetter, mas podemos adicionar outros estilos de seleção */
    box-shadow: 0 0 0 2px ${({theme}) => theme.colors.background}, 0 0 0 3px #fff; /* Destaque branco */
    opacity: 1;
  }

  .rbc-agenda-view {
    table {
        border: 1px solid ${({ theme }) => theme.colors.cardBorder};
        font-size: 0.9rem;
        thead th {
            background-color: #282828;
            color: ${({ theme }) => theme.colors.primary};
            border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
            padding: 10px 12px;
        }
        tbody tr:hover { background-color: #2f2f2f; }
        .rbc-agenda-date-cell, .rbc-agenda-time-cell {
            color: ${({ theme }) => theme.colors.primary};
            font-weight: 500;
            white-space: nowrap;
            padding: 10px 12px;
        }
         .rbc-agenda-event-cell {
            padding: 10px 12px;
         }
    }
  }

  .rbc-time-slot, .rbc-day-slot .rbc-time-slot {
    border-top: 1px dotted #3a3a3a; 
  }
  .rbc-time-gutter .rbc-timeslot-group { border-bottom: none; }
  .rbc-time-header-gutter, .rbc-time-gutter {
    background: #1e1e1e; 
    border-right: 1px solid ${({ theme }) => theme.colors.cardBorder};
  }
  .rbc-day-bg + .rbc-day-bg { border-left: 1px solid ${({ theme }) => theme.colors.cardBorder}80; }
  .rbc-month-row + .rbc-month-row { border-top: 1px solid ${({ theme }) => theme.colors.cardBorder}80; }
  
  .rbc-today {
    background-color: rgba(212, 175, 55, 0.1); 
  }

  .rbc-off-range-bg {
    background-color: #212121; 
  }
  
  .rbc-slot-selectable {
    cursor: pointer;
    &:hover {
      background-color: rgba(212, 175, 55, 0.06); 
    }
  }
  .rbc-current-time-indicator {
    background-color: ${({ theme }) => theme.colors.error};
    height: 1.5px;
    box-shadow: 0 0 6px ${({ theme }) => theme.colors.error}90;
    &::before {
      content: ''; display: block; width: 7px; height: 7px;
      border-radius: 50%; background-color: ${({ theme }) => theme.colors.error};
      position: absolute; left: -2.5px; top: -2.75px;
    }
  }
`;

const MessageBaseStyles = css`
  text-align: center; padding: 12px 18px; margin: 20px auto;
  border-radius: ${({ theme }) => theme.borderRadius};
  border-width: 1px; border-style: solid; max-width: 600px;
  font-size: 0.9rem; font-weight: 500;
`;
const PageErrorText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.errorBg};
  border-color: ${({ theme }) => theme.colors.error};
`;
const PageSuccessMessage = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.success};
  background-color: ${({ theme }) => theme.colors.successBg};
  border-color: ${({ theme }) => theme.colors.success};
`;
const LoadingText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.primary};
  border-color: transparent;
  background: transparent;
`;
const NoItemsContainer = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 30px 15px; background-color: ${({ theme }) => theme.colors.cardBackground}CC;
  border-radius: ${({ theme }) => theme.borderRadius}; text-align: center;
  color: ${({ theme }) => theme.colors.textMuted}; margin-top: 20px;
  svg { font-size: 2.5rem; color: ${({ theme }) => theme.colors.primary}99; margin-bottom: 10px; }
  p { font-size: 1rem; margin: 0; }
`;

// ... (restantes Modal Styled Components mantidos da última versão correta)
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.88); display: flex;
  justify-content: center; align-items: center;
  z-index: 1050; padding: 20px;
`;
const ModalContent = styled.div`
  background-color: #2A2A2A;
  padding: clamp(25px, 4vw, 35px);
  border-radius: 10px; width: 100%; max-width: 550px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.6);
  position: relative; color: ${({ theme }) => theme.colors.textMain};
  max-height: 90vh; overflow-y: auto;
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
`;
const ModalTitle = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 0; margin-bottom: 20px;
  font-size: clamp(1.4rem, 3.5vw, 1.7rem);
  font-weight: 600; text-align: center;
  padding-bottom: 15px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;
const ModalDetail = styled.p`
  margin: 10px 0; font-size: 0.95rem; line-height: 1.7;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex; align-items: flex-start;
  span {
    font-weight: 600; color: ${({ theme }) => theme.colors.textMain};
    min-width: 110px; 
    display: inline-block; 
  }
  svg {
    margin-right: 10px; color: ${({ theme }) => theme.colors.primary};
    font-size: 1.1em; margin-top: 4px;
  }
`;
const ModalActions = styled.div`
  display: flex; flex-direction: column; gap: 10px;
  margin-top: 25px; padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  @media (min-width: 480px) { flex-direction: row; justify-content: flex-end; }
`;
const ModalButton = styled.button`
  background-color: ${props => props.danger ? props.theme.colors.error : (props.primary ? props.theme.colors.primary : props.theme.colors.buttonSecondaryBg)};
  color: ${props => props.danger ? 'white' : (props.primary ? props.theme.colors.textDark : props.theme.colors.textMain)};
  padding: 10px 18px; border-radius: ${({ theme }) => theme.borderRadius};
  border: none; cursor: pointer; font-weight: 600; font-size: 0.9rem;
  transition: background-color 0.2s ease, transform 0.15s ease;
  width: 100%;
  @media (min-width: 480px) { width: auto; }
  &:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  &:disabled { background-color: #444; color: #888; cursor: not-allowed; }
`;
const CloseButton = styled.button`
  position: absolute; top: 10px; right: 10px; background: transparent; border: none;
  color: #888; font-size: 1.8rem; cursor: pointer; line-height: 1; padding: 8px;
  transition: color 0.2s, transform 0.2s; border-radius: 50%;
  &:hover { color: #fff; transform: scale(1.1) rotate(90deg); }
`;

const RequestModalForm = styled.form` display: flex; flex-direction: column; gap: 15px; `;
const RequestModalLabel = styled.label` font-size: 0.85rem; color: ${({ theme }) => theme.colors.textMuted}; margin-bottom: 3px; display: block; font-weight: 500;`;
const RequestModalInput = styled.input` padding: 10px 14px; background-color: #333; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: ${({ theme }) => theme.borderRadius}; color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%; transition: border-color 0.2s, box-shadow 0.2s; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const RequestModalSelect = styled.select` padding: 10px 14px; background-color: #333; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: ${({ theme }) => theme.borderRadius}; color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%; transition: border-color 0.2s, box-shadow 0.2s; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const RequestModalTextarea = styled.textarea` padding: 10px 14px; background-color: #333; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: ${({ theme }) => theme.borderRadius}; color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%; min-height: 80px; resize: vertical; transition: border-color 0.2s, box-shadow 0.2s; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const ModalErrorText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.errorBg};
  border-color: ${({ theme }) => theme.colors.error};
  margin: -5px 0 10px 0; 
  text-align: left;      
  font-size: 0.8rem;    
  padding: 8px 12px;     
`;

const EventComponentStyled = styled.div`
  display: flex;
  align-items: center;
  gap: 5px; 
  height: 100%;
  padding: 2px 0;
  font-size: inherit;
  color: ${({ theme }) => theme.colors.textDark}; /* Cor do texto dentro do evento */

  .event-icon {
    font-size: 1em; 
    opacity: 0.85;
    flex-shrink: 0;
    line-height: 1; 
  }
  .event-title-text {
    font-weight: 600; /* Mais bold para o título */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
  }
  .event-details-text {
    font-size: 0.85em;
    opacity: 0.8; /* Um pouco mais visível */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-left: auto;
    padding-left: 4px;
    flex-shrink: 0;
  }
`;

const CustomEventComponent = ({ event }) => (
  <EventComponentStyled title={`${event.title} ${event.resource.type === 'training' ? `(${(event.resource.participantsCount ?? event.resource.participants?.length ?? 0)}/${event.resource.capacity})` : ''}`}>
    {event.resource.type === 'training' && <FaUsers className="event-icon" />}
    {event.resource.type === 'appointment' && <FaUserMd className="event-icon" />}
    <span className="event-title-text">{event.title.split('(')[0].trim().split(':')[0]}</span>
    <span className="event-details-text">
      {event.resource.type === 'training' &&
        `(${event.resource.participantsCount ?? event.resource.participants?.length ?? 0}/${event.resource.capacity})`}
      {event.resource.type === 'appointment' && event.resource.status === 'disponível' && `(Vago)`}
      {event.resource.type === 'appointment' && event.resource.status === 'pendente_aprovacao_staff' && `(Pendente)`}
      {event.resource.type === 'appointment' && event.resource.status === 'confirmada' && `(Confirm.)`}
    </span>
  </EventComponentStyled>
);

const ModalPlanLink = styled(Link)`
  display: inline-flex; align-items: center; gap: 8px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 10px 18px; border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none; font-weight: 600; font-size: 0.9rem;
  text-align: center; margin-top: 15px;
  transition: background-color 0.2s ease-in-out, transform 0.15s ease;
  &:hover { background-color: #e6c358; transform: translateY(-2px); }
`;


// --- Componente Principal ---
const CalendarPage = () => {
  const { authState, theme } = useAuth(); // Assumindo que o tema está no AuthContext ou importado diretamente
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [myBookedTrainingIds, setMyBookedTrainingIds] = useState(new Set());
  const [myBookedAppointmentIds, setMyBookedAppointmentIds] = useState(new Set());
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [pageSuccessMessage, setPageSuccessMessage] = useState('');

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
    // ... (Lógica de fetchPageData igual à versão anterior)
    if (!authState.token) {
      setLoading(false); setPageError("Autenticação necessária para ver o calendário."); return;
    }
    try {
      setLoading(true); setPageError(''); setPageSuccessMessage('');
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

      if (authState.role === 'user' && staffDataResult?.length > 0) {
        setProfessionals(staffDataResult.filter(s => ['physiotherapist', 'trainer', 'admin'].includes(s.role)));
      } else if (authState.role === 'user') {
        setProfessionals([]);
      }

      const bookedTrainings = new Set();
      const bookedAppointments = new Set();
      if (authState.role === 'user' && authState.user?.id) {
        trainingsData.forEach(t => t.participants?.some(p => p.id === authState.user.id) && bookedTrainings.add(t.id));
        appointmentsData.forEach(a => { if (a.client?.id === authState.user.id) { bookedAppointments.add(a.id); } });
      }
      setMyBookedTrainingIds(bookedTrainings);
      setMyBookedAppointmentIds(bookedAppointments);

      const formattedEvents = [];
      trainingsData.forEach(training => {
        const [hours, minutes] = String(training.time).split(':').map(Number);
        const startDateTime = parse(training.date, 'yyyy-MM-dd', new Date());
        startDateTime.setHours(hours, minutes, 0, 0);
        const endDateTime = new Date(startDateTime.getTime() + (training.durationMinutes || 45) * 60 * 1000);
        formattedEvents.push({
          id: `training-${training.id}`, title: `${training.name}`,
          start: startDateTime, end: endDateTime, resource: { type: 'training', ...training }
        });
      });
      appointmentsData.forEach(appointment => {
        const [hours, minutes] = String(appointment.time).split(':').map(Number);
        const startDateTime = parse(appointment.date, 'yyyy-MM-dd', new Date());
        startDateTime.setHours(hours, minutes, 0, 0);
        const endDateTime = new Date(startDateTime.getTime() + (appointment.durationMinutes || 60) * 60 * 1000);
        let title = `${appointment.professional?.firstName || 'Consulta'}`;
        if (appointment.client) title += ` c/ ${appointment.client.firstName}`;
        
        formattedEvents.push({
          id: `appointment-${appointment.id}`, title, start: startDateTime, end: endDateTime,
          resource: { type: 'appointment', ...appointment }
        });
      });
      setEvents(formattedEvents);
    } catch (err) {
      setPageError(err.message || 'Não foi possível carregar os dados do calendário.');
      console.error("CalendarPage fetchData error:", err);
    }
    finally { setLoading(false); }
  }, [authState.token, authState.role, authState.user?.id]);

  useEffect(() => { fetchPageData(); }, [fetchPageData]);

  const handleSelectEvent = (event) => { setSelectedEvent(event.resource); setShowEventModal(true); setPageSuccessMessage(''); setPageError(''); };
  const handleCloseEventModal = () => { setShowEventModal(false); setSelectedEvent(null); };

  const handleSelectSlot = useCallback((slotInfo) => {
    if (authState.role !== 'user') return;
    const selectedDate = format(slotInfo.start, 'yyyy-MM-dd');
    const selectedTime = format(slotInfo.start, 'HH:mm');
    setRequestFormData({ ...initialRequestFormState, date: selectedDate, time: selectedTime });
    setRequestFormError(''); setPageSuccessMessage(''); setShowRequestModal(true);
  }, [authState.role]);

  const handleCloseRequestModal = () => { setShowRequestModal(false); setRequestFormData(initialRequestFormState); setRequestFormError(''); };
  const handleRequestFormChange = (e) => { setRequestFormData({ ...requestFormData, [e.target.name]: e.target.value }); };

  const handleRequestSubmit = async (e) => {
    // ... (Lógica igual à versão anterior)
    e.preventDefault();
    if (!requestFormData.staffId) { setRequestFormError("Por favor, selecione um profissional."); return; }
    setRequestFormLoading(true); setRequestFormError(''); setPageSuccessMessage('');
    try {
      const dataToSend = { ...requestFormData, time: requestFormData.time.length === 5 ? `${requestFormData.time}:00` : requestFormData.time };
      const response = await clientRequestNewAppointment(dataToSend, authState.token);
      setPageSuccessMessage(response.message || 'Pedido de consulta enviado com sucesso!');
      await fetchPageData(); 
      handleCloseRequestModal();
    } catch (err) {
      setRequestFormError(err.message || 'Falha ao enviar pedido de consulta.');
    } finally { setRequestFormLoading(false); }
  };
  const handleBookSelectedTraining = async () => { /* ... (Lógica igual) ... */ 
    if (!selectedEvent || selectedEvent.type !== 'training') return;
    if (!window.confirm('Confirmas a inscrição neste treino?')) return;
    setActionLoading(true); setPageError(''); setPageSuccessMessage('');
    try {
      await bookTrainingService(selectedEvent.id, authState.token);
      setPageSuccessMessage('Inscrição no treino realizada com sucesso!');
      await fetchPageData(); handleCloseEventModal();
    } catch (err) {
      setPageError(err.message || 'Falha ao inscrever no treino.');
    } finally { setActionLoading(false); }
  };
  const handleCancelTrainingBooking = async () => { /* ... (Lógica igual) ... */ 
    if (!selectedEvent || selectedEvent.type !== 'training') return;
    if (!window.confirm('Confirmas o cancelamento da inscrição neste treino?')) return;
    setActionLoading(true); setPageError(''); setPageSuccessMessage('');
    try {
      await cancelTrainingBookingService(selectedEvent.id, authState.token);
      setPageSuccessMessage('Inscrição no treino cancelada com sucesso!');
      await fetchPageData(); handleCloseEventModal();
    } catch (err) {
      setPageError(err.message || 'Falha ao cancelar inscrição.');
    } finally { setActionLoading(false); }
  };
  const handleBookSelectedAppointment = async () => { /* ... (Lógica igual) ... */ 
    if (!selectedEvent || selectedEvent.type !== 'appointment') return;
    if (!window.confirm('Confirmas a marcação desta consulta?')) return;
    setActionLoading(true); setPageError(''); setPageSuccessMessage('');
    try {
      await bookAppointmentService(selectedEvent.id, authState.token);
      setPageSuccessMessage('Consulta marcada com sucesso!');
      await fetchPageData(); handleCloseEventModal();
    } catch (err) {
      setPageError(err.message || 'Falha ao marcar consulta.');
    } finally { setActionLoading(false); }
  };
  const handleCancelAppointmentBooking = async () => { /* ... (Lógica igual) ... */ 
    if (!selectedEvent || selectedEvent.type !== 'appointment') return;
    if (!window.confirm('Confirmas o cancelamento desta consulta?')) return;
    setActionLoading(true); setPageError(''); setPageSuccessMessage('');
    try {
      await cancelAppointmentBookingService(selectedEvent.id, authState.token);
      setPageSuccessMessage('Consulta cancelada com sucesso!');
      await fetchPageData(); handleCloseEventModal();
    } catch (err) {
      setPageError(err.message || 'Falha ao cancelar consulta.');
    } finally { setActionLoading(false); }
  };
  const handleAdminManageEvent = () => { /* ... (Lógica igual) ... */ 
    if (!selectedEvent) return;
    if (selectedEvent.type === 'training') navigate(`/admin/manage-trainings#training-${selectedEvent.id}`);
    else if (selectedEvent.type === 'appointment') navigate(`/admin/manage-appointments#appointment-${selectedEvent.id}`);
    handleCloseEventModal();
  };

  const handleNavigate = useCallback((newDate) => { setCurrentDate(newDate); }, []);
  const handleViewChange = useCallback((newView) => { setCurrentView(newView); }, []);

  const messages = useMemo(() => ({
    allDay: 'Todo o dia', previous: '‹', next: '›', today: 'Hoje',
    month: 'Mês', week: 'Semana', day: 'Dia', agenda: 'Agenda',
    date: 'Data', time: 'Hora', event: 'Evento',
    noEventsInRange: 'Não existem eventos neste período.',
    showMore: total => `+ ${total} mais`
  }), []);

  const eventStyleGetter = useCallback((event, start, end, isSelected) => {
    let backgroundColor = theme.colors.primary; // Cor padrão ou para treinos
    let borderColor = theme.colors.primary;

    if (event.resource.type === 'appointment') {
      backgroundColor = theme.colors.success; // Verde para consultas
      borderColor = theme.colors.success;
        if(event.resource.status === 'disponível'){
            backgroundColor = theme.colors.mediaButtonBg; // Azul para disponíveis (exemplo)
            borderColor = theme.colors.mediaButtonBg;
        } else if (event.resource.status === 'pendente_aprovacao_staff'){
            backgroundColor = '#FFA000'; // Laranja para pendentes
            borderColor = '#FFA000';
        }
    }
    
    const style = {
      backgroundColor: backgroundColor,
      borderRadius: '5px',
      opacity: 0.9,
      color: theme.colors.textDark, // Texto escuro para bom contraste com cores claras
      border: `1px solid ${borderColor}`,
      boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
      fontSize: '0.78rem', // Consistente com .rbc-event
      padding: '3px 5px',   // Consistente com .rbc-event
    };
    if(isSelected){
        style.backgroundColor = event.resource.type === 'appointment' ? '#4CAF50' : '#b89b2e'; // Mais escuro quando selecionado
        style.boxShadow = `0 0 0 2px ${theme.colors.background}, 0 0 0 3px ${borderColor}`;
        style.opacity = 1;
    }
    return { style };
  }, [theme]);

  const tooltipAccessor = useCallback((event) => {
    const time = `${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`;
    let details = `${event.title}\n${time}`;
    if (event.resource.type === 'training') {
      details += `\nInstrutor: ${event.resource.instructor?.firstName || 'N/A'}`;
      details += `\nVagas: ${event.resource.capacity - (event.resource.participantsCount ?? event.resource.participants?.length ?? 0)}/${event.resource.capacity}`;
    } else if (event.resource.type === 'appointment') {
      details += `\nProfissional: ${event.resource.professional?.firstName || 'N/A'}`;
      if (event.resource.client) {
        details += `\nCliente: ${event.resource.client.firstName}`;
      } else {
        details += `\nStatus: ${event.resource.status.replace(/_/g, ' ')}`;
      }
    }
    return details;
  }, []);

  const isAdminOrStaff = authState.role && authState.role !== 'user';
  const isClient = authState.role === 'user';

  if (loading) return <PageContainer><LoadingText>A carregar calendário...</LoadingText></PageContainer>;

  return (
    <PageContainer>
      <HeaderSection> <Title>Calendário e Marcações</Title> </HeaderSection>
      <BackLink to={isAdminOrStaff ? "/admin/dashboard" : "/dashboard"}> <FaArrowLeft /> Voltar ao Painel </BackLink>

      {pageError && <PageErrorText>{pageError}</PageErrorText>}
      {pageSuccessMessage && !showRequestModal && !showEventModal && <PageSuccessMessage>{pageSuccessMessage}</PageSuccessMessage>}

      <CalendarWrapper>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          defaultView={Views.MONTH}
          view={currentView}
          date={currentDate}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          messages={messages}
          culture='pt-BR'
          onSelectEvent={handleSelectEvent}
          onSelectSlot={isClient ? handleSelectSlot : undefined}
          selectable={isClient}
          components={{ event: CustomEventComponent }}
          popup
          eventPropGetter={eventStyleGetter} // <--- Adicionado para cores dinâmicas
          tooltipAccessor={tooltipAccessor}   // <--- Adicionado para tooltips
          timeslots={1} 
          step={60}    
          min={new Date(1970, 0, 1, 7, 0, 0)} 
          max={new Date(1970, 0, 1, 22, 0, 0)}
          formats={{
            agendaHeaderFormat: ({ start, end }) => `${format(start, 'dd/MM')} – ${format(end, 'dd/MM')}`,
            dayHeaderFormat: date => format(date, 'eeee, dd MMM', { locale: ptBR }),
            dayRangeHeaderFormat: ({ start, end }, culture, local) =>
              `${local.format(start, 'dd MMM', {locale: ptBR})} – ${local.format(end, (getDay(start) === getDay(end) ? '' : 'dd ') + 'MMM', {locale: ptBR})}`
          }}
          dayLayoutAlgorithm="no-overlap"
        />
      </CalendarWrapper>

      {/* Modal de Detalhes do Evento */}
      {showEventModal && selectedEvent && (
        <ModalOverlay onClick={handleCloseEventModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseEventModal}><FaTimes /></CloseButton>
            <ModalTitle>{selectedEvent.type === 'training' ? selectedEvent.name : `Consulta: ${selectedEvent.professional?.firstName}`}</ModalTitle>
            
            <ModalDetail><span><FaCalendarDay /> Data:</span> {new Date(selectedEvent.date).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</ModalDetail>
            <ModalDetail><span><FaClock /> Hora:</span> {selectedEvent.time.substring(0, 5)}</ModalDetail>
            <ModalDetail><span>Duração:</span> {selectedEvent.durationMinutes} min</ModalDetail>
            
            {selectedEvent.type === 'training' && (<>
              <ModalDetail><span><FaUserMd /> Instrutor:</span> {selectedEvent.instructor?.firstName} {selectedEvent.instructor?.lastName}</ModalDetail>
              <ModalDetail><span><FaUsers /> Vagas:</span> {selectedEvent.capacity - (selectedEvent.participantsCount ?? selectedEvent.participants?.length ?? 0)} / {selectedEvent.capacity}</ModalDetail>
              <ModalDetail><span><FaInfoCircle /> Descrição:</span> {selectedEvent.description || "N/A"}</ModalDetail>
              {isClient && myBookedTrainingIds.has(selectedEvent.id) && (
                <ModalPlanLink to={`/treinos/${selectedEvent.id}/plano`}> <FaExternalLinkAlt /> Ver Plano de Treino </ModalPlanLink>
              )}
            </>)}

            {selectedEvent.type === 'appointment' && (<>
              <ModalDetail><span><FaUserMd /> Profissional:</span> {selectedEvent.professional?.firstName} {selectedEvent.professional?.lastName}</ModalDetail>
              <ModalDetail><span><FaUserCircle /> Cliente:</span> {selectedEvent.client ? `${selectedEvent.client.firstName} ${selectedEvent.client.lastName}` : (selectedEvent.status === 'disponível' ? 'Disponível para marcação' : (selectedEvent.status === 'pendente_aprovacao_staff' ? 'Pendente de Aprovação' : 'N/A'))}</ModalDetail>
              <ModalDetail><span>Status:</span> {selectedEvent.status?.replace(/_/g, ' ')}</ModalDetail>
              <ModalDetail><span><FaStickyNote /> Notas:</span> {selectedEvent.notes || "N/A"}</ModalDetail>
            </>)}
            
            <ModalActions>
              <ModalButton onClick={handleCloseEventModal} secondary>Fechar</ModalButton>
              {isClient && selectedEvent.type === 'training' && (myBookedTrainingIds.has(selectedEvent.id) ? <ModalButton onClick={handleCancelTrainingBooking} disabled={actionLoading} danger> {actionLoading ? 'Aguarde...' : 'Cancelar Inscrição'} </ModalButton> : (selectedEvent.capacity - (selectedEvent.participantsCount ?? selectedEvent.participants?.length ?? 0)) > 0 && <ModalButton onClick={handleBookSelectedTraining} disabled={actionLoading} primary> {actionLoading ? 'Aguarde...' : 'Inscrever-me'} </ModalButton>)}
              {isClient && selectedEvent.type === 'appointment' && (myBookedAppointmentIds.has(selectedEvent.id) ? <ModalButton onClick={handleCancelAppointmentBooking} disabled={actionLoading} danger> {actionLoading ? 'Aguarde...' : 'Cancelar Consulta'} </ModalButton> : selectedEvent.status === 'disponível' && !selectedEvent.userId && <ModalButton onClick={handleBookSelectedAppointment} disabled={actionLoading} primary> {actionLoading ? 'Aguarde...' : 'Marcar Consulta'} </ModalButton>)}
              {isAdminOrStaff && (<ModalButton onClick={handleAdminManageEvent} primary>Gerir Evento</ModalButton>)}
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal de Solicitar Nova Consulta */}
      {showRequestModal && isClient && (
        <ModalOverlay onClick={handleCloseRequestModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseRequestModal}><FaTimes /></CloseButton>
            <ModalTitle>Solicitar Nova Consulta</ModalTitle>
            {requestFormError && <ModalErrorText>{requestFormError}</ModalErrorText>}
            <RequestModalForm onSubmit={handleRequestSubmit}>
              <RequestModalLabel htmlFor="reqStaffIdModal">Profissional*</RequestModalLabel>
              <RequestModalSelect name="staffId" id="reqStaffIdModal" value={requestFormData.staffId} onChange={handleRequestFormChange} required>
                <option value="">Selecione um profissional...</option>
                {professionals.map(prof => ( <option key={prof.id} value={prof.id}> {prof.firstName} {prof.lastName} ({prof.role}) </option> ))}
              </RequestModalSelect>
              <RequestModalLabel htmlFor="reqDateModal">Data*</RequestModalLabel>
              <RequestModalInput type="date" name="date" id="reqDateModal" value={requestFormData.date} onChange={handleRequestFormChange} required />
              <RequestModalLabel htmlFor="reqTimeModal">Hora (HH:MM)*</RequestModalLabel>
              <RequestModalInput type="time" name="time" id="reqTimeModal" value={requestFormData.time} onChange={handleRequestFormChange} required step="1800" />
              <RequestModalLabel htmlFor="reqNotesModal">Notas (Opcional)</RequestModalLabel>
              <RequestModalTextarea name="notes" id="reqNotesModal" value={requestFormData.notes} onChange={handleRequestFormChange} rows="3" />
              <ModalActions>
                <ModalButton type="button" secondary onClick={handleCloseRequestModal} disabled={requestFormLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={requestFormLoading}> {requestFormLoading ? 'Enviando...' : (<><FaCalendarPlus style={{marginRight: '8px'}}/> Enviar Pedido</>)} </ModalButton>
              </ModalActions>
            </RequestModalForm>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};
export default CalendarPage;