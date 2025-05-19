// src/pages/admin/AdminManageAppointmentsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import {
    getAllAppointments,
    adminCreateAppointment,
    adminUpdateAppointment,
    adminDeleteAppointment
} from '../../services/appointmentService';
import { adminGetAllStaff } from '../../services/staffService';
import { adminGetAllUsers } from '../../services/userService';

// --- Styled Components (Certifica-te que tens estas definições ou importa-as) ---
const PageContainer = styled.div` background-color: #1A1A1A; color: #E0E0E0; min-height: 100vh; padding: 20px 40px; font-family: 'Inter', sans-serif; `;
const Title = styled.h1` font-size: 2.2rem; color: #D4AF37; margin-bottom: 25px; `;
const Table = styled.table` width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #252525; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5); th, td { border-bottom: 1px solid #383838; padding: 10px 12px; text-align: left; font-size: 0.9rem; } th { background-color: #303030; color: #D4AF37; font-weight: 600; } tr:last-child td { border-bottom: none; } tr:hover { background-color: #2c2c2c; } `;
const ActionButton = styled.button` margin-right: 8px; padding: 6px 10px; font-size: 0.85rem; border-radius: 5px; cursor: pointer; border: none; transition: background-color 0.2s ease; background-color: ${props => props.danger ? '#D32F2F' : (props.secondary ? '#555' : '#D4AF37')}; color: ${props => props.danger ? 'white' : (props.secondary ? '#E0E0E0' : '#1A1A1A')}; &:hover { background-color: ${props => props.danger ? '#C62828' : (props.secondary ? '#666' : '#e6c358')}; } &:disabled { background-color: #404040; color: #777; cursor: not-allowed; } `;
const TopActionsContainer = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; `;
const CreateButtonStyled = styled.button` background-color: #D4AF37; color: #1A1A1A; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; border: none; cursor: pointer; transition: background-color 0.2s ease; &:hover { background-color: #e6c358; } `;
const LoadingText = styled.p` font-size: 1.1rem; text-align: center; padding: 20px; color: #D4AF37;`;
const ErrorText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #FF6B6B; background-color: rgba(255,107,107,0.15); border: 1px solid #FF6B6B; border-radius: 8px; margin: 15px 0;`;
const MessageText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #66BB6A; background-color: rgba(102,187,106,0.15); border: 1px solid #66BB6A; border-radius: 8px; margin: 15px 0;`;

const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.75); display: flex; justify-content: center; align-items: center; z-index: 1000; padding:20px;`;
const ModalContent = styled.div` background-color: #2C2C2C; padding: 30px 40px; border-radius: 10px; width: 100%; max-width: 550px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); position: relative; max-height: 90vh; overflow-y: auto; `;
const ModalTitle = styled.h2` color: #D4AF37; margin-top: 0; margin-bottom: 25px; font-size: 1.6rem; `;
const ModalForm = styled.form` display: flex; flex-direction: column; gap: 15px; `;
const ModalLabel = styled.label` font-size: 0.9rem; color: #b0b0b0; margin-bottom: 5px; display: block; `;
const ModalInput = styled.input` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; &:focus { outline: none; border-color: #D4AF37; } `;
const ModalTextarea = styled.textarea` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; min-height: 80px; &:focus { outline: none; border-color: #D4AF37; } `;
const ModalSelect = styled.select` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; &:focus { outline: none; border-color: #D4AF37; } `;
const ModalActions = styled.div` display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; `;
const ModalButton = styled.button` padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; transition: background-color 0.2s ease; background-color: ${props => props.primary ? '#D4AF37' : '#555'}; color: ${props => props.primary ? '#1A1A1A' : '#E0E0E0'}; &:hover { background-color: ${props => props.primary ? '#e6c358' : '#666'}; } &:disabled { background-color: #404040; color: #777; cursor: not-allowed; } `;
const CloseButton = styled.button`
  position: absolute; top: 15px; right: 20px;
  background: transparent; border: none;
  color: #aaa; font-size: 1.8rem; cursor: pointer;
  line-height: 1; padding: 0;
  &:hover { color: #fff; }
`;

const initialAppointmentFormState = {
  date: '',
  time: '',
  staffId: '',
  userId: '', // String vazia para 'Nenhum' no select
  notes: '',
  status: 'disponível',
  durationMinutes: 60,
  totalCost: '', // Inicializado como string vazia para o input
};

const appointmentStatuses = [
    'disponível', 'agendada', 'confirmada', 'concluída',
    'cancelada_pelo_cliente', 'cancelada_pelo_staff',
    'não_compareceu', 'pendente_aprovacao_staff', 'rejeitada_pelo_staff'
];


const AdminManageAppointmentsPage = () => {
  const { authState } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAppointmentData, setCurrentAppointmentData] = useState(initialAppointmentFormState);
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchPageData = useCallback(async () => {
    if (authState.token) {
      try {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        const [appointmentsData, staffData, usersData] = await Promise.all([
          getAllAppointments(authState.token, {}),
          adminGetAllStaff(authState.token),
          adminGetAllUsers(authState.token)
        ]);
        setAppointments(appointmentsData);
        setStaffList(staffData.filter(s => ['physiotherapist', 'trainer', 'admin'].includes(s.role)));
        setUserList(usersData);
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
    setCurrentAppointmentData(initialAppointmentFormState);
    setCurrentAppointmentId(null);
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (appointment) => {
    setIsEditing(true);
    setCurrentAppointmentData({
      date: appointment.date,
      time: appointment.time ? appointment.time.substring(0,5) : '',
      staffId: appointment.staffId || (appointment.professional?.id || ''),
      userId: appointment.userId || (appointment.client?.id || ''),
      notes: appointment.notes || '',
      status: appointment.status || 'disponível',
      durationMinutes: appointment.durationMinutes || 60,
      totalCost: appointment.totalCost === null || appointment.totalCost === undefined ? '' : String(appointment.totalCost),
    });
    setCurrentAppointmentId(appointment.id);
    setModalError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalError('');
    setCurrentAppointmentData(initialAppointmentFormState); // Resetar form ao fechar
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentAppointmentData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setModalError('');
    setError('');
    setSuccessMessage('');

    const dataToSend = {
      ...currentAppointmentData,
      staffId: currentAppointmentData.staffId ? parseInt(currentAppointmentData.staffId, 10) : null,
      userId: currentAppointmentData.userId ? parseInt(currentAppointmentData.userId, 10) : null,
      durationMinutes: parseInt(currentAppointmentData.durationMinutes, 10),
      time: currentAppointmentData.time.length === 5 ? `${currentAppointmentData.time}:00` : currentAppointmentData.time,
      totalCost: (currentAppointmentData.userId && currentAppointmentData.totalCost !== '' && !isNaN(parseFloat(currentAppointmentData.totalCost))) ? parseFloat(currentAppointmentData.totalCost) : null,
    };

    if (!dataToSend.staffId) {
        setModalError("Por favor, selecione um profissional.");
        setFormLoading(false);
        return;
    }
    if (dataToSend.userId && (dataToSend.totalCost === null || dataToSend.totalCost <= 0)) {
        setModalError("Custo total (positivo) é obrigatório ao atribuir um cliente.");
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
        await adminUpdateAppointment(currentAppointmentId, dataToSend, authState.token);
        setSuccessMessage('Consulta atualizada com sucesso!');
      } else {
        await adminCreateAppointment(dataToSend, authState.token);
        setSuccessMessage('Consulta criada com sucesso! Pagamento de sinal pendente (se aplicável).');
      }
      fetchPageData();
      handleCloseModal();
    } catch (err) {
      setModalError(err.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} consulta.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm(`Tens a certeza que queres eliminar a consulta ID ${appointmentId}?`)) {
      return;
    }
    setError('');
    setSuccessMessage('');
    try {
      await adminDeleteAppointment(appointmentId, authState.token);
      setSuccessMessage('Consulta eliminada com sucesso.');
      fetchPageData();
    } catch (err) {
      setError(err.message || 'Falha ao eliminar consulta.');
    }
  };

  if (loading && !showModal) {
    return <PageContainer><LoadingText>A carregar lista de consultas...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <TopActionsContainer>
        <Title>Gerir Consultas</Title>
        <CreateButtonStyled onClick={handleOpenCreateModal}>Criar Nova Consulta</CreateButtonStyled>
      </TopActionsContainer>
      <Link to="/admin/dashboard" style={{color: '#D4AF37', marginBottom: '20px', display: 'inline-block', textDecoration:'none'}}>‹ Voltar ao Painel Admin</Link>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

      <Table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Data</th>
            <th>Hora</th>
            <th>Duração (min)</th>
            <th>Profissional</th>
            <th>Cliente</th>
            <th>Custo Total</th>
            <th>Sinal Pago?</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length > 0 ? appointments.map(appt => (
            <tr key={appt.id}>
              <td>{appt.id}</td>
              <td>{new Date(appt.date).toLocaleDateString('pt-PT')}</td>
              <td>{appt.time ? appt.time.substring(0,5) : 'N/A'}</td>
              <td>{appt.durationMinutes}</td>
              <td>{appt.professional ? `${appt.professional.firstName} ${appt.professional.lastName}` : 'N/A'}</td>
              <td>{appt.client ? `${appt.client.firstName} ${appt.client.lastName}` : '(Vago)'}</td>
              <td>{appt.totalCost ? `${Number(appt.totalCost).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}` : 'N/A'}</td>
              <td>{appt.userId ? (appt.signalPaid ? 'Sim' : 'Não') : 'N/A'}</td>
              <td>{appt.status ? appt.status.replace(/_/g, ' ') : 'N/A'}</td>
              <td>
                <ActionButton secondary onClick={() => handleOpenEditModal(appt)}>
                  Editar
                </ActionButton>
                <ActionButton danger onClick={() => handleDeleteAppointment(appt.id)}>
                  Eliminar
                </ActionButton>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>Nenhuma consulta encontrada.</td>
            </tr>
          )}
        </tbody>
      </Table>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}>&times;</CloseButton>
            <ModalTitle>{isEditing ? 'Editar Consulta' : 'Criar Nova Consulta'}</ModalTitle>
            {modalError && <ErrorText style={{marginBottom: '15px'}}>{modalError}</ErrorText>}
            <ModalForm onSubmit={handleFormSubmit}>
              <ModalLabel htmlFor="date">Data*</ModalLabel>
              <ModalInput type="date" name="date" id="date" value={currentAppointmentData.date} onChange={handleFormChange} required />

              <ModalLabel htmlFor="time">Hora (HH:MM)*</ModalLabel>
              <ModalInput type="time" name="time" id="time" value={currentAppointmentData.time} onChange={handleFormChange} required />

              <ModalLabel htmlFor="durationMinutes">Duração (minutos)*</ModalLabel>
              <ModalInput type="number" name="durationMinutes" id="durationMinutes" value={currentAppointmentData.durationMinutes} onChange={handleFormChange} required min="1" />

              <ModalLabel htmlFor="staffId">Profissional*</ModalLabel>
              <ModalSelect name="staffId" id="staffId" value={currentAppointmentData.staffId} onChange={handleFormChange} required>
                <option value="">Selecione um profissional</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.firstName} {staff.lastName} ({staff.role})</option>
                ))}
              </ModalSelect>

              <ModalLabel htmlFor="userId">Cliente (Opcional)</ModalLabel>
              <ModalSelect name="userId" id="userId" value={currentAppointmentData.userId} onChange={handleFormChange}>
                <option value="">Nenhum (Horário Vago / Disponível)</option>
                {userList.map(user => (
                  <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.email})</option>
                ))}
              </ModalSelect>

              {/* Campo Custo Total - aparece se um cliente for selecionado */}
              {currentAppointmentData.userId && (
                <>
                  <ModalLabel htmlFor="totalCost">Custo Total da Consulta (EUR)*</ModalLabel>
                  <ModalInput
                    type="number"
                    name="totalCost"
                    id="totalCost"
                    value={currentAppointmentData.totalCost}
                    onChange={handleFormChange}
                    placeholder="Ex: 50.00"
                    step="0.01"
                    min="0.01"
                    required={!!currentAppointmentData.userId}
                  />
                </>
              )}

              <ModalLabel htmlFor="status">Status*</ModalLabel>
              <ModalSelect name="status" id="status" value={currentAppointmentData.status} onChange={handleFormChange} required>
                {appointmentStatuses.map(statusValue => ( // Alterado 'status' para 'statusValue' para evitar conflito de nome
                  <option key={statusValue} value={statusValue}>{statusValue.charAt(0).toUpperCase() + statusValue.slice(1).replace(/_/g, ' ')}</option>
                ))}
              </ModalSelect>

              <ModalLabel htmlFor="notes">Notas Adicionais</ModalLabel>
              <ModalTextarea name="notes" id="notes" value={currentAppointmentData.notes} onChange={handleFormChange} />

              <ModalActions>
                <ModalButton type="button" onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}>
                  {formLoading ? 'A guardar...' : (isEditing ? 'Guardar Alterações' : 'Criar Consulta')}
                </ModalButton>
              </ModalActions>
            </ModalForm>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default AdminManageAppointmentsPage;