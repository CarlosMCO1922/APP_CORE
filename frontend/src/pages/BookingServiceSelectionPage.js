import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaUserMd, FaDumbbell, FaChevronDown, FaArrowLeft } from 'react-icons/fa';

const serviceData = [
  {
    category: 'Personal Training',
    services: [
      { id: 'pt_individual_60', name: 'PT Individual 60 minutos', type: 'appointment', details: '60 min • 13,00€ - 21,25€' },
      { id: 'pt_grupo', name: 'PT Grupo', type: 'training', details: '45 min • 2,15€ - 7,50€' },
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
  max-width: 800px; margin: 20px auto; padding: 20px;
  font-family: ${({ theme }) => theme.fonts.main}; color: ${({ theme }) => theme.colors.textMain};
`;
const Header = styled.div`
  display: flex; align-items: center; gap: 15px; margin-bottom: 30px;
`;
const BackButton = styled(Link)`
  color: ${({ theme }) => theme.colors.textMuted}; font-size: 1.5rem;
  transition: color 0.2s; &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;
const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.2rem); color: ${({ theme }) => theme.colors.textMain}; margin: 0;
`;
const AccordionContainer = styled.div`
  display: flex; flex-direction: column; gap: 15px;
`;
const CategoryHeader = styled.button`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.textMain}; border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px; padding: 18px 20px; width: 100%; text-align: left;
  font-size: 1.2rem; font-weight: 600; cursor: pointer; display: flex;
  justify-content: space-between; align-items: center; transition: border-color 0.2s;
  &:hover { border-color: ${({ theme }) => theme.colors.primary}; }
  svg { transition: transform 0.3s ease; transform: ${props => (props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)')}; }
`;
const ServiceList = styled.div`
  background-color: #1c1c1c; border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-top: none; border-radius: 0 0 8px 8px; margin-top: -8px;
  overflow: hidden; max-height: ${props => (props.isOpen ? '1000px' : '0')};
  transition: all 0.4s ease-in-out; padding: ${props => (props.isOpen ? '10px' : '0 10px')};
`;
const ServiceItem = styled.div`
  padding: 15px; display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha}; cursor: pointer;
  &:last-child { border-bottom: none; }
  &:hover { background-color: ${({ theme }) => theme.colors.cardBackgroundDarker}; }
  .service-text h4 { margin: 0 0 4px 0; font-size: 1rem; }
  .service-text p { margin: 0; font-size: 0.85rem; color: ${({ theme }) => theme.colors.textMuted}; }
`;
const RadioInput = styled.input`
  accent-color: ${({ theme }) => theme.colors.primary}; width: 18px; height: 18px; cursor: pointer;
`;
const ContinueButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.textDark};
  padding: 14px 25px; border-radius: 8px; width: 100%; font-size: 1.1rem;
  font-weight: bold; border: none; cursor: pointer; margin-top: 30px;
  transition: background-color 0.2s;
  &:disabled { background-color: #555; cursor: not-allowed; color: #999; }
  &:not(:disabled):hover { background-color: #e6c358; }
`;

const BookingServiceSelectionPage = () => {
  const [openCategory, setOpenCategory] = useState(serviceData[0].category);
  const [selectedService, setSelectedService] = useState(null);
  const navigate = useNavigate();

  const handleSelectService = (service) => {
    setSelectedService(service);
  };

  const handleContinue = () => {
    if (selectedService) {
      navigate(`/agendar?serviceId=${selectedService.id}&type=${selectedService.type}`);
    }
  };

  return (
    <PageContainer>
      <Header>
        <BackButton to="/dashboard"><FaArrowLeft /></BackButton>
        <Title>Escolher serviço</Title>
      </Header>
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
                    type="radio"
                    name="serviceSelection"
                    value={service.id}
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
    </PageContainer>
  );
};

export default BookingServiceSelectionPage;