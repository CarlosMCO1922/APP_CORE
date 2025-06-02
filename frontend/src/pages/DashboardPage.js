// src/pages/DashboardPage.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/userService';
import { clientGetMyPendingPaymentsService } from '../services/paymentService'; // Importado
import { 
    getActiveTrainingSeriesForClientService, 
    createSeriesSubscriptionService 
} from '../services/trainingService'; 
import { FaCalendarAlt, FaRunning, FaUserMd, FaRegCalendarCheck, FaRegClock, FaExclamationTriangle, FaCreditCard } from 'react-icons/fa';
import moment from 'moment';
import 'moment/locale/pt';
import { theme } from '../theme'; // Assume que tem um theme.js

// --- Styled Components ---
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

const UpcomingEventItem = styled(BookingItem)`
  border-left-color: #00A9FF;
  min-height: auto;
  padding: 15px;

  h3 {
    font-size: 1.1rem;
    color: #00A9FF;
    margin-bottom: 8px;
  }
  p {
    font-size: 0.9rem;
    margin: 4px 0;
  }
  .event-type-icon {
    margin-right: 8px;
    color: #00A9FF;
  }
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

const PlanLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: underline;
  display: inline-block;
  margin-top: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 5px 0;
  &:hover {
    color: #e6c358;
  }
`;

const PendingPaymentsSection = styled(Section)`
  border: 2px solid ${({ theme }) => theme.colors.warning || '#FFA000'};
  background-color: rgba(255, 160, 0, 0.05);
  padding: 20px;
  border-radius: ${({ theme }) => theme.borderRadius};
`;

const PendingPaymentItem = styled.li`
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
const CloseModalButton = styled.button` /* Renomeado de CloseButton */
  position: absolute; top: 10px; right: 15px; background: transparent; border: none;
  color: #aaa; font-size: 1.8rem; cursor: pointer;
  &:hover { color: #fff; }
`;
const ModalMessageText = styled.p` /* Para mensagens dentro do modal */
  font-size: 0.9rem; text-align: center; padding: 10px; margin: 10px 0 0 0;
  border-radius: 4px;
  &.success { color: ${({ theme }) => theme.colors.success}; background-color: ${({ theme }) => theme.colors.successBg}; border: 1px solid ${({ theme }) => theme.colors.success};}
  &.error { color: ${({ theme }) => theme.colors.error}; background-color: ${({ theme }) => theme.colors.errorBg}; border: 1px solid ${({ theme }) => theme.colors.error};}
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
  &:hover {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
  }
`;


const DashboardPage = () => {
  const { authState } = useAuth();
  const [bookings, setBookings] = useState({ trainings: [], appointments: [] });
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingPaymentsError, setPendingPaymentsError] = useState('');

  const [availableSeries, setAvailableSeries] = useState([]);
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [seriesError, setSeriesError] = useState('');
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [selectedSeriesForSubscription, setSelectedSeriesForSubscription] = useState(null);
  const [clientSubscriptionEndDate, setClientSubscriptionEndDate] = useState('');
  const [subscribingToSeries, setSubscribingToSeries] = useState(false);
  const [seriesModalMessage, setSeriesModalMessage] = useState({type: '', text: ''});

  const fetchPageData = useCallback(async () => {
    if (authState.token) {
      setLoading(true);
      setError('');
      setPendingPaymentsError('');
      try {
        const [bookingsData, pendingPaymentsData] = await Promise.all([
          getMyBookings(authState.token),
          clientGetMyPendingPaymentsService(authState.token)
        ]);

        setBookings({
          trainings: bookingsData.trainings || [],
          appointments: bookingsData.appointments || []
        });
        setPendingPayments(pendingPaymentsData || []);

      } catch (err) {
        console.error("Erro ao buscar dados do dashboard:", err);
        if (err.message.toLowerCase().includes("pagamentos pendentes")) { // Mais robusto
            setPendingPaymentsError(err.message);
        } else if (err.message.toLowerCase().includes("marcações")) { // Mais robusto
            setError(err.message);
        } else {
            setError('Não foi possível carregar todos os dados do dashboard.');
        }
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const allEvents = [];

    bookings.trainings.forEach(training => {
      const eventDate = new Date(`${training.date}T${training.time}`);
      if (eventDate >= now) {
        allEvents.push({
          id: `train-${training.id}`,
          type: 'Treino',
          title: training.name,
          date: eventDate,
          description: training.instructor ? `Com ${training.instructor.firstName} ${training.instructor.lastName}` : '',
          icon: <FaRunning />,
          link: `/treinos/${training.id}/plano`
        });
      }
    });

    bookings.appointments.forEach(appointment => {
      const eventDate = new Date(`${appointment.date}T${appointment.time}`);
      // Filtrar para mostrar apenas consultas que não estão em estados "finais" ou "negativos"
      const relevantStatus = !['cancelada_pelo_cliente', 'cancelada_pelo_staff', 'rejeitada_pelo_staff', 'concluída', 'não_compareceu'].includes(appointment.status);
      if (eventDate >= now && relevantStatus) {
        allEvents.push({
          id: `appt-${appointment.id}`,
          type: 'Consulta',
          title: `Consulta de ${appointment.professional?.role === 'physiotherapist' ? 'Fisioterapia' : 'Acompanhamento'}`,
          date: eventDate,
          description: `Com ${appointment.professional?.firstName} ${appointment.professional?.lastName}`,
          icon: <FaUserMd />,
          link: `/calendario`
        });
      }
    });

    return allEvents.sort((a, b) => a.date - b.date).slice(0, 3);
  }, [bookings.trainings, bookings.appointments]);

  // 👇 NOVAS FUNÇÕES HANDLER PARA SÉRIES 👇
  const handleOpenSeriesSubscriptionModal = (series) => {
    setSelectedSeriesForSubscription(series);
    setClientSubscriptionEndDate(series.seriesEndDate); // Default para o fim da série
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
        // O backend calculará a clientSubscriptionStartDate se não for enviada,
        // ou pode definir aqui se quiser que o cliente possa escolher (ex: new Date().toISOString().split('T')[0])
      };
      const result = await createSeriesSubscriptionService(subscriptionData, authState.token);
      setSeriesModalMessage({type: 'success', text: result.message || 'Inscrição na série bem-sucedida!'});
      // Refresh bookings para mostrar as novas aulas da série
      fetchPageData(); 
      // Opcional: fechar modal após um tempo ou deixar o user fechar
      setTimeout(() => {
          handleCloseSeriesSubscriptionModal();
          // Pode querer redirecionar para /calendario ou /meus-agendamentos
          // navigate('/calendario'); 
      }, 3000);

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
        <StyledLinkButton to="/calendario">Ver Calendário e Marcar</StyledLinkButton>
        <StyledLinkButton to="/meus-pagamentos">Meus Pagamentos</StyledLinkButton>
        <StyledLinkButton to="/definicoes">Minhas Definições</StyledLinkButton>
      </ActionsSection>

      {error && <ErrorText>{error}</ErrorText>}
      {pendingPaymentsError && <ErrorText>{pendingPaymentsError}</ErrorText>}

      {pendingPayments.length > 0 && (
        <PendingPaymentsSection>
          <SectionTitle style={{ color: theme.colors.warning || '#FFA000' }}>
            <FaExclamationTriangle /> Pagamentos Pendentes
          </SectionTitle>
          <BookingList style={{gridTemplateColumns: '1fr'}}>
            {pendingPayments.map(payment => (
              <PendingPaymentItem key={`pending-${payment.id}`}>
                <div>
                  <p><span>Descrição:</span> {payment.description || payment.category.replace(/_/g, ' ')}</p>
                  <p><span>Valor:</span> {Number(payment.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</p>
                  <p><span>Data de Emissão:</span> {new Date(payment.paymentDate).toLocaleDateString('pt-PT')}</p>
                </div>
                <PayNowButton to="/meus-pagamentos">
                  <FaCreditCard /> Pagar Agora
                </PayNowButton>
              </PendingPaymentItem>
            ))}
          </BookingList>
        </PendingPaymentsSection>
      )}

      <Section>
        <SectionTitle><FaRegCalendarCheck /> Próximos Eventos</SectionTitle>
        {upcomingEvents.length > 0 ? (
          <BookingList>
            {upcomingEvents.map(event => (
              <UpcomingEventItem key={event.id}>
                <h3><span className="event-type-icon">{event.icon}</span>{event.title}</h3>
                <p><FaRegClock style={{ marginRight: '5px'}} /> <span>Data:</span> {event.date.toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} às {event.date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
                <p>{event.description}</p>
                {event.type === 'Treino' && event.link && (
                    <PlanLink to={event.link}>Ver Plano de Treino</PlanLink>
                )}
              </UpcomingEventItem>
            ))}
          </BookingList>
        ) : (
          !loading && <NoBookingsText>Não tens eventos futuros agendados.</NoBookingsText>
        )}
      </Section>

      <Section>
        <SectionTitle><FaCalendarAlt /> Descobrir Programas Semanais</SectionTitle>
        {loadingSeries && <LoadingText>A carregar programas...</LoadingText>}
        {seriesError && <ErrorText>{seriesError}</ErrorText>}
        {!loadingSeries && !seriesError && availableSeries.length === 0 && (
          <NoItemsText>De momento, não há programas semanais disponíveis.</NoItemsText>
        )}
        {!loadingSeries && !seriesError && availableSeries.length > 0 && (
          <ItemList>
            {availableSeries.map(series => (
              <ItemCard key={`series-${series.id}`} itemType="series">
                <div>
                  <h3>{series.name}</h3>
                  {series.instructor && <p><span>Instrutor:</span> {series.instructor.firstName} {series.instructor.lastName}</p>}
                  <p><span>Horário:</span> Todas as {moment().day(series.dayOfWeek).format('dddd')}s, {series.startTime.substring(0,5)} - {series.endTime.substring(0,5)}</p>
                  <p><span>Período:</span> {moment(series.seriesStartDate).format('DD/MM/YY')} a {moment(series.seriesEndDate).format('DD/MM/YY')}</p>
                  {series.description && <p><FaInfoCircle /> {series.description.substring(0,100)}{series.description.length > 100 && '...'}</p>}
                </div>
                <ViewDetailsButton onClick={() => handleOpenSeriesSubscriptionModal(series)}>
                  <FaPlusSquare /> Detalhes e Inscrição
                </ViewDetailsButton>
              </ItemCard>
            ))}
          </ItemList>
        )}
      </Section>

      <Section>
        <SectionTitle><FaRunning /> Meus Treinos Inscritos</SectionTitle>
        {bookings.trainings.length > 0 ? (
          <BookingList>
            {bookings.trainings.map(training => (
              <BookingItem key={`train-${training.id}`}>
                <div>
                  <h3>{training.name}</h3>
                  <p><span>Data:</span> {new Date(training.date).toLocaleDateString('pt-PT')} às {training.time.substring(0, 5)}</p>
                  <p><span>Instrutor:</span> {training.instructor?.firstName} {training.instructor?.lastName}</p>
                  <p><span>Descrição:</span> {training.description || 'Sem descrição.'}</p>
                </div>
                <PlanLink to={`/treinos/${training.id}/plano`}>
                  Ver Plano de Treino
                </PlanLink>
              </BookingItem>
            ))}
          </BookingList>
        ) : (
          !loading && <NoBookingsText>Ainda não te inscreveste em nenhum treino.</NoBookingsText>
        )}
      </Section>

      <Section>
        <SectionTitle><FaUserMd /> Minhas Consultas Agendadas</SectionTitle>
        {bookings.appointments.length > 0 ? (
          <BookingList>
            {bookings.appointments.map(appointment => (
              <BookingItem key={`appt-${appointment.id}`}>
                <h3>Consulta de {appointment.professional?.role === 'physiotherapist' ? 'Fisioterapia' : 'Acompanhamento'}</h3>
                <p><span>Data:</span> {new Date(appointment.date).toLocaleDateString('pt-PT')} às {appointment.time.substring(0, 5)}</p>
                <p><span>Profissional:</span> {appointment.professional?.firstName} {appointment.professional?.lastName}</p>
                <p><span>Status:</span> {appointment.status?.replace(/_/g, ' ')}</p>
                <p><span>Notas:</span> {appointment.notes || 'Sem notas adicionais.'}</p>
              </BookingItem>
            ))}
          </BookingList>
        ) : (
          !loading && <NoBookingsText>Não tens consultas agendadas.</NoBookingsText>
        )}
      </Section>

      {showSeriesModal && selectedSeriesForSubscription && (
        <ModalOverlay onClick={handleCloseSeriesSubscriptionModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseModalButton onClick={handleCloseSeriesSubscriptionModal}><FaTimes /></CloseModalButton>
            <ModalTitle>Inscrever em: {selectedSeriesForSubscription.name}</ModalTitle>
            
            <ModalDetail><strong>Instrutor:</strong> {selectedSeriesForSubscription.instructor?.firstName} {selectedSeriesForSubscription.instructor?.lastName}</ModalDetail>
            <ModalDetail>
                <strong>Horário Fixo Semanal:</strong> Todas as {moment().day(selectedSeriesForSubscription.dayOfWeek).format('dddd')}s, das {selectedSeriesForSubscription.startTime.substring(0,5)} às {selectedSeriesForSubscription.endTime.substring(0,5)}.
            </ModalDetail>
            <ModalDetail><strong>Período da Série:</strong> {moment(selectedSeriesForSubscription.seriesStartDate).format('L')} a {moment(selectedSeriesForSubscription.seriesEndDate).format('L')}.</ModalDetail>
            {selectedSeriesForSubscription.description && <ModalDetail><strong>Descrição:</strong> {selectedSeriesForSubscription.description}</ModalDetail>}
            {selectedSeriesForSubscription.location && <ModalDetail><strong>Local:</strong> {selectedSeriesForSubscription.location}</ModalDetail>}
            <ModalDetail><strong>Capacidade por Aula:</strong> {selectedSeriesForSubscription.capacity} participantes.</ModalDetail>
            
            <ModalForm onSubmit={handleSubscribeToSeries}>
              <ModalLabel htmlFor="clientSubscriptionEndDate">Pretendo frequentar até à data (inclusive):</ModalLabel>
              <ModalInput 
                type="date" 
                id="clientSubscriptionEndDate"
                name="clientSubscriptionEndDate"
                value={clientSubscriptionEndDate}
                onChange={handleSubscriptionDateChange}
                min={moment.max(moment(), moment(selectedSeriesForSubscription.seriesStartDate)).format('YYYY-MM-DD')}
                max={selectedSeriesForSubscription.seriesEndDate}
                required
              />
              <p style={{fontSize: '0.8rem', color: theme.colors.textMuted}}>
                Pode escolher qualquer data de fim até ao final da série. A sua inscrição será para todas as aulas semanais dentro do período que selecionar.
              </p>
              {seriesModalMessage.text && <ModalMessageText className={seriesModalMessage.type}>{seriesModalMessage.text}</ModalMessageText>}
              <ModalActions>
                <ModalButton type="button" onClick={handleCloseSeriesSubscriptionModal} disabled={subscribingToSeries}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={subscribingToSeries}>
                  {subscribingToSeries ? 'A Inscrever...' : 'Confirmar Inscrição na Série'}
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