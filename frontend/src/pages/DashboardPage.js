// src/pages/DashboardPage.js
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { css, useTheme } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/userService';
import { clientGetMyPendingPaymentsService } from '../services/paymentService';
import { 
    getActiveTrainingSeriesForClientService, 
    createSeriesSubscriptionService, 
    cancelTrainingBooking,
    getAllTrainings,
    bookTraining as bookTrainingService
} from '../services/trainingService'; 
import { FaCalendarAlt, FaRunning, FaUserMd, FaRegCalendarCheck, 
    FaRegClock, FaExclamationTriangle, FaCreditCard, FaUsers, 
    FaInfoCircle, FaTimes, FaPlusSquare, FaEye, FaTrashAlt, FaRedo, FaPencilAlt
} from 'react-icons/fa';
import moment from 'moment';
import 'moment/locale/pt';


// --- Styled Components (do teu ficheiro original) ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 20px 40px;
  font-family: ${({ theme }) => theme.fonts.main};
  position: relative;

  @media (max-width: 768px) {
    padding: 20px 20px;
  }
  @media (max-width: 480px) {
    padding: 15px 15px;
  }
`;

const TogglerContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 40px;
  z-index: 10;
  
  @media (max-width: 768px) {
    right: 20px;
    top: 15px;
  }
  @media (max-width: 480px) {
    right: 15px;
    top: 15px;
  }
`;

const Header = styled.header`
  margin-bottom: 30px;
  padding-bottom: 20px;
  padding-right: 80px; /* Espaço para o toggle */
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  text-align: center;
  
  @media (max-width: 768px) {
    padding-right: 70px;
  }
  @media (max-width: 480px) {
    padding-right: 60px;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.5rem;
  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const WelcomeMessage = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textMain};
  @media (max-width: 480px) {
    font-size: 0.95rem;
  }
`;

const ActionsSection = styled.section`
  margin-bottom: 30px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px;
`;

const Section = styled.section`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  display: flex;
  align-items: center;
  gap: 10px;
  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

const BookingList = styled.ul`
  list-style: none;
  padding: 0;
  display: flex;
  gap: 20px;
  overflow-x: auto; 
  scroll-snap-type: x mandatory; 
  -webkit-overflow-scrolling: touch; 
  scrollbar-width: none; 
  &::-webkit-scrollbar {
    display: none; 
  }
`;
const BookingItem = styled.li`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px;
  border-radius: 10px;
  border-left: 5px solid ${({ theme }) => theme.colors.primary};
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  transition: transform 0.2s ease-in-out;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover {
    transform: translateY(-3px);
  }

  h3 {
    margin-top: 0;
    margin-bottom: 12px;
    color: ${({ theme }) => theme.colors.textMain};
    font-size: 1.25rem;
     @media (max-width: 480px) {
        font-size: 1.1rem;
    }
  }
  p {
    margin: 6px 0;
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.5;
     @media (max-width: 480px) {
        font-size: 0.9rem;
    }
  }
  span {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textMain};
  }
`;

const UpcomingEventItem = styled.li`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px;
  border-radius: 10px;
  border-left: 5px solid ${({ theme }) => theme.colors.primary};
  box-shadow: 0 4px 12px ${({ theme }) => theme.colors.borderShadow};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
   min-height: 210px;

  /* Linhas adicionadas para o slider */
  flex-shrink: 0; // Impede que os itens encolham
  width: calc(100% / 3 - 14px); // Mostra 3 itens de cada vez (ajusta o 14px se o 'gap' for diferente de 20px)
  scroll-snap-align: start; // Define o ponto de "íman"

  @media (max-width: 1024px) {
    width: calc(100% / 2 - 10px); // Mostra 2 itens em tablets
  }
  @media (max-width: 768px) {
    width: 80%; // Mostra 1 item de cada vez em mobile, com um vislumbre do próximo
  }


  h3 { 
    font-size: 1.1rem;
    color: ${({ theme }) => theme.colors.primary}; 
    margin: 0 0 8px 0; 
    display: flex; 
    align-items: center; 
    gap: 8px;
  }

  p { 
    font-size: 0.9rem; 
    margin: 4px 0; 
    color: ${({ theme }) => theme.colors.textMuted}; 
    display: flex;
    align-items: center;
    gap:8px
  }
  span { font-weight: 600; color: ${({ theme }) => theme.colors.primary} }
`;

const LoadingText = styled.p`
  text-align: center;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.primary};
  padding: 20px;
`;

const MessageBaseStyles = css`
  text-align: center;
  padding: 12px 18px;
  margin: 20px auto;
  border-radius: ${({ theme }) => theme.borderRadius};
  border-width: 1px;
  border-style: solid;
  max-width: 600px;
  font-size: 0.9rem;
  font-weight: 500;
`;

const ErrorText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.error || '#FF6B6B'};
  background-color: ${({ theme }) => theme.colors.errorBg || 'rgba(255, 107, 107, 0.1)'};
  border-color: ${({ theme }) => theme.colors.error || '#FF6B6B'};
`;

const MessageText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.success};
  background-color: ${({ theme }) => theme.colors.successBg};
  border-color: ${({ theme }) => theme.colors.success};
`;

const NoBookingsText = styled.p`
  text-align: center;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 20px;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-radius: 8px;
`;

const StyledLinkButton = styled(Link)`
  display: inline-block;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textButton};
  padding: 12px 22px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  font-size: 0.95rem;
  transition: background-color 0.2s ease-in-out, transform 0.15s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
    padding: 10px 18px;
    width: 100%;
    text-align: center;
  }
`;

const PendingPaymentsSection = styled(Section)`
  border: 2px solid ${({ theme }) => theme.colors.warning || '#FFA000'};
  background-color: rgba(255, 160, 0, 0.05);
  padding: 20px;
  border-radius: ${({ theme }) => theme.borderRadius};
`;

const PendingPaymentItem = styled.li`
  list-style: none; 
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 4px solid ${({ theme }) => theme.colors.warning || '#FFA000'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;

  p {
    margin: 2px 0;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};
    span {
      font-weight: 600;
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const PayNowButton = styled(Link)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textButton};
  padding: 8px 15px;
  border-radius: 5px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background-color: ${({ theme }) => theme.colors.successDark || '#388E3C'};
  }
`;

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.88); display: flex;
  justify-content: center; align-items: center;
  z-index: 1050; padding: 20px;
`;
const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker || '#2C2C2C'};
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
  margin: 8px 0; font-size: 0.9rem; line-height: 1.6;
  color: ${({ theme }) => theme.colors.textMuted};
  strong { font-weight: 600; color: ${({ theme }) => theme.colors.textMain}; }
`;
const ModalForm = styled.form` display: flex; flex-direction: column; gap: 15px; margin-top: 20px;`;
const ModalLabel = styled.label` font-size: 0.85rem; color: ${({ theme }) => theme.colors.textMuted}; margin-bottom: 3px; display: block; font-weight: 500;`;
const ModalInput = styled.input`
  padding: 10px 14px; background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
`;
const ModalActions = styled.div`
  display: flex; flex-direction: column; gap: 10px;
  margin-top: 25px; padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  @media (min-width: 480px) { flex-direction: row; justify-content: flex-end; }
`;
const ModalButton = styled.button`
  background-color: ${props => props.primary ? props.theme.colors.primary : props.theme.colors.buttonSecondaryBg};
  color: ${props => props.primary ? props.theme.colors.textDark : props.theme.colors.textMain};
  padding: 10px 18px; border-radius: ${({ theme }) => theme.borderRadius};
  border: none; cursor: pointer; font-weight: 600; font-size: 0.9rem;
  &:hover:not(:disabled) { opacity: 0.9; }
  &:disabled { background-color: #444; color: #888; cursor: not-allowed; }
  width: 100%;
  @media (min-width: 480px) { width: auto; }
`;
const CloseModalButton = styled.button`
  position: absolute; top: 10px; right: 15px; background: transparent; border: none;
  color: ${({ theme }) => theme.colors.textMuted}; font-size: 1.8rem; cursor: pointer;
  &:hover { color: ${({ theme }) => theme.colors.textMain}; }
`;
const ModalMessageText = styled.p`
  font-size: 0.9rem; text-align: center; padding: 10px; margin: 10px 0 0 0;
  border-radius: 4px;
  &.success { color: ${({ theme }) => theme.colors.success}; background-color: ${({ theme }) => theme.colors.successBg}; border: 1px solid ${({ theme }) => theme.colors.success};}
  &.error { color: ${({ theme }) => theme.colors.error}; background-color: ${({ theme }) => theme.colors.errorBg}; border: 1px solid ${({ theme }) => theme.colors.error};}
`;

const ItemList = styled.ul`
  list-style: none;
  padding: 0;
  display: flex; 
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

// Dentro de DashboardPage.js

const ItemCard = styled.li`
  background-color: ${({ theme }) => theme.colors.cardBackground || '#252525'};
  padding: 20px;
  border-radius: ${({ theme }) => theme.borderRadius || '10px'};
  border-left: 5px solid ${({ theme }) => theme.colors.lightGray|| '#cccccc'};
  transition: transform 0.2s ease-in-out;
  min-height: 210px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  /* ... resto dos estilos (flex-shrink, width, etc.) ... */
  flex-shrink: 0;
  width: calc(100% / 3 - 14px);
  scroll-snap-align: start;

  @media (max-width: 1024px) {
    width: calc(100% / 2 - 10px);
  }
  @media (max-width: 768px) {
    width: 80%;
  }

  h3 { 
    margin-top: 0; 
    margin-bottom: 12px; color: ${({ theme }) => theme.colors.lightGray|| '#cccccc'};
    font-size: 1.25rem; 
  }

  p { 
    margin: 6px 0; 
    font-size: 0.95rem; color: ${({ theme }) => theme.colors.lightGray|| '#cccccc'}; 
    line-height: 1.5; 
    display: flex; align-items: center; 
    gap: 6px; 
  }

  p svg { 
    color: ${({ theme }) => theme.colors.textMuted}; 
    margin-right: 4px; 
  }

  span { 
    font-weight: 600; 
    color: ${({ theme }) => theme.colors.primary }
  }
`;

const ViewDetailsButton = styled.button`
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  color: ${({ theme }) => theme.colors.textMain};
  padding: 8px 15px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &:hover { background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg}; }
`;

const EventActions = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SliderContainer = styled.div`
  position: relative; 
`;

const NavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: ${({ theme }) => theme.colors.sliderButton}; 
  border: 0.5px solid ${({ theme }) => theme.colors.sliderButton};
  color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.textDark};
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  // Posicionamento específico para cada botão
  &.left {
    left: -20px;
  }

  &.right {
    right: -20px;
  }

  @media (max-width: 480px) {
    display: none;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  font-size: 1.8rem;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border-radius: 8px;

  &:hover {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
    transform: scale(1.1);
  }
`;

const PlanLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &:hover {
    text-decoration: underline;
    color: #e6c358;
  }
`;

const CancelButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.error};
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  transition: all 0.2s;
  &:hover:not(:disabled) {
    color: #ff8a8a;
    transform: scale(1.1);
  }
  &:disabled {
    color: #555;
    cursor: not-allowed;
  }
`;

const NoItemsText = styled.p`text-align: center; color: #888; padding: 20px;`;

const DashboardPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const eventsSliderRef = useRef(null); 
    const seriesSliderRef = useRef(null);
    const { authState } = useAuth();
    const [bookings, setBookings] = useState({ trainings: [], appointments: [] });
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pageMessage, setPageMessage] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const [availableTrainings, setAvailableTrainings] = useState([]);
    const [loadingTrainings, setLoadingTrainings] = useState(true);
    const [trainingsError, setTrainingsError] = useState('');
    const [showSeriesModal, setShowSeriesModal] = useState(false);
    const [selectedSeriesForSubscription, setSelectedSeriesForSubscription] = useState(null);
    const [clientSubscriptionEndDate, setClientSubscriptionEndDate] = useState('');
    const [subscribingToSeries, setSubscribingToSeries] = useState(false);
    const [seriesModalMessage, setSeriesModalMessage] = useState({ type: '', text: '' });
    const [showTrainingDetailsModal, setShowTrainingDetailsModal] = useState(false);
    const [selectedTrainingForDetails, setSelectedTrainingForDetails] = useState(null);

    const fetchPageData = useCallback(async () => {
        if (!authState.token) return;
        setLoading(true);
        setError('');
        setTrainingsError('');
        try {
            const [bookingsData, pendingPaymentsData, allTrainingsData] = await Promise.all([
                getMyBookings(authState.token),
                clientGetMyPendingPaymentsService(authState.token).catch(() => []),
                getAllTrainings(authState.token).catch(() => [])
            ]);
            setBookings({
                trainings: bookingsData.trainings || [],
                appointments: bookingsData.appointments || []
            });
            setPendingPayments(pendingPaymentsData || []);
            
            // Filtrar apenas treinos futuros com vagas disponíveis
            const now = new Date();
            const available = (allTrainingsData || []).filter(training => {
                const trainingDate = new Date(`${training.date}T${training.time}`);
                const spotsAvailable = training.capacity - (training.participants?.length || 0);
                return trainingDate >= now && spotsAvailable > 0;
            }).sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA - dateB;
            }).slice(0, 10); // Limitar a 10 treinos
            setAvailableTrainings(available);
        } catch (err) {
            setError('Não foi possível carregar todos os dados do dashboard.');
            setTrainingsError('Não foi possível carregar treinos disponíveis.');
            console.error("Erro ao buscar dados do dashboard:", err);
        } finally {
            setLoading(false);
            setLoadingTrainings(false);
        }
    }, [authState.token]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

const upcomingEvents = useMemo(() => {
        const now = new Date();
        const seenIds = new Set();
        const allEvents = [
            ...bookings.trainings
                .filter(t => {
                    // Remover duplicados baseado no ID
                    if (seenIds.has(t.id)) return false;
                    seenIds.add(t.id);
                    return true;
                })
                .map(t => ({
                    ...t,
                    eventType: 'Treino',
                    dateObj: moment(`${t.date}T${t.time}`).toDate(),
                    link: `/treinos/${t.id}/plano`,
                    icon: <FaRunning />,
                    uniqueKey: `train-${t.id}`,
                    name: t.name || 'Treino'
                })),
            ...bookings.appointments
                .filter(a => {
                    // Remover duplicados baseado no ID
                    if (seenIds.has(`appt-${a.id}`)) return false;
                    seenIds.add(`appt-${a.id}`);
                    return true;
                })
                .map(a => ({
                    ...a,
                    eventType: 'Consulta',
                    dateObj: moment(`${a.date}T${a.time}`).toDate(),
                    icon: <FaUserMd />,
                    uniqueKey: `appt-${a.id}`,
                    name: a.title || (a.professional ? `Consulta com ${a.professional.firstName}` : 'Consulta')
                }))
        ];
        return allEvents
            .filter(event => event.dateObj >= now && !['cancelada_pelo_cliente', 'cancelada_pelo_staff', 'rejeitada_pelo_staff', 'concluída'].includes(event.status))
            .sort((a, b) => a.dateObj - b.dateObj)
            .slice(0, 5);
    }, [bookings]);

    const handleCancelTraining = async (trainingId) => {
        if (!window.confirm("Tem a certeza que quer cancelar a sua inscrição neste treino?")) return;
        setActionLoading(trainingId);
        setPageMessage('');
        setError('');
        try {
            const res = await cancelTrainingBooking(trainingId, authState.token);
            setPageMessage(res.message || "Inscrição cancelada com sucesso!");
            await fetchPageData();
        } catch (err) {
            setError(err.message || "Não foi possível cancelar a inscrição.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleBookTraining = async (trainingId) => {
        if (!window.confirm("Confirmas a inscrição neste treino?")) return;
        setActionLoading(trainingId);
        setPageMessage('');
        setError('');
        try {
            await bookTrainingService(trainingId, authState.token);
            setPageMessage("Inscrição no treino realizada com sucesso!");
            await fetchPageData();
        } catch (err) {
            setError(err.message || "Falha ao inscrever no treino.");
        } finally {
            setActionLoading(null);
        }
    };


    const handleOpenSeriesSubscriptionModal = (series) => {
        setSelectedSeriesForSubscription(series);
        setClientSubscriptionEndDate(series.seriesEndDate); 
        setSeriesModalMessage({type: '', text: ''});
        setShowSeriesModal(true);
    };
    
    const handleCloseSeriesSubscriptionModal = () => {
        setShowSeriesModal(false);
        setSelectedSeriesForSubscription(null);
        setClientSubscriptionEndDate('');
        setSeriesModalMessage({type: '', text: ''});
    };
    
    const handleSubscriptionDateChange = (e) => {
        setClientSubscriptionEndDate(e.target.value);
    };
    
    const handleSubscribeToSeries = async (e) => {
        e.preventDefault();
        if (!selectedSeriesForSubscription || !authState.token) return;
        setSubscribingToSeries(true);
        setSeriesModalMessage({type: '', text: ''});
        try {
          const subscriptionData = {
            trainingSeriesId: selectedSeriesForSubscription.id,
            clientSubscriptionEndDate: clientSubscriptionEndDate,
          };
          const result = await createSeriesSubscriptionService(subscriptionData, authState.token);
          setSeriesModalMessage({type: 'success', text: result.message || 'Inscrição na série bem-sucedida!'});
          fetchPageData();
          setTimeout(() => handleCloseSeriesSubscriptionModal(), 3000);
        } catch (error) {
          console.error("Erro ao inscrever na série:", error);
          setSeriesModalMessage({type: 'error', text: error.message || 'Falha ao inscrever na série.'});
        } finally {
          setSubscribingToSeries(false);
        }
    };

    const handleScroll = (sliderRef, direction) => {
    if (sliderRef.current) {
        // Esta nova lógica calcula a largura exata de um item + o espaçamento
        const firstItem = sliderRef.current.querySelector('li');
        if (firstItem) {
            const scrollAmount = firstItem.offsetWidth + 20; // 20 é o valor do 'gap'
            sliderRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    }
};

    if (loading) {
        return <PageContainer><LoadingText>A carregar o seu dashboard...</LoadingText></PageContainer>;
    }

    return (
        <PageContainer>
            <Header>
                <WelcomeMessage><strong>Bem-vindo(a) de volta, {authState.user?.firstName || 'Utilizador'}!</strong></WelcomeMessage>
            </Header>

            {error && <ErrorText>{error}</ErrorText>}
            {pageMessage && <MessageText>{pageMessage}</MessageText>}

            {pendingPayments.length > 0 && (
                <PendingPaymentsSection>
                    <SectionTitle style={{ color: theme.colors.warning || '#FFA000' }}><FaExclamationTriangle /> Pagamentos Pendentes</SectionTitle>
                    <ul>
                        {pendingPayments.map(payment => (
                            <PendingPaymentItem key={`pending-${payment.id}`}>
                                <div>
                                    <p><span>Descrição:</span> {payment.description || payment.category.replace(/_/g, ' ')}</p>
                                    <p><span>Valor:</span> {Number(payment.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</p>
                                </div>
                                <PayNowButton to="/meus-pagamentos"><FaCreditCard /> Pagar Agora</PayNowButton>
                            </PendingPaymentItem>
                        ))}
                    </ul>
                </PendingPaymentsSection>
            )}

            <Section>
                <SectionTitle><FaRegCalendarCheck /> Próximos Eventos</SectionTitle>
                {!loading && upcomingEvents.length > 0 ? (
                    <SliderContainer>
                      {upcomingEvents.length > 3 && (
                        <>
                          <NavButton className='left' onClick={() => handleScroll(eventsSliderRef, 'left')}>←</NavButton>
                          <NavButton className='right' onClick={() => handleScroll(eventsSliderRef, 'right')}>→</NavButton>
                        </>
                      )}

                      <BookingList ref={eventsSliderRef}>
                          {upcomingEvents.map(event => (
                              <UpcomingEventItem key={event.uniqueKey}>
                                  <div>
                                      <h3>{event.icon} {event.name || event.title}</h3>
                                      <p><FaRegClock />{moment(event.dateObj).locale('pt').format('dddd, D/MM/YYYY [às] HH:mm')}</p>
                                      <p><span>Instrutor:</span> {event.instructor?.firstName|| event.professional?.firstName || 'N/A'}</p>
                                  </div>
                                  <EventActions>
                                      {event.link ? <PlanLink to={event.link}><FaEye /> Ver Plano</PlanLink> : <span />}
                                      {event.eventType === 'Treino' && (
                                          <CancelButton 
                                              onClick={() => handleCancelTraining(event.id)}
                                              disabled={actionLoading === event.id}
                                              title="Cancelar inscrição"
                                          >
                                              {actionLoading === event.id ? 'A cancelar...' : <FaTrashAlt />}
                                          </CancelButton>
                                      )}
                                  </EventActions>
                              </UpcomingEventItem>
                          ))}
                      </BookingList>
                    </SliderContainer>
                ) : (
                    !loading && <NoBookingsText>Não existe eventos futuros.</NoBookingsText>
                )}
            </Section>

            <Section>
              <SectionTitle><FaUsers /> Treinos Disponíveis</SectionTitle>
              {loadingTrainings ? <LoadingText>A carregar treinos...</LoadingText> : trainingsError ? <ErrorText>{trainingsError}</ErrorText> : (
                  availableTrainings.length > 0 ? (
                      <SliderContainer>
                          {availableTrainings.length > 3 && (
                              <>
                                  <NavButton className="left" onClick={() => handleScroll(seriesSliderRef, 'left')}>←</NavButton>
                                  <NavButton className="right" onClick={() => handleScroll(seriesSliderRef, 'right')}>→</NavButton>
                              </>
                          )}

                          <ItemList ref={seriesSliderRef}>
                              {availableTrainings.map(training => {
                                const spotsAvailable = training.capacity - (training.participants?.length || 0);
                                const trainingDate = moment(`${training.date}T${training.time}`);
                                
                                return (
                                    <ItemCard key={training.id} itemType="training">
                                        <div>
                                            <h3>{training.name}</h3>
                                        </div>
                                        <EventActions>
                                            <IconButton 
                                                onClick={() => {
                                                    setSelectedTrainingForDetails(training);
                                                    setShowTrainingDetailsModal(true);
                                                }}
                                                title="Ver Detalhes"
                                            >
                                                <FaInfoCircle />
                                            </IconButton>
                                            <IconButton 
                                                onClick={() => {
                                                    if (training.trainingSeriesId) {
                                                        handleOpenSeriesSubscriptionModal({ 
                                                            id: training.trainingSeriesId,
                                                            name: training.name,
                                                            dayOfWeek: trainingDate.day(),
                                                            startTime: training.time,
                                                            endTime: moment(training.time, 'HH:mm:ss').add(training.durationMinutes || 45, 'minutes').format('HH:mm:ss'),
                                                            instructor: training.instructor,
                                                            seriesStartDate: training.date,
                                                            seriesEndDate: training.date
                                                        });
                                                    } else {
                                                        // Inscrição simples
                                                        handleBookTraining(training.id);
                                                    }
                                                }}
                                                title="Inscrever-me"
                                            >
                                                <FaPencilAlt />
                                            </IconButton>
                                        </EventActions>
                                    </ItemCard>
                                );
                            })}
                          </ItemList>
                      </SliderContainer>
                  ) : (
                      <NoItemsText>De momento, não há treinos disponíveis com vagas.</NoItemsText>
                  )
              )}
            </Section>

            {showSeriesModal && selectedSeriesForSubscription && (
                <ModalOverlay onClick={handleCloseSeriesSubscriptionModal}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <CloseModalButton onClick={handleCloseSeriesSubscriptionModal}><FaTimes /></CloseModalButton>
                        <ModalTitle>Inscrever em: {selectedSeriesForSubscription.name}</ModalTitle>
                        <ModalDetail><strong>Instrutor:</strong> {selectedSeriesForSubscription.instructor?.firstName} {selectedSeriesForSubscription.instructor?.lastName}</ModalDetail>
                        <ModalDetail><strong>Horário:</strong> Todas as {moment().day(selectedSeriesForSubscription.dayOfWeek).format('dddd')}s, das {selectedSeriesForSubscription.startTime.substring(0,5)} às {selectedSeriesForSubscription.endTime.substring(0,5)}.</ModalDetail>
                        <ModalForm onSubmit={handleSubscribeToSeries}>
                            <ModalLabel htmlFor="clientSubscriptionEndDate">Pretendo frequentar até à data (inclusive):</ModalLabel>
                            <ModalInput type="date" id="clientSubscriptionEndDate" name="clientSubscriptionEndDate" value={clientSubscriptionEndDate} onChange={handleSubscriptionDateChange} min={moment.max(moment(), moment(selectedSeriesForSubscription.seriesStartDate)).format('YYYY-MM-DD')} max={selectedSeriesForSubscription.seriesEndDate} required />
                            {seriesModalMessage.text && <ModalMessageText className={seriesModalMessage.type}>{seriesModalMessage.text}</ModalMessageText>}
                            <ModalActions>
                                <ModalButton type="button" onClick={handleCloseSeriesSubscriptionModal} disabled={subscribingToSeries}>Cancelar</ModalButton>
                                <ModalButton type="submit" primary disabled={subscribingToSeries}>
                                    {subscribingToSeries ? 'A Inscrever...' : 'Confirmar Inscrição'}
                                </ModalButton>
                            </ModalActions>
                        </ModalForm>
                    </ModalContent>
                </ModalOverlay>
            )}
        </PageContainer>
    );
};

export default DashboardPage;