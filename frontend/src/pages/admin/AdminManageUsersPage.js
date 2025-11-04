// src/pages/admin/AdminManageUsersPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { css, useTheme } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import {
    adminGetAllUsers,
    adminCreateUser,
    adminUpdateUser,
    adminDeleteUser
} from '../../services/userService';
import { FaPlus, FaEdit, FaTrashAlt, FaArrowLeft, FaTimes, FaEye, FaUserPlus } from 'react-icons/fa';



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
    background-color: ${({ theme }) => theme.colors.primaryHover}; // Lighter gold for hover
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
    color: ${({ theme }) => theme.colors.textMain};
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
  background-color: ${({ theme }) => theme.colors.cardBackground};

  &::-webkit-scrollbar {
    height: 8px;
    background-color: ${({ theme }) => theme.colors.cardBackground};
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.buttonSecondaryBg};
    border-radius: 4px;
  }
`;

const Table = styled.table`
  width: 100%;
  min-width: 800px; /* Largura mínima para scroll horizontal */
  border-collapse: collapse;
  
  th, td {
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
    padding: 10px 12px;
    text-align: left;
    font-size: 0.85rem;
    white-space: nowrap;
    vertical-align: middle;
  }
  th {
    background-color: ${({ theme }) => theme.colors.cardBackground};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  tbody tr:hover { /* tbody adicionado para especificidade */
    background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
  }
  tr:last-child td { border-bottom: none; }

  td.actions-cell { 
    white-space: nowrap; 
    text-align: right;
    min-width: 280px; /* Espaço para botões */
  }
  @media (max-width: 768px) {
    th, td { padding: 8px 10px; font-size: 0.8rem; }
    td.actions-cell { min-width: 260px; }
  }
`;

const ActionButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: nowrap;
`;

const ActionButton = styled.button`
  padding: 6px 10px;
  font-size: 0.8rem; /* Ajustado para consistência */
  border-radius: 5px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease, transform 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  
  background-color: ${props => {
    if (props.danger) return props.theme.colors.error;
    if (props.details) return props.theme.colors.info || '#17a2b8'; 
    return props.theme.colors.buttonSecondaryBg;
  }};
  color: ${props => (props.danger ? 'white' : (props.details ? 'white' : props.theme.colors.textMain))};

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
  font-style: italic;
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
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: clamp(25px, 4vw, 35px);
  border-radius: 10px; width: 100%;
  max-width: 550px; box-shadow: 0 8px 25px rgba(0,0,0,0.6);
  position: relative; max-height: 90vh; overflow-y: auto;
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
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
  padding: 10px 14px; background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); }
`;
const ModalCheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
  margin-bottom: 5px;
`;
const ModalCheckbox = styled.input`
  width: auto; /* Para não ocupar 100% */
  margin-right: 5px;
  accent-color: ${({ theme }) => theme.colors.primary}; /* Estiliza a cor do check */
`;

const ModalActions = styled.div`
  display: flex; flex-direction: column; gap: 10px;
  margin-top: 25px; padding-top: 15px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  @media (min-width: 480px) { flex-direction: row; justify-content: flex-end; }
`;
const ModalButton = styled.button` /* Usar este como base para botões do modal */
  padding: 10px 18px;
  font-size: 0.9rem;
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease, transform 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 500;
  width: 100%;
  @media (min-width: 480px) { width: auto; }

  background-color: ${props => {
    if (props.danger) return props.theme.colors.error;
    if (props.secondary) return props.theme.colors.buttonSecondaryBg;
    return props.theme.colors.primary;
  }};
  color: ${props => (props.danger ? 'white' : (props.secondary ? props.theme.colors.textMain : props.theme.colors.textDark))};

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.disabledBg};
    color: ${({ theme }) => theme.colors.disabledText};
    cursor: not-allowed;
  }
`;
const CloseButton = styled.button`
  position: absolute; top: 15px; right: 15px; background: transparent; border: none;
  color: ${({ theme }) => theme.colors.textMuted}; font-size: 1.8rem; cursor: pointer; line-height: 1; padding: 5px;
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

const initialUserFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  isAdmin: false,
};

const AdminManageUsersPage = () => {
  const theme = useTheme();
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(initialUserFormState);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchUsers = useCallback(async () => {
    if (authState.token) {
      setLoading(true);
      setError('');
      try {
        const data = await adminGetAllUsers(authState.token);
        setUsers(data);
      } catch (err) {
        setError(err.message || 'Não foi possível carregar os utilizadores.');
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentUserData(initialUserFormState);
    setCurrentUserId(null);
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (user) => {
    setIsEditing(true);
    setCurrentUserData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      confirmPassword: '',
      isAdmin: user.isAdmin || false,
    });
    setCurrentUserId(user.id);
    setModalError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentUserData(initialUserFormState);
    setCurrentUserId(null);
    setModalError('');
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentUserData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setModalError('');
    setError('');
    setSuccessMessage('');

    if (!isEditing && currentUserData.password !== currentUserData.confirmPassword) {
      setModalError('As passwords não coincidem.');
      setFormLoading(false);
      return;
    }
    if (isEditing && currentUserData.password && currentUserData.password !== currentUserData.confirmPassword) {
      setModalError('As novas passwords não coincidem.');
      setFormLoading(false);
      return;
    }

    const userData = {
      firstName: currentUserData.firstName,
      lastName: currentUserData.lastName,
      email: currentUserData.email,
      isAdmin: currentUserData.isAdmin,
    };
    if (currentUserData.password) { 
      userData.password = currentUserData.password;
    }

    try {
      if (isEditing) {
        await adminUpdateUser(currentUserId, userData, authState.token);
        setSuccessMessage('Utilizador atualizado com sucesso!');
      } else {
        await adminCreateUser(userData, authState.token);
        setSuccessMessage('Utilizador criado com sucesso!');
      }
      fetchUsers();
      handleCloseModal();
    } catch (err) {
      setModalError(err.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} utilizador.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(`Tens a certeza que queres eliminar o utilizador ID ${userId}?`)) return;
    setError('');
    setSuccessMessage('');
    try {
      await adminDeleteUser(userId, authState.token);
      setSuccessMessage('Utilizador eliminado com sucesso.');
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Falha ao eliminar utilizador.');
    }
  };

  if (loading && !showModal) {
    return <PageContainer><LoadingText>A carregar utilizadores...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <HeaderContainer>
        <Title>Gerir Clientes (Utilizadores)</Title>
        <CreateButton onClick={handleOpenCreateModal}><FaUserPlus /> Novo Cliente</CreateButton>
      </HeaderContainer>
      <BackLink to="/admin/dashboard">←</BackLink>

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
              <th>Admin?</th>
              <th className="actions-cell">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.firstName}</td>
                <td>{user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.isAdmin ? 'Sim' : 'Não'}</td>
                <td className="actions-cell">
                  <ActionButtonContainer>
                    <ActionButton
                      details
                      onClick={() => navigate(`/admin/users/${user.id}/details`)}
                    >
                      <FaEye /> Detalhes
                    </ActionButton>
                    <ActionButton onClick={() => handleOpenEditModal(user)}>
                      <FaEdit /> Editar
                    </ActionButton>
                    <ActionButton danger onClick={() => handleDeleteUser(user.id)}>
                      <FaTrashAlt /> Eliminar
                    </ActionButton>
                  </ActionButtonContainer>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Nenhum utilizador encontrado.</td></tr>
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}><FaTimes /></CloseButton>
            <ModalTitle>{isEditing ? 'Editar Utilizador' : 'Criar Novo Utilizador'}</ModalTitle>
            {modalError && <ModalErrorText>{modalError}</ModalErrorText>}
            <ModalForm onSubmit={handleFormSubmit}>
              <ModalLabel htmlFor="firstNameModal">Nome*</ModalLabel>
              <ModalInput type="text" name="firstName" id="firstNameModal" value={currentUserData.firstName} onChange={handleFormChange} required />

              <ModalLabel htmlFor="lastNameModal">Apelido*</ModalLabel>
              <ModalInput type="text" name="lastName" id="lastNameModal" value={currentUserData.lastName} onChange={handleFormChange} required />

              <ModalLabel htmlFor="emailModal">Email*</ModalLabel>
              <ModalInput type="email" name="email" id="emailModal" value={currentUserData.email} onChange={handleFormChange} required />

              <ModalLabel htmlFor="passwordModal">{isEditing ? 'Nova Password (deixar em branco para não alterar)' : 'Password*'}</ModalLabel>
              <ModalInput type="password" name="password" id="passwordModal" value={currentUserData.password} onChange={handleFormChange} required={!isEditing} />

              <ModalLabel htmlFor="confirmPasswordModal">{isEditing ? 'Confirmar Nova Password' : 'Confirmar Password*'}</ModalLabel>
              <ModalInput type="password" name="confirmPassword" id="confirmPasswordModal" value={currentUserData.confirmPassword} onChange={handleFormChange} required={!isEditing && !!currentUserData.password} />
              
              <ModalCheckboxContainer>
                <ModalCheckbox type="checkbox" name="isAdmin" id="isAdminModal" checked={currentUserData.isAdmin} onChange={handleFormChange} />
                <ModalLabel htmlFor="isAdminModal" style={{marginBottom: 0}}>Conceder privilégios de Administrador</ModalLabel>
              </ModalCheckboxContainer>

              <ModalActions>
                <ModalButton type="button" secondary onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}>
                  <FaUserPlus style={{marginRight: '8px'}}/> {formLoading ? 'A guardar...' : (isEditing ? 'Guardar Alterações' : 'Criar Utilizador')}
                </ModalButton>
              </ModalActions>
            </ModalForm>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default AdminManageUsersPage;