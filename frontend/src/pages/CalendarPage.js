// src/pages/CalendarPage.js
import { logger } from '../utils/logger';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { css, useTheme} from 'styled-components';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import ptBR from 'date-fns/locale/pt-BR';
import moment from 'moment';
import { useToast } from '../components/Toast/ToastProvider';
import CustomCalendar, { Views } from '../components/Calendar/CustomCalendar';


import { useAuth } from '../context/AuthContext';
import {
    getAllTrainings,
    bookTraining as bookTrainingService,
    cancelTrainingBooking as cancelTrainingBookingService,
    adminCreateTraining,
    createSeriesSubscriptionService,
    createTrainingSeriesService,
    checkRecurringTrainings,
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
    FaTimes, FaUsers, FaUserMd, FaExternalLinkAlt,
    FaCalendarPlus, FaInfoCircle, FaCalendarDay, FaClock, FaUserCircle, FaStickyNote,
    FaDumbbell, FaRedo, FaTrashAlt
} from 'react-icons/fa';
import BackArrow from '../components/BackArrow';
import ConfirmationModal from '../components/Common/ConfirmationModal';

const initialRequestFormState = { staffId: '', date: '', time: '', notes: '' };
const initialAdminTrainingFormState = { name: '', description: '', date: '', time: '', capacity: 10, instructorId: '', durationMinutes: 45, isRecurring: false, recurrenceType: 'weekly', seriesStartDate: '', seriesEndDate: '', dayOfWeek: '1'};
const initialAdminAppointmentFormState = { date: '', time: '', staffId: '', userId: '', notes: '', status: 'disponível', durationMinutes: 60, totalCost: ''};
const appointmentStatuses = [ 'disponível', 'agendada', 'confirmada', 'concluída', 'cancelada_pelo_cliente', 'cancelada_pelo_staff', 'não_compareceu', 'pendente_aprovacao_staff', 'rejeitada_pelo_staff' ];

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 10px clamp(8px, 2vw, 20px);
  font-family: ${({ theme }) => theme.fonts.main};
  
  @media (max-width: 768px) {
    padding: 8px 5px;
  }
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


const CalendarWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 0;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  height: 80vh;
  overflow: hidden;
  
  @media (max-width: 768px) {
    border-radius: 6px;
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
  background-color: ${({ theme }) => theme.colors.overlayBg}; display: flex;
  justify-content: center; align-items: center;
  z-index: 1050; padding: 20px;
`;
const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
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
const EventModalButton = styled.button`
  background-color: ${props => props.danger ? props.theme.colors.error : (props.primary ? props.theme.colors.primary : props.theme.colors.buttonSecondaryBg)};
  color: ${props => props.danger ? 'white' : (props.primary ? props.theme.colors.textDark : props.theme.colors.textMain)};
  padding: 10px 18px; border-radius: ${({ theme }) => theme.borderRadius};
  border: none; cursor: pointer; font-weight: 600; font-size: 0.9rem;
  transition: background-color 0.2s ease, transform 0.15s ease;
  width: 100%;
  @media (min-width: 480px) { width: auto; }
  &:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
  &:disabled { background-color: ${({ theme }) => theme.colors.disabledBg}; color: ${({ theme }) => theme.colors.disabledText}; cursor: not-allowed; }
`;
const CloseButton = styled.button`
  position: absolute; top: 10px; right: 10px; background: transparent; border: none;
  color: ${({ theme }) => theme.colors.textMuted}; font-size: 1.8rem; cursor: pointer; line-height: 1; padding: 8px;
  transition: color 0.2s, transform 0.2s; border-radius: 50%;
  &:hover { color: ${({ theme }) => theme.colors.textMain}; transform: scale(1.1) rotate(90deg); }
`;

const ActionButton = styled.button`
  padding: 6px 10px;
  min-height: 44px; /* Touch target mínimo para mobile */
  font-size: 0.8rem;
  border-radius: 5px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease, transform 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  -webkit-tap-highlight-color: transparent;
  @media (max-width: 768px) {
    min-height: 48px;
    padding: 10px 16px;
  }

  background-color: ${props => {
    if (props.danger) return props.theme.colors.error;
    if (props.secondary) return props.theme.colors.buttonSecondaryBg;
    return props.theme.colors.primary;
  }};
  color: ${props => (props.danger || props.secondary) ? 'white' : props.theme.colors.textDark};

  &:hover:not(:disabled) {
    opacity: 0.85;
    transform: translateY(-1px);
  }
  &:disabled {
    background-color: #404040;
    color: #777;
    cursor: not-allowed;
  }
`;

const ModalButton = styled(ActionButton)` /* Existing definition */
  font-size: 0.9rem; 
  padding: 10px 18px;
  gap: 6px;
  width: 100%;
  @media (min-width: 480px) { width: auto; }
`;

const ModalLabel = styled.label`
  font-size: 0.85rem; 
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 4px; 
  display: block; 
  font-weight: 500;
`;

const ModalInput = styled.input`
  padding: 10px 14px; 
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain}; 
  font-size: 0.95rem; 
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { 
    outline: none; 
    border-color: ${({ theme }) => theme.colors.primary}; 
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing}; 
  }
`;

const RequestModalForm = styled.form` display: flex; flex-direction: column; gap: 15px; `;
const RequestModalLabel = styled.label` font-size: 0.85rem; color: ${({ theme }) => theme.colors.textMuted}; margin-bottom: 3px; display: block; font-weight: 500;`;
const RequestModalInput = styled.input` padding: 10px 14px; background-color: ${({ theme }) => theme.colors.buttonSecondaryBg}; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: ${({ theme }) => theme.borderRadius}; color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%; transition: border-color 0.2s, box-shadow 0.2s; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const RequestModalSelect = styled.select` padding: 10px 14px; background-color: ${({ theme }) => theme.colors.buttonSecondaryBg}; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: ${({ theme }) => theme.borderRadius}; color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%; transition: border-color 0.2s, box-shadow 0.2s; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const RequestModalTextarea = styled.textarea` padding: 10px 14px; background-color: ${({ theme }) => theme.colors.buttonSecondaryBg}; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: ${({ theme }) => theme.borderRadius}; color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%; min-height: 80px; resize: vertical; transition: border-color 0.2s, box-shadow 0.2s; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
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
  &:hover { background-color: ${({ theme }) => theme.colors.primaryHover}; transform: translateY(-2px); }
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
    background-color: ${({ theme }) => theme.colors.cardBackgroundDarker};
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
const AdminModalInput = styled.input` padding: 10px 14px; background-color: ${({ theme }) => theme.colors.buttonSecondaryBg}; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: ${({ theme }) => theme.borderRadius}; color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%; transition: border-color 0.2s, box-shadow 0.2s; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const AdminModalTextarea = styled.textarea` padding: 10px 14px; background-color: ${({ theme }) => theme.colors.buttonSecondaryBg}; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: ${({ theme }) => theme.borderRadius}; color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%; min-height: 80px; resize: vertical; transition: border-color 0.2s, box-shadow 0.2s; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const AdminModalSelect = styled.select` padding: 10px 14px; background-color: ${({ theme }) => theme.colors.buttonSecondaryBg}; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: ${({ theme }) => theme.borderRadius}; color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%; transition: border-color 0.2s, box-shadow 0.2s; &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const AdminModalButton = styled(ModalButton)``;

const SubscriptionFormGroup = styled.div`
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha || 'rgba(255,255,255,0.1)'};
`;
const SubscriptionLabel = styled(ModalLabel)``; 
const SubscriptionInput = styled(ModalInput)``; 
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



// --- Componente Principal ---
const CalendarPage = () => {
  const theme = useTheme();
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { search } = window.location;
  const searchParams = new URLSearchParams(search);
  const viewParam = searchParams.get('view');
  
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

  const [showAdminCreateAppointmentModal, setShowAdminCreateAppointmentModal] = useState(false);
  const [selectedSeriesDetailsForSubscription, setSelectedSeriesDetailsForSubscription] = useState(null);

  const [showSubscribeSeriesModal, setShowSubscribeSeriesModal] = useState(false);
  const [showBookTrainingConfirmModal, setShowBookTrainingConfirmModal] = useState(false);
  const [showCancelTrainingConfirmModal, setShowCancelTrainingConfirmModal] = useState(false);
  const [showBookAppointmentConfirmModal, setShowBookAppointmentConfirmModal] = useState(false);
  const [showCancelAppointmentConfirmModal, setShowCancelAppointmentConfirmModal] = useState(false);
  const [seriesSubscriptionEndDate, setSeriesSubscriptionEndDate] = useState('');
  const [seriesSubscriptionError, setSeriesSubscriptionError] = useState('');
  const [isSubscribingRecurring, setIsSubscribingRecurring] = useState(false);
  

  const [actionLoading, setActionLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(viewParam === 'agenda' ? Views.AGENDA : Views.WEEK);
  const [agendaVisibleCount, setAgendaVisibleCount] = useState(25);
  const [showCancelRecurringModal, setShowCancelRecurringModal] = useState(false);
  const [cancelRecurringInfo, setCancelRecurringInfo] = useState(null);
  const [trainingToCancel, setTrainingToCancel] = useState(null);

  const [adminTrainingFormData, setAdminTrainingFormData] = useState(initialAdminTrainingFormState);
  const [adminTrainingFormLoading, setAdminTrainingFormLoading] = useState(false);
  const [adminTrainingModalError, setAdminTrainingModalError] = useState('');
  const [adminInstructors, setAdminInstructors] = useState([]);
    
  const [adminAppointmentFormData, setAdminAppointmentFormData] = useState(initialAdminAppointmentFormState);
  const [adminAppointmentFormLoading, setAdminAppointmentFormLoading] = useState(false);
  const [adminAppointmentModalError, setAdminAppointmentModalError] = useState('');
  const [adminStaffListForAppointment, setAdminStaffListForAppointment] = useState([]);
  const [adminUserListForAppointment, setAdminUserListForAppointment] = useState([]);
    
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
        promisesToFetch.push(adminGetAllStaff(authState.token).catch(e => { logger.error("Falha ao buscar staff (admin)", e); return []; }));
        promisesToFetch.push(adminGetAllUsers(authState.token).catch(e => { logger.error("Falha ao buscar users (admin)", e); return []; }));
      } else if (isClient) {
        promisesToFetch.push(getAllStaffForSelection(authState.token).catch(e => { logger.warn("Falha ao buscar staff (client)", e.message); return []; }));
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

      // Remover treinos duplicados baseado no ID
      const seenTrainingIds = new Set();
      const uniqueTrainings = trainingsData.filter(training => {
        if (seenTrainingIds.has(training.id)) return false;
        seenTrainingIds.add(training.id);
        return true;
      });

      // Remover consultas duplicadas baseado no ID
      const seenAppointmentIds = new Set();
      const uniqueAppointments = appointmentsData.filter(appointment => {
        if (seenAppointmentIds.has(appointment.id)) return false;
        seenAppointmentIds.add(appointment.id);
        return true;
      });

      const formattedEvents = [];
      uniqueTrainings.forEach(training => {
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
      uniqueAppointments.forEach(appointment => {
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
      logger.error("CalendarPage fetchData error:", err);
addToast('Falha ao carregar dados do calendário.', { type: 'error', category: 'calendar' });
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
addToast('Falha ao enviar pedido de consulta.', { type: 'error', category: 'calendar' });
    } finally { setRequestFormLoading(false); }
  };

  const handleBookSelectedTraining = async () => {
    if (!selectedEvent || selectedEvent.type !== 'training') return;
    
    // Se o treino faz parte de uma série, perguntar se quer inscrever-se em mais treinos futuros
    if (selectedEvent.resource?.trainingSeriesId) {
      setSelectedSeriesDetailsForSubscription({
        id: selectedEvent.resource.trainingSeriesId,
        name: selectedEvent.resource.name || selectedEvent.title,
        date: selectedEvent.resource.date,
        time: selectedEvent.resource.time,
        seriesEndDate: selectedEvent.resource.seriesEndDate,
        instructor: selectedEvent.resource.instructor
      });
      setSeriesSubscriptionEndDate('');
      setSeriesSubscriptionError('');
      setShowSubscribeSeriesModal(true);
      return;
    }
    
    // Inscrição simples (sem série)
    setShowBookTrainingConfirmModal(true);
  };

  const handleBookTrainingConfirm = async () => {
    if (!selectedEvent || selectedEvent.type !== 'training') return;
    setActionLoading(true); 
    setPageError(''); 
    setPageSuccessMessage('');
    setShowBookTrainingConfirmModal(false);
    try {
      await bookTrainingService(selectedEvent.id, authState.token);
      setPageSuccessMessage('Inscrição no treino realizada com sucesso!');
      addToast('Inscrição no treino realizada com sucesso!', { type: 'success', category: 'calendar' });
      await fetchPageData(); 
      handleCloseEventModal();
    } catch (err) {
      setPageError(err.message || 'Falha ao inscrever no treino.');
      addToast('Falha ao inscrever no treino.', { type: 'error', category: 'calendar' });
    } finally { 
      setActionLoading(false); 
    }
  };
  const handleCancelTrainingBooking = async () => {
    if (!selectedEvent || selectedEvent.type !== 'training') return;
    
    // Verificar se há treinos futuros na mesma série
    if (selectedEvent.resource?.trainingSeriesId) {
      try {
        const recurringInfo = await checkRecurringTrainings(selectedEvent.id, authState.token);
        if (recurringInfo.hasRecurring && recurringInfo.futureCount > 0) {
          setCancelRecurringInfo(recurringInfo);
          setTrainingToCancel(selectedEvent.id);
          setShowCancelRecurringModal(true);
          return;
        }
      } catch (err) {
        logger.error('Erro ao verificar treinos recorrentes:', err);
      }
    }
    
    // Cancelamento normal (sem série ou sem futuros)
    setShowCancelTrainingConfirmModal(true);
  };

  const handleCancelTrainingConfirm = async () => {
    if (!selectedEvent || selectedEvent.type !== 'training') return;
    setActionLoading(true); 
    setPageError(''); 
    setPageSuccessMessage('');
    setShowCancelTrainingConfirmModal(false);
    try {
      await cancelTrainingBookingService(selectedEvent.id, authState.token);
      setPageSuccessMessage('Inscrição no treino cancelada com sucesso!');
      addToast('Inscrição cancelada.', { type: 'success', category: 'calendar' });
      await fetchPageData(); 
      handleCloseEventModal();
    } catch (err) {
      setPageError(err.message || 'Falha ao cancelar inscrição.');
      addToast('Falha ao cancelar inscrição.', { type: 'error', category: 'calendar' });
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleCancelAllRecurring = async () => {
    if (!trainingToCancel) return;
    setActionLoading(true); setPageError(''); setPageSuccessMessage('');
    try {
      await cancelTrainingBookingService(trainingToCancel, authState.token, true);
      setPageSuccessMessage('Inscrições canceladas com sucesso!');
      addToast('Inscrições canceladas.', { type: 'success', category: 'calendar' });
      await fetchPageData();
      handleCloseCancelRecurringModal();
      handleCloseEventModal();
    } catch (err) {
      setPageError(err.message || 'Falha ao cancelar inscrições.');
      addToast('Falha ao cancelar inscrições.', { type: 'error', category: 'calendar' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelCurrentOnly = async () => {
    if (!trainingToCancel) return;
    setActionLoading(true); setPageError(''); setPageSuccessMessage('');
    try {
      await cancelTrainingBookingService(trainingToCancel, authState.token, false);
      setPageSuccessMessage('Inscrição cancelada com sucesso!');
      addToast('Inscrição cancelada.', { type: 'success', category: 'calendar' });
      await fetchPageData();
      handleCloseCancelRecurringModal();
      handleCloseEventModal();
    } catch (err) {
      setPageError(err.message || 'Falha ao cancelar inscrição.');
      addToast('Falha ao cancelar inscrição.', { type: 'error', category: 'calendar' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseCancelRecurringModal = () => {
    setShowCancelRecurringModal(false);
    setCancelRecurringInfo(null);
    setTrainingToCancel(null);
  };
  const handleBookSelectedAppointment = () => {
    if (!selectedEvent || selectedEvent.type !== 'appointment') return;
    setShowBookAppointmentConfirmModal(true);
  };

  const handleBookAppointmentConfirm = async () => {
    if (!selectedEvent || selectedEvent.type !== 'appointment') return;
    setActionLoading(true); 
    setPageError(''); 
    setPageSuccessMessage('');
    setShowBookAppointmentConfirmModal(false);
    try {
      await bookAppointmentService(selectedEvent.id, authState.token);
      setPageSuccessMessage('Consulta marcado com sucesso!');
      addToast('Consulta marcada com sucesso!', { type: 'success', category: 'calendar' });
      await fetchPageData(); 
      handleCloseEventModal();
    } catch (err) {
      setPageError(err.message || 'Falha ao marcar consulta.');
      addToast('Falha ao marcar consulta.', { type: 'error', category: 'calendar' });
    } finally { 
      setActionLoading(false); 
    }
  };
  const handleCancelAppointmentBooking = () => {
    if (!selectedEvent || selectedEvent.type !== 'appointment') return;
    setShowCancelAppointmentConfirmModal(true);
  };

  const handleCancelAppointmentConfirm = async () => {
    if (!selectedEvent || selectedEvent.type !== 'appointment') return;
    setActionLoading(true); 
    setPageError(''); 
    setPageSuccessMessage('');
    setShowCancelAppointmentConfirmModal(false);
    try {
      await cancelAppointmentBookingService(selectedEvent.id, authState.token);
      setPageSuccessMessage('Consulta cancelada com sucesso!');
      addToast('Consulta cancelada.', { type: 'success', category: 'calendar' });
      await fetchPageData(); 
      handleCloseEventModal();
    } catch (err) {
      setPageError(err.message || 'Falha ao cancelar consulta.');
      addToast('Falha ao cancelar consulta.', { type: 'error', category: 'calendar' });
    } finally { 
      setActionLoading(false); 
    }
  };
  const handleAdminManageEvent = () => {
    if (!selectedEvent) return;
    if (selectedEvent.type === 'training') navigate(`/admin/manage-trainings#training-${selectedEvent.id}`);
    else if (selectedEvent.type === 'appointment') navigate(`/admin/manage-appointments#appointment-${selectedEvent.id}`);
    handleCloseEventModal();
  };

  const handleNavigate = useCallback((newDate) => { setCurrentDate(newDate); }, []);
  const handleViewChange = useCallback((newView) => { setCurrentView(newView); if (newView === Views.AGENDA) setAgendaVisibleCount(25); }, []);


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

  const handleAdminTrainingFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAdminTrainingFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAdminCreateTrainingSubmit = async (e) => {
        e.preventDefault();
        setAdminTrainingFormLoading(true);
        setAdminTrainingModalError('');
        setPageSuccessMessage('');

        const data = adminTrainingFormData;

        if (data.isRecurring) { // Se for recorrente
            const seriesPayload = {
                name: data.name,
                description: data.description,
                instructorId: parseInt(data.instructorId),
                recurrenceType: 'weekly', // Por agora, apenas semanal
                dayOfWeek: parseInt(data.dayOfWeek),
                startTime: data.time,
                seriesStartDate: data.seriesStartDate,
                seriesEndDate: data.seriesEndDate,
                capacity: parseInt(data.capacity),
            };
            if (data.time && data.durationMinutes) {
                const [hours, minutes] = data.time.split(':').map(Number);
                const endMoment = moment().hours(hours).minutes(minutes).add(parseInt(data.durationMinutes, 10), 'minutes');
                seriesPayload.endTime = endMoment.format('HH:mm:ss');
            }
            // Validações...
            if (!seriesPayload.seriesStartDate || !seriesPayload.seriesEndDate || !seriesPayload.instructorId) {
                setAdminTrainingModalError("Para treinos recorrentes, preencha os campos obrigatórios.");
                setAdminTrainingFormLoading(false);
                return;
            }
            try {
                await createTrainingSeriesService(seriesPayload, authState.token);
                setPageSuccessMessage('Série de treinos recorrentes criada com sucesso!');
                fetchPageData();
                handleCloseAdminCreateTrainingModal();
            } catch (err) {
                setAdminTrainingModalError(err.message || 'Falha ao criar série de treinos.');
addToast('Falha ao criar série de treinos.', { type: 'error', category: 'calendar' });
            } finally {
                setAdminTrainingFormLoading(false);
            }
        } else { // Se for treino único
            const trainingPayload = {
                name: data.name, description: data.description, date: data.date,
                time: data.time.length === 5 ? `${data.time}:00` : data.time,
                capacity: parseInt(data.capacity, 10),
                instructorId: parseInt(data.instructorId, 10),
                durationMinutes: parseInt(data.durationMinutes, 10),
            };
            try {
                await adminCreateTraining(trainingPayload, authState.token);
                setPageSuccessMessage('Novo treino criado com sucesso!');
addToast('Treino criado com sucesso!', { type: 'success', category: 'calendar' });
                fetchPageData();
                handleCloseAdminCreateTrainingModal();
            } catch (err) {
                setAdminTrainingModalError(err.message || 'Falha ao criar treino.');
addToast('Falha ao criar treino.', { type: 'error', category: 'calendar' });
            } finally {
                setAdminTrainingFormLoading(false);
            }
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
  const handleAdminAppointmentFormChange = (e) => {
      setAdminAppointmentFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleAdminCreateAppointmentSubmit = async (e) => {
      e.preventDefault();
      setAdminAppointmentFormLoading(true);
      setAdminAppointmentModalError('');
      setPageSuccessMessage('');
      
      const dataToSend = {
          ...adminAppointmentFormData,
          staffId: adminAppointmentFormData.staffId ? parseInt(adminAppointmentFormData.staffId, 10) : null,
          userId: adminAppointmentFormData.userId ? parseInt(adminAppointmentFormData.userId, 10) : null,
          durationMinutes: parseInt(adminAppointmentFormData.durationMinutes, 10),
          time: adminAppointmentFormData.time.length === 5 ? `${adminAppointmentFormData.time}:00` : adminAppointmentFormData.time,
          totalCost: (adminAppointmentFormData.userId && adminAppointmentFormData.totalCost !== '' && !isNaN(parseFloat(adminAppointmentFormData.totalCost))) ? parseFloat(adminAppointmentFormData.totalCost) : null,
          category: 'FISIOTERAPIA' // Categoria fixa para este modal
      };
      try {
          await adminCreateAppointment(dataToSend, authState.token);
          setPageSuccessMessage('Nova consulta criada com sucesso a partir do calendário!');
addToast('Consulta criada com sucesso!', { type: 'success', category: 'calendar' });
          fetchPageData();
          handleCloseAdminCreateAppointmentModal();
      } catch (err) {
          setAdminAppointmentModalError(err.message || 'Falha ao criar consulta.');
addToast('Falha ao criar consulta.', { type: 'error', category: 'calendar' });
      } finally {
          setAdminAppointmentFormLoading(false);
      }
  };

  const handleOpenSubscribeToSeriesModal = (trainingResource) => {
    if (!trainingResource || !trainingResource.trainingSeriesId) {
        logger.error("Este treino não parece pertencer a uma série ou falta trainingSeriesId.");
        setPageError("Este treino não pode ser subscrito como série.");
        return;
    }

    if (!trainingResource.series || !trainingResource.series.seriesStartDate || !trainingResource.series.seriesEndDate) {
        logger.error("Detalhes da série (seriesStartDate, seriesEndDate) não encontrados no objeto do treino:", trainingResource);
        setPageError("Detalhes da série incompletos. Tente recarregar a página ou contacte o suporte.");
        return;
    }

    const seriesDetails = trainingResource.series;

    setSelectedSeriesDetailsForSubscription({
        id: trainingResource.trainingSeriesId, 
        name: seriesDetails.name || trainingResource.name, 
        seriesStartDate: seriesDetails.seriesStartDate,  
        seriesEndDate: seriesDetails.seriesEndDate,        
        dayOfWeek: seriesDetails.dayOfWeek !== null && seriesDetails.dayOfWeek !== undefined 
                   ? seriesDetails.dayOfWeek 
                   : new Date(trainingResource.date + 'T00:00:00').getDay(), 
        time: seriesDetails.startTime ? seriesDetails.startTime.substring(0,5) : trainingResource.time.substring(0,5),
        recurrenceType: seriesDetails.recurrenceType || 'weekly', 
    });

    
    setSeriesSubscriptionEndDate(seriesDetails.seriesEndDate || '');
    setSeriesSubscriptionError('');
    setPageError(''); 
    setPageSuccessMessage('');

  
    if (typeof setShowEventModal === 'function') setShowEventModal(false); 
    setShowSubscribeSeriesModal(true);
};

  const handleCloseSubscribeSeriesModal = () => {
    setShowSubscribeSeriesModal(false);
    setSelectedSeriesDetailsForSubscription(null);
    setSeriesSubscriptionEndDate('');
    setSeriesSubscriptionError('');
    // Se estava a inscrever-se num treino, fechar também o modal do evento
    if (selectedEvent) {
      handleCloseEventModal();
    }
  };

  /** Inscrever apenas na sessão atual (treino de série), sem subscrever a série. Permite repor uma sessão cancelada. */
  const handleBookOnlyThisSessionInSeriesModal = async () => {
    if (!selectedEvent || selectedEvent.type !== 'training') return;
    setShowSubscribeSeriesModal(false);
    setSelectedSeriesDetailsForSubscription(null);
    setSeriesSubscriptionEndDate('');
    setSeriesSubscriptionError('');
    setActionLoading(true);
    setPageError('');
    setPageSuccessMessage('');
    try {
      await bookTrainingService(selectedEvent.id, authState.token);
      setPageSuccessMessage('Inscrição no treino realizada com sucesso!');
      addToast('Inscrição no treino realizada com sucesso!', { type: 'success', category: 'calendar' });
      await fetchPageData();
      handleCloseEventModal();
    } catch (err) {
      setPageError(err.message || 'Falha ao inscrever no treino.');
      addToast(err.message || 'Falha ao inscrever no treino.', { type: 'error', category: 'calendar' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeriesSubscriptionSubmit = async (e) => {
    e.preventDefault(); 
    if (!selectedEvent?.resource.trainingSeriesId || !seriesSubscriptionEndDate) {
      setSeriesSubscriptionError("Por favor, selecione uma data de fim para a subscrição.");
      return;
    }
    setIsSubscribingRecurring(true); 
    setSeriesSubscriptionError(''); setPageError(''); setPageSuccessMessage('');

    try {
      const result = await createSeriesSubscriptionService(
        {
          trainingSeriesId: selectedEvent.resource.trainingSeriesId,
          clientSubscriptionEndDate: seriesSubscriptionEndDate,
        },
        authState.token
      );
      setPageSuccessMessage(result.message || "Inscrição na série realizada com sucesso! As suas aulas foram adicionadas ao calendário.");
addToast('Inscrição na série realizada com sucesso!', { type: 'success', category: 'calendar' });
      fetchPageData(); 
      handleCloseSubscribeSeriesModal(); 
      handleCloseEventModal();      
    } catch (err) {
      setSeriesSubscriptionError(err.message || "Falha ao subscrever a série.");
addToast('Falha ao subscrever a série.', { type: 'error', category: 'calendar' });
    } finally {
      setIsSubscribingRecurring(false);
    }
  };

  if (loading) return (
    <PageContainer>
      <LoadingText>A carregar calendário...</LoadingText>
      <div style={{background: theme.colors.cardBackground, border: `1px solid ${theme.colors.cardBorder}`, borderRadius: 12, padding: 20}}>
        <div style={{height: 24, width: 180, background: '#444', borderRadius: 6, opacity: .25, animation: 'pulse 1.2s ease-in-out infinite', marginBottom: 12}} />
        {Array.from({length:7}).map((_,i)=>(
          <div key={i} style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 8, marginBottom: 8}}>
            {Array.from({length:7}).map((__,j)=>(
              <div key={j} style={{height: 60, background:'#444', borderRadius:8, opacity:.25, animation:'pulse 1.2s ease-in-out infinite'}} />
            ))}
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%{opacity:.2} 50%{opacity:.5} 100%{opacity:.2} }`}</style>
    </PageContainer>
  );

  return (
    <PageContainer>
      <HeaderSection> <Title>Calendário e Marcações</Title> </HeaderSection>
      <div style={{ marginBottom: '10px' }}>
        <BackArrow to={isAdminOrStaff ? "/admin/dashboard" : "/dashboard"} />
      </div>

      {pageError && <PageErrorText>{pageError}</PageErrorText>}
      {pageSuccessMessage && !showRequestModal && !showEventModal && !showAdminCreateOptionsModal && !showAdminCreateTrainingModal && !showAdminCreateAppointmentModal && <PageSuccessMessage>{pageSuccessMessage}</PageSuccessMessage>}

      <CalendarWrapper>
        <CustomCalendar
          events={events}
          currentDate={currentDate}
          view={currentView}
          onNavigate={handleNavigate}
          onViewChange={handleViewChange}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={true}
          min={new Date(1970, 0, 1, 7, 0, 0)}
          max={new Date(1970, 0, 1, 22, 0, 0)}
          step={60}
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
              {isClient && selectedEvent.type === 'training' && selectedEvent.trainingSeriesId && !myBookedTrainingIds.has(selectedEvent.id) && (
            <ModalButton
                onClick={() => handleOpenSubscribeToSeriesModal(selectedEvent)}
                disabled={actionLoading} 
                primary 
                style={{ backgroundColor: theme.colors.success, marginTop: '10px' }} 
              >
                <FaRedo style={{ marginRight: '8px' }} /> Inscrever Semanalmente (Série)
            </ModalButton>
            )}
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
            <ModalTitle>Criar Novo Evento de Treino</ModalTitle>
            
            <AdminModalForm onSubmit={handleAdminCreateTrainingSubmit}>
              {/* Checkbox para escolher o tipo de criação */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: '#333', borderRadius: '6px', marginBottom: '15px' }}>
                  <ModalInput
                    type="checkbox"
                    name="isRecurring"
                    id="isRecurringTrainModalForm"
                    checked={adminTrainingFormData.isRecurring || false}
                    onChange={handleAdminTrainingFormChange}
                    style={{ width: 'auto' }}
                  />
                  <ModalLabel htmlFor="isRecurringTrainModalForm" style={{ marginBottom: 0, cursor: 'pointer', color: theme.colors.textMain }}>
                    Criar como Treino Recorrente (Série)
                  </ModalLabel>
              </div>

              {/* --- Campos Comuns a Ambos os Tipos --- */}
              <ModalLabel htmlFor="adminTrainName">Nome do Treino/Série*</ModalLabel>
              <AdminModalInput type="text" name="name" id="adminTrainName" value={adminTrainingFormData.name} onChange={handleAdminTrainingFormChange} required />

              <ModalLabel htmlFor="adminTrainDesc">Descrição</ModalLabel>
              <AdminModalTextarea name="description" id="adminTrainDesc" value={adminTrainingFormData.description} onChange={handleAdminTrainingFormChange} />

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div>
                  <ModalLabel htmlFor="adminTrainInstructor">Instrutor*</ModalLabel>
                  <AdminModalSelect name="instructorId" id="adminTrainInstructor" value={adminTrainingFormData.instructorId} onChange={handleAdminTrainingFormChange} required>
                    <option value="">Selecione um instrutor</option>
                    {adminInstructors.map(instr => (
                      <option key={instr.id} value={instr.id}>{instr.firstName} {instr.lastName} ({instr.role})</option>
                    ))}
                  </AdminModalSelect>
                </div>
                <div>
                  <ModalLabel htmlFor="adminTrainCapacity">Capacidade*</ModalLabel>
                  <AdminModalInput type="number" name="capacity" id="adminTrainCapacity" value={adminTrainingFormData.capacity} onChange={handleAdminTrainingFormChange} required min="1" />
                </div>
              </div>

              {/* --- Campos para TREINO ÚNICO (isRecurring é false) --- */}
              {!adminTrainingFormData.isRecurring && (
                  <>
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                        <div>
                          <ModalLabel htmlFor="adminTrainDate">Data*</ModalLabel>
                          <AdminModalInput type="date" name="date" id="adminTrainDate" value={adminTrainingFormData.date} onChange={handleAdminTrainingFormChange} required />
                        </div>
                        <div>
                          <ModalLabel htmlFor="adminTrainTime">Hora (HH:MM)*</ModalLabel>
                          <AdminModalInput type="time" name="time" id="adminTrainTime" value={adminTrainingFormData.time} onChange={handleAdminTrainingFormChange} required />
                        </div>
                      </div>
                      <ModalLabel htmlFor="adminTrainDuration">Duração (minutos)*</ModalLabel>
                      <AdminModalInput type="number" name="durationMinutes" id="adminTrainDuration" value={adminTrainingFormData.durationMinutes} onChange={handleAdminTrainingFormChange} required min="1" />
                  </>
              )}

              {/* --- Campos para TREINO RECORRENTE (isRecurring é true) --- */}
              {adminTrainingFormData.isRecurring && (
                  <div style={{ borderTop: '1px solid #444', paddingTop: '15px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                        <div>
                          <ModalLabel htmlFor="dayOfWeekTrainModalForm">Dia da Semana*</ModalLabel>
                          <AdminModalSelect name="dayOfWeek" id="dayOfWeekTrainModalForm" value={adminTrainingFormData.dayOfWeek} onChange={handleAdminTrainingFormChange}>
                              <option value="1">Segunda-feira</option>
                              <option value="2">Terça-feira</option>
                              <option value="3">Quarta-feira</option>
                              <option value="4">Quinta-feira</option>
                              <option value="5">Sexta-feira</option>
                              <option value="6">Sábado</option>
                              <option value="0">Domingo</option>
                          </AdminModalSelect>
                        </div>
                        <div>
                          <ModalLabel htmlFor="adminTrainTimeRecurring">Hora de Início*</ModalLabel>
                          <AdminModalInput type="time" name="time" id="adminTrainTimeRecurring" value={adminTrainingFormData.time} onChange={handleAdminTrainingFormChange} required />
                        </div>
                      </div>
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                          <div>
                            <ModalLabel htmlFor="seriesStartDateTrainModalForm">Início da Série*</ModalLabel>
                            <AdminModalInput type="date" name="seriesStartDate" id="seriesStartDateTrainModalForm" value={adminTrainingFormData.seriesStartDate} onChange={handleAdminTrainingFormChange} required />
                          </div>
                          <div>
                            <ModalLabel htmlFor="seriesEndDateTrainModalForm">Fim da Série*</ModalLabel>
                            <AdminModalInput type="date" name="seriesEndDate" id="seriesEndDateTrainModalForm" value={adminTrainingFormData.seriesEndDate} onChange={handleAdminTrainingFormChange} required />
                          </div>
                      </div>
                       <div>
                          <ModalLabel htmlFor="adminTrainDurationRecurring">Duração de cada aula (minutos)*</ModalLabel>
                          <AdminModalInput type="number" name="durationMinutes" id="adminTrainDurationRecurring" value={adminTrainingFormData.durationMinutes} onChange={handleAdminTrainingFormChange} required min="1" />
                      </div>
                  </div>
              )}
              
              {adminTrainingModalError && <ModalErrorText>{adminTrainingModalError}</ModalErrorText>}
              
              <ModalActions>
                <AdminModalButton type="button" secondary onClick={handleCloseAdminCreateTrainingModal} disabled={adminTrainingFormLoading}>Cancelar</AdminModalButton>
                <AdminModalButton type="submit" primary disabled={adminTrainingFormLoading}>
                  {adminTrainingFormLoading ? 'A criar...' : 'Criar Evento'}
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
          {showSubscribeSeriesModal && selectedSeriesDetailsForSubscription && (
            <ModalOverlay onClick={handleCloseSubscribeSeriesModal}>
              <ModalContent onClick={e => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
                <CloseButton onClick={handleCloseSubscribeSeriesModal}><FaTimes /></CloseButton>
                <ModalTitle>Inscrever na Série: {selectedSeriesDetailsForSubscription.name.split(' - ')[0]}</ModalTitle>

                <ModalDetail>
                  Este treino repete-se todas as <strong>{moment(selectedSeriesDetailsForSubscription.date).locale('pt').format('dddd')}s</strong> às <strong>{selectedSeriesDetailsForSubscription.time}</strong>.
                </ModalDetail>
                <ModalDetail>
                  A série termina em: <strong>{selectedSeriesDetailsForSubscription.seriesEndDate ? new Date(selectedSeriesDetailsForSubscription.seriesEndDate).toLocaleDateString('pt-PT') : 'N/A'}</strong>.
                </ModalDetail>

                <p style={{ marginBottom: 12, fontSize: '0.9rem' }}>
                  <button
                    type="button"
                    onClick={handleBookOnlyThisSessionInSeriesModal}
                    disabled={isSubscribingRecurring || actionLoading}
                    style={{ background: 'none', border: 'none', color: theme.colors.primary, textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
                  >
                    Ou inscrever-me apenas nesta sessão
                  </button>
                </p>

                {seriesSubscriptionError && <ModalErrorText>{seriesSubscriptionError}</ModalErrorText>}

                <RequestModalForm onSubmit={async (e) => { 
                  e.preventDefault();
                  if (!selectedSeriesDetailsForSubscription?.id || !seriesSubscriptionEndDate) {
                    setSeriesSubscriptionError("Por favor, selecione uma data de fim para a subscrição.");
                    return;
                  }
                  setIsSubscribingRecurring(true);
                  setSeriesSubscriptionError(''); setPageError(''); setPageSuccessMessage('');

                  try {
                    const subscriptionPayload = {
                      trainingSeriesId: selectedSeriesDetailsForSubscription.id,
                      clientSubscriptionEndDate: seriesSubscriptionEndDate,
                    };
                    const result = await createSeriesSubscriptionService(subscriptionPayload, authState.token);
                    setPageSuccessMessage(result.message || "Inscrição na série realizada com sucesso! As suas aulas foram adicionadas ao calendário.");
addToast('Inscrição na série realizada com sucesso!', { type: 'success', category: 'calendar' });
                    await fetchPageData(); // Re-busca todos os eventos
                    handleCloseSubscribeSeriesModal();
                    if (selectedEvent) {
                      handleCloseEventModal();
                    }
                  } catch (err) {
                    setSeriesSubscriptionError(err.message || "Falha ao subscrever a série.");
                  } finally {
                    setIsSubscribingRecurring(false);
                  }
                }}>
                  <ModalLabel htmlFor="seriesSubEndDateCalendar">Quero participar nesta série até à data (inclusive):*</ModalLabel>
                  <ModalInput
                    type="date"
                    id="seriesSubEndDateCalendar"
                    value={seriesSubscriptionEndDate || ''}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSeriesSubscriptionEndDate(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    min={moment().format('YYYY-MM-DD')}
                    max={selectedSeriesDetailsForSubscription.seriesEndDate || undefined} 
                    required
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  />
                  <p style={{fontSize: '0.8rem', color: theme.colors.textMuted, marginTop:'5px'}}>
                    A sua inscrição será para todas as aulas desta série que ocorram até à data selecionada.
                  </p>
                  <ModalActions>
                    <ModalButton type="button" secondary onClick={handleCloseSubscribeSeriesModal} disabled={isSubscribingRecurring}>
                      Cancelar
                    </ModalButton>
                    <ModalButton type="submit" primary disabled={isSubscribingRecurring}>
                      {isSubscribingRecurring ? 'A Inscrever...' : 'Confirmar Inscrição na Série'}
                    </ModalButton>
                  </ModalActions>
                </RequestModalForm>
              </ModalContent>
            </ModalOverlay>
          )}

            {showCancelRecurringModal && cancelRecurringInfo && (
                <ModalOverlay onClick={handleCloseCancelRecurringModal}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <CloseButton onClick={handleCloseCancelRecurringModal}><FaTimes /></CloseButton>
                        <ModalTitle>Cancelar Inscrição</ModalTitle>
                        <p style={{color: theme.colors.textMain, marginBottom: '20px', lineHeight: '1.6'}}>
                            Este treino faz parte de uma série recorrente.<br/><br/>
                            Existem <strong>{cancelRecurringInfo.futureCount}</strong> treino(s) futuro(s) à mesma hora onde estás inscrito.
                        </p>
                        <ModalActions style={{flexDirection: 'column', gap: '12px'}}>
                            <ModalButton 
                                type="button" 
                                danger 
                                onClick={handleCancelAllRecurring}
                                disabled={actionLoading}
                                style={{width: '100%'}}
                            >
                                <FaTrashAlt style={{marginRight: '8px'}} />
                                Cancelar Todos os Futuros
                            </ModalButton>
                            <ModalButton 
                                type="button" 
                                primary 
                                onClick={handleCancelCurrentOnly}
                                disabled={actionLoading}
                                style={{width: '100%'}}
                            >
                                Apenas Este
                            </ModalButton>
                            <ModalButton 
                                type="button" 
                                secondary 
                                onClick={handleCloseCancelRecurringModal}
                                disabled={actionLoading}
                                style={{width: '100%'}}
                            >
                                Cancelar
                            </ModalButton>
                        </ModalActions>
                    </ModalContent>
                </ModalOverlay>
            )}

            <ConfirmationModal
                isOpen={showBookTrainingConfirmModal}
                onClose={() => {
                    if (!actionLoading) {
                        setShowBookTrainingConfirmModal(false);
                    }
                }}
                onConfirm={handleBookTrainingConfirm}
                title="Inscrever no Treino"
                message="Confirmas a inscrição neste treino?"
                confirmText="Confirmar"
                cancelText="Cancelar"
                danger={false}
                loading={actionLoading}
            />

            <ConfirmationModal
                isOpen={showCancelTrainingConfirmModal}
                onClose={() => {
                    if (!actionLoading) {
                        setShowCancelTrainingConfirmModal(false);
                    }
                }}
                onConfirm={handleCancelTrainingConfirm}
                title="Cancelar Inscrição"
                message="Confirmas o cancelamento da inscrição neste treino?"
                confirmText="Confirmar"
                cancelText="Cancelar"
                danger={true}
                loading={actionLoading}
            />

            <ConfirmationModal
                isOpen={showBookAppointmentConfirmModal}
                onClose={() => {
                    if (!actionLoading) {
                        setShowBookAppointmentConfirmModal(false);
                    }
                }}
                onConfirm={handleBookAppointmentConfirm}
                title="Marcar Consulta"
                message="Confirmas a marcação desta consulta?"
                confirmText="Confirmar"
                cancelText="Cancelar"
                danger={false}
                loading={actionLoading}
            />

            <ConfirmationModal
                isOpen={showCancelAppointmentConfirmModal}
                onClose={() => {
                    if (!actionLoading) {
                        setShowCancelAppointmentConfirmModal(false);
                    }
                }}
                onConfirm={handleCancelAppointmentConfirm}
                title="Cancelar Consulta"
                message="Confirmas o cancelamento desta consulta?"
                confirmText="Confirmar"
                cancelText="Cancelar"
                danger={true}
                loading={actionLoading}
            />
    </PageContainer>
  );
};
export default CalendarPage;