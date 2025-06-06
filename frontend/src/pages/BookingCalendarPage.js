// src/pages/BookingCalendarPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import Calendar from 'react-calendar';
import { useAuth } from '../context/AuthContext';
import { getAllAppointments, bookAppointment as bookAppointmentService, clientRequestNewAppointment } from '../services/appointmentService';
import { getAllTrainings, bookTraining as bookTrainingService } from '../services/trainingService';
import { getAllStaffForSelection } from '../services/staffService';
import { FaArrowLeft, FaRegCalendarCheck, FaClock, FaCheckCircle, FaTimes } from 'react-icons/fa';
import moment from 'moment';

// --- Styled Components ---
const PageContainer = styled.div`
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
`;

const BackButton = styled(Link)`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.2rem);
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0;
`;

const BookingLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
  @media (min-width: 800px) {
    grid-template-columns: auto 1fr;
  }
`;

const CalendarContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const TimeSlotsContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 25px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const TimeSlotsHeader = styled.h3`
  font-size: 1.2rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 0;
  margin-bottom: 25px;
  text-align: center;
  span {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }
`;

const TimePeriodGroup = styled.div`
  margin-bottom: 25px;
  h4 {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  }
`;

const TimeSlotsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 15px;
`;

const TimeSlotButton = styled.button`
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker || '#1F1F1F'};
  color: ${({ theme }) => theme.colors.textMain};
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textDark};
    border-color: ${({ theme }) => theme.colors.primary};
  }
  &:disabled {
    background-color: #2a2a2a;
    color: #555;
    cursor: not-allowed;
    border-color: #333;
  }
`;

const LoadingText = styled.p`text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.primary};`;
const ErrorText = styled.p`text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.error};`;
const NoSlotsText = styled.p`text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.textMuted}; padding: 20px 0;`;

const BookingCalendarPage = () => {
  const { authState } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [serviceId, setServiceId] = useState('');
  const [serviceType, setServiceType] = useState(''); // 'training' ou 'appointment'

  const [allEvents, setAllEvents] = useState([]);
  const [availableDays, setAvailableDays] = useState(new Set());
  const [timeSlotsForDay, setTimeSlotsForDay] = useState([]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lógica para determinar o tipo de serviço a partir do ID
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('service');
    setServiceId(id);
    if (id === 'pt_grupo') {
      setServiceType('training');
    } else {
      setServiceType('appointment');
    }
  }, [location.search]);

  // Lógica para buscar todos os eventos (treinos e consultas)
  useEffect(() => {
    if (authState.token) {
      setLoading(true);
      setError('');
      Promise.all([
        getAllTrainings(authState.token),
        getAllAppointments(authState.token, { status: 'disponível' })
      ]).then(([trainings, appointments]) => {
        const combinedEvents = [
          ...trainings.map(t => ({...t, type: 'training'})),
          ...appointments.map(a => ({...a, type: 'appointment'}))
        ];
        setAllEvents(combinedEvents);
      }).catch(err => {
        setError('Erro ao carregar horários disponíveis.');
        console.error(err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [authState.token]);
  
  // Lógica para filtrar e encontrar dias disponíveis e slots para o dia selecionado
  useEffect(() => {
    if (allEvents.length > 0 && serviceType) {
      const filteredForService = allEvents.filter(event => event.type === serviceType);
      
      const daysWithSlots = new Set(
        filteredForService.map(event => moment(event.date).format('YYYY-MM-DD'))
      );
      setAvailableDays(daysWithSlots);

      const slots = filteredForService
        .filter(event => moment(event.date).isSame(selectedDate, 'day'))
        .sort((a, b) => a.time.localeCompare(b.time));
        
      setTimeSlotsForDay(slots);
    }
  }, [allEvents, serviceType, selectedDate]);


  const handleDateChange = (date) => {
    setSelectedDate(date);
  };
  
  const handleBookSlot = async (event) => {
    if (!window.confirm(`Tem a certeza que quer marcar para as ${event.time.substring(0, 5)}?`)) return;

    try {
      if (event.type === 'training') {
        await bookTrainingService(event.id, authState.token);
      } else {
        await bookAppointmentService(event.id, authState.token);
      }
      alert('Marcação realizada com sucesso!');
      navigate('/dashboard'); // Ou para uma página de confirmação
    } catch (err) {
      alert(`Erro na marcação: ${err.message}`);
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      if (availableDays.has(moment(date).format('YYYY-MM-DD'))) {
        return 'has-slots'; // Classe para estilização customizada se necessário
      }
    }
    return null;
  };

  const morningSlots = timeSlotsForDay.filter(slot => parseInt(slot.time.split(':')[0]) < 12);
  const afternoonSlots = timeSlotsForDay.filter(slot => parseInt(slot.time.split(':')[0]) >= 12);

  return (
    <PageContainer>
      <Header>
        <BackButton to="/calendario"><FaArrowLeft /></BackButton>
        <Title>Escolha uma hora</Title>
      </Header>
      
      {loading && <LoadingText>A carregar...</LoadingText>}
      {error && <ErrorText>{error}</ErrorText>}

      {!loading && !error && (
        <BookingLayout>
          <CalendarContainer>
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              locale="pt-BR"
              tileClassName={tileClassName}
              minDate={new Date()}
            />
          </CalendarContainer>

          <TimeSlotsContainer>
            <TimeSlotsHeader>
              <FaRegCalendarCheck /> <span>{moment(selectedDate).format('dddd, DD [de] MMMM')}</span>
            </TimeSlotsHeader>
            {timeSlotsForDay.length > 0 ? (
              <>
                {morningSlots.length > 0 && (
                  <TimePeriodGroup>
                    <h4>Antes do meio-dia</h4>
                    <TimeSlotsGrid>
                      {morningSlots.map(slot => (
                        <TimeSlotButton key={slot.id} onClick={() => handleBookSlot(slot)}>
                          {slot.time.substring(0, 5)}
                        </TimeSlotButton>
                      ))}
                    </TimeSlotsGrid>
                  </TimePeriodGroup>
                )}
                {afternoonSlots.length > 0 && (
                  <TimePeriodGroup>
                    <h4>Depois do meio-dia</h4>
                    <TimeSlotsGrid>
                      {afternoonSlots.map(slot => (
                        <TimeSlotButton key={slot.id} onClick={() => handleBookSlot(slot)}>
                          {slot.time.substring(0, 5)}
                        </TimeSlotButton>
                      ))}
                    </TimeSlotsGrid>
                  </TimePeriodGroup>
                )}
              </>
            ) : (
              <NoSlotsText>Não há horários disponíveis para este dia.</NoSlotsText>
            )}
          </TimeSlotsContainer>
        </BookingLayout>
      )}
    </PageContainer>
  );
};

export default BookingCalendarPage;