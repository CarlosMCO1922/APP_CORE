// src/pages/admin/AdminManageUsersPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { adminGetAllUsers, adminDeleteUser, adminCreateUser, adminUpdateUser } from '../../services/userService';
import { FaEdit, FaTrashAlt, FaPlus, FaArrowLeft } from 'react-icons/fa';

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 20px clamp(15px, 4vw, 40px); // Padding responsivo
  font-family: ${({ theme }) => theme.fonts.main};
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap; // Permite quebrar linha em ecrãs pequenos
  gap: 15px;
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem); // Título responsivo
  color: ${({ theme }) => theme.colors.primary};
  margin: 0; // Remover margem para melhor controlo com flex
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
    background-color: #e6c358; // Um pouco mais claro no hover
    transform: translateY(-2px);
  }
  @media (max-width: 480px) {
    width: 100%; // Ocupa largura total em mobile
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
    white-space: nowrap; // Evita quebra de linha indesejada nas células
  }
  th {
    background-color: #303030;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    position: sticky; // Para cabeçalho fixo ao fazer scroll horizontal
    left: 0; // Fixa a primeira coluna se necessário (adicionar por th especifico)
    z-index: 1;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover { background-color: #2c2c2c; }

  td:last-child { // Coluna de ações
    white-space: normal; // Permite quebra de botões se necessário
    text-align: right; // Alinha botões à direita
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

const MessageBase = styled.p`
  text-align: center; padding: 12px 18px; margin: 20px auto;
  border-radius: ${({ theme }) => theme.borderRadius};
  border-width: 1px; border-style: solid; max-width: 600px;
  font-size: 0.9rem; font-weight: 500;
`;
const LoadingText = styled(MessageBase)` color: ${({ theme }) => theme.colors.primary}; border-color: transparent; background: transparent;`;
const ErrorText = styled(MessageBase)` color: ${({ theme }) => theme.colors.error}; background-color: ${({ theme }) => theme.colors.errorBg}; border-color: ${({ theme }) => theme.colors.error};`;
const MessageText = styled(MessageBase)` color: ${({ theme }) => theme.colors.success}; background-color: ${({ theme }) => theme.colors.successBg}; border-color: ${({ theme }) => theme.colors.success};`;

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
  padding: 10px 14px; background-color: #333;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
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
const ModalCheckboxContainer = styled.div`
  display: flex; align-items: center; gap: 8px; margin-top: 5px;
`;
const ModalCheckbox = styled.input`
  accent-color: ${({ theme }) => theme.colors.primary};
  transform: scale(1.1);
  cursor: pointer;
`;
const ModalActions = styled.div`
  display: flex; flex-direction: column; gap: 10px;
  margin-top: 25px; padding-top: 15px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  @media (min-width: 480px) { flex-direction: row; justify-content: flex-end; }
`;
const ModalButton = styled(ActionButton)` // Reutilizando ActionButton para consistência
  font-size: 0.9rem; // Ajuste de tamanho para botões do modal
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
//const ModalErrorText = styled(ErrorText)\`margin: -5px 0 10px 0; text-align:left; font-size: 0.8rem; padding: 8px 12px;\`;


const initialFormState = {
  firstName: '', lastName: '', email: '', password: '', isAdmin: false,
};

const AdminManageUsersPage = () => {
  const { authState } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(initialFormState);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchUsers = useCallback(async () => {
    if (authState.token) {
      try {
        setLoading(true); setError(''); setSuccessMessage('');
        const data = await adminGetAllUsers(authState.token);
        setUsers(data);
      } catch (err) {
        setError(err.message || 'Não foi possível carregar os utilizadores.');
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleOpenCreateModal = () => {
    setIsEditing(false); setCurrentUserData(initialFormState);
    setCurrentUserId(null); setModalError(''); setShowModal(true);
  };

  const handleOpenEditModal = (user) => {
    setIsEditing(true);
    setCurrentUserData({
      firstName: user.firstName, lastName: user.lastName, email: user.email,
      password: '', isAdmin: user.isAdmin,
    });
    setCurrentUserId(user.id); setModalError(''); setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false); setCurrentUserData(initialFormState);
    setCurrentUserId(null); setModalError('');
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentUserData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true); setModalError(''); setError(''); setSuccessMessage('');
    const dataToSend = { ...currentUserData };
    if (isEditing && !dataToSend.password) {
      delete dataToSend.password;
    } else if (!isEditing && (!dataToSend.password || dataToSend.password.length < 6 )) {
        setModalError("Password é obrigatória (mínimo 6 caracteres) para criar novo utilizador.");
        setFormLoading(false); return;
    } else if (isEditing && dataToSend.password && dataToSend.password.length < 6) {
        setModalError("A nova password deve ter pelo menos 6 caracteres.");
        setFormLoading(false); return;
    }

    try {
      if (isEditing) {
        await adminUpdateUser(currentUserId, dataToSend, authState.token);
        setSuccessMessage('Utilizador atualizado com sucesso!');
      } else {
        await adminCreateUser(dataToSend, authState.token);
        setSuccessMessage('Utilizador criado com sucesso!');
      }
      fetchUsers(); handleCloseModal();
    } catch (err) {
      setModalError(err.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} utilizador.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(`Tens a certeza que queres eliminar o utilizador com ID ${userId}? Esta ação não pode ser desfeita.`)) return;
    setError(''); setSuccessMessage('');
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
        <Title>Gerir Clientes</Title>
        <CreateButton onClick={handleOpenCreateModal}><FaPlus /> Novo Cliente</CreateButton>
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
              <th>Admin?</th>
              <th style={{textAlign: 'right'}}>Ações</th>
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
                <td>
                  <ActionButtonContainer>
                    <ActionButton secondary onClick={() => handleOpenEditModal(user)}>
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
            <ModalTitle>{isEditing ? 'Editar Cliente' : 'Criar Novo Cliente'}</ModalTitle>
            {modalError && <ModalErrorText>{modalError}</ModalErrorText>}
            <ModalForm onSubmit={handleFormSubmit}>
              <ModalLabel htmlFor="firstName">Nome*</ModalLabel>
              <ModalInput type="text" name="firstName" id="firstName" value={currentUserData.firstName} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="lastName">Apelido*</ModalLabel>
              <ModalInput type="text" name="lastName" id="lastName" value={currentUserData.lastName} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="email">Email*</ModalLabel>
              <ModalInput type="email" name="email" id="email" value={currentUserData.email} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="password">Password {isEditing ? '(Deixar em branco para não alterar)' : '(Mín. 6 caracteres)*'}</ModalLabel>
              <ModalInput type="password" name="password" id="password" value={currentUserData.password} onChange={handleFormChange} placeholder={isEditing ? 'Nova password (opcional)' : 'Mínimo 6 caracteres'} required={!isEditing} autoComplete="new-password" />
              
              <ModalCheckboxContainer>
                <ModalCheckbox type="checkbox" name="isAdmin" id="isAdminModal" checked={currentUserData.isAdmin} onChange={handleFormChange} />
                <ModalLabel htmlFor="isAdminModal" style={{marginBottom: 0, cursor: 'pointer', fontWeight: 'normal', color: '#e0e0e0'}}>Este cliente é administrador?</ModalLabel>
              </ModalCheckboxContainer>

              <ModalActions>
                <ModalButton type="button" secondary onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}>
                  {formLoading ? 'A guardar...' : (isEditing ? 'Guardar Alterações' : 'Criar Cliente')}
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