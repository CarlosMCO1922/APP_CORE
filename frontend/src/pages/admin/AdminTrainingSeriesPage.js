// src/pages/admin/AdminTrainingSeriesPage.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext'; 
import { createTrainingSeriesService } from '../../services/trainingService'; 
import { getAllStaffForSelection } from '../../services/staffService'; 
import { FaCalendarPlus, FaListAlt, FaArrowLeft } from 'react-icons/fa';
import { theme } from '../../theme'; 
import { Link } from 'react-router-dom';

// --- Styled Components ---
const PageContainer = styled.div`
  padding: 25px clamp(15px, 4vw, 40px);
  max-width: 900px;
  margin: 20px auto;
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
  background-color: ${({ theme }) => theme.colors.background};
`;

const HeaderContainer = styled.div`
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.2rem);
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 25px;
  padding: 9px 16px;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background-color 0.2s, color 0.2s;
  font-size: 0.95rem;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textOnPrimary || '#fff'};
  }
`;

const FormSection = styled.section`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 25px;
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};
  margin-bottom: 30px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 18px;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Input = styled.input`
  padding: 12px 15px;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  background-color: ${({ theme }) => theme.colors.inputBg};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusShadow || 'rgba(212, 175, 55, 0.2)'};
  }
`;
   
const Textarea = styled.textarea`
  padding: 12px 15px;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  background-color: ${({ theme }) => theme.colors.inputBg};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  width: 100%;
  box-sizing: border-box;
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusShadow || 'rgba(212, 175, 55, 0.2)'};
  }
`;

const Select = styled.select`
  padding: 12px 15px;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  background-color: ${({ theme }) => theme.colors.inputBg};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1rem;
  width: 100%;
  box-sizing: border-box;
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusShadow || 'rgba(212, 175, 55, 0.2)'};
  }
`;

const SubmitButton = styled.button`
  padding: 12px 25px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary || 'white'};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.disabledBg};
    cursor: not-allowed;
  }
`;

const Message = styled.p`
    padding: 12px 18px;
    border-radius: ${({ theme }) => theme.borderRadius};
    margin: 20px 0;
    text-align: center;
    font-size: 0.9rem;
    font-weight: 500;
    &.success {
        background-color: ${({ theme }) => theme.colors.successBg || 'rgba(40, 167, 69, 0.1)'};
        color: ${({ theme }) => theme.colors.success || '#28a745'};
        border: 1px solid ${({ theme }) => theme.colors.success || '#28a745'};
    }
    &.error {
        background-color: ${({ theme }) => theme.colors.errorBg || 'rgba(220, 53, 69, 0.1)'};
        color: ${({ theme }) => theme.colors.error || '#dc3545'};
        border: 1px solid ${({ theme }) => theme.colors.error || '#dc3545'};
    }
`;
// --- Fim Styled Components ---

const AdminTrainingSeriesPage = () => {
  const { authState } = useAuth();
  const [seriesData, setSeriesData] = useState({
    name: '',
    description: '',
    instructorId: '', 
    dayOfWeek: '1', 
    startTime: '18:00',
    endTime: '19:00',
    seriesStartDate: '',
    seriesEndDate: '',
    capacity: '10',
    location: '',
  });
  const [instructors, setInstructors] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loadingInstructors, setLoadingInstructors] = useState(true);


  useEffect(() => {
    const fetchInstructors = async () => {
      if (!authState.token) {
        setLoadingInstructors(false);
        return;
      }
      try {
        setLoadingInstructors(true);
        const data = await getAllStaffForSelection(authState.token);
        const validInstructors = (data.professionals || [])
            .filter(p => ['trainer', 'admin', 'physiotherapist'].includes(p.role)) 
            .map(p => ({
                id: p.id,
                name: `${p.userDetails.firstName} ${p.userDetails.lastName} (${p.role})`
        }));
        setInstructors(validInstructors);
      } catch (error) {
        console.error("Erro ao buscar instrutores:", error);
        setMessage({ type: 'error', text: 'Falha ao carregar lista de instrutores.' });
      } finally {
        setLoadingInstructors(false);
      }
    };
    fetchInstructors();
  }, [authState.token]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSeriesData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authState.token || !(authState.user?.role === 'admin')) { 
      setMessage({ type: 'error', text: 'Apenas administradores podem criar séries de treinos.'});
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (new Date(seriesData.seriesEndDate) < new Date(seriesData.seriesStartDate)) {
        setMessage({ type: 'error', text: 'Data de fim não pode ser anterior à data de início.'});
        setLoading(false);
        return;
    }
    if (!seriesData.instructorId) {
        setMessage({ type: 'error', text: 'Por favor, selecione um instrutor.'});
        setLoading(false);
        return;
    }
     if (!seriesData.name.trim()) {
        setMessage({ type: 'error', text: 'O nome da série é obrigatório.'});
        setLoading(false);
        return;
    }
    const capacityNum = parseInt(seriesData.capacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
        setMessage({ type: 'error', text: 'A capacidade deve ser um número positivo.'});
        setLoading(false);
        return;
    }

    try {
      const payload = {
        ...seriesData,
        instructorId: parseInt(seriesData.instructorId), 
        dayOfWeek: parseInt(seriesData.dayOfWeek),
        capacity: capacityNum,
      };

      const result = await createTrainingSeriesService(payload, authState.token);
      setMessage({ type: 'success', text: `${result.message} Foram criadas ${result.instancesCreatedCount || result.instancesCreated || 0} instâncias de treino.` });
      setSeriesData({ 
         name: '', description: '', instructorId: '', dayOfWeek: '1', 
         startTime: '18:00', endTime: '19:00', seriesStartDate: '', 
         seriesEndDate: '', capacity: '10', location: '',
      });
    } catch (error) {
      console.error("Erro ao criar série de treinos:", error);
      setMessage({ type: 'error', text: error.message || 'Falha ao criar série de treinos.' });
    } finally {
      setLoading(false);
    }
  };
  
  const isAdminUserCheck = authState.user?.role === 'admin'; 

  return (
    <PageContainer>
      <BackLink to={isAdminUserCheck ? "/admin/dashboard" : "/dashboard"}> 
          <FaArrowLeft /> Voltar ao Painel
      </BackLink> 
      <HeaderContainer>
        <Title><FaCalendarPlus /> Criar Nova Série de Treinos</Title>
      </HeaderContainer>
      
      {message.text && <Message className={message.type}>{message.text}</Message>}

      {isAdminUserCheck ? (
        <FormSection>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="name">Nome da Série*</Label>
              <Input type="text" name="name" id="name" value={seriesData.name} onChange={handleChange} required />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="description">Descrição</Label>
              <Textarea name="description" id="description" value={seriesData.description} onChange={handleChange} />
            </FormGroup>
            <FormRow>
              <FormGroup>
                <Label htmlFor="instructorId">Instrutor Responsável*</Label>
                <Select name="instructorId" id="instructorId" value={seriesData.instructorId} onChange={handleChange} required disabled={loadingInstructors}>
                  <option value="">{loadingInstructors ? 'A carregar...' : 'Selecione um instrutor'}</option>
                  {instructors.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="dayOfWeek">Dia da Semana*</Label>
                <Select name="dayOfWeek" id="dayOfWeek" value={seriesData.dayOfWeek} onChange={handleChange}>
                  <option value="1">Segunda-feira</option>
                  <option value="2">Terça-feira</option>
                  <option value="3">Quarta-feira</option>
                  <option value="4">Quinta-feira</option>
                  <option value="5">Sexta-feira</option>
                  <option value="6">Sábado</option>
                  <option value="0">Domingo</option>
                </Select>
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label htmlFor="startTime">Hora de Início*</Label>
                <Input type="time" name="startTime" id="startTime" value={seriesData.startTime} onChange={handleChange} required />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="endTime">Hora de Fim*</Label>
                <Input type="time" name="endTime" id="endTime" value={seriesData.endTime} onChange={handleChange} required />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label htmlFor="seriesStartDate">Data de Início da Série*</Label>
                <Input type="date" name="seriesStartDate" id="seriesStartDate" value={seriesData.seriesStartDate} onChange={handleChange} required />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="seriesEndDate">Data de Fim da Série*</Label>
                <Input type="date" name="seriesEndDate" id="seriesEndDate" value={seriesData.seriesEndDate} onChange={handleChange} required />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label htmlFor="capacity">Capacidade por Aula*</Label>
                <Input type="number" name="capacity" id="capacity" value={seriesData.capacity} onChange={handleChange} min="1" required/>
              </FormGroup>
              <FormGroup>
                <Label htmlFor="location">Localização (Opcional)</Label>
                <Input type="text" name="location" id="location" value={seriesData.location} onChange={handleChange} />
              </FormGroup>
            </FormRow>
            
            <SubmitButton type="submit" disabled={loading || loadingInstructors}>
              <FaCalendarPlus /> {loading ? 'A Criar...' : 'Criar Série de Treinos'}
            </SubmitButton>
          </Form>
        </FormSection>
      ) : (
        <Message className="error">Apenas administradores podem aceder a esta página.</Message>
      )}

      {isAdminUserCheck && (
        <FormSection style={{marginTop: '40px'}}>
            <Title as="h2" style={{fontSize: '1.5rem', borderBottom: 'none', marginBottom: '15px'}}><FaListAlt /> Séries de Treinos Programadas</Title>
            <p style={{color: theme.colors.textMuted}}><i>(A funcionalidade de listar e gerir séries existentes será implementada aqui no futuro.)</i></p>
        </FormSection>
      )}
    </PageContainer>
  );
};

export default AdminTrainingSeriesPage;