// src/pages/admin/AdminManageStaffPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components'; 
import { useAuth } from '../../context/AuthContext';
import { adminGetAllStaff, adminDeleteStaff, adminCreateStaff, adminUpdateStaff } from '../../services/staffService';
import { FaUserTie, FaPlus, FaEdit, FaTrashAlt, FaTimes } from 'react-icons/fa';
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
  border-collapse: collapse;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  
  th, td {
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
    padding: 10px 12px;
    text-align: left;
    font-size: 0.9rem;
    white-space: nowrap;
  }
  th {
    background-color: ${({ theme }) => theme.colors.tableHeaderBg};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    position: sticky; 
    left: 0; 
    z-index: 1;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover { background-color: ${({ theme }) => theme.colors.hoverRowBg}; }

  td:last-child { 
    white-space: normal; 
    text-align: right;
  }
   @media (max-width: 768px) {
    th, td {
      padding: 8px 10px;
      font-size: 0.85rem;
    }
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
  max-width: 500px; box-shadow: 0 8px 25px rgba(0,0,0,0.6);
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
const ModalInput = styled.input`
  padding: 10px 14px; background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); }
`;
const ModalSelect = styled.select`
  padding: 10px 14px; background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); }
`;
const ModalLabel = styled.label`
  font-size: 0.85rem; color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 4px; display: block; font-weight: 500;
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
const ModalErrorText = styled.p` // Baseado em ErrorText, mas com ajustes
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.errorBg};
  border-color: ${({ theme }) => theme.colors.error};
  margin: -5px 0 10px 0; 
  text-align: left;      
  font-size: 0.8rem;    
  padding: 8px 12px;     
`;

const initialStaffFormState = {
  firstName: '', lastName: '', email: '', password: '', role: 'employee',
};
const staffRoles = ['admin', 'trainer', 'physiotherapist', 'employee'];

const AdminManageStaffPage = () => {
  const { authState } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); 
  const [successMessage, setSuccessMessage] = useState(''); 

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStaffData, setCurrentStaffData] = useState(initialStaffFormState);
  const [currentStaffId, setCurrentStaffId] = useState(null);
  const [formLoading, setFormLoading] = useState(false); 
  const [modalError, setModalError] = useState(''); 

  const fetchStaff = useCallback(async () => {
    if (authState.token) {
      try {
        setLoading(true); setError(''); setSuccessMessage('');
        const data = await adminGetAllStaff(authState.token);
        setStaffList(data);
      } catch (err) {
        setError(err.message || 'Não foi possível carregar a equipa.');
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleOpenCreateModal = () => {
    setIsEditing(false); setCurrentStaffData(initialStaffFormState);
    setCurrentStaffId(null); setModalError(''); setShowModal(true);
  };

  const handleOpenEditModal = (staff) => {
    setIsEditing(true);
    setCurrentStaffData({
      firstName: staff.firstName, lastName: staff.lastName, email: staff.email,
      password: '', role: staff.role,
    });
    setCurrentStaffId(staff.id); setModalError(''); setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false); setCurrentStaffData(initialStaffFormState);
    setCurrentStaffId(null); setModalError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentStaffData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true); setModalError(''); setError(''); setSuccessMessage('');
    const dataToSend = { ...currentStaffData };

    if (isEditing && !dataToSend.password) {
      delete dataToSend.password;
    } else if (!isEditing && (!dataToSend.password || dataToSend.password.length < 6)) {
      setModalError("Password é obrigatória (mínimo 6 caracteres) para criar novo membro.");
      setFormLoading(false); return;
    } else if (isEditing && dataToSend.password && dataToSend.password.length < 6) {
      setModalError("A nova password deve ter pelo menos 6 caracteres.");
      setFormLoading(false); return;
    }
    if (!dataToSend.role) {
        setModalError("O papel (role) é obrigatório.");
        setFormLoading(false); return;
    }

    try {
      if (isEditing) {
        await adminUpdateStaff(currentStaffId, dataToSend, authState.token);
        setSuccessMessage('Membro da equipa atualizado com sucesso!');
      } else {
        await adminCreateStaff(dataToSend, authState.token);
        setSuccessMessage('Membro da equipa criado com sucesso!');
      }
      fetchStaff(); handleCloseModal();
    } catch (err) {
      setModalError(err.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} membro da equipa.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId, staffEmail) => {
    if (authState.user?.id === staffId) {
        alert("Não pode eliminar a sua própria conta de administrador/staff a partir daqui.");
        return;
    }
    if (!window.confirm(`Tens a certeza que queres eliminar o membro da equipa ${staffEmail} (ID: ${staffId})? Esta ação não pode ser desfeita.`)) return;
    setError(''); setSuccessMessage('');
    try {
      await adminDeleteStaff(staffId, authState.token);
      setSuccessMessage('Membro da equipa eliminado com sucesso.');
      fetchStaff();
    } catch (err) {
      setError(err.message || 'Falha ao eliminar membro da equipa.');
    }
  };
  
  if (loading && !showModal) {
    return <PageContainer><LoadingText>A carregar equipa...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <HeaderContainer>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackArrow to="/admin/dashboard" />
          <Title>Equipa</Title>
        </div>
        <CreateButton onClick={handleOpenCreateModal}><FaPlus /> Adicionar Membro</CreateButton>
      </HeaderContainer>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Apelido</th>
              <th>Email</th>
              <th>Papel</th>
              <th style={{textAlign: 'right'}}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {staffList.length > 0 ? staffList.map(staff => (
              <tr key={staff.id}>
                <td>{staff.id}</td>
                <td>{staff.firstName}</td>
                <td>{staff.lastName}</td>
                <td>{staff.email}</td>
                <td>{staff.role}</td>
                <td>
                  <ActionButtonContainer>
                    <ActionButton secondary onClick={() => handleOpenEditModal(staff)}>
                      <FaEdit /> Editar
                    </ActionButton>
                    <ActionButton danger onClick={() => handleDeleteStaff(staff.id, staff.email)} disabled={authState.user?.id === staff.id}>
                      <FaTrashAlt /> Eliminar
                    </ActionButton>
                  </ActionButtonContainer>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Nenhum membro da equipa encontrado.</td></tr>
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}> 
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}><FaTimes /></CloseButton>
            <ModalTitle>{isEditing ? 'Editar Membro da Equipa' : 'Novo Membro da Equipa'}</ModalTitle>
            {modalError && <ModalErrorText>{modalError}</ModalErrorText>}
            <ModalForm onSubmit={handleFormSubmit}>
              <ModalLabel htmlFor="modalFirstName">Nome*</ModalLabel>
              <ModalInput type="text" name="firstName" id="modalFirstName" value={currentStaffData.firstName} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="modalLastName">Apelido*</ModalLabel>
              <ModalInput type="text" name="lastName" id="modalLastName" value={currentStaffData.lastName} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="modalEmail">Email*</ModalLabel>
              <ModalInput type="email" name="email" id="modalEmail" value={currentStaffData.email} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="modalPassword">Password {isEditing ? '(Deixar em branco para não alterar)' : '(Mín. 6 caracteres)*'}</ModalLabel>
              <ModalInput type="password" name="password" id="modalPassword" value={currentStaffData.password} onChange={handleFormChange} placeholder={isEditing ? 'Nova password (opcional)' : 'Mínimo 6 caracteres'} required={!isEditing} autoComplete="new-password"/>

              <ModalLabel htmlFor="modalRole">Papel (Role)*</ModalLabel>
              <ModalSelect name="role" id="modalRole" value={currentStaffData.role} onChange={handleFormChange} required>
                {staffRoles.map(role => (
                  <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                ))}
              </ModalSelect>

              <ModalActions>
                <ModalButton type="button" secondary onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}>
                  <FaUserTie style={{marginRight: '8px'}} /> {formLoading ? 'A guardar...' : (isEditing ? 'Guardar Alterações' : 'Adicionar Membro')}
                </ModalButton>
              </ModalActions>
            </ModalForm>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default AdminManageStaffPage;