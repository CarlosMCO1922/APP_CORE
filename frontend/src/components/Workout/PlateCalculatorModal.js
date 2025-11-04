import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: ${({ theme }) => theme.colors.overlayBg}; display: flex;
  justify-content: center; align-items: center; z-index: 2050; padding: 20px;
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker}; padding: 25px 35px; border-radius: 10px; width: 100%;
  max-width: 400px; box-shadow: 0 8px 25px rgba(0,0,0,0.5); position: relative;
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
`;

const ModalTitle = styled.h3`
  color: ${({ theme }) => theme.colors.primary}; margin-top: 0; margin-bottom: 20px;
  font-size: 1.5rem; text-align: center;
`;

const CloseButton = styled.button`
  position: absolute; top: 15px; right: 15px; background: transparent; border: none;
  color: ${({ theme }) => theme.colors.textMuted}; font-size: 1.8rem; cursor: pointer; &:hover { color: ${({ theme }) => theme.colors.textMain}; }
`;

const InputGroup = styled.div`
  display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;
  label { font-size: 0.9rem; color: ${({ theme }) => theme.colors.textMuted}; }
  input {
    padding: 10px 14px; background-color: ${({ theme }) => theme.colors.inputBg}; border: 1px solid ${({ theme }) => theme.colors.inputBorder};
    border-radius: 6px; color: ${({ theme }) => theme.colors.inputText}; font-size: 1rem; width: 100%;
    &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
  }
`;

const ResultContainer = styled.div`
  margin-top: 20px; text-align: center;
  h4 { color: ${({ theme }) => theme.colors.textMuted}; font-weight: 500; }
  p { color: white; font-size: 1.2rem; font-weight: 600; margin: 5px 0 0 0; }
  span { font-size: 0.8rem; color: ${({ theme }) => theme.colors.textMuted};}
`;

const PlateList = styled.div`
  display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 10px;
`;

const PlateChip = styled.span`
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg}; color: ${({ theme }) => theme.colors.textMain}; padding: 5px 12px;
  border-radius: 15px; font-size: 0.9rem; font-weight: 500;
`;

const PlateCalculatorModal = ({ onSelectWeight, onClose }) => {
  const [targetWeight, setTargetWeight] = useState('');
  const [barWeight, setBarWeight] = useState('20');

  const availablePlates = useMemo(() => [25, 20, 15, 10, 5, 2.5, 1.25, 0.5], []);

  const calculatedPlates = useMemo(() => {
    const target = parseFloat(targetWeight);
    const bar = parseFloat(barWeight);
    if (isNaN(target) || isNaN(bar) || target <= bar) return null;

    let weightPerSide = (target - bar) / 2;
    const platesOnSide = [];
    
    for (const plate of availablePlates) {
      while (weightPerSide >= plate) {
        platesOnSide.push(plate);
        weightPerSide -= plate;
      }
    }
    
    const totalPlatesWeight = platesOnSide.reduce((sum, p) => sum + p, 0) * 2;
    const achievableWeight = bar + totalPlatesWeight;

    return { plates: platesOnSide, achievableWeight };
  }, [targetWeight, barWeight, availablePlates]);

  const handleSelect = () => {
    if (calculatedPlates) {
      onSelectWeight(calculatedPlates.achievableWeight);
      onClose();
    } else if (!isNaN(parseFloat(targetWeight))) {
        onSelectWeight(parseFloat(targetWeight));
        onClose();
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}><FaTimes /></CloseButton>
        <ModalTitle>Calculadora de Discos</ModalTitle>
        <InputGroup>
          <div>
            <label htmlFor="targetWeight">Peso Total Desejado (kg)</label>
            <input type="number" id="targetWeight" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} placeholder="Ex: 100" />
          </div>
          <div>
            <label htmlFor="barWeight">Peso da Barra (kg)</label>
            <input type="number" id="barWeight" value={barWeight} onChange={e => setBarWeight(e.target.value)} />
          </div>
        </InputGroup>

        {calculatedPlates && (
          <ResultContainer>
            <h4>Discos por lado:</h4>
            <PlateList>
              {calculatedPlates.plates.map((plate, index) => <PlateChip key={index}>{plate}kg</PlateChip>)}
            </PlateList>
            <p>{calculatedPlates.achievableWeight} kg</p>
            <span>Peso total alcançável</span>
          </ResultContainer>
        )}
        
        <PrimaryButton onClick={handleSelect}>
          Usar este Peso
        </PrimaryButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PlateCalculatorModal;