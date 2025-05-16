// src/pages/DashboardPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../services/userService';

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: #1A1A1A; 
  color: #E0E0E0; 
  min-height: 100vh;
  padding: 20px 40px; /* Aumentado padding lateral */
  font-family: 'Inter', sans-serif;
`;

const Header = styled.header`
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #4A4A4A;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #D4AF37; 
  margin-bottom: 0.5rem;
`;

const WelcomeMessage = styled.p`
  font-size: 1.1rem;
  color: #b0b0b0;
`;

const Section = styled.section`
  margin-bottom: 40px; /* Aumentado espaço entre secções */
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: #D4AF37; 
  margin-bottom: 20px; /* Aumentado espaço abaixo do título da secção */
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
`;

const BookingList = styled.ul`
  list-style: none;
  padding: 0;
  display: grid; /* Usar grid para melhor layout dos itens */
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Layout responsivo */
  gap: 20px; /* Espaço entre os cards */
`;

const BookingItem = styled.li`
  background-color: #252525;
  padding: 20px; /* Aumentado padding interno */
  border-radius: 10px; /* Aumentado border-radius */
  border-left: 5px solid #D4AF37; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.4); /* Sombra mais pronunciada */
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-3px); /* Efeito subtil ao pairar */
  }

  h3 {
    margin-top: 0;
    margin-bottom: 10px; /* Mais espaço */
    color: #E0E0E0;
    font-size: 1.25rem; /* Ligeiramente maior */
  }
  p {
    margin: 8px 0; /* Mais espaço vertical */
    font-size: 0.95rem;
    color: #a0a0a0;
    line-height: 1.5; /* Melhorar legibilidade */
  }
  span {
    font-weight: 600; /* Ligeiramente mais bold */
    color: #c8c8c8; /* Cor um pouco mais clara para o label */
  }
`;

const LoadingText = styled.p`
  font-size: 1.1rem;
  text-align: center;
  padding: 20px;
  color: #D4AF37;
`;

const ErrorText = styled.p`
  font-size: 1.1rem;
  text-align: center;
  padding: 20px;
  color: #FF6B6B; 
  background-color: rgba(94, 46, 46, 0.3); /* Fundo mais subtil para o erro */
  border: 1px solid #FF6B6B;
  border-radius: 8px;
`;

const StyledLinkButton = styled(Link)`
  display: inline-block;
  background-color: #D4AF37; 
  color: #1A1A1A; 
  padding: 12px 22px; /* Padding ligeiramente aumentado */
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  font-size: 0.95rem; /* Ajustado */
  margin: 10px 10px 10px 0;
  transition: background-color 0.2s ease-in-out, transform 0.15s ease;

  &:hover {
    background-color: #e6c358; 
    transform: translateY(-2px);
  }
`;

const NoBookingsText = styled.p`
  color: #888;
  text-align: center;
  font-style: italic;
  margin-top: 20px;
`;


const DashboardPage = () => {
  const { authState } = useAuth(); // Removido logout, pois está na Navbar
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
        {/* O botão de logout está na Navbar, não é necessário aqui */}
      </Header>

      <Section>
        <StyledLinkButton to="/calendario">Ver Calendário e Marcar</StyledLinkButton>
        <StyledLinkButton to="/meus-pagamentos">Meus Pagamentos</StyledLinkButton>
        <StyledLinkButton to="/definicoes">Minhas Definições</StyledLinkButton>
      </Section>

      {error && <ErrorText>{error}</ErrorText>}

      <Section>
        <SectionTitle>Meus Treinos Inscritos</SectionTitle>
        {bookings.trainings.length > 0 ? (
          <BookingList>
            {bookings.trainings.map(training => (
              <BookingItem key={`train-${training.id}`}>
                <h3>{training.name}</h3>
                <p><span>Data:</span> {new Date(training.date).toLocaleDateString('pt-PT')} às {training.time.substring(0,5)}</p>
                <p><span>Instrutor:</span> {training.instructor?.firstName} {training.instructor?.lastName}</p>
                <p><span>Descrição:</span> {training.description || 'Sem descrição.'}</p>
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
                <p><span>Data:</span> {new Date(appointment.date).toLocaleDateString('pt-PT')} às {appointment.time.substring(0,5)}</p>
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