// src/pages/BookingCalendarPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import Calendar from 'react-calendar';
import { useAuth } from '../context/AuthContext';
import { getAvailableSlotsForProfessional, clientRequestNewAppointment } from '../services/appointmentService';
import { getAllStaffForSelection } from '../services/staffService';
import { FaRegCalendarCheck, FaClock, FaUserMd } from 'react-icons/fa';
import BackArrow from '../components/BackArrow';
import moment from 'moment';
import 'moment/locale/pt';
import { useToast } from '../components/Toast/ToastProvider';
import ConfirmationModal from '../components/Common/ConfirmationModal';

// --- Styled Components ---
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
  select { width: 100%; padding: 10px 14px; background-color: ${({ theme }) => theme.colors.background}; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: ${({ theme }) => theme.borderRadius}; color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; }
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
  background-color: ${({ theme }) => theme.colors.background}; color: ${({ theme }) => theme.colors.textMain};
  padding: 12px; border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
  &:hover:not(:disabled) { background-color: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.textDark}; border-color: ${({ theme }) => theme.colors.primary}; transform: translateY(-2px); }
`;
const LoadingText = styled.p`text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.primary};`;
const ErrorText = styled.p`text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.error};`;
const NoSlotsText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.textMuted}; padding: 20px 0;`;

const BookingCalendarPage = () => {
  const { authState } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [serviceType, setServiceType] = useState('');
  const [professionals, setProfessionals] = useState([]);
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [appointmentToRequest, setAppointmentToRequest] = useState(null);
  const [showRequestConfirmModal, setShowRequestConfirmModal] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    setServiceType(type);

    if (authState.token && type === 'appointment') {
      setLoading(true);
      getAllStaffForSelection(authState.token)
        .then(data => {
          const physios = data.filter(p => p.role === 'physiotherapist' || p.role === 'admin' || p.role === 'trainer');
          setProfessionals(physios);
        })
        .catch(err => setError("Erro ao carregar lista de profissionais."))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [location.search, authState.token]);

  useEffect(() => {
    if (serviceType === 'appointment' && selectedProfessional && selectedDate) {
      setSlotsLoading(true);
      setAvailableSlots([]);
      const params = {
        staffId: selectedProfessional,
        date: moment(selectedDate).format('YYYY-MM-DD'),
        durationMinutes: 60,
      };
      const t = setTimeout(() => {
        getAvailableSlotsForProfessional(params, authState.token)
          .then(slots => setAvailableSlots(slots))
          .catch(err => {
            console.error(err);
            setError("Não foi possível carregar os horários para este dia.");
addToast('Falha ao carregar horários.', { type: 'error', category: 'calendar' });
        })
        .finally(() => setSlotsLoading(false));
      }, 300);
      return () => clearTimeout(t);
    }
  }, [serviceType, selectedProfessional, selectedDate, authState.token]);

  const handleRequestAppointment = (time) => {
    setAppointmentToRequest({ time, date: moment(selectedDate).format('DD/MM/YYYY') });
    setShowRequestConfirmModal(true);
  };

  const handleRequestAppointmentConfirm = async () => {
    if (!appointmentToRequest || !selectedProfessional || isRequesting) return;
    setIsRequesting(true);
    setShowRequestConfirmModal(false);
    const requestData = {
      staffId: selectedProfessional,
      date: moment(selectedDate).format('YYYY-MM-DD'),
      time: appointmentToRequest.time,
      durationMinutes: 60
    };

    try {
      await clientRequestNewAppointment(requestData, authState.token);
      addToast('Pedido de consulta enviado com sucesso!', { type: 'success', category: 'calendar' });
      setAppointmentToRequest(null);
      navigate('/dashboard');
    } catch (err) {
      addToast('Erro ao enviar pedido de consulta.', { type: 'error', category: 'calendar' });
      setAppointmentToRequest(null);
    } finally {
      setIsRequesting(false);
    }
  };

  const morningSlots = availableSlots.filter(slot => parseInt(slot.split(':')[0]) < 12);
  const afternoonSlots = availableSlots.filter(slot => parseInt(slot.split(':')[0]) >= 12);
  const pageTitle = serviceType === 'appointment' ? 'Agendar Consulta' : 'Agendar Treino';

  return (
    <PageContainer>
      <Header>
        <BackArrow to="/calendario" />
        <Title>{pageTitle}</Title>
      </Header>
      
      {error && <ErrorText>{error}</ErrorText>}

      {serviceType === 'appointment' ? (
        <BookingLayout>
          <LeftColumn>
            <ProfessionalSelector>
              <label htmlFor="professional-select"><FaUserMd /> Selecione o Profissional</label>
              <select id="professional-select" value={selectedProfessional} onChange={e => setSelectedProfessional(e.target.value)}>
                <option value="">{loading ? 'A carregar...' : 'Escolha...'}</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </ProfessionalSelector>
            {selectedProfessional && (
              <CalendarContainer>
                <Calendar onChange={setSelectedDate} value={selectedDate} locale="pt-BR" minDate={new Date()} />
              </CalendarContainer>
            )}
          </LeftColumn>
          <TimeSlotsContainer>
            <TimeSlotsHeader>
              <FaRegCalendarCheck style={{marginRight: '10px'}} /> 
              <span>{moment(selectedDate).format('dddd, D [de] MMMM')}</span>
            </TimeSlotsHeader>
            {!selectedProfessional ? <NoSlotsText>Por favor, selecione um profissional para ver os horários.</NoSlotsText>
            : slotsLoading ? <LoadingText>A procurar vagas...</LoadingText>
            : availableSlots.length > 0 ? (
              <>
                {morningSlots.length > 0 && (
                  <TimePeriodGroup><h4>Antes do meio-dia</h4><TimeSlotsGrid>
                    {morningSlots.map(slot => <TimeSlotButton key={slot} onClick={() => handleRequestAppointment(slot)}>{slot}</TimeSlotButton>)}
                  </TimeSlotsGrid></TimePeriodGroup>
                )}
                {afternoonSlots.length > 0 && (
                  <TimePeriodGroup><h4>Depois do meio-dia</h4><TimeSlotsGrid>
                    {afternoonSlots.map(slot => <TimeSlotButton key={slot} onClick={() => handleRequestAppointment(slot)}>{slot}</TimeSlotButton>)}
                  </TimeSlotsGrid></TimePeriodGroup>
                )}
              </>
            ) : (
              <NoSlotsText>Não há horários disponíveis para este dia.</NoSlotsText>
            )}
          </TimeSlotsContainer>
        </BookingLayout>
      ) : (
        <p>Funcionalidade para agendar treinos em desenvolvimento.</p>
      )}

      <ConfirmationModal
        isOpen={showRequestConfirmModal}
        onClose={() => {
          setShowRequestConfirmModal(false);
          setAppointmentToRequest(null);
        }}
        onConfirm={handleRequestAppointmentConfirm}
        title="Pedir Consulta"
        message={appointmentToRequest ? `Confirmas o pedido de consulta para ${appointmentToRequest.date} às ${appointmentToRequest.time}?` : ''}
        confirmText="Confirmar"
        cancelText="Cancelar"
        loading={isRequesting}
        danger={false}
        loading={false}
      />
    </PageContainer>
  );
};

export default BookingCalendarPage;