// src/pages/admin/AdminManageTrainingsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { 
    getAllTrainings, 
    adminCreateTraining, 
    adminUpdateTraining, 
    adminDeleteTraining 
} from '../../services/trainingService';
import { adminGetAllStaff } from '../../services/staffService'; // Para listar instrutores

// --- Reutilizar Styled Components ---
const PageContainer = styled.div`
  background-color: #1A1A1A; color: #E0E0E0; min-height: 100vh;
  padding: 20px 40px; font-family: 'Inter', sans-serif;
`;
const Title = styled.h1` font-size: 2.2rem; color: #D4AF37; margin-bottom: 25px; `;
const Table = styled.table`
  width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #252525;
  border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  th, td { border-bottom: 1px solid #383838; padding: 10px 12px; text-align: left; font-size: 0.9rem; }
  th { background-color: #303030; color: #D4AF37; font-weight: 600; }
  tr:last-child td { border-bottom: none; }
  tr:hover { background-color: #2c2c2c; }
`;
const ActionButton = styled.button`
  margin-right: 8px; padding: 6px 10px; font-size: 0.85rem; border-radius: 5px;
  cursor: pointer; border: none; transition: background-color 0.2s ease;
  background-color: ${props => props.danger ? '#D32F2F' : (props.secondary ? '#555' : '#D4AF37')};
  color: ${props => props.danger ? 'white' : (props.secondary ? '#E0E0E0' : '#1A1A1A')};
  &:hover { background-color: ${props => props.danger ? '#C62828' : (props.secondary ? '#666' : '#e6c358')}; }
  &:disabled { background-color: #404040; color: #777; cursor: not-allowed; }
`;
const TopActionsContainer = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; `;
const CreateButtonStyled = styled.button`
  background-color: #D4AF37; color: #1A1A1A; padding: 10px 20px; border-radius: 8px;
  text-decoration: none; font-weight: bold; border: none; cursor: pointer;
  transition: background-color 0.2s ease;
  &:hover { background-color: #e6c358; }
`;
const LoadingText = styled.p` font-size: 1.1rem; text-align: center; padding: 20px; color: #D4AF37;`;
const ErrorText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #FF6B6B; background-color: rgba(255,107,107,0.15); border: 1px solid #FF6B6B; border-radius: 8px; margin: 15px 0;`;
const MessageText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #66BB6A; background-color: rgba(102,187,106,0.15); border: 1px solid #66BB6A; border-radius: 8px; margin: 15px 0;`;

const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.75); display: flex; justify-content: center; align-items: center; z-index: 1000; `;
const ModalContent = styled.div` background-color: #2C2C2C; padding: 30px 40px; border-radius: 10px; width: 100%; max-width: 550px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); position: relative; max-height: 90vh; overflow-y: auto; `;
const ModalTitle = styled.h2` color: #D4AF37; margin-top: 0; margin-bottom: 25px; font-size: 1.6rem; `;
const ModalForm = styled.form` display: flex; flex-direction: column; gap: 15px; `;
const ModalLabel = styled.label` font-size: 0.9rem; color: #b0b0b0; margin-bottom: 5px; display: block; `;
const ModalInput = styled.input` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; &:focus { outline: none; border-color: #D4AF37; } `;
const ModalTextarea = styled.textarea` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; min-height: 80px; &:focus { outline: none; border-color: #D4AF37; } `;
const ModalSelect = styled.select` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; &:focus { outline: none; border-color: #D4AF37; } `;
const ModalActions = styled.div` display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; `;
const ModalButton = styled.button`
  padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer;
  font-weight: 500; transition: background-color 0.2s ease;
  background-color: ${props => props.primary ? '#D4AF37' : '#555'};
  color: ${props => props.primary ? '#1A1A1A' : '#E0E0E0'};
  &:hover { background-color: ${props => props.primary ? '#e6c358' : '#666'}; }
  &:disabled { background-color: #404040; color: #777; cursor: not-allowed; }
`;
const CloseButton = styled.button` 
  position: absolute; top: 15px; right: 20px; 
  background: transparent; border: none; 
  color: #aaa; font-size: 1.8rem; cursor: pointer;
  line-height: 1; padding: 0;
  &:hover { color: #fff; } 
`;

const initialTrainingFormState = {
  name: '',
  description: '',
  date: '',
  time: '',
  capacity: 10,
  instructorId: '',
  durationMinutes: 45, // Adicionado o default do modelo
};

const AdminManageTrainingsPage = () => {
  const { authState } = useAuth();
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
        setLoading(true);
        setError('');
        setSuccessMessage('');
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

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentTrainingData(initialTrainingFormState);
    setCurrentTrainingId(null);
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (training) => {
    setIsEditing(true);
    setCurrentTrainingData({
      name: training.name,
      description: training.description || '',
      date: training.date,
      time: training.time.substring(0,5),
      capacity: training.capacity,
      instructorId: training.instructorId || (training.instructor?.id || ''),
      durationMinutes: training.durationMinutes || 45,
    });
    setCurrentTrainingId(training.id);
    setModalError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentTrainingData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setModalError('');
    setError('');
    setSuccessMessage('');

    const dataToSend = {
      ...currentTrainingData,
      capacity: parseInt(currentTrainingData.capacity, 10),
      instructorId: parseInt(currentTrainingData.instructorId, 10),
      durationMinutes: parseInt(currentTrainingData.durationMinutes, 10),
      time: currentTrainingData.time.length === 5 ? `${currentTrainingData.time}:00` : currentTrainingData.time,
    };

    if (isNaN(dataToSend.capacity) || dataToSend.capacity <= 0) {
        setModalError("Capacidade deve ser um número positivo.");
        setFormLoading(false);
        return;
    }
    if (isNaN(dataToSend.instructorId) || !dataToSend.instructorId) {
        setModalError("Por favor, selecione um instrutor.");
        setFormLoading(false);
        return;
    }
     if (isNaN(dataToSend.durationMinutes) || dataToSend.durationMinutes <= 0) {
        setModalError("Duração deve ser um número positivo.");
        setFormLoading(false);
        return;
    }

    try {
      if (isEditing) {
        await adminUpdateTraining(currentTrainingId, dataToSend, authState.token);
        setSuccessMessage('Treino atualizado com sucesso!');
      } else {
        await adminCreateTraining(dataToSend, authState.token);
        setSuccessMessage('Treino criado com sucesso!');
      }
      fetchPageData(); 
      handleCloseModal();
    } catch (err) {
      setModalError(err.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} treino.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTraining = async (trainingId) => {
    if (!window.confirm(`Tens a certeza que queres eliminar o treino ID ${trainingId}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setError('');
    setSuccessMessage('');
    try {
      await adminDeleteTraining(trainingId, authState.token);
      setSuccessMessage('Treino eliminado com sucesso.');
      fetchPageData();
    } catch (err) {
      setError(err.message || 'Falha ao eliminar treino.');
    }
  };
  
  if (loading && !showModal) {
    return <PageContainer><LoadingText>A carregar lista de treinos...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <TopActionsContainer>
        <Title>Gerir Treinos</Title>
        <CreateButtonStyled onClick={handleOpenCreateModal}>Criar Novo Treino</CreateButtonStyled>
      </TopActionsContainer>
      <Link to="/admin/dashboard" style={{color: '#D4AF37', marginBottom: '20px', display: 'inline-block', textDecoration:'none'}}>‹ Voltar ao Painel Admin</Link>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

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
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {trainings.length > 0 ? trainings.map(training => (
            <tr key={training.id}>
              <td>{training.id}</td>
              <td>{training.name}</td>
              <td>{new Date(training.date).toLocaleDateString('pt-PT')}</td>
              <td>{training.time.substring(0,5)}</td>
              <td>{training.durationMinutes} min</td>
              <td>{training.capacity}</td>
              <td>{training.participantsCount || training.participants?.length || 0}</td>
              <td>{training.instructor ? `${training.instructor.firstName} ${training.instructor.lastName}` : 'N/A'}</td>
              <td>
                <ActionButton secondary onClick={() => handleOpenEditModal(training)}>
                  Editar
                </ActionButton>
                <ActionButton danger onClick={() => handleDeleteTraining(training.id)}>
                  Eliminar
                </ActionButton>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Nenhum treino encontrado.</td>
            </tr>
          )}
        </tbody>
      </Table>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}>&times;</CloseButton>
            <ModalTitle>{isEditing ? 'Editar Treino' : 'Criar Novo Treino'}</ModalTitle>
            {modalError && <ErrorText style={{marginBottom: '15px'}}>{modalError}</ErrorText>}
            <ModalForm onSubmit={handleFormSubmit}>
              <ModalLabel htmlFor="name">Nome do Treino</ModalLabel>
              <ModalInput type="text" name="name" id="name" value={currentTrainingData.name} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="description">Descrição</ModalLabel>
              <ModalTextarea name="description" id="description" value={currentTrainingData.description} onChange={handleFormChange} />
              
              <ModalLabel htmlFor="date">Data</ModalLabel>
              <ModalInput type="date" name="date" id="date" value={currentTrainingData.date} onChange={handleFormChange} required />

              <ModalLabel htmlFor="time">Hora (HH:MM)</ModalLabel>
              <ModalInput type="time" name="time" id="time" value={currentTrainingData.time} onChange={handleFormChange} required />

              <ModalLabel htmlFor="durationMinutes">Duração (minutos)</ModalLabel>
              <ModalInput type="number" name="durationMinutes" id="durationMinutes" value={currentTrainingData.durationMinutes} onChange={handleFormChange} required min="1" />

              <ModalLabel htmlFor="capacity">Capacidade</ModalLabel>
              <ModalInput type="number" name="capacity" id="capacity" value={currentTrainingData.capacity} onChange={handleFormChange} required min="1" />

              <ModalLabel htmlFor="instructorId">Instrutor</ModalLabel>
              <ModalSelect name="instructorId" id="instructorId" value={currentTrainingData.instructorId} onChange={handleFormChange} required>
                <option value="">Selecione um instrutor</option>
                {instructors.map(instr => (
                  <option key={instr.id} value={instr.id}>{instr.firstName} {instr.lastName} ({instr.role})</option>
                ))}
              </ModalSelect>

              <ModalActions>
                <ModalButton type="button" onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}>
                  {formLoading ? 'A guardar...' : (isEditing ? 'Guardar Alterações' : 'Criar Treino')}
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