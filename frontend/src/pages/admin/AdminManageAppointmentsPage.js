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

// --- Styled Components (Mantidos os mesmos) ---
const PageContainer = styled.div` /* ... */ `;
const Title = styled.h1` /* ... */ `;
const Table = styled.table` /* ... */ `;
const ActionButton = styled.button` /* ... */ `;
const TopActionsContainer = styled.div` /* ... */ `;
const CreateButtonStyled = styled.button` /* ... */ `;
const LoadingText = styled.p` /* ... */ `;
const ErrorText = styled.p` /* ... */ `;
const MessageText = styled.p` /* ... */ `;
const ModalOverlay = styled.div` /* ... */ `;
const ModalContent = styled.div` /* ... */ `;
const ModalTitle = styled.h2` /* ... */ `;
const ModalForm = styled.form` /* ... */ `;
const ModalLabel = styled.label` /* ... */ `;
const ModalInput = styled.input` /* ... */ `;
const ModalTextarea = styled.textarea` /* ... */ `;
const ModalSelect = styled.select` /* ... */ `;
const ModalActions = styled.div` /* ... */ `;
const ModalButton = styled.button` /* ... */ `;
const CloseButton = styled.button` /* ... */ `;
// COPIAR OS STYLED COMPONENTS DE UMA DAS VERSÕES ANTERIORES COMPLETAS DESTA PÁGINA

const initialAppointmentFormState = {
  date: '',
  time: '',
  staffId: '',
  userId: '',
  notes: '',
  status: 'disponível',
  durationMinutes: 60,
  totalCost: '', // Adicionado totalCost, inicializado como string vazia
};

// Os status válidos para o dropdown, incluindo o novo 'confirmada'
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
          getAllAppointments(authState.token, {}), // Passar filtros vazios ou os que já usavas
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
      time: appointment.time.substring(0,5),
      staffId: appointment.staffId || (appointment.professional?.id || ''),
      userId: appointment.userId || (appointment.client?.id || ''),
      notes: appointment.notes || '',
      status: appointment.status || 'disponível',
      durationMinutes: appointment.durationMinutes || 60,
      totalCost: appointment.totalCost === null || appointment.totalCost === undefined ? '' : String(appointment.totalCost), // Converter para string para o input
    });
    setCurrentAppointmentId(appointment.id);
    setModalError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalError('');
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
      staffId: parseInt(currentAppointmentData.staffId, 10),
      userId: currentAppointmentData.userId ? parseInt(currentAppointmentData.userId, 10) : null,
      durationMinutes: parseInt(currentAppointmentData.durationMinutes, 10),
      time: currentAppointmentData.time.length === 5 ? `${currentAppointmentData.time}:00` : currentAppointmentData.time,
      totalCost: currentAppointmentData.userId && currentAppointmentData.totalCost !== '' ? parseFloat(currentAppointmentData.totalCost) : null,
    };

    if (isNaN(dataToSend.staffId) || !dataToSend.staffId) {
        setModalError("Por favor, selecione um profissional.");
        setFormLoading(false);
        return;
    }
    if (dataToSend.userId && (dataToSend.totalCost === null || dataToSend.totalCost <= 0)) {
        setModalError("Custo total (positivo) é obrigatório ao atribuir um cliente para gerar o sinal.");
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
            <th>Duração</th>
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
              <td>{appt.time.substring(0,5)}</td>
              <td>{appt.durationMinutes} min</td>
              <td>{appt.professional ? `${appt.professional.firstName} ${appt.professional.lastName}` : 'N/A'}</td>
              <td>{appt.client ? `${appt.client.firstName} ${appt.client.lastName}` : '(Vago)'}</td>
              <td>{appt.totalCost ? `${Number(appt.totalCost).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}` : 'N/A'}</td>
              <td>{appt.userId ? (appt.signalPaid ? 'Sim' : 'Não') : 'N/A'}</td>
              <td>{appt.status.replace(/_/g, ' ')}</td>
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
              <td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>Nenhuma consulta encontrada.</td> {/* Ajustar colSpan */}
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
              <ModalLabel htmlFor="date">Data</ModalLabel>
              <ModalInput type="date" name="date" id="date" value={currentAppointmentData.date} onChange={handleFormChange} required />

              <ModalLabel htmlFor="time">Hora (HH:MM)</ModalLabel>
              <ModalInput type="time" name="time" id="time" value={currentAppointmentData.time} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="durationMinutes">Duração (minutos)</ModalLabel>
              <ModalInput type="number" name="durationMinutes" id="durationMinutes" value={currentAppointmentData.durationMinutes} onChange={handleFormChange} required min="1" />

              <ModalLabel htmlFor="staffId">Profissional</ModalLabel>
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
                  <ModalLabel htmlFor="totalCost">Custo Total da Consulta (EUR)</ModalLabel>
                  <ModalInput 
                    type="number" 
                    name="totalCost" 
                    id="totalCost" 
                    value={currentAppointmentData.totalCost} 
                    onChange={handleFormChange} 
                    placeholder="Ex: 50.00"
                    step="0.01" 
                    min="0.01" 
                    required={!!currentAppointmentData.userId} // Obrigatório se houver cliente
                  />
                </>
              )}
              
              <ModalLabel htmlFor="status">Status</ModalLabel>
              <ModalSelect name="status" id="status" value={currentAppointmentData.status} onChange={handleFormChange} required>
                {appointmentStatuses.map(status => (
                  <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}</option>
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