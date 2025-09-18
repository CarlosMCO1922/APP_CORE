// src/pages/DashboardPage.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/userService';
import { clientGetMyPendingPaymentsService } from '../services/paymentService';
import { 
    getActiveTrainingSeriesForClientService, 
    createSeriesSubscriptionService, 
    cancelTrainingBooking 
} from '../services/trainingService'; 
import { FaCalendarAlt, FaRunning, FaUserMd, FaRegCalendarCheck, 
    FaRegClock, FaExclamationTriangle, FaCreditCard, FaUsers, 
    FaInfoCircle, FaTimes, FaPlusSquare, FaEye, FaTrashAlt // <<< ADICIONADO
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

  @media (max-width: 768px) {
    padding: 20px 20px;
  }
  @media (max-width: 480px) {
    padding: 15px 15px;
  }
`;

const Header = styled.header`
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #4A4A4A;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.5rem;
  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
  @media (max-width: 480px) {
    font-size: 1.8rem;
  }
`;

const WelcomeMessage = styled.p`
  font-size: 1.1rem;
  color: #b0b0b0;
  @media (max-width: 480px) {
    font-size: 1rem;
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
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  gap: 10px;
  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const BookingList = styled.ul`
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const BookingItem = styled.li`
  background-color: #252525;
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
    color: #a0a0a0;
    line-height: 1.5;
     @media (max-width: 480px) {
        font-size: 0.9rem;
    }
  }
  span {
    font-weight: 600;
    color: #c8c8c8;
  }
`;

const UpcomingEventItem = styled.li`
  background-color: #252525;
  padding: 20px;
  border-radius: 10px;
  border-left: 5px solid #00A9FF;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  h3 { font-size: 1.1rem; color: #00A9FF; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;}
  p { font-size: 0.9rem; margin: 4px 0; color: #a0a0a0; }
  span { font-weight: 600; color: #c8c8c8; }
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
  color: #888;
  padding: 20px;
  background-color: #222;
  border-radius: 8px;
`;

const StyledLinkButton = styled(Link)`
  display: inline-block;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 12px 22px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  font-size: 0.95rem;
  transition: background-color 0.2s ease-in-out, transform 0.15s ease;

  &:hover {
    background-color: #e6c358;
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
  list-style: none; /* Adicionado para garantir que não há bullets */
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
      color: ${({ theme }) => theme.colors.textMain};
    }
  }
`;

const PayNowButton = styled(Link)`
  background-color: ${({ theme }) => theme.colors.success || '#4CAF50'};
  color: white;
  padding: 8px 15px;
  border-radius: 5px;
  text-decoration: none;
  font-weight: 500;
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
  padding: 10px 14px; background-color: #333;
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
  color: #aaa; font-size: 1.8rem; cursor: pointer;
  &:hover { color: #fff; }
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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
`;

const ItemCard = styled.li`
  background-color: ${({ theme }) => theme.colors.cardBackground || '#252525'};
  padding: 20px;
  border-radius: ${({ theme }) => theme.borderRadius || '10px'};
  border-left: 5px solid ${({ theme, itemType }) => 
    itemType === 'series' ? (theme.colors.success || '#66BB6A') : (theme.colors.primary || '#D4AF37')};
  box-shadow: ${({ theme }) => theme.boxShadow || '0 4px 12px rgba(0,0,0,0.4)'};
  transition: transform 0.2s ease-in-out;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover { transform: translateY(-3px); }

  h3 { margin-top: 0; margin-bottom: 12px; color: ${({ theme }) => theme.colors.textMain}; font-size: 1.25rem; }
  p { margin: 6px 0; font-size: 0.95rem; color: ${({ theme }) => theme.colors.textMuted || '#a0a0a0'}; line-height: 1.5; display: flex; align-items: center; gap: 6px; }
  p svg { color: ${({ theme }) => theme.colors.primary}; margin-right: 4px; }
  span { font-weight: 600; color: ${({ theme }) => theme.colors.textMain || '#c8c8c8'}; }
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
  border-top: 1px solid #383838;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
    const { authState } = useAuth();
    const [bookings, setBookings] = useState({ trainings: [], appointments: [] });
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pageMessage, setPageMessage] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const [availableSeries, setAvailableSeries] = useState([]);
    const [loadingSeries, setLoadingSeries] = useState(true);
    const [seriesError, setSeriesError] = useState('');
    const [showSeriesModal, setShowSeriesModal] = useState(false);
    const [selectedSeriesForSubscription, setSelectedSeriesForSubscription] = useState(null);
    const [clientSubscriptionEndDate, setClientSubscriptionEndDate] = useState('');
    const [subscribingToSeries, setSubscribingToSeries] = useState(false);
    const [seriesModalMessage, setSeriesModalMessage] = useState({ type: '', text: '' });

    const fetchPageData = useCallback(async () => {
        if (!authState.token) return;
        setLoading(true);
        setError('');
        setSeriesError('');
        try {
            const [bookingsData, pendingPaymentsData, seriesData] = await Promise.all([
                getMyBookings(authState.token),
                clientGetMyPendingPaymentsService(authState.token).catch(() => []),
                getActiveTrainingSeriesForClientService(authState.token).catch(() => [])
            ]);
            setBookings({
                trainings: bookingsData.trainings || [],
                appointments: bookingsData.appointments || []
            });
            setPendingPayments(pendingPaymentsData || []);
            setAvailableSeries(seriesData || []);
        } catch (err) {
            setError('Não foi possível carregar todos os dados do dashboard.');
            console.error("Erro ao buscar dados do dashboard:", err);
        } finally {
            setLoading(false);
            setLoadingSeries(false);
        }
    }, [authState.token]);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const upcomingEvents = useMemo(() => {
        const now = new Date();
        const allEvents = [
            ...bookings.trainings.map(t => ({...t, eventType: 'Treino', dateObj: moment(`${t.date}T${t.time}`).toDate(), link: `/treinos/${t.id}/plano`, icon: <FaRunning />, uniqueKey: `train-${t.id}`})),
            ...bookings.appointments.map(a => ({...a, eventType: 'Consulta', dateObj: moment(`${a.date}T${a.time}`).toDate(), icon: <FaUserMd />, uniqueKey: `appt-${a.id}`}))
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

    if (loading) {
        return <PageContainer><LoadingText>A carregar o seu dashboard...</LoadingText></PageContainer>;
    }

    return (
        <PageContainer>
            <Header>
                <Title>Meu Painel CORE</Title>
                <WelcomeMessage>Bem-vindo(a) de volta, {authState.user?.firstName || 'Utilizador'}!</WelcomeMessage>
            </Header>

            <ActionsSection>
                <StyledLinkButton to="/calendario">Agendar</StyledLinkButton>
                <StyledLinkButton to="/meus-treinos">Meus Treinos</StyledLinkButton>
                <StyledLinkButton to="/meus-pagamentos">Meus Pagamentos</StyledLinkButton>
            </ActionsSection>

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
                    <BookingList>
                        {upcomingEvents.map(event => (
                            <UpcomingEventItem key={event.uniqueKey}>
                                <div>
                                    <h3>{event.icon} {event.name || event.title}</h3>
                                    <p><span>Data:</span> {moment(event.dateObj).locale('pt').format('dddd, D/MM/YYYY [às] HH:mm')}</p>
                                    <p><span>Com:</span> {event.instructor?.firstName || event.professional?.firstName || 'N/A'}</p>
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
                ) : (
                    !loading && <NoBookingsText>Não tens eventos futuros agendados.</NoBookingsText>
                )}
            </Section>

            <Section>
                <SectionTitle><FaUsers /> Descobrir Programas Semanais</SectionTitle>
                {loadingSeries ? <LoadingText>A carregar programas...</LoadingText> : seriesError ? <ErrorText>{seriesError}</ErrorText> : (
                    availableSeries.length > 0 ? (
                        <ItemList>
                            {availableSeries.map(series => (
                                <ItemCard key={series.id} itemType="series">
                                    <div>
                                        <h3>{series.name}</h3>
                                        <p><FaRegClock /> Todas as {moment().day(series.dayOfWeek).format('dddd')}s, {series.startTime.substring(0,5)} - {series.endTime.substring(0,5)}</p>
                                        {series.instructor && <p><span>Instrutor:</span> {series.instructor.firstName} {series.instructor.lastName}</p>}
                                    </div>
                                    <ViewDetailsButton onClick={() => handleOpenSeriesSubscriptionModal(series)}>
                                        <FaInfoCircle /> Ver Detalhes e Inscrever
                                    </ViewDetailsButton>
                                </ItemCard>
                            ))}
                        </ItemList>
                    ) : (
                        <NoItemsText>De momento, não há programas semanais com inscrições abertas.</NoItemsText>
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