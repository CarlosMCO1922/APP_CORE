// src/pages/admin/AdminManageAppointmentsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import {
    getAllAppointments,
    adminCreateAppointment,
    adminUpdateAppointment,
    adminDeleteAppointment
} from '../../services/appointmentService';
import { adminGetAllStaff } from '../../services/staffService';
import { adminGetAllUsers } from '../../services/userService';
import { FaCalendarCheck, FaPlus, FaEdit, FaTrashAlt, FaTimes } from 'react-icons/fa';
import BackArrow from '../../components/BackArrow';

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
    background-color: ${({ theme }) => theme.colors.primaryHover};
    transform: translateY(-2px);
  }
  @media (max-width: 480px) {
    width: 100%; 
    justify-content: center;
    font-size: 1rem;
    padding: 12px;
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
    background-color: ${({ theme }) => theme.colors.scrollbarTrackBg};
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.scrollbarThumbBg};
    border-radius: 4px;
  }
`;

const Table = styled.table`
  width: 100%;
  min-width: 1000px; /* Ajustar conforme necessidade para scroll */
  border-collapse: collapse;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  
  th, td {
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
    padding: 10px 12px;
    text-align: left;
    font-size: 0.85rem; 
    white-space: nowrap;
  }
  th {
    background-color: ${({ theme }) => theme.colors.tableHeaderBg};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    position: sticky; 
    top: 0; 
    z-index: 1;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover { background-color: ${({ theme }) => theme.colors.hoverRowBg}; }

  td.actions-cell { 
    white-space: nowrap; 
    text-align: right;
  }
  @media (max-width: 768px) {
    th, td { padding: 8px 10px; font-size: 0.8rem; }
  }
`;

const ActionButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const ActionButton = styled.button`
  padding: 6px 10px;
  font-size: 0.8rem;
  border-radius: 5px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease, transform 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  
  background-color: ${props => {
    if (props.danger) return props.theme.colors.error;
    if (props.secondary) return props.theme.colors.buttonSecondaryBg;
    return props.theme.colors.primary;
  }};
  color: ${props => (props.danger || props.secondary) ? 'white' : props.theme.colors.textDark};

  &:hover:not(:disabled) {
    opacity: 0.85;
    transform: translateY(-1px);
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.disabledBg};
    color: ${({ theme }) => theme.colors.disabledText};
    cursor: not-allowed;
  }
`;

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
  background-color: ${({ theme }) => theme.colors.overlayBg}; display: flex;
  justify-content: center; align-items: center;
  z-index: 1050; padding: 20px;
`;
const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker};
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
  padding: 10px 14px; background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.inputText}; font-size: 0.95rem;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing}; }
`;
const ModalTextarea = styled.textarea`
  padding: 10px 14px; background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.inputText}; font-size: 0.95rem;
  width: 100%; min-height: 80px; resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing}; }
`;
const ModalSelect = styled.select`
  padding: 10px 14px; background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.inputText}; font-size: 0.95rem;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing}; }
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
  color: ${({ theme }) => theme.colors.textMuted}; font-size: 1.8rem; cursor: pointer; line-height: 1; padding: 8px;
  transition: color 0.2s, transform 0.2s; border-radius: 50%;
  &:hover { color: ${({ theme }) => theme.colors.textMain}; transform: scale(1.1); }
`;
const ModalErrorText = styled.p` 
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.errorBg};
  border-color: ${({ theme }) => theme.colors.error};
  margin: -5px 0 10px 0; 
  text-align: left;      
  font-size: 0.8rem;    
  padding: 8px 12px;     
`;

const initialAppointmentFormState = {
  date: '', time: '', staffId: '', userId: '', 
  notes: '', status: 'disponível', durationMinutes: 60, totalCost: '',
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
        setLoading(true); setError(''); setSuccessMessage('');
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

  useEffect(() => { fetchPageData(); }, [fetchPageData]);

  const handleOpenCreateModal = () => {
    setIsEditing(false); setCurrentAppointmentData(initialAppointmentFormState);
    setCurrentAppointmentId(null); setModalError(''); setShowModal(true);
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
    setCurrentAppointmentId(appointment.id); setModalError(''); setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false); setCurrentAppointmentData(initialAppointmentFormState);
    setCurrentAppointmentId(null); setModalError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentAppointmentData(prev => {
        const newState = { ...prev, [name]: value };
        if (name === 'userId' && value === '') { newState.totalCost = ''; }
        return newState;
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true); setModalError(''); setError(''); setSuccessMessage('');
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
        setFormLoading(false); return;
    }
    if (dataToSend.userId && (dataToSend.totalCost === null || dataToSend.totalCost <= 0)) {
        setModalError("Custo total (positivo) é obrigatório ao atribuir um cliente.");
        setFormLoading(false); return;
    }
    if (isNaN(dataToSend.durationMinutes) || dataToSend.durationMinutes <= 0) {
        setModalError("Duração deve ser um número positivo.");
        setFormLoading(false); return;
    }

    try {
      if (isEditing) {
        await adminUpdateAppointment(currentAppointmentId, dataToSend, authState.token);
        setSuccessMessage('Consulta atualizada com sucesso!');
      } else {
        await adminCreateAppointment(dataToSend, authState.token);
        setSuccessMessage('Consulta criada com sucesso! Pagamento de sinal pendente (se aplicável).');
      }
      fetchPageData(); handleCloseModal();
    } catch (err) {
      setModalError(err.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} consulta.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm(`Tens a certeza que queres eliminar a consulta ID ${appointmentId}?`)) return;
    setError(''); setSuccessMessage('');
    try {
      await adminDeleteAppointment(appointmentId, authState.token);
      setSuccessMessage('Consulta eliminada com sucesso.');
      fetchPageData();
    } catch (err) {
      setError(err.message || 'Falha ao eliminar consulta.');
    }
  };

  if (loading && !showModal) {
    return <PageContainer><LoadingText>A carregar consultas...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <HeaderContainer>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackArrow to="/admin/dashboard" />
          <Title>Consultas</Title>
        </div>
        <CreateButton onClick={handleOpenCreateModal}><FaPlus /> Nova Consulta</CreateButton>
      </HeaderContainer>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Hora</th>
              <th>Duração</th>
              <th>Profissional</th>
              <th>Cliente</th>
              <th>Custo</th>
              <th>Sinal?</th>
              <th>Status</th>
              <th className="actions-cell">Ações</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length > 0 ? appointments.map(appt => (
              <tr key={appt.id}>
                <td>{appt.id}</td>
                <td>{new Date(appt.date).toLocaleDateString('pt-PT')}</td>
                <td>{appt.time ? appt.time.substring(0,5) : 'N/A'}</td>
                <td>{appt.durationMinutes} min</td>
                <td>{appt.professional ? `${appt.professional.firstName} ${appt.professional.lastName}` : 'N/A'}</td>
                <td>{appt.client ? `${appt.client.firstName} ${appt.client.lastName}` : '(Vago)'}</td>
                <td>{appt.totalCost ? `${Number(appt.totalCost).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}` : 'N/A'}</td>
                <td>{appt.userId ? (appt.signalPaid ? 'Sim' : 'Não') : 'N/A'}</td>
                <td>{appt.status ? appt.status.replace(/_/g, ' ') : 'N/A'}</td>
                <td className="actions-cell">
                  <ActionButtonContainer>
                    <ActionButton secondary onClick={() => handleOpenEditModal(appt)}>
                      <FaEdit /> Editar
                    </ActionButton>
                    <ActionButton danger onClick={() => handleDeleteAppointment(appt.id)}>
                      <FaTrashAlt /> Eliminar
                    </ActionButton>
                  </ActionButtonContainer>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>Nenhuma consulta encontrada.</td></tr>
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}><FaTimes /></CloseButton>
            <ModalTitle>{isEditing ? 'Editar Consulta' : 'Criar Nova Consulta'}</ModalTitle>
            {modalError && <ModalErrorText>{modalError}</ModalErrorText>}
            <ModalForm onSubmit={handleFormSubmit}>
              <ModalLabel htmlFor="dateAppt">Data*</ModalLabel>
              <ModalInput type="date" name="date" id="dateAppt" value={currentAppointmentData.date} onChange={handleFormChange} required />

              <ModalLabel htmlFor="timeAppt">Hora (HH:MM)*</ModalLabel>
              <ModalInput type="time" name="time" id="timeAppt" value={currentAppointmentData.time} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="durationMinutesAppt">Duração (minutos)*</ModalLabel>
              <ModalInput type="number" name="durationMinutes" id="durationMinutesAppt" value={currentAppointmentData.durationMinutes} onChange={handleFormChange} required min="1" />

              <ModalLabel htmlFor="staffIdAppt">Profissional*</ModalLabel>
              <ModalSelect name="staffId" id="staffIdAppt" value={currentAppointmentData.staffId} onChange={handleFormChange} required>
                <option value="">Selecione um profissional</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.firstName} {staff.lastName} ({staff.role})</option>
                ))}
              </ModalSelect>

              <ModalLabel htmlFor="userIdAppt">Cliente (Opcional)</ModalLabel>
              <ModalSelect name="userId" id="userIdAppt" value={currentAppointmentData.userId} onChange={handleFormChange}>
                <option value="">Nenhum (Horário Vago)</option>
                {userList.map(user => (
                  <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.email})</option>
                ))}
              </ModalSelect>
              
              {currentAppointmentData.userId && currentAppointmentData.userId !== '' && (
                <>
                  <ModalLabel htmlFor="totalCostAppt">Custo Total (EUR)*</ModalLabel>
                  <ModalInput
                    type="number" name="totalCost" id="totalCostAppt"
                    value={currentAppointmentData.totalCost} onChange={handleFormChange}
                    placeholder="Ex: 50.00" step="0.01" min="0.01"
                  />
                </>
              )}
              
              <ModalLabel htmlFor="statusAppt">Status*</ModalLabel>
              <ModalSelect name="status" id="statusAppt" value={currentAppointmentData.status} onChange={handleFormChange} required>
                {appointmentStatuses.map(statusValue => (
                  <option key={statusValue} value={statusValue}>{statusValue.charAt(0).toUpperCase() + statusValue.slice(1).replace(/_/g, ' ')}</option>
                ))}
              </ModalSelect>

              <ModalLabel htmlFor="notesAppt">Notas Adicionais</ModalLabel>
              <ModalTextarea name="notes" id="notesAppt" value={currentAppointmentData.notes} onChange={handleFormChange} />

              <ModalActions>
                <ModalButton type="button" secondary onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}>
                  <FaCalendarCheck style={{marginRight: '8px'}}/> {formLoading ? 'A guardar...' : (isEditing ? 'Guardar Alterações' : 'Criar Consulta')}
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