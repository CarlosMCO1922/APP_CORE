import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getAllTrainings, bookTraining } from '../services/trainingService';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import moment from 'moment';
import 'moment/locale/pt';
import { 
    FaUserMd, 
    FaDumbbell, 
    FaChevronDown, 
    FaRegCalendarCheck, 
    FaUsers, 
    FaClock, 
    FaUserTie 
} from 'react-icons/fa';
import BackArrow from '../components/BackArrow';
import ConfirmationModal from '../components/Common/ConfirmationModal';

const serviceData = [
  {
    category: 'Personal Training',
    services: [
      { id: 'pt_individual_60', name: 'Pedir Sessão de PT Individual', type: 'training_request', details: '60 min • A combinar' },
      { id: 'pt_grupo', name: 'Inscrever em Treino de Grupo', type: 'training_group', details: 'Aulas pré-agendadas' },
    ]
  },
  {
    category: 'Fisioterapia Avançada',
    services: [
      { id: 'fisio_avaliacao', name: 'Avaliação + Consulta (1ª)', type: 'appointment', details: '60 min • 30,00€' },
      { id: 'fisio_consulta', name: 'Consulta', type: 'appointment', details: '60 min • 25,00€' },
    ]
  }
];

const PageContainer = styled.div`
  max-width: 800px;
  margin: 20px auto;
  padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
`;


const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.2rem);
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0;
`;

const ViewContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: 500px; // Altura mínima para evitar saltos de layout
  overflow: hidden; // Esconde as vistas que deslizam para fora
`;

const AnimatedView = styled.div`
  width: 100%;
  top: 0;
  left: 0;
  transition: transform 0.5s ease-in-out, opacity 0.5s ease-in-out;
  opacity: ${props => (props.active ? 1 : 0)};
  display: ${props => (props.active ? "block" : "none")};
  transform: translateX(${props => (props.active ? '0%' : (props.direction === 'right' ? '100%' : '-100%'))});
  pointer-events: ${props => (props.active ? 'auto' : 'none')}; // Permite clicar apenas na vista ativa
`;

const AccordionContainer = styled.div`
  display: flex; flex-direction: column; gap: 15px;
`;

const CategoryHeader = styled.button`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.primary}; 
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px; 
  padding: 18px 20px; 
  width: 100%; 
  text-align: left;
  font-size: 1.2rem; 
  font-weight: 600; 
  cursor: pointer; 
  display: flex;
  justify-content: space-between; 
  align-items: center; 
  transition: border-color 0.2s;

  &:hover { 
    border-color: ${({ theme }) => theme.colors.primary}; 
  }

  svg { 
    transition: transform 0.3s ease; 
    transform: ${props => (props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)')}; 
  }
`;

const ServiceList = styled.div`
  background-color: ${({ theme }) => theme.colors.background}; 
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-top: none; 
  border-radius: 0 0 8px 8px; 
  margin-top: -8px;
  overflow: hidden; 
  max-height: ${props => (props.isOpen ? '1000px' : '0')};
  transition: all 0.4s ease-in-out; 
  padding: ${props => (props.isOpen ? '10px' : '0 10px')};
`;

const ServiceItem = styled.div`
  padding: 15px; 
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha}; 
  cursor: pointer;
  &:last-child { 
    border-bottom: none; 
  }
  &:hover { 
    background-color: ${({ theme }) => theme.colors.cardBackground}; 
  }
  .service-text h4 { 
    margin: 0 0 4px 0; 
    font-size: 1rem; 
  }

  .service-text p { 
    margin: 0; 
    font-size: 0.85rem; 
    color: ${({ theme }) => theme.colors.textMuted}; }
`;

const RadioInput = styled.input`
  accent-color: ${({ theme }) => theme.colors.primary}; width: 18px; height: 18px; cursor: pointer;
`;

const ContinueButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.textDark};
  padding: 14px 25px; border-radius: 8px; width: 100%; font-size: 1.1rem;
  font-weight: bold; border: none; cursor: pointer; margin-top: 30px;
  transition: background-color 0.2s;
  &:disabled { background-color: ${({ theme }) => theme.colors.disabledBg}; cursor: not-allowed; color: ${({ theme }) => theme.colors.disabledText}; }
  &:not(:disabled):hover { background-color: ${({ theme }) => theme.colors.primaryHover}; }
`;

const CalendarWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  
  .react-calendar { /* Estilos para o calendário */
    width: 100% !important;
    max-width: 400px;
    min-width: 280px; /* Largura mínima para garantir que não quebra */
    background: ${({ theme }) => theme.colors.cardBackground};
    border: 1px solid ${({ theme }) => theme.colors.background};
    border-radius: 8px;
    padding: 10px;
    font-family: ${({ theme }) => theme.fonts.main};
    
    /* Forçar estrutura do grid - CRÍTICO para alinhamento */
    * {
      box-sizing: border-box;
    }
    
    /* Garantir que o month-view ocupa toda a largura */
    .react-calendar__month-view {
      width: 100% !important;
      overflow: hidden;
    }
    
    /* Cabeçalho dos dias da semana - SEMPRE 7 colunas fixas */
    .react-calendar__month-view__weekdays {
      display: grid !important;
      grid-template-columns: repeat(7, 1fr) !important;
      width: 100% !important;
      margin-bottom: 8px;
      gap: 0;
      
      .react-calendar__month-view__weekdays__weekday {
        text-align: center !important;
        padding: 8px 2px !important;
        font-weight: 600;
        font-size: 0.75rem;
        color: ${({ theme }) => theme.colors.primary};
        flex: 0 0 auto !important;
        width: auto !important;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        
        abbr {
          text-decoration: none;
          cursor: default;
        }
      }
    }
    
    /* Grid dos dias - SEMPRE 7 colunas fixas - CRÍTICO */
    .react-calendar__month-view__days {
      display: grid !important;
      grid-template-columns: repeat(7, 1fr) !important;
      width: 100% !important;
      gap: 2px;
      margin: 0 !important;
      padding: 0 !important;
      
      .react-calendar__tile {
        aspect-ratio: 1; /* Mantém células quadradas */
        min-height: 36px;
        max-width: none !important;
        width: 100% !important;
        flex: 0 0 auto !important;
        display: flex !important;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        padding: 0 !important;
        margin: 0 !important;
        border-radius: 4px;
        transition: background-color 0.2s;
        position: relative;
        
        &:hover {
          background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
        }
        
        &--active {
          background-color: ${({ theme }) => theme.colors.primary} !important;
          color: ${({ theme }) => theme.colors.textDark} !important;
          font-weight: 700;
        }
        
        &--now {
          background-color: ${({ theme }) => theme.colors.primary}30;
        }
        
        &--neighboringMonth {
          opacity: 0.4;
        }
      }
    }
    
    /* Navegação */
    .react-calendar__navigation {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      
      button {
        background-color: transparent;
        border: none;
        color: ${({ theme }) => theme.colors.primary};
        font-size: 1rem;
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.2s;
        
        &:hover {
          background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
        }
        
        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
      }
      
      .react-calendar__navigation__label {
        font-weight: 700;
        font-size: 1.1rem;
        pointer-events: none;
      }
    }
    
    /* Garantir que não há quebras de linha */
    @media (max-width: 320px) {
      min-width: 260px;
      padding: 8px;
      
      .react-calendar__month-view__weekdays__weekday {
        font-size: 0.65rem;
        padding: 6px 1px !important;
      }
      
      .react-calendar__month-view__days .react-calendar__tile {
        min-height: 32px;
        font-size: 0.75rem;
      }
    }
  }
`;

const DetailsHeader = styled.h3`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;
  margin-bottom: 20px;
`;

const TrainingAccordion = styled.div`
  display: flex;          
  flex-direction: column; 
  gap: 10px;
  max-width: 450px;       
  margin: 0 auto;
  max-height: 70vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 5px;
  
  /* Estilização da scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background};
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 3px;
    &:hover {
      background: ${({ theme }) => theme.colors.primaryHover};
    }
  }
`;

const TrainingHeader = styled.button`
  background-color: ${({ theme, isOpen }) => (isOpen ? theme.colors.primary : theme.colors.cardBackground)};
  color: ${({ theme, isOpen }) => (isOpen ? theme.colors.textDark : theme.colors.textMain)};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${props => (props.isOpen ? '8px 8px 0 0' : '8px')};
  padding: 12px;
  width: 100%;
  font-size: 1.2rem; 
  font-weight: 700;
  cursor: pointer;
  display: flex;
  justify-content: space-between; 
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  svg {
    font-size: 0.9em; /* Torna a seta mais pequena em relação ao texto */
    transition: transform 0.3s ease;
    transform: ${props => (props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
  }
`;

const TrainingDetails = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundSelect};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-top: none;
  border-radius: 0 0 8px 8px;
  margin-top: -1px;
  overflow: hidden;
  max-height: ${props => (props.isOpen ? '300px' : '0')};
  transition: max-height 0.4s ease-in-out, padding 0.4s ease-in-out;
  padding: ${props => (props.isOpen ? '15px' : '0 15px')};
  display: flex;
  justify-content: space-between;
  align-items: center;

  .info p {
    margin: 4px 0;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};
    display: flex;
    align-items: center;
    gap: 6px;
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
  &:hover:not(:disabled) { background-color: #e6c358ff; }
  &:disabled { background-color: #e6c358b9; color: #999; cursor: not-allowed; }
`;

const LoadingText = styled.p`text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.primary};`;

const NoSlotsText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.textMuted}; padding: 20px 0;`;

const BookingServiceSelectionPage = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  
  // --- ESTADO PRINCIPAL ---
  const [currentView, setCurrentView] = useState('selection'); // 'selection', 'calendar', 'details'
  const [viewDirection, setViewDirection] = useState('right');

  // Estado da vista 'selection'
  const [openCategory, setOpenCategory] = useState(serviceData[0].category);
  const [selectedService, setSelectedService] = useState(null);
  
  // Estado das vistas 'calendar' e 'details'
  const [allTrainings, setAllTrainings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedTrainingId, setExpandedTrainingId] = useState(null);
  const [showBookConfirmModal, setShowBookConfirmModal] = useState(false);
  const [trainingToBook, setTrainingToBook] = useState(null);


  // --- FUNÇÕES ---

  // Função para buscar os treinos (copiada e adaptada)
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

  // Função para tratar da seleção de serviço
  const handleSelectService = (service) => {
    setSelectedService(service);
  };
  
  // Função do botão "Continuar" - AGORA MUDA A VISTA
  const handleContinue = () => {
    if (!selectedService) return;

    switch (selectedService.type) {
      case 'training_group':
        fetchTrainings(); // Busca os treinos
        setViewDirection('right');
        setCurrentView('calendar'); // Muda para a vista do calendário
        break;
      // ... (outros cases permanecem iguais)
      case 'appointment': navigate(`/agendar?serviceId=${selectedService.id}&type=appointment`); break;
      case 'training_request': navigate('/pedir-pt-individual'); break;
      default: console.error("Tipo de serviço desconhecido:", selectedService.type);
    }
  };

  // Função para quando se clica num dia do calendário
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setViewDirection('right');
    setCurrentView('details'); // Muda para a vista de detalhes do dia
  };
  
  // Função para voltar para trás
  const handleBack = () => {
    setViewDirection('left');
    if (currentView === 'details') {
      setCurrentView('calendar');
    } else if (currentView === 'calendar') {
      setCurrentView('selection');
    } else {
      navigate(-1); // Usar navigate(-1) em vez de ir para dashboard
    }
  };

  // Função para expandir/recolher os detalhes de um treino
  const handleToggleExpand = (trainingId) => {
    setExpandedTrainingId(prevId => (prevId === trainingId ? null : trainingId));
  };
  
  // Função para inscrever no treino (copiada e adaptada)
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
      fetchTrainings();
    } catch (err) {
      setError(err.message || "Erro ao realizar inscrição.");
      setTrainingToBook(null);
    } finally {
      setBookingLoading(null);
    }
  };

  // Lógica para filtrar treinos e remover duplicados
  const trainingsForSelectedDay = allTrainings
    .filter(training =>
      moment(training.date).isSame(selectedDate, 'day') && new Date(training.date) >= new Date().setHours(0,0,0,0)
    )
    .reduce((acc, training) => {
      // Verificar se já existe um treino com o mesmo horário
      const existing = acc.find(t => t.time === training.time);
      if (!existing) {
        acc.push(training);
      }
      return acc;
    }, [])
    .sort((a, b) => {
      // Ordenar por horário
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });

  // Lógica para o título dinâmico
  const getTitle = () => {
    switch(currentView) {
      case 'calendar': return 'Escolha o dia';
      case 'details': return 'Escolha o horário';
      default: return 'Escolher serviço';
    }
  };

  return (
    <PageContainer>
      <Header>
        <BackArrow onClick={handleBack} />
        <Title>{getTitle()}</Title>
      </Header> 
      
      {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
      {successMessage && <p style={{color: 'green', textAlign: 'center'}}>{successMessage}</p>}

      <ViewContainer>
        {/* VISTA 1: SELEÇÃO DE SERVIÇO */}
        <AnimatedView active={currentView === 'selection'} direction={viewDirection}>
          <AccordionContainer>
            {serviceData.filter(cat => cat.services.length > 0).map(category => (
              <div key={category.category}>
                <CategoryHeader
                  isOpen={openCategory === category.category}
                  onClick={() => setOpenCategory(openCategory === category.category ? null : category.category)}
                >
                  {category.category} <FaChevronDown />
                </CategoryHeader>
                <ServiceList isOpen={openCategory === category.category}>
                  {category.services.map(service => (
                    <ServiceItem key={service.id} onClick={() => handleSelectService(service)}>
                      <div className='service-text'>
                        <h4>{service.name}</h4>
                        <p>{service.details}</p>
                      </div>
                      <RadioInput
                        type="radio" name="serviceSelection" value={service.id}
                        checked={selectedService?.id === service.id}
                        onChange={() => handleSelectService(service)}
                      />
                    </ServiceItem>
                  ))}
                </ServiceList>
              </div>
            ))}
          </AccordionContainer>
          <ContinueButton onClick={handleContinue} disabled={!selectedService}>
            Continuar
          </ContinueButton>
        </AnimatedView>

        {/* VISTA 2: CALENDÁRIO */}
        <AnimatedView active={currentView === 'calendar'} direction={viewDirection}>
          {loading ? <LoadingText>A carregar calendário...</LoadingText> : (
            <CalendarWrapper>
              <Calendar
                onChange={handleDateSelect}
                value={selectedDate}
                locale="pt-BR"
                minDate={new Date()}
                calendarType="ISO 8601"
                tileClassName={({ date, view }) => {
                  if (view === 'month' && allTrainings.some(t => moment(t.date).isSame(date, 'day'))) {
                    return 'day-with-training';
                  }
                  return null;
                }}
              />
            </CalendarWrapper>
          )}
        </AnimatedView>

        {/* VISTA 3: DETALHES DO DIA */}
        <AnimatedView active={currentView === 'details'} direction={viewDirection}>
          <DetailsHeader>{moment(selectedDate).format('dddd, D [de] MMMM')}</DetailsHeader>
          {loading ? <LoadingText>A carregar aulas...</LoadingText> : (
            trainingsForSelectedDay.length > 0 ? (
              <TrainingAccordion>
                {trainingsForSelectedDay.map(training => {
                  const spotsAvailable = training.capacity - (training.participants?.length || 0);
                  const isExpanded = expandedTrainingId === training.id;
                  return (
                    <div key={training.id}>
                      <TrainingHeader isOpen={isExpanded} onClick={() => handleToggleExpand(training.id)}>
                        <span>{training.time.substring(0,5)}</span>
                        <FaChevronDown />
                      </TrainingHeader>
                      <TrainingDetails isOpen={isExpanded}>
                        <div className="info">
                          <p><FaUserTie /> {training.instructor?.firstName} {training.instructor?.lastName}</p>
                          <p><FaUsers /> {spotsAvailable} de {training.capacity} vagas</p>
                        </div>
                        <BookButton
                          onClick={() => handleBookTraining(training.id)}
                          disabled={spotsAvailable <= 0 || bookingLoading === training.id}
                        >
                          {bookingLoading === training.id ? 'A inscrever...' : (spotsAvailable > 0 ? 'Inscrever' : 'Esgotado')}
                        </BookButton>
                      </TrainingDetails>
                    </div>
                  )
                })}
              </TrainingAccordion>
            ) : <NoSlotsText>Não há treinos de grupo agendados para este dia.</NoSlotsText>
          )}
        </AnimatedView>
      </ViewContainer>

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

export default BookingServiceSelectionPage;