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
import { theme } from '../theme'; // Assume que tem um theme.js exportando o tema

import { useAuth } from '../context/AuthContext';
import {
    getAllTrainings,
    bookTraining as bookTrainingService,
    cancelTrainingBooking as cancelTrainingBookingService,
    adminCreateTraining
} from '../services/trainingService';
import {
    getAllAppointments,
    clientRequestNewAppointment,
    bookAppointment as bookAppointmentService, 
    cancelAppointmentBooking as cancelAppointmentBookingService, 
    adminCreateAppointment
} from '../services/appointmentService';
import { getAllStaffForSelection, adminGetAllStaff } from '../services/staffService';
import { adminGetAllUsers } from '../services/userService';

import {
    FaArrowLeft, FaTimes, FaUsers, FaUserMd, FaExternalLinkAlt,
    FaCalendarPlus, FaInfoCircle, FaCalendarDay, FaClock, FaUserCircle, FaStickyNote,
    FaDumbbell, FaRedo
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
const initialAdminTrainingFormState = { name: '', description: '', date: '', time: '', capacity: 10, instructorId: '', durationMinutes: 45 };
const initialAdminAppointmentFormState = { date: '', time: '', staffId: '', userId: '', notes: '', status: 'disponível', durationMinutes: 60, totalCost: ''};
const appointmentStatuses = [ 'disponível', 'agendada', 'confirmada', 'concluída', 'cancelada_pelo_cliente', 'cancelada_pelo_staff', 'não_compareceu', 'pendente_aprovacao_staff', 'rejeitada_pelo_staff' ];

// --- Styled Components (Completos) ---
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

  .rbc-event, .rbc-day-slot .rbc-event {
    border: none;
    border-radius: 5px;
    padding: 4px 7px;
    font-size: 0.8rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    transition: opacity 0.2s, transform 0.15s ease-out, box-shadow 0.15s ease-out;
    overflow: hidden;
    cursor: pointer;

    &:hover {
        opacity: 0.85;
        transform: translateY(-2px) scale(1.03);
        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
    }
  }

  .rbc-event-label { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rbc-event-content { display: none; }
  .rbc-event.rbc-selected { opacity: 1; }

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
            font-weight: 500; white-space: nowrap; padding: 10px 12px;
        }
         .rbc-agenda-event-cell { padding: 10px 12px; }
    }
  }

  .rbc-time-slot, .rbc-day-slot .rbc-time-slot { border-top: 1px dotted #3a3a3a; }
  .rbc-time-gutter .rbc-timeslot-group { border-bottom: none; }
  .rbc-time-header-gutter, .rbc-time-gutter { background: #1e1e1e; border-right: 1px solid ${({ theme }) => theme.colors.cardBorder}; }
  .rbc-day-bg + .rbc-day-bg { border-left: 1px solid ${({ theme }) => theme.colors.cardBorder}80; }
  .rbc-month-row + .rbc-month-row { border-top: 1px solid ${({ theme }) => theme.colors.cardBorder}80; }
  .rbc-today { background-color: rgba(212, 175, 55, 0.1); }
  .rbc-off-range-bg { background-color: #212121; }
  .rbc-slot-selectable { cursor: pointer; &:hover { background-color: rgba(212, 175, 55, 0.06); } }

  .rbc-current-time-indicator {
    background-color: ${({ theme }) => theme.colors.error}; height: 1.5px;
    box-shadow: 0 0 6px ${({ theme }) => theme.colors.error}90;
    &::before {
      content: ''; display: block; width: 7px; height: 7px; border-radius: 50%;
      background-color: ${({ theme }) => theme.colors.error};
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
const EventModalTitle = styled.h2`
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
const EventModalActions = styled.div`
  display: flex; flex-direction: column; gap: 10px;
  margin-top: 25px; padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  @media (min-width: 480px) { flex-direction: row; justify-content: flex-end; }
`;
const EventModalButton = styled.button`
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
  color: ${({ theme }) => theme.colors.textDark}; // Ajustado para melhor contraste

  .event-icon { font-size: 1em; opacity: 0.85; flex-shrink: 0; line-height: 1; }
  .event-title-text { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-grow: 1; }
  .event-details-text { font-size: 0.85em; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-left: auto; padding-left: 4px; flex-shrink: 0; }
`;

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

const ParticipantListStyled = styled.div`
  margin-top: 15px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  padding-top: 15px;

  h4 {
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1rem;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  ul {
    list-style: none;
    padding: 0;
    max-height: 150px;
    overflow-y: auto;
    background-color: #222;
    border-radius: 5px;
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  }

  li {
    padding: 8px 12px;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
    &:last-child { border-bottom: none; }
  }

  p.no-participants {
      font-size: 0.9rem;
      color: ${({ theme }) => theme.colors.textMuted};
      font-style: italic;
      text-align: center;
      padding: 10px;
  }
`;

const OptionsModalButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 12px 20px;
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1rem;
  width: 100%;
  margin-bottom: 10px;

  &:hover {
    background-color: #e6c358;
    transform: translateY(-2px);
  }
  &:last-child {
    margin-bottom: 0;
    background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
    color: ${({ theme }) => theme.colors.textMain};
     &:hover {
        background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
    }
  }
`;

const AdminModalForm = styled.form` display: flex; flex-direction: column; gap: 15px; `;
const AdminModalLabel = styled.label` font-size: 0.85rem; color: ${({ theme }) => theme.colors.textMuted}; margin-bottom: 4px; display: block; font-weight: 500;`;
const AdminModalInput = styled.input` padding: 10px 14px; background-color: #333; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: ${({ theme }) => theme.borderRadius}; color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%; transition: border-color 0.2s, box-shadow 0.2s; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const AdminModalTextarea = styled.textarea` padding: 10px 14px; background-color: #333; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: ${({ theme }) => theme.borderRadius}; color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%; min-height: 80px; resize: vertical; transition: border-color 0.2s, box-shadow 0.2s; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const AdminModalSelect = styled.select` padding: 10px 14px; background-color: #333; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: ${({ theme }) => theme.borderRadius}; color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%; transition: border-color 0.2s, box-shadow 0.2s; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const AdminModalButton = styled(ModalButton)``;

const SubscriptionFormGroup = styled.div`
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha || 'rgba(255,255,255,0.1)'};
`;
const SubscriptionLabel = styled(ModalLabel)``; // Reutilizar ModalLabel
const SubscriptionInput = styled(ModalInput)``; // Reutilizar ModalInput
const SubscriptionButton = styled(EventModalButton)` // Reutilizar EventModalButton
  width: 100%;
  margin-top: 10px;
  &.subscribe { // Classe para dar estilo específico ao botão de subscrever
    background-color: ${({ theme }) => theme.colors.success};
    color: white;
     &:hover:not(:disabled) {
        background-color: ${({ theme }) => theme.colors.successDark || '#5cb85c' } ;
     }
  }
`;
const SubscriptionMessageText = styled.p`
    font-size: 0.85rem; text-align: center; padding: 8px; margin-top: 10px;
    border-radius: ${({theme}) => theme.borderRadius}; border-width: 1px; border-style: solid;
    &.success { color: ${({ theme }) => theme.colors.success}; background-color: ${({ theme }) => theme.colors.successBg}; border-color: ${({ theme }) => theme.colors.success};}
    &.error { color: ${({ theme }) => theme.colors.error}; background-color: ${({ theme }) => theme.colors.errorBg}; border-color: ${({ theme }) => theme.colors.error};}
`;


const CustomEventComponent = ({ event }) => (
  <EventComponentStyled title={event.title + (event.resource.type === 'training' ? ` (${(event.resource.participantsCount ?? event.resource.participants?.length ?? 0)}/${event.resource.capacity})` : '')}>
    {event.resource.type === 'training' && <FaUsers className="event-icon" />}
    {event.resource.type === 'appointment' && <FaUserMd className="event-icon" />}
    <span className="event-title-text">{event.title.split('(')[0].trim().split(':')[0]}</span>
    <span className="event-details-text">
      {event.resource.type === 'training' &&
        `(${(event.resource.participantsCount ?? event.resource.participants?.length ?? 0)}/${event.resource.capacity})`}
      {event.resource.type === 'appointment' && event.resource.status === 'disponível' && `(Vago)`}
      {event.resource.type === 'appointment' && event.resource.status === 'pendente_aprovacao_staff' && `(Pendente)`}
      {event.resource.type === 'appointment' && event.resource.status === 'confirmada' && `(Confirm.)`}
    </span>
  </EventComponentStyled>
);

// --- Componente Principal ---
const CalendarPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [myBookedTrainingIds, setMyBookedTrainingIds] = useState(new Set());
  const [myBookedAppointmentIds, setMyBookedAppointmentIds] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [pageSuccessMessage, setPageSuccessMessage] = useState('');

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const [professionalsForClient, setProfessionalsForClient] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestFormData, setRequestFormData] = useState(initialRequestFormState);
  const [requestFormError, setRequestFormError] = useState('');
  const [requestFormLoading, setRequestFormLoading] = useState(false);

  const [selectedSlotInfo, setSelectedSlotInfo] = useState(null);
  const [showAdminCreateOptionsModal, setShowAdminCreateOptionsModal] = useState(false);

  const [showAdminCreateTrainingModal, setShowAdminCreateTrainingModal] = useState(false);
  const [adminTrainingFormData, setAdminTrainingFormData] = useState(initialAdminTrainingFormState);
  const [adminTrainingFormLoading, setAdminTrainingFormLoading] = useState(false);
  const [adminTrainingModalError, setAdminTrainingModalError] = useState('');
  const [adminInstructors, setAdminInstructors] = useState([]);

  const [showAdminCreateAppointmentModal, setShowAdminCreateAppointmentModal] = useState(false);
  const [adminAppointmentFormData, setAdminAppointmentFormData] = useState(initialAdminAppointmentFormState);
  const [adminAppointmentFormLoading, setAdminAppointmentFormLoading] = useState(false);
  const [adminAppointmentModalError, setAdminAppointmentModalError] = useState('');
  const [adminStaffListForAppointment, setAdminStaffListForAppointment] = useState([]);
  const [adminUserListForAppointment, setAdminUserListForAppointment] = useState([]);

  const [showRecurringOptionsModal, setShowRecurringOptionsModal] = useState(false); // Renomeado para clareza
  const [clientRecurringEndDate, setClientRecurringEndDate] = useState('');
  const [recurringSubscriptionMessage, setRecurringSubscriptionMessage] = useState({type: '', text: ''});
  const [isSubscribingRecurring, setIsSubscribingRecurring] = useState(false);


  const [actionLoading, setActionLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(Views.WEEK);

  const isAdminOrStaff = authState.role && authState.role !== 'user';
  const isClient = authState.role === 'user';

  const fetchPageData = useCallback(async () => {
    if (!authState.token) {
      setLoading(false); setPageError("Autenticação necessária para ver o calendário."); return;
    }
    try {
      setLoading(true); setPageError(''); setPageSuccessMessage('');
      const appointmentFilters = {};
      
      const promisesToFetch = [
        getAllTrainings(authState.token),
        getAllAppointments(authState.token, appointmentFilters),
      ];

      if (isAdminOrStaff) {
        promisesToFetch.push(adminGetAllStaff(authState.token).catch(e => { console.error("Falha ao buscar staff (admin)", e); return []; }));
        promisesToFetch.push(adminGetAllUsers(authState.token).catch(e => { console.error("Falha ao buscar users (admin)", e); return []; }));
      } else if (isClient) {
        promisesToFetch.push(getAllStaffForSelection(authState.token).catch(e => { console.warn("Falha ao buscar staff (client)", e.message); return []; }));
        promisesToFetch.push(Promise.resolve([]));
      } else {
        promisesToFetch.push(Promise.resolve([]));
        promisesToFetch.push(Promise.resolve([]));
      }

      const [trainingsData, appointmentsData, staffData, usersData] = await Promise.all(promisesToFetch);

      if (isClient && staffData?.length > 0) {
        setProfessionalsForClient(staffData.filter(s => ['physiotherapist', 'trainer', 'admin'].includes(s.role)));
      }
      if (isAdminOrStaff) {
        setAdminInstructors(staffData.filter(s => ['trainer', 'admin'].includes(s.role)));
        setAdminStaffListForAppointment(staffData.filter(s => ['physiotherapist', 'trainer', 'admin'].includes(s.role)));
        setAdminUserListForAppointment(usersData || []);
      }

      const bookedTrainings = new Set();
      const bookedAppointments = new Set();
      if (isClient && authState.user?.id) {
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
          start: startDateTime, end: endDateTime,
          resource: { type: 'training', ...training }
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
  }, [authState.token, authState.role, authState.user?.id, isAdminOrStaff, isClient]);

  useEffect(() => { fetchPageData(); }, [fetchPageData]);

  const handleSelectEvent = (event) => { setSelectedEvent(event.resource); setShowEventModal(true); setPageSuccessMessage(''); setPageError(''); };
  const handleCloseEventModal = () => { setShowEventModal(false); setSelectedEvent(null); };

  const handleSelectSlot = useCallback((slotInfo) => {
    setPageError(''); setPageSuccessMessage('');
    const selectedDate = format(slotInfo.start, 'yyyy-MM-dd');
    const selectedTime = format(slotInfo.start, 'HH:mm');

    if (isAdminOrStaff) {
      setSelectedSlotInfo({ date: selectedDate, time: selectedTime, start: slotInfo.start, end: slotInfo.end });
      setShowAdminCreateOptionsModal(true);
    } else if (isClient) {
      setRequestFormData({ ...initialRequestFormState, date: selectedDate, time: selectedTime });
      setRequestFormError('');
      setShowRequestModal(true);
    }
  }, [isAdminOrStaff, isClient]);

  const handleCloseRequestModal = () => { setShowRequestModal(false); setRequestFormData(initialRequestFormState); setRequestFormError(''); };
  const handleRequestFormChange = (e) => { setRequestFormData({ ...requestFormData, [e.target.name]: e.target.value }); };
  const handleRequestSubmit = async (e) => {
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

  const handleBookSelectedTraining = async () => {
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
  const handleCancelTrainingBooking = async () => {
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
  const handleBookSelectedAppointment = async () => {
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
  const handleCancelAppointmentBooking = async () => {
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
  const handleAdminManageEvent = () => {
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
    let backgroundColor = theme.colors.primary;
    let borderColor = theme.colors.primary;
    let textColor = theme.colors.textDark;

    if (event.resource.type === 'appointment') {
      backgroundColor = theme.colors.success;
      borderColor = theme.colors.success;
      if (event.resource.status === 'disponível') {
        backgroundColor = theme.colors.mediaButtonBg || '#007bff';
        borderColor = theme.colors.mediaButtonBg || '#007bff';
        textColor = theme.colors.textMain;
      } else if (event.resource.status === 'pendente_aprovacao_staff') {
        backgroundColor = '#FFA000';
        borderColor = '#FFA000';
        textColor = theme.colors.textDark;
      }
    }

    const style = {
      backgroundColor: backgroundColor,
      borderRadius: '5px',
      opacity: isSelected ? 1 : 0.9,
      color: textColor,
      border: `1px solid ${borderColor}`,
      boxShadow: isSelected ? `0 0 0 2px ${theme.colors.background}, 0 0 0 3px ${borderColor}` : '0 1px 2px rgba(0,0,0,0.2)',
      fontSize: '0.78rem',
      padding: '3px 5px',
    };
    return { style };
  }, [theme]); // Adicionando theme aqui para que eventStyleGetter não reclame de missing dependency

  const tooltipAccessor = useCallback((event) => {
    const time = `${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`;
    let details = `${event.title}\n${time}`;
    if (event.resource.type === 'training') {
      details += `\nInstrutor: ${event.resource.instructor?.firstName || 'N/A'}`;
      details += `\nVagas: ${(event.resource.participantsCount ?? event.resource.participants?.length ?? 0)}/${event.resource.capacity}`;
    } else if (event.resource.type === 'appointment') {
      details += `\nProfissional: ${event.resource.professional?.firstName || 'N/A'}`;
      if (event.resource.client) {
        details += `\nCliente: ${event.resource.client.firstName}`;
      }
      details += `\nStatus: ${event.resource.status.replace(/_/g, ' ')}`;
    }
    return details;
  }, []);

  const handleCloseAdminCreateOptionsModal = () => setShowAdminCreateOptionsModal(false);

  const handleOpenAdminCreateTrainingModal = () => {
    setShowAdminCreateOptionsModal(false);
    setAdminTrainingFormData({
      ...initialAdminTrainingFormState,
      date: selectedSlotInfo?.date || '',
      time: selectedSlotInfo?.time || ''
    });
    setAdminTrainingModalError('');
    setShowAdminCreateTrainingModal(true);
  };
  const handleCloseAdminCreateTrainingModal = () => {
    setShowAdminCreateTrainingModal(false);
    setAdminTrainingFormData(initialAdminTrainingFormState);
  };
  const handleAdminTrainingFormChange = (e) => setAdminTrainingFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAdminCreateTrainingSubmit = async (e) => {
    e.preventDefault();
    setAdminTrainingFormLoading(true); setAdminTrainingModalError(''); setPageSuccessMessage('');
    const dataToSend = {
      ...adminTrainingFormData,
      capacity: parseInt(adminTrainingFormData.capacity, 10),
      instructorId: parseInt(adminTrainingFormData.instructorId, 10),
      durationMinutes: parseInt(adminTrainingFormData.durationMinutes, 10),
      time: adminTrainingFormData.time.length === 5 ? `${adminTrainingFormData.time}:00` : adminTrainingFormData.time,
    };
    try {
      await adminCreateTraining(dataToSend, authState.token);
      setPageSuccessMessage('Novo treino criado com sucesso a partir do calendário!');
      fetchPageData();
      handleCloseAdminCreateTrainingModal();
    } catch (err) {
      setAdminTrainingModalError(err.message || 'Falha ao criar treino.');
    } finally {
      setAdminTrainingFormLoading(false);
    }
  };

  const handleOpenAdminCreateAppointmentModal = () => {
    setShowAdminCreateOptionsModal(false);
    setAdminAppointmentFormData({
      ...initialAdminAppointmentFormState,
      date: selectedSlotInfo?.date || '',
      time: selectedSlotInfo?.time || ''
    });
    setAdminAppointmentModalError('');
    setShowAdminCreateAppointmentModal(true);
  };
  const handleCloseAdminCreateAppointmentModal = () => {
    setShowAdminCreateAppointmentModal(false);
    setAdminAppointmentFormData(initialAdminAppointmentFormState);
  };
  const handleAdminAppointmentFormChange = (e) => setAdminAppointmentFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAdminCreateAppointmentSubmit = async (e) => {
    e.preventDefault();
    setAdminAppointmentFormLoading(true); setAdminAppointmentModalError(''); setPageSuccessMessage('');
     const dataToSend = {
      ...adminAppointmentFormData,
      staffId: adminAppointmentFormData.staffId ? parseInt(adminAppointmentFormData.staffId, 10) : null,
      userId: adminAppointmentFormData.userId ? parseInt(adminAppointmentFormData.userId, 10) : null,
      durationMinutes: parseInt(adminAppointmentFormData.durationMinutes, 10),
      time: adminAppointmentFormData.time.length === 5 ? `${adminAppointmentFormData.time}:00` : adminAppointmentFormData.time,
      totalCost: (adminAppointmentFormData.userId && adminAppointmentFormData.totalCost !== '' && !isNaN(parseFloat(adminAppointmentFormData.totalCost))) ? parseFloat(adminAppointmentFormData.totalCost) : null,
    };
    try {
      await adminCreateAppointment(dataToSend, authState.token);
      setPageSuccessMessage('Nova consulta criada com sucesso a partir do calendário!');
      fetchPageData();
      handleCloseAdminCreateAppointmentModal();
    } catch (err) {
      setAdminAppointmentModalError(err.message || 'Falha ao criar consulta.');
    } finally {
      setAdminAppointmentFormLoading(false);
    }
  };

  if (loading) return <PageContainer><LoadingText>A carregar calendário...</LoadingText></PageContainer>;

  return (
    <PageContainer>
      <HeaderSection> <Title>Calendário e Marcações</Title> </HeaderSection>
      <BackLink to={isAdminOrStaff ? "/admin/dashboard" : "/dashboard"}> <FaArrowLeft /> Voltar ao Painel </BackLink>

      {pageError && <PageErrorText>{pageError}</PageErrorText>}
      {pageSuccessMessage && !showRequestModal && !showEventModal && !showAdminCreateOptionsModal && !showAdminCreateTrainingModal && !showAdminCreateAppointmentModal && <PageSuccessMessage>{pageSuccessMessage}</PageSuccessMessage>}

      <CalendarWrapper>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          defaultView={Views.WEEK}
          view={currentView}
          date={currentDate}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          messages={messages}
          culture='pt-BR'
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={true}
          components={{ event: CustomEventComponent }}
          popup
          eventPropGetter={eventStyleGetter}
          tooltipAccessor={tooltipAccessor}
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
              {isAdminOrStaff && (
                  <ParticipantListStyled>
                      <h4><FaUsers /> Clientes Inscritos:</h4>
                      {selectedEvent.participants && selectedEvent.participants.length > 0 ? (
                          <ul>
                              {selectedEvent.participants.map(p => (
                                  <li key={p.id}>
                                      {p.firstName} {p.lastName} ({p.email})
                                  </li>
                              ))}
                          </ul>
                      ) : (
                          <p className="no-participants">Nenhum cliente inscrito.</p>
                      )}
                  </ParticipantListStyled>
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
                {professionalsForClient.map(prof => ( <option key={prof.id} value={prof.id}> {prof.firstName} {prof.lastName} ({prof.role}) </option> ))}
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

      {showAdminCreateOptionsModal && isAdminOrStaff && (
        <ModalOverlay onClick={handleCloseAdminCreateOptionsModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseAdminCreateOptionsModal}><FaTimes /></CloseButton>
            <ModalTitle>Criar Novo Evento</ModalTitle>
            <p style={{textAlign: 'center', marginBottom: '20px', color: theme.colors.textMuted}}>
              Para: {selectedSlotInfo?.date ? format(parse(selectedSlotInfo.date, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy', {locale: ptBR}) : ''} às {selectedSlotInfo?.time || ''}
            </p>
            <OptionsModalButton onClick={handleOpenAdminCreateTrainingModal}><FaDumbbell /> Criar Treino</OptionsModalButton>
            <OptionsModalButton onClick={handleOpenAdminCreateAppointmentModal}><FaCalendarPlus /> Criar Consulta</OptionsModalButton>
          </ModalContent>
        </ModalOverlay>
      )}

      {showAdminCreateTrainingModal && isAdminOrStaff && (
        <ModalOverlay onClick={handleCloseAdminCreateTrainingModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseAdminCreateTrainingModal}><FaTimes /></CloseButton>
            <ModalTitle>Criar Novo Treino</ModalTitle>
            {adminTrainingModalError && <ModalErrorText>{adminTrainingModalError}</ModalErrorText>}
            <AdminModalForm onSubmit={handleAdminCreateTrainingSubmit}>
              <AdminModalLabel htmlFor="adminTrainName">Nome do Treino*</AdminModalLabel>
              <AdminModalInput type="text" name="name" id="adminTrainName" value={adminTrainingFormData.name} onChange={handleAdminTrainingFormChange} required />

              <AdminModalLabel htmlFor="adminTrainDesc">Descrição</AdminModalLabel>
              <AdminModalTextarea name="description" id="adminTrainDesc" value={adminTrainingFormData.description} onChange={handleAdminTrainingFormChange} />

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div>
                    <AdminModalLabel htmlFor="adminTrainDate">Data*</AdminModalLabel>
                    <AdminModalInput type="date" name="date" id="adminTrainDate" value={adminTrainingFormData.date} onChange={handleAdminTrainingFormChange} required />
                </div>
                <div>
                    <AdminModalLabel htmlFor="adminTrainTime">Hora (HH:MM)*</AdminModalLabel>
                    <AdminModalInput type="time" name="time" id="adminTrainTime" value={adminTrainingFormData.time} onChange={handleAdminTrainingFormChange} required />
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div>
                    <AdminModalLabel htmlFor="adminTrainDuration">Duração (minutos)*</AdminModalLabel>
                    <AdminModalInput type="number" name="durationMinutes" id="adminTrainDuration" value={adminTrainingFormData.durationMinutes} onChange={handleAdminTrainingFormChange} required min="1" />
                </div>
                <div>
                    <AdminModalLabel htmlFor="adminTrainCapacity">Capacidade*</AdminModalLabel>
                    <AdminModalInput type="number" name="capacity" id="adminTrainCapacity" value={adminTrainingFormData.capacity} onChange={handleAdminTrainingFormChange} required min="1" />
                </div>
              </div>

              <AdminModalLabel htmlFor="adminTrainInstructor">Instrutor*</AdminModalLabel>
              <AdminModalSelect name="instructorId" id="adminTrainInstructor" value={adminTrainingFormData.instructorId} onChange={handleAdminTrainingFormChange} required>
                <option value="">Selecione um instrutor</option>
                {adminInstructors.map(instr => (
                  <option key={instr.id} value={instr.id}>{instr.firstName} {instr.lastName} ({instr.role})</option>
                ))}
              </AdminModalSelect>

              <ModalActions>
                <AdminModalButton type="button" secondary onClick={handleCloseAdminCreateTrainingModal} disabled={adminTrainingFormLoading}>Cancelar</AdminModalButton>
                <AdminModalButton type="submit" primary disabled={adminTrainingFormLoading}>
                  <FaDumbbell style={{marginRight: '8px'}} /> {adminTrainingFormLoading ? 'A criar...' : 'Criar Treino'}
                </AdminModalButton>
              </ModalActions>
            </AdminModalForm>
          </ModalContent>
        </ModalOverlay>
      )}

    {showAdminCreateAppointmentModal && isAdminOrStaff && (
        <ModalOverlay onClick={handleCloseAdminCreateAppointmentModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <CloseButton onClick={handleCloseAdminCreateAppointmentModal}><FaTimes /></CloseButton>
                <ModalTitle>Criar Nova Consulta</ModalTitle>
                {adminAppointmentModalError && <ModalErrorText>{adminAppointmentModalError}</ModalErrorText>}
                <AdminModalForm onSubmit={handleAdminCreateAppointmentSubmit}>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                        <div>
                            <AdminModalLabel htmlFor="adminApptDate">Data*</AdminModalLabel>
                            <AdminModalInput type="date" name="date" id="adminApptDate" value={adminAppointmentFormData.date} onChange={handleAdminAppointmentFormChange} required />
                        </div>
                        <div>
                            <AdminModalLabel htmlFor="adminApptTime">Hora (HH:MM)*</AdminModalLabel>
                            <AdminModalInput type="time" name="time" id="adminApptTime" value={adminAppointmentFormData.time} onChange={handleAdminAppointmentFormChange} required />
                        </div>
                    </div>
                    <AdminModalLabel htmlFor="adminApptDuration">Duração (minutos)*</AdminModalLabel>
                    <AdminModalInput type="number" name="durationMinutes" id="adminApptDuration" value={adminAppointmentFormData.durationMinutes} onChange={handleAdminAppointmentFormChange} required min="1" />

                    <AdminModalLabel htmlFor="adminApptStaff">Profissional*</AdminModalLabel>
                    <AdminModalSelect name="staffId" id="adminApptStaff" value={adminAppointmentFormData.staffId} onChange={handleAdminAppointmentFormChange} required>
                        <option value="">Selecione um profissional</option>
                        {adminStaffListForAppointment.map(staff => (
                            <option key={staff.id} value={staff.id}>{staff.firstName} {staff.lastName} ({staff.role})</option>
                        ))}
                    </AdminModalSelect>

                    <AdminModalLabel htmlFor="adminApptUser">Cliente (Opcional)</AdminModalLabel>
                    <AdminModalSelect name="userId" id="adminApptUser" value={adminAppointmentFormData.userId} onChange={handleAdminAppointmentFormChange}>
                        <option value="">Nenhum (Horário Vago)</option>
                        {adminUserListForAppointment.map(user => (
                            <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.email})</option>
                        ))}
                    </AdminModalSelect>

                    {adminAppointmentFormData.userId && (
                        <>
                            <AdminModalLabel htmlFor="adminApptCost">Custo Total (EUR){adminAppointmentFormData.userId ? '*' : ''}</AdminModalLabel>
                            <AdminModalInput type="number" name="totalCost" id="adminApptCost" value={adminAppointmentFormData.totalCost} onChange={handleAdminAppointmentFormChange} placeholder="Ex: 50.00" step="0.01" min={adminAppointmentFormData.userId ? "0.01" : "0"} />
                        </>
                    )}

                    <AdminModalLabel htmlFor="adminApptStatus">Status*</AdminModalLabel>
                    <AdminModalSelect name="status" id="adminApptStatus" value={adminAppointmentFormData.status} onChange={handleAdminAppointmentFormChange} required>
                        {appointmentStatuses.map(statusValue => (
                            <option key={statusValue} value={statusValue}>{statusValue.charAt(0).toUpperCase() + statusValue.slice(1).replace(/_/g, ' ')}</option>
                        ))}
                    </AdminModalSelect>

                    <AdminModalLabel htmlFor="adminApptNotes">Notas Adicionais</AdminModalLabel>
                    <AdminModalTextarea name="notes" id="adminApptNotes" value={adminAppointmentFormData.notes} onChange={handleAdminAppointmentFormChange} />

                    <ModalActions>
                        <AdminModalButton type="button" secondary onClick={handleCloseAdminCreateAppointmentModal} disabled={adminAppointmentFormLoading}>Cancelar</AdminModalButton>
                        <AdminModalButton type="submit" primary disabled={adminAppointmentFormLoading}>
                            <FaCalendarPlus style={{marginRight: '8px'}}/> {adminAppointmentFormLoading ? 'A criar...' : 'Criar Consulta'}
                        </AdminModalButton>
                    </ModalActions>
                </AdminModalForm>
            </ModalContent>
        </ModalOverlay>
    )}

    </PageContainer>
  );
};
export default CalendarPage;