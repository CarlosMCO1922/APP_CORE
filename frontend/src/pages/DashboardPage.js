// src/pages/DashboardPage.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/userService';
import { clientGetMyPendingPaymentsService } from '../services/paymentService';
import {
    FaCalendarAlt, FaRunning, FaUserMd, FaRegCalendarCheck,
    FaRegClock, FaExclamationTriangle, FaCreditCard
} from 'react-icons/fa';
import { theme } from '../theme'; // Garanta que tem um ficheiro theme.js configurado

// --- Styled Components (Completos) ---
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
    display: flex; // Para alinhar ícone
    align-items: center;
  }
  p {
    font-size: 0.9rem;
    margin: 4px 0;
  }
  .event-type-icon {
    margin-right: 8px;
    color: #00A9FF; // Cor do ícone
  }
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

const LoadingText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.primary};
  border-color: transparent;
  background: transparent;
  font-style: italic;
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
  background-color: #222; // Cor de fundo para destaque quando não há itens
  border-radius: 8px;
`;

const StyledLinkButton = styled(Link)`
  display: inline-block;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark}; // Ajustado para textDark para contraste
  padding: 12px 22px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  font-size: 0.95rem;
  transition: background-color 0.2s ease-in-out, transform 0.15s ease;

  &:hover {
    background-color: #e6c358; // Cor de hover mais clara
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


const DashboardPage = () => {
  const { authState } = useAuth();
  const [bookings, setBookings] = useState({ trainings: [], appointments: [] });
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingPaymentsError, setPendingPaymentsError] = useState('');

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
        if (err.message.toLowerCase().includes("pagamentos pendentes")) {
            setPendingPaymentsError(err.message);
        } else if (err.message.toLowerCase().includes("marcações")) {
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
    </PageContainer>
  );
};

export default DashboardPage;