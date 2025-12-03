// src/pages/GroupTrainingCalendarPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import Calendar from 'react-calendar';
import { useAuth } from '../context/AuthContext';
import { getAllTrainings, bookTraining } from '../services/trainingService';
import { FaRegCalendarCheck, FaUsers, FaClock, FaUserTie } from 'react-icons/fa';
import BackArrow from '../components/BackArrow';
import moment from 'moment';
import 'moment/locale/pt';
import ConfirmationModal from '../components/Common/ConfirmationModal';

// --- Styled Components (adaptados da BookingCalendarPage) ---
const PageContainer = styled.div`
  max-width: 1000px; margin: 20px auto; padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
`;
const Header = styled.div`
  display: flex; align-items: center; gap: 15px; margin-bottom: 30px;
`;
const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.2rem); color: ${({ theme }) => theme.colors.textMain}; margin: 0;
`;
const BookingLayout = styled.div`
  display: grid; grid-template-columns: 1fr; gap: 40px;
  @media (min-width: 800px) { grid-template-columns: auto 1fr; }
`;
const LeftColumn = styled.div`
  display: flex; flex-direction: column; gap: 20px;
`;
const ProfessionalSelector = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px; border-radius: 12px; border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  label { display: block; margin-bottom: 10px; font-weight: 500; color: ${({ theme }) => theme.colors.primary}; display: flex; align-items: center; gap: 8px;}
  select { width: 100%; padding: 10px 14px; background-color: ${({ theme }) => theme.colors.inputBg}; border: 1px solid ${({ theme }) => theme.colors.inputBorder}; border-radius: ${({ theme }) => theme.borderRadius}; color: ${({ theme }) => theme.colors.inputText}; font-size: 0.95rem; }
`;
const CalendarContainer = styled.div`
  display: flex; justify-content: center; align-items: flex-start;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px; border-radius: 12px; border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;
const TimeSlotsContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 25px; border-radius: 12px; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; min-height: 400px;
`;
const TimeSlotsHeader = styled.h3`
  font-size: 1.2rem; font-weight: 500; color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 0; margin-bottom: 25px; text-align: center;
  span { color: ${({ theme }) => theme.colors.primary}; font-weight: 600; }
`;
const TimePeriodGroup = styled.div`
  margin-bottom: 25px;
  h4 { font-size: 0.9rem; color: ${({ theme }) => theme.colors.textMuted}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder}; }
`;
const TimeSlotsGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 15px;
`;
const TimeSlotButton = styled.button`
  background-color: ${({ theme }) => theme.colors.cardBackground}; color: ${({ theme }) => theme.colors.textMain};
  padding: 12px; border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
  &:hover:not(:disabled) { background-color: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.textDark}; border-color: ${({ theme }) => theme.colors.primary}; transform: translateY(-2px); }
`;
const LoadingText = styled.p`text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.primary};`;
const SkeletonList = styled.div`
  display: flex; flex-direction: column; gap: 12px; padding: 10px 0;
  .row { height: 52px; background: #444; border-radius: 8px; opacity: .25; animation: pulse 1.2s ease-in-out infinite; }
`;
const ErrorText = styled.p`text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.error};`;
const NoSlotsText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.textMuted}; padding: 20px 0;`;

const TrainingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const TrainingCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;

  .info {
    flex-grow: 1;
    h4 { margin: 0 0 8px 0; font-size: 1.1rem; color: ${({ theme }) => theme.colors.textMain}; }
    p { margin: 4px 0; font-size: 0.9rem; color: ${({ theme }) => theme.colors.textMuted}; display: flex; align-items: center; gap: 6px; }
  }
`;

const BookButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 10px 18px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
  &:hover:not(:disabled) { background-color: ${({ theme }) => theme.colors.primaryHover}; }
  &:disabled { background-color: ${({ theme }) => theme.colors.disabledBg}; color: ${({ theme }) => theme.colors.disabledText}; cursor: not-allowed; }
`;

const GroupTrainingCalendarPage = () => {
  const { authState } = useAuth();
  const [allTrainings, setAllTrainings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(null); // Para o ID do treino
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showBookConfirmModal, setShowBookConfirmModal] = useState(false);
  const [trainingToBook, setTrainingToBook] = useState(null);

  const fetchTrainings = useCallback(async () => {
    if (!authState.token) return;
    setLoading(true);
    try {
      const trainingsData = await getAllTrainings(authState.token);
      setAllTrainings(trainingsData || []);
    } catch (err) {
      setError("Não foi possível carregar os treinos de grupo.");
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  const handleBookTraining = (trainingId) => {
    setTrainingToBook(trainingId);
    setShowBookConfirmModal(true);
  };

  const handleBookTrainingConfirm = async () => {
    if (!trainingToBook) return;
    setBookingLoading(trainingToBook);
    setError(''); 
    setSuccessMessage('');
    setShowBookConfirmModal(false);
    try {
      const response = await bookTraining(trainingToBook, authState.token);
      setSuccessMessage(response.message || "Inscrição realizada com sucesso!");
      setTrainingToBook(null);
      // Atualizar a lista de treinos para refletir a nova vaga ocupada
      fetchTrainings(); 
    } catch (err) {
      setError(err.message || "Erro ao realizar inscrição.");
      setTrainingToBook(null);
    } finally {
      setBookingLoading(null);
    }
  };

  const trainingsForSelectedDay = allTrainings.filter(training =>
    moment(training.date).isSame(selectedDate, 'day') && new Date(training.date) >= new Date().setHours(0,0,0,0)
  );

  return (
    <PageContainer>
      <Header>
        <BackArrow to="/calendario" />
        <Title>Inscrever em Treino de Grupo</Title>
      </Header>
      
      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <p style={{color: 'green', textAlign: 'center'}}>{successMessage}</p>}

      <BookingLayout>
        <CalendarContainer>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            locale="pt-BR"
            minDate={new Date()}
            tileClassName={({ date, view }) => {
              if (view === 'month' && allTrainings.some(t => moment(t.date).isSame(date, 'day'))) {
                return 'day-with-training'; // Adiciona uma classe para estilização futura
              }
              return null;
            }}
          />
        </CalendarContainer>

        <TimeSlotsContainer>
          <TimeSlotsHeader>
            <FaRegCalendarCheck style={{marginRight: '10px'}} /> 
            <span>{moment(selectedDate).format('dddd, D [de] MMMM')}</span>
          </TimeSlotsHeader>
          {loading ? (
            <>
              <LoadingText>A carregar aulas...</LoadingText>
              <SkeletonList>
                {Array.from({length:4}).map((_,i)=>(<div className="row" key={i} />))}
              </SkeletonList>
              <style>{`@keyframes pulse { 0%{opacity:.2} 50%{opacity:.5} 100%{opacity:.2} }`}</style>
            </>
          ) : (
            trainingsForSelectedDay.length > 0 ? (
              <TrainingList>
                {trainingsForSelectedDay.map(training => {
                  const spotsAvailable = training.capacity - (training.participants?.length || 0);
                  return (
                    <TrainingCard key={training.id}>
                      <div className="info">
                        <h4>{training.name}</h4>
                        <p><FaClock /> {training.time.substring(0,5)}</p>
                        <p><FaUserTie /> {training.instructor?.firstName} {training.instructor?.lastName}</p>
                        <p><FaUsers /> {spotsAvailable} de {training.capacity} vagas</p>
                      </div>
                      <BookButton
                        onClick={() => handleBookTraining(training.id)}
                        disabled={spotsAvailable <= 0 || bookingLoading === training.id}
                      >
                        {bookingLoading === training.id ? 'A inscrever...' : (spotsAvailable > 0 ? 'Inscrever' : 'Esgotado')}
                      </BookButton>
                    </TrainingCard>
                  )
                })}
              </TrainingList>
            ) : (
              <NoSlotsText>Não há treinos de grupo agendados para este dia.</NoSlotsText>
            )
          )}
        </TimeSlotsContainer>
      </BookingLayout>

      <ConfirmationModal
        isOpen={showBookConfirmModal}
        onClose={() => {
          if (bookingLoading === null) {
            setShowBookConfirmModal(false);
            setTrainingToBook(null);
          }
        }}
        onConfirm={handleBookTrainingConfirm}
        title="Inscrever no Treino"
        message="Confirmas a tua inscrição neste treino de grupo?"
        confirmText="Confirmar"
        cancelText="Cancelar"
        danger={false}
        loading={bookingLoading !== null}
      />
    </PageContainer>
  );
};

export default GroupTrainingCalendarPage;