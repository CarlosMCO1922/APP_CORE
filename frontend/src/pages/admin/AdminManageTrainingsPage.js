// src/pages/admin/AdminManageTrainingsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components'; // Importar css helper
import { useAuth } from '../../context/AuthContext';
import {
    getAllTrainings,
    adminCreateTraining,
    adminUpdateTraining,
    adminDeleteTraining
} from '../../services/trainingService';
import { adminGetAllStaff } from '../../services/staffService';
import { FaDumbbell, FaPlus, FaEdit, FaTrashAlt, FaListAlt, FaArrowLeft, FaTimes } from 'react-icons/fa';

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap; 
  gap: 15px;
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem); 
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
`;

const CreateButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 10px 18px;
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;

  &:hover {
    background-color: #e6c358;
    transform: translateY(-2px);
  }
  @media (max-width: 480px) {
    width: 100%; 
    justify-content: center;
    font-size: 1rem;
    padding: 12px;
  }
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background-color 0.2s ease, color 0.2s ease;
  font-size: 0.9rem;

  &:hover {
    background-color: ${({ theme }) => theme.colors.cardBackground};
    color: #fff;
  }
  svg {
    margin-right: 4px;
  }
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; 
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};
  
  &::-webkit-scrollbar {
    height: 8px;
    background-color: #252525;
  }
  &::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
  }
`;

const Table = styled.table`
  width: 100%;
  min-width: 800px; /* Garante que a tabela tenha uma largura mínima para o scroll fazer sentido */
  border-collapse: collapse;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  
  th, td {
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
    padding: 10px 12px;
    text-align: left;
    font-size: 0.85rem; /* Ligeiramente menor para mais info na tabela */
    white-space: nowrap;
  }
  th {
    background-color: #303030;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    position: sticky; 
    top: 0; /* Para cabeçalho fixo ao fazer scroll vertical dentro do TableWrapper (se a altura do wrapper for limitada) */
    z-index: 1;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover { background-color: #2c2c2c; }

  td.actions-cell { 
    white-space: nowrap; /* Para que os botões não quebrem linha entre si, mas o container pode quebrar */
    text-align: right;
    min-width: 280px; /* Espaço para os botões */
  }
  @media (max-width: 768px) {
    th, td { padding: 8px 10px; font-size: 0.8rem; }
    td.actions-cell { min-width: 240px; }
  }
`;

const ActionButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: nowrap; /* Evita que os botões quebrem linha entre si */
`;

const ActionButton = styled.button`
  padding: 6px 10px;
  font-size: 0.75rem; /* Um pouco menor para caber mais */
  border-radius: 5px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease, transform 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap; /* Evita que o texto do botão quebre */
  
  background-color: ${props => {
    if (props.danger) return props.theme.colors.error;
    if (props.secondary) return props.theme.colors.buttonSecondaryBg;
    if (props.plans) return props.theme.colors.mediaButtonBg; // Usando cor de media button para planos
    return props.theme.colors.primary;
  }};
  color: ${props => (props.danger || props.plans) ? 'white' : (props.secondary ? props.theme.colors.textMain : props.theme.colors.textDark)};

  &:hover:not(:disabled) {
    opacity: 0.85;
    transform: translateY(-1px);
    background-color: ${props => { /* Ajusta cores de hover se necessário */
        if (props.danger) return '#C62828';
        if (props.secondary) return props.theme.colors.buttonSecondaryHoverBg;
        if (props.plans) return props.theme.colors.mediaButtonHoverBg;
        return '#e6c358';
    }};
  }
  &:disabled {
    background-color: #404040;
    color: #777;
    cursor: not-allowed;
  }
`;

// Estilos base para mensagens
const MessageBaseStyles = css` 
  text-align: center;
  padding: 12px 18px;
  margin: 20px auto;
  border-radius: ${({ theme }) => theme.borderRadius};
  border-width: 1px;
  border-style: solid;
  max-width: 600px;
  font-size: 0.9rem;
  font-weight: 500;
`;

const LoadingText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.primary};
  border-color: transparent;
  background: transparent;
`;

const ErrorText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.errorBg};
  border-color: ${({ theme }) => theme.colors.error};
`;

const MessageText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.success};
  background-color: ${({ theme }) => theme.colors.successBg};
  border-color: ${({ theme }) => theme.colors.success};
`;

// Modal Styled Components
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.85); display: flex;
  justify-content: center; align-items: center;
  z-index: 1050; padding: 20px;
`;
const ModalContent = styled.div`
  background-color: #2A2A2A;
  padding: clamp(25px, 4vw, 35px);
  border-radius: 10px; width: 100%;
  max-width: 550px; box-shadow: 0 8px 25px rgba(0,0,0,0.6);
  position: relative; max-height: 90vh; overflow-y: auto;
`;
const ModalTitle = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 0; margin-bottom: 20px;
  font-size: clamp(1.4rem, 3.5vw, 1.7rem);
  font-weight: 600; text-align: center;
  padding-bottom: 15px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;
const ModalForm = styled.form` display: flex; flex-direction: column; gap: 15px; `;
const ModalLabel = styled.label`
  font-size: 0.85rem; color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 4px; display: block; font-weight: 500;
`;
const ModalInput = styled.input`
  padding: 10px 14px; background-color: #333;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); }
`;
const ModalTextarea = styled.textarea`
  padding: 10px 14px; background-color: #333;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem;
  width: 100%; min-height: 80px; resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); }
`;
const ModalSelect = styled.select`
  padding: 10px 14px; background-color: #333;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); }
`;
const ModalActions = styled.div`
  display: flex; flex-direction: column; gap: 10px;
  margin-top: 25px; padding-top: 15px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  @media (min-width: 480px) { flex-direction: row; justify-content: flex-end; }
`;
const ModalButton = styled(ActionButton)`
  font-size: 0.9rem; 
  padding: 10px 18px;
  gap: 6px;
  width: 100%;
  @media (min-width: 480px) { width: auto; }
`;
const CloseButton = styled.button`
  position: absolute; top: 10px; right: 10px; background: transparent; border: none;
  color: #888; font-size: 1.8rem; cursor: pointer; line-height: 1; padding: 8px;
  transition: color 0.2s, transform 0.2s; border-radius: 50%;
  &:hover { color: #fff; transform: scale(1.1); }
`;
const ModalErrorText = styled.p` // Usando ErrorText como base com ajustes
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.errorBg};
  border-color: ${({ theme }) => theme.colors.error};
  margin: -5px 0 10px 0; 
  text-align: left;      
  font-size: 0.8rem;    
  padding: 8px 12px;     
`;

const initialTrainingFormState = {
  name: '', description: '', date: '', time: '',
  capacity: 10, instructorId: '', durationMinutes: 45,
};

const AdminManageTrainingsPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [trainings, setTrainings] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTrainingData, setCurrentTrainingData] = useState(initialTrainingFormState);
  const [currentTrainingId, setCurrentTrainingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchPageData = useCallback(async () => {
    if (authState.token) {
      try {
        setLoading(true); setError(''); setSuccessMessage('');
        const [trainingsData, staffData] = await Promise.all([
          getAllTrainings(authState.token),
          adminGetAllStaff(authState.token)
        ]);
        setTrainings(trainingsData);
        setInstructors(staffData.filter(staff => ['trainer', 'admin'].includes(staff.role)));
      } catch (err) {
        setError(err.message || 'Não foi possível carregar os dados da página.');
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token]);

  useEffect(() => { fetchPageData(); }, [fetchPageData]);

  const handleOpenCreateModal = () => {
    setIsEditing(false); setCurrentTrainingData(initialTrainingFormState);
    setCurrentTrainingId(null); setModalError(''); setShowModal(true);
  };

  const handleOpenEditModal = (training) => {
    setIsEditing(true);
    setCurrentTrainingData({
      name: training.name, description: training.description || '', date: training.date,
      time: training.time.substring(0,5), capacity: training.capacity,
      instructorId: training.instructorId || (training.instructor?.id || ''),
      durationMinutes: training.durationMinutes || 45,
    });
    setCurrentTrainingId(training.id); setModalError(''); setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false); setCurrentTrainingData(initialTrainingFormState);
    setCurrentTrainingId(null); setModalError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentTrainingData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true); setModalError(''); setError(''); setSuccessMessage('');
    const dataToSend = {
      ...currentTrainingData,
      capacity: parseInt(currentTrainingData.capacity, 10),
      instructorId: parseInt(currentTrainingData.instructorId, 10),
      durationMinutes: parseInt(currentTrainingData.durationMinutes, 10),
      time: currentTrainingData.time.length === 5 ? `${currentTrainingData.time}:00` : currentTrainingData.time,
    };

    if (isNaN(dataToSend.capacity) || dataToSend.capacity <= 0) {
        setModalError("Capacidade deve ser um número positivo.");
        setFormLoading(false); return;
    }
    if (isNaN(dataToSend.instructorId) || !dataToSend.instructorId) {
        setModalError("Por favor, selecione um instrutor.");
        setFormLoading(false); return;
    }
     if (isNaN(dataToSend.durationMinutes) || dataToSend.durationMinutes <= 0) {
        setModalError("Duração deve ser um número positivo.");
        setFormLoading(false); return;
    }

    try {
      if (isEditing) {
        await adminUpdateTraining(currentTrainingId, dataToSend, authState.token);
        setSuccessMessage('Treino atualizado com sucesso!');
      } else {
        await adminCreateTraining(dataToSend, authState.token);
        setSuccessMessage('Treino criado com sucesso!');
      }
      fetchPageData(); handleCloseModal();
    } catch (err) {
      setModalError(err.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} treino.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTraining = async (trainingId) => {
    if (!window.confirm(`Tens a certeza que queres eliminar o treino ID ${trainingId}? Esta ação não pode ser desfeita e eliminará também os planos de treino associados.`)) return;
    setError(''); setSuccessMessage('');
    try {
      await adminDeleteTraining(trainingId, authState.token);
      setSuccessMessage('Treino eliminado com sucesso.');
      fetchPageData();
    } catch (err) {
      setError(err.message || 'Falha ao eliminar treino.');
    }
  };

  if (loading && !showModal) {
    return <PageContainer><LoadingText>A carregar treinos...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <HeaderContainer>
        <Title>Gerir Treinos</Title>
        <CreateButton onClick={handleOpenCreateModal}><FaPlus /> Novo Treino</CreateButton>
      </HeaderContainer>
      <BackLink to="/admin/dashboard"><FaArrowLeft /> Voltar ao Painel Admin</BackLink>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Data</th>
              <th>Hora</th>
              <th>Duração</th>
              <th>Capacidade</th>
              <th>Inscritos</th>
              <th>Instrutor</th>
              <th className="actions-cell">Ações</th>
            </tr>
          </thead>
          <tbody>
            {trainings.length > 0 ? trainings.map(training => (
              <tr key={training.id}>
                <td>{training.id}</td>
                <td>{training.name}</td>
                <td>{new Date(training.date).toLocaleDateString('pt-PT')}</td>
                <td>{training.time ? training.time.substring(0,5) : 'N/A'}</td>
                <td>{training.durationMinutes} min</td>
                <td>{training.capacity}</td>
                <td>{training.participantsCount ?? (training.participants?.length || 0)}</td>
                <td>{training.instructor ? `${training.instructor.firstName} ${training.instructor.lastName}` : 'N/A'}</td>
                <td className="actions-cell">
                  <ActionButtonContainer>
                    <ActionButton plans onClick={() => navigate(`/admin/trainings/${training.id}/manage-plans`)}>
                      <FaListAlt /> Planos
                    </ActionButton>
                    <ActionButton secondary onClick={() => handleOpenEditModal(training)}>
                      <FaEdit /> Editar
                    </ActionButton>
                    <ActionButton danger onClick={() => handleDeleteTraining(training.id)}>
                      <FaTrashAlt /> Eliminar
                    </ActionButton>
                  </ActionButtonContainer>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Nenhum treino encontrado.</td></tr>
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}><FaTimes /></CloseButton>
            <ModalTitle>{isEditing ? 'Editar Treino' : 'Criar Novo Treino'}</ModalTitle>
            {modalError && <ModalErrorText>{modalError}</ModalErrorText>}
            <ModalForm onSubmit={handleFormSubmit}>
              <ModalLabel htmlFor="nameTrain">Nome do Treino*</ModalLabel>
              <ModalInput type="text" name="name" id="nameTrain" value={currentTrainingData.name} onChange={handleFormChange} required />

              <ModalLabel htmlFor="descriptionTrain">Descrição</ModalLabel>
              <ModalTextarea name="description" id="descriptionTrain" value={currentTrainingData.description} onChange={handleFormChange} />

              <ModalLabel htmlFor="dateTrain">Data*</ModalLabel>
              <ModalInput type="date" name="date" id="dateTrain" value={currentTrainingData.date} onChange={handleFormChange} required />

              <ModalLabel htmlFor="timeTrain">Hora (HH:MM)*</ModalLabel>
              <ModalInput type="time" name="time" id="timeTrain" value={currentTrainingData.time} onChange={handleFormChange} required />

              <ModalLabel htmlFor="durationMinutesTrain">Duração (minutos)*</ModalLabel>
              <ModalInput type="number" name="durationMinutes" id="durationMinutesTrain" value={currentTrainingData.durationMinutes} onChange={handleFormChange} required min="1" />

              <ModalLabel htmlFor="capacityTrain">Capacidade*</ModalLabel>
              <ModalInput type="number" name="capacity" id="capacityTrain" value={currentTrainingData.capacity} onChange={handleFormChange} required min="1" />

              <ModalLabel htmlFor="instructorIdTrain">Instrutor*</ModalLabel>
              <ModalSelect name="instructorId" id="instructorIdTrain" value={currentTrainingData.instructorId} onChange={handleFormChange} required>
                <option value="">Selecione um instrutor</option>
                {instructors.map(instr => (
                  <option key={instr.id} value={instr.id}>{instr.firstName} {instr.lastName} ({instr.role})</option>
                ))}
              </ModalSelect>

              <ModalActions>
                <ModalButton type="button" secondary onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}>
                  <FaDumbbell style={{marginRight: '8px'}} /> {formLoading ? 'A guardar...' : (isEditing ? 'Guardar Alterações' : 'Criar Treino')}
                </ModalButton>
              </ModalActions>
            </ModalForm>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default AdminManageTrainingsPage;