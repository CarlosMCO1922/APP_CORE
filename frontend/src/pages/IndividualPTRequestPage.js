// src/pages/IndividualPTRequestPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { clientRequestNewAppointment } from '../services/appointmentService';
import { getAllStaffForSelection } from '../services/staffService';
import { FaArrowLeft, FaUserTie, FaCalendarAlt, FaClock, FaStickyNote, FaPaperPlane } from 'react-icons/fa';

// --- Styled Components ---

const PageContainer = styled.div`
  max-width: 700px;
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

const BackButton = styled(Link)`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  transition: color 0.2s;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.2rem);
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0;
`;

const FormContainer = styled.form`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: clamp(20px, 4vw, 30px);
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const inputStyles = `
  padding: 12px 15px;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  background-color: #333;
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2);
  }
`;

const Input = styled.input`
  ${inputStyles}
`;

const Select = styled.select`
  ${inputStyles}
`;

const Textarea = styled.textarea`
  ${inputStyles}
  min-height: 100px;
  resize: vertical;
`;

const SubmitButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 12px 25px;
  border-radius: ${({ theme }) => theme.borderRadius};
  font-size: 1rem;
  font-weight: bold;
  border: none;
  cursor: pointer;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background-color 0.2s, transform 0.15s ease;

  &:disabled {
    background-color: #555;
    cursor: not-allowed;
    color: #999;
  }
  &:not(:disabled):hover {
    background-color: #e6c358;
    transform: translateY(-2px);
  }
`;

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid ${({ theme }) => theme.colors.error};
  padding: 10px 15px;
  border-radius: ${({ theme }) => theme.borderRadius};
  text-align: center;
  font-size: 0.9rem;
  margin: 0;
`;

// --- Componente Principal ---

const IndividualPTRequestPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  
  const [trainers, setTrainers] = useState([]);
  const [formData, setFormData] = useState({
    staffId: '',
    date: '',
    time: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authState.token) {
      getAllStaffForSelection(authState.token)
        .then(data => {
          // Filtrar para incluir apenas 'trainer' e 'admin'
          const validTrainers = data.filter(p => p.role === 'trainer' || p.role === 'admin');
          setTrainers(validTrainers);
        })
        .catch(() => setError("Erro ao carregar lista de treinadores."));
    }
  }, [authState.token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.staffId || !formData.date || !formData.time) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      const requestData = {
        ...formData,
        category: 'PT_INDIVIDUAL', // Enviamos a nova categoria para o backend
        durationMinutes: 60, // Duração padrão, pode ser ajustada se necessário
      };
      await clientRequestNewAppointment(requestData, authState.token);
      alert('Pedido de treino individual enviado com sucesso! Serás notificado quando for aceite.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || "Ocorreu um erro ao enviar o seu pedido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <Header>
        <BackButton to="/calendario"><FaArrowLeft /></BackButton>
        <Title>Pedir Sessão de PT Individual</Title>
      </Header>

      <FormContainer onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="staffId"><FaUserTie /> Personal Trainer</Label>
          <Select id="staffId" name="staffId" value={formData.staffId} onChange={handleChange} required>
            <option value="">Selecione um treinador...</option>
            {trainers.map(trainer => (
              <option key={trainer.id} value={trainer.id}>{trainer.firstName} {trainer.lastName}</option>
            ))}
          </Select>
        </FormGroup>

        <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
          <FormGroup style={{flex: 1, minWidth: '200px'}}>
            <Label htmlFor="date"><FaCalendarAlt /> Data Desejada</Label>
            <Input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]}/>
          </FormGroup>
          <FormGroup style={{flex: 1, minWidth: '200px'}}>
            <Label htmlFor="time"><FaClock /> Hora Desejada</Label>
            <Input type="time" id="time" name="time" value={formData.time} onChange={handleChange} required />
          </FormGroup>
        </div>

        <FormGroup>
          <Label htmlFor="notes"><FaStickyNote /> Notas Adicionais (opcional)</Label>
          <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows="4" placeholder="Ex: Foco em membros inferiores, objetivos específicos, etc." />
        </FormGroup>

        {error && <ErrorText>{error}</ErrorText>}

        <SubmitButton type="submit" disabled={loading}>
          <FaPaperPlane /> {loading ? 'A Enviar Pedido...' : 'Enviar Pedido de Sessão'}
        </SubmitButton>
      </FormContainer>
    </PageContainer>
  );
};

export default IndividualPTRequestPage;