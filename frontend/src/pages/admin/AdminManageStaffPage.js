// src/pages/admin/AdminManageStaffPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { adminGetAllStaff, adminDeleteStaff, adminCreateStaff, adminUpdateStaff } from '../../services/staffService';
import { FaUserTie, FaPlus, FaEdit, FaTrashAlt, FaArrowLeft, FaTimes } from 'react-icons/fa';

// --- Styled Components (reutilizados e adaptados de AdminManageUsersPage) ---
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
    background-color: #303030;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    position: sticky; 
    left: 0; 
    z-index: 1;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover { background-color: #2c2c2c; }

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
    background-color: #404040;
    color: #777;
    cursor: not-allowed;
  }
`;

const MessageBaseStyles = css` // Usar css helper para estilos partilhados se necessário, ou definir individualmente
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

// O ModalErrorText já estava a usar ErrorText como base, o que é bom.
// Se ErrorText foi corrigido, ModalErrorText deve funcionar.
// const ModalErrorText = styled(ErrorText)\`margin: -5px 0 10px 0; text-align:left; font-size: 0.8rem; padding: 8px 12px;\`;
// No entanto, para garantir, vamos redefinir explicitamente se ainda der problemas:
const ModalErrorText = styled.p`
  ${MessageBaseStyles} // Herda os estilos base
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.errorBg};
  border-color: ${({ theme }) => theme.colors.error};
  margin: -5px 0 10px 0; // Sobrescreve margem
  text-align: left;      // Sobrescreve alinhamento
  font-size: 0.8rem;     // Sobrescreve tamanho da fonte
  padding: 8px 12px;     // Sobrescreve padding
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
        <Title>Gerir Equipa</Title>
        <CreateButton onClick={handleOpenCreateModal}><FaPlus /> Adicionar Membro</CreateButton>
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