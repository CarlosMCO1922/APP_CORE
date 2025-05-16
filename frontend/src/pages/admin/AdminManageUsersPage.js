// src/pages/admin/AdminManageUsersPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { adminGetAllUsers, adminDeleteUser, adminCreateUser, adminUpdateUser } from '../../services/userService';

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: #1A1A1A;
  color: #E0E0E0;
  min-height: 100vh;
  padding: 20px 40px;
  font-family: 'Inter', sans-serif;
`;

const Title = styled.h1`
  font-size: 2.2rem;
  color: #D4AF37;
  margin-bottom: 25px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: #252525;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  th, td {
    border-bottom: 1px solid #383838;
    padding: 12px 15px;
    text-align: left;
    font-size: 0.95rem;
  }
  th {
    background-color: #303030;
    color: #D4AF37;
    font-weight: 600;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover { background-color: #2c2c2c; }
`;

const ActionButton = styled.button`
  margin-right: 8px;
  padding: 6px 10px;
  font-size: 0.85rem;
  border-radius: 5px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease;
  background-color: ${props => props.danger ? '#D32F2F' : (props.secondary ? '#555' : '#D4AF37')};
  color: ${props => props.danger ? 'white' : (props.secondary ? '#E0E0E0' : '#1A1A1A')};
  &:hover {
    background-color: ${props => props.danger ? '#C62828' : (props.secondary ? '#666' : '#e6c358')};
  }
`;

const TopActionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const CreateButton = styled.button`
  background-color: #D4AF37;
  color: #1A1A1A;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #e6c358;
  }
`;

const LoadingText = styled.p` font-size: 1.1rem; text-align: center; padding: 20px; color: #D4AF37;`;
const ErrorText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #FF6B6B; background-color: rgba(255,107,107,0.15); border: 1px solid #FF6B6B; border-radius: 8px; margin: 15px 0;`;
const MessageText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #66BB6A; background-color: rgba(102,187,106,0.15); border: 1px solid #66BB6A; border-radius: 8px; margin: 15px 0;`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #2C2C2C;
  padding: 30px;
  border-radius: 10px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.4);
  position: relative;
`;

const ModalTitle = styled.h2`
  color: #D4AF37;
  margin-top: 0;
  margin-bottom: 25px;
  font-size: 1.6rem;
`;

const ModalForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ModalInput = styled.input`
  padding: 10px 12px;
  background-color: #383838;
  border: 1px solid #555;
  border-radius: 6px;
  color: #E0E0E0;
  font-size: 0.95rem;
  &:focus { outline: none; border-color: #D4AF37; }
`;
const ModalLabel = styled.label`
  font-size: 0.9rem;
  color: #b0b0b0;
  margin-bottom: 5px;
  display: block;
`;
const ModalCheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;
const ModalCheckbox = styled.input` accent-color: #D4AF37; `;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 25px;
`;

const ModalButton = styled.button`
  padding: 10px 18px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
  background-color: ${props => props.primary ? '#D4AF37' : '#555'};
  color: ${props => props.primary ? '#1A1A1A' : '#E0E0E0'};
  &:hover {
    background-color: ${props => props.primary ? '#e6c358' : '#666'};
  }
  &:disabled {
    background-color: #404040;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button` 
  position: absolute; top: 15px; right: 20px; 
  background: transparent; border: none; 
  color: #aaa; font-size: 1.8rem; cursor: pointer;
  line-height: 1; padding: 0;
  &:hover { color: #fff; } 
`;


const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  isAdmin: false,
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
  const [modalError, setModalError] = useState(''); // Erro específico do modal

  const fetchUsers = useCallback(async () => {
    if (authState.token) {
      try {
        setLoading(true);
        setError(''); 
        setSuccessMessage('');
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
    setCurrentUserData(initialFormState);
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
      isAdmin: user.isAdmin,
    });
    setCurrentUserId(user.id);
    setModalError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentUserData(initialFormState); 
    setCurrentUserId(null);
    setModalError(''); // Limpa erro do modal ao fechar
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
    // Limpar mensagens globais ao submeter o formulário
    setError(''); 
    setSuccessMessage('');

    const dataToSend = { ...currentUserData };
    if (isEditing && !dataToSend.password) {
      delete dataToSend.password;
    } else if (!isEditing && (!dataToSend.password || dataToSend.password.length < 6 )) {
        setModalError("Password é obrigatória (mínimo 6 caracteres) para criar novo utilizador.");
        setFormLoading(false);
        return;
    } else if (isEditing && dataToSend.password && dataToSend.password.length < 6) {
        setModalError("A nova password deve ter pelo menos 6 caracteres.");
        setFormLoading(false);
        return;
    }


    try {
      if (isEditing) {
        await adminUpdateUser(currentUserId, dataToSend, authState.token);
        setSuccessMessage('Utilizador atualizado com sucesso!');
      } else {
        await adminCreateUser(dataToSend, authState.token);
        setSuccessMessage('Utilizador criado com sucesso!');
      }
      fetchUsers(); 
      handleCloseModal();
    } catch (err) {
      // Mostrar erro dentro do modal se possível, ou como fallback no erro principal
      setModalError(err.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} utilizador.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(`Tens a certeza que queres eliminar o utilizador com ID ${userId}? Esta ação não pode ser desfeita.`)) {
      return;
    }
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
    return <PageContainer><LoadingText>A carregar lista de utilizadores...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <TopActionsContainer>
        <Title>Gerir Utilizadores (Clientes)</Title>
        <CreateButton onClick={handleOpenCreateModal}>Criar Novo Utilizador</CreateButton>
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
            <th>Admin?</th>
            <th>Ações</th>
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
                <ActionButton secondary onClick={() => handleOpenEditModal(user)}>
                  Editar
                </ActionButton>
                <ActionButton danger onClick={() => handleDeleteUser(user.id)}>
                  Eliminar
                </ActionButton>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Nenhum utilizador encontrado.</td>
            </tr>
          )}
        </tbody>
      </Table>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}> 
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}>&times;</CloseButton>
            <ModalTitle>{isEditing ? 'Editar Utilizador' : 'Criar Novo Utilizador'}</ModalTitle>
            {modalError && <ErrorText style={{marginBottom: '15px'}}>{modalError}</ErrorText>}
            <ModalForm onSubmit={handleFormSubmit}>
              <ModalLabel htmlFor="firstName">Nome</ModalLabel>
              <ModalInput type="text" name="firstName" id="firstName" value={currentUserData.firstName} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="lastName">Apelido</ModalLabel>
              <ModalInput type="text" name="lastName" id="lastName" value={currentUserData.lastName} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="email">Email</ModalLabel>
              <ModalInput type="email" name="email" id="email" value={currentUserData.email} onChange={handleFormChange} required />
              
              <ModalLabel htmlFor="password">Password {isEditing ? '(Deixar em branco para não alterar)' : '(Obrigatória)'}</ModalLabel>
              <ModalInput type="password" name="password" id="password" value={currentUserData.password} onChange={handleFormChange} placeholder={isEditing ? '' : 'Mínimo 6 caracteres'} required={!isEditing} />
              
              <ModalCheckboxContainer>
                <ModalCheckbox type="checkbox" name="isAdmin" id="isAdmin" checked={currentUserData.isAdmin} onChange={handleFormChange} />
                <ModalLabel htmlFor="isAdmin" style={{marginBottom: 0, cursor: 'pointer'}}>Este utilizador é um administrador (User Admin)?</ModalLabel>
              </ModalCheckboxContainer>

              <ModalActions>
                <ModalButton type="button" onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}>
                  {formLoading ? 'A guardar...' : (isEditing ? 'Guardar Alterações' : 'Criar Utilizador')}
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