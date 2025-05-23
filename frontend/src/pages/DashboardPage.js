// src/pages/DashboardPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext'; // Ajusta o caminho se necessário
import { getMyBookings } from '../services/userService'; // Ajusta o caminho se necessário

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: #1A1A1A;
  color: #E0E0E0;
  min-height: 100vh;
  padding: 20px 40px; // Padding base
  font-family: 'Inter', sans-serif;

  @media (max-width: 768px) {
    padding: 20px 20px; // Reduz padding lateral
  }
  @media (max-width: 480px) {
    padding: 15px 15px; // Reduz mais
  }
`;

const Header = styled.header`
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #4A4A4A;
  text-align: center; // Centralizar header
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #D4AF37;
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

const ActionsSection = styled.section` // Renomeado de Section para ActionsSection para clareza
  margin-bottom: 30px;
  display: flex;
  flex-wrap: wrap; // Permite que os botões quebrem linha
  justify-content: center; // Centraliza os botões
  gap: 15px; // Espaço entre os botões
`;

const Section = styled.section`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: #D4AF37;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
  @media (max-width: 480px) {
    font-size: 1.5rem; // Reduzir para mobile
  }
`;

const BookingList = styled.ul`
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); // Já responsivo!
  gap: 20px;
`;

const BookingItem = styled.li`
  background-color: #252525;
  padding: 20px;
  border-radius: 10px;
  border-left: 5px solid #D4AF37;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  transition: transform 0.2s ease-in-out;
  min-height: 180px; // Altura mínima para consistência
  display: flex; // Para melhor controlo do conteúdo interno
  flex-direction: column;
  justify-content: space-between; // Para empurrar o link do plano para baixo se houver

  &:hover {
    transform: translateY(-3px);
  }

  h3 {
    margin-top: 0;
    margin-bottom: 12px; // Aumentar um pouco
    color: #E0E0E0;
    font-size: 1.25rem;
     @media (max-width: 480px) {
        font-size: 1.1rem;
    }
  }
  p {
    margin: 6px 0; // Ligeiro ajuste
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

const LoadingText = styled.p` /* ... como antes ... */ `;
const ErrorText = styled.p` /* ... como antes ... */ `;
const NoBookingsText = styled.p` /* ... como antes ... */ `;

const StyledLinkButton = styled(Link)`
  display: inline-block;
  background-color: #D4AF37;
  color: #1A1A1A;
  padding: 12px 22px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  font-size: 0.95rem;
  /* margin: 10px 10px 10px 0; // Removido, o gap no ActionsSection trata disto */
  transition: background-color 0.2s ease-in-out, transform 0.15s ease;

  &:hover {
    background-color: #e6c358;
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    font-size: 0.9rem; // Ligeiramente menor
    padding: 10px 18px; // Padding menor
    width: 100%; // Faz os botões ocuparem a largura total em mobile para melhor toque
    text-align: center;
  }
`;

const PlanLink = styled(Link)`
  color: #D4AF37;
  text-decoration: underline;
  display: inline-block;
  margin-top: 12px; // Mais espaço
  font-weight: 600; // Mais destaque
  font-size: 0.95rem; // Ligeiramente maior
  padding: 5px 0; // Adiciona um pouco de padding para área de toque
  &:hover {
    color: #e6c358;
  }
`;

// A lógica da função DashboardPage (useEffect, useState, etc.) permanece a mesma
const DashboardPage = () => {
  const { authState } = useAuth();
  const [bookings, setBookings] = useState({ trainings: [], appointments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookingsData = useCallback(async () => {
    if (authState.token) {
      try {
        setLoading(true);
        setError('');
        const data = await getMyBookings(authState.token);
        setBookings({
          trainings: data.trainings || [],
          appointments: data.appointments || []
        });
      } catch (err) {
        setError(err.message || 'Não foi possível carregar as suas marcações.');
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token]);

  useEffect(() => {
    fetchBookingsData();
  }, [fetchBookingsData]);

  if (loading) {
    return <PageContainer><LoadingText>A carregar o seu dashboard...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <Header>
        <Title>Meu Painel CORE</Title>
        <WelcomeMessage>Bem-vindo(a) de volta, {authState.user?.firstName || 'Utilizador'}!</WelcomeMessage>
      </Header>

      <ActionsSection> {/* Alterado para ActionsSection */}
        <StyledLinkButton to="/calendario">Ver Calendário e Marcar</StyledLinkButton>
        <StyledLinkButton to="/meus-pagamentos">Meus Pagamentos</StyledLinkButton>
        <StyledLinkButton to="/definicoes">Minhas Definições</StyledLinkButton>
      </ActionsSection>

      {error && <ErrorText>{error}</ErrorText>}

      <Section>
        <SectionTitle>Meus Treinos Inscritos</SectionTitle>
        {bookings.trainings.length > 0 ? (
          <BookingList>
            {bookings.trainings.map(training => (
              <BookingItem key={`train-${training.id}`}>
                <div> {/* Div para agrupar conteúdo principal do cartão */}
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
          <NoBookingsText>Ainda não te inscreveste em nenhum treino.</NoBookingsText>
        )}
      </Section>

      <Section>
        <SectionTitle>Minhas Consultas Agendadas</SectionTitle>
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
          <NoBookingsText>Não tens consultas agendadas.</NoBookingsText>
        )}
      </Section>
    </PageContainer>
  );
};

export default DashboardPage;