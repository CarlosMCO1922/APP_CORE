// src/pages/admin/AdminManageStaffPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { adminGetAllStaff, adminDeleteStaff, adminCreateStaff, adminUpdateStaff } from '../../services/staffService';

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: #1A1A1A; color: #E0E0E0; min-height: 100vh;
  padding: 20px 40px; font-family: 'Inter', sans-serif;
`;
const Title = styled.h1` font-size: 2.2rem; color: #D4AF37; margin-bottom: 25px; `;
const Table = styled.table`
  width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #252525;
  border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  th, td { border-bottom: 1px solid #383838; padding: 12px 15px; text-align: left; font-size: 0.95rem; }
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
const ModalContent = styled.div` background-color: #2C2C2C; padding: 30px 40px; border-radius: 10px; width: 100%; max-width: 500px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); position: relative; max-height: 90vh; overflow-y: auto; `;
const ModalTitle = styled.h2` color: #D4AF37; margin-top: 0; margin-bottom: 25px; font-size: 1.6rem; `;
const ModalForm = styled.form` display: flex; flex-direction: column; gap: 15px; `;
const ModalLabel = styled.label` font-size: 0.9rem; color: #b0b0b0; margin-bottom: 5px; display: block; `;
const ModalInput = styled.input` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; &:focus { outline: none; border-color: #D4AF37; } `;
const ModalSelect = styled.select`
  padding: 10px 12px; background-color: #383838; border: 1px solid #555;
  border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%;
  &:focus { outline: none; border-color: #D4AF37; }
`;
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

const initialStaffFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'employee',
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
        setLoading(true);
        setError('');
        setSuccessMessage('');
        const data = await adminGetAllStaff(authState.token);
        setStaffList(data);
      } catch (err) {
        setError(err.message || 'Não foi possível carregar a equipa.');
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentStaffData(initialStaffFormState);
    setCurrentStaffId(null);
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (staff) => {
    setIsEditing(true);
    setCurrentStaffData({
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      password: '', 
      role: staff.role,
    });
    setCurrentStaffId(staff.id);
    setModalError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentStaffData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setModalError('');
    setError(''); 
    setSuccessMessage('');

    const dataToSend = { ...currentStaffData };
    if (isEditing && !dataToSend.password) {
      delete dataToSend.password;
    } else if (!isEditing && (!dataToSend.password || dataToSend.password.length < 6)) {
      setModalError("Password é obrigatória (mínimo 6 caracteres) para criar novo membro.");
      setFormLoading(false);
      return;
    } else if (isEditing && dataToSend.password && dataToSend.password.length < 6) {
      setModalError("A nova password deve ter pelo menos 6 caracteres.");
      setFormLoading(false);
      return;
    }
    if (!dataToSend.role) {
        setModalError("O papel (role) é obrigatório.");
        setFormLoading(false);
        return;
    }

    try {
      if (isEditing) {
        await adminUpdateStaff(currentStaffId, dataToSend, authState.token);
        setSuccessMessage('Membro da equipa atualizado com sucesso!');
      } else {
        await adminCreateStaff(dataToSend, authState.token);
        setSuccessMessage('Membro da equipa criado com sucesso!');
      }
      fetchStaff();
      handleCloseModal();
    } catch (err) {
      setModalError(err.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} membro da equipa.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId, staffEmail) => {
    if (authState.user?.id === staffId) { // Usa authState.user.id que é o ID do staff logado
        alert("Não pode eliminar a sua própria conta de administrador/staff a partir daqui.");
        return;
    }
    if (!window.confirm(`Tens a certeza que queres eliminar o membro da equipa ${staffEmail} (ID: ${staffId})? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setError('');
    setSuccessMessage('');
    try {
      await adminDeleteStaff(staffId, authState.token);
      setSuccessMessage('Membro da equipa eliminado com sucesso.');
      fetchStaff();
    } catch (err) {
      setError(err.message || 'Falha ao eliminar membro da equipa.');
    }
  };

  if (loading && !showModal) {
    return <PageContainer><LoadingText>A carregar lista da equipa...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <TopActionsContainer>
        <Title>Gerir Equipa (Staff)</Title>
        <CreateButtonStyled onClick={handleOpenCreateModal}>Adicionar Membro</CreateButtonStyled>
      </TopActionsContainer>
      <Link to="/admin/dashboard" style={{color: '#D4AF37', marginBottom: '20px', display: 'inline-block', textDecoration:'none'}}>‹ Voltar ao Painel Admin</Link>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

      <Table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Apelido</th>
            <th>Email</th>
            <th>Papel (Role)</th>
            <th>Ações</th>
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
                <ActionButton secondary onClick={() => handleOpenEditModal(staff)}>
                  Editar
                </ActionButton>
                <ActionButton 
                  danger 
                  onClick={() => handleDeleteStaff(staff.id, staff.email)}
                  disabled={authState.user?.id === staff.id}
                >
                  Eliminar
                </ActionButton>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Nenhum membro da equipa encontrado.</td>
            </tr>
          )}
        </tbody>
      </Table>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}>&times;</CloseButton>
            <ModalTitle>{isEditing ? 'Editar Membro da Equipa' : 'Adicionar Novo Membro'}</ModalTitle>
            {modalError && <ErrorText style={{marginBottom: '15px'}}>{modalError}</ErrorText>}
            <ModalForm onSubmit={handleFormSubmit}>
              <ModalLabel htmlFor="firstName">Nome</ModalLabel>
              <ModalInput type="text" name="firstName" id="firstName" value={currentStaffData.firstName} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="lastName">Apelido</ModalLabel>
              <ModalInput type="text" name="lastName" id="lastName" value={currentStaffData.lastName} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="email">Email</ModalLabel>
              <ModalInput type="email" name="email" id="email" value={currentStaffData.email} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="password">Password {isEditing ? '(Deixar em branco para não alterar)' : '(Obrigatória)'}</ModalLabel>
              <ModalInput type="password" name="password" id="password" value={currentStaffData.password} onChange={handleFormChange} placeholder={isEditing ? '' : 'Mínimo 6 caracteres'} required={!isEditing} autoComplete="new-password" />

              <ModalLabel htmlFor="role">Papel (Role)</ModalLabel>
              <ModalSelect name="role" id="role" value={currentStaffData.role} onChange={handleFormChange} required>
                {staffRoles.map(role => (
                  <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                ))}
              </ModalSelect>

              <ModalActions>
                <ModalButton type="button" onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}>
                  {formLoading ? 'A guardar...' : (isEditing ? 'Guardar Alterações' : 'Adicionar Membro')}
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