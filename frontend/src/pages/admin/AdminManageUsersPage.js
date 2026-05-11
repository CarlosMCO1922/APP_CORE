// src/pages/admin/AdminManageUsersPage.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { css, useTheme } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import {
    adminGetAllUsers,
    adminCreateUser,
    adminUpdateUser,
    adminDeleteUser,
    adminApproveUser,
} from '../../services/userService';
import { FaPlus, FaEdit, FaTrashAlt, FaTimes, FaEye, FaUserPlus, FaSearch, FaCheckCircle } from 'react-icons/fa';
import BackArrow from '../../components/BackArrow';
import ConfirmationModal from '../../components/Common/ConfirmationModal';



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

  @media (max-width: 480px) {
    gap: 10px;
    margin-bottom: 12px;
  }
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;

  @media (max-width: 480px) {
    font-size: 1.8rem;
    line-height: 1.1;
  }
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
    font-size: 0.95rem;
    padding: 10px 12px;
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

  @media (max-width: 480px) {
    padding: 7px 10px;
    font-size: 0.82rem;
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

const SearchContainer = styled.div`
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 10px 14px 10px 44px;
  background-color: ${({ theme }) => theme.colors.inputBg || theme.colors.buttonSecondaryBg};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder || theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing || 'rgba(212, 175, 55, 0.2)'};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  @media (max-width: 480px) {
    padding: 9px 12px 9px 42px;
    font-size: 0.92rem;
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
  pointer-events: none;

  @media (max-width: 480px) {
    left: 14px;
    font-size: 0.85rem;
  }
`;

const SearchInputWrapper = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
`;

const ApprovalToggle = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;

  @media (max-width: 480px) {
    width: 100%;
    justify-content: space-between;
    gap: 8px;
  }
`;

const ApprovalButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;

  @media (max-width: 480px) {
    flex: 1;
    justify-content: flex-start;
  }
`;

const ToolbarRight = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: 480px) {
    width: 100%;
    justify-content: space-between;
    gap: 8px;
  }
`;

const ResultsMeta = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.85rem;

  @media (max-width: 480px) {
    width: 100%;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.8rem;
  }
`;

const PageSizeSelect = styled.select`
  padding: 8px 10px;
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.85rem;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  }

  @media (max-width: 480px) {
    padding: 7px 10px;
    font-size: 0.82rem;
  }
`;

const UsersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const UserCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};
  overflow: hidden;
  transition: transform 0.15s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const UserCardHeader = styled.div`
  padding: 12px 14px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};

  @media (max-width: 480px) {
    padding: 10px 12px;
  }
`;

const UserNameBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const UserName = styled.div`
  font-weight: 700;
  font-size: 0.98rem;
  color: ${({ theme }) => theme.colors.textMain};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 480px) {
    font-size: 0.95rem;
  }
`;

const UserSubtitle = styled.div`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 480px) {
    font-size: 0.78rem;
  }
`;

const Badge = styled.span`
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  color: ${({ theme }) => theme.colors.textMain};
  background: ${({ theme }) => theme.colors.buttonSecondaryBg};

  ${props => props.variant === 'success' && css`
    border-color: ${props.theme.colors.success || '#28a745'};
    background: ${(props.theme.colors.successBg || '#28a745')}22;
    color: ${props.theme.colors.success || '#28a745'};
  `}

  ${props => props.variant === 'warning' && css`
    border-color: ${props.theme.colors.warning || props.theme.colors.primary};
    background: ${(props.theme.colors.warning || props.theme.colors.primary)}22;
    color: ${props.theme.colors.warning || props.theme.colors.primary};
  `}

  @media (max-width: 480px) {
    padding: 3px 7px;
    font-size: 0.72rem;
  }
`;

const UserCardBody = styled.div`
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 480px) {
    padding: 10px 12px;
    gap: 6px;
  }
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 10px;
  align-items: center;
  font-size: 0.85rem;

  @media (max-width: 480px) {
    grid-template-columns: 70px 1fr;
    gap: 8px;
    font-size: 0.82rem;
  }
`;

const FieldLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;

const FieldValue = styled.span`
  color: ${({ theme }) => theme.colors.textMain};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserCardFooter = styled.div`
  padding: 12px 14px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    padding: 10px 12px;
    gap: 8px;
    justify-content: space-between;

    & > button {
      flex: 1 1 calc(50% - 4px);
      justify-content: center;
    }
  }
`;

const PaginationBar = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    margin-top: 12px;
    gap: 10px;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const PageIndicator = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
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
  phone: '',
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState('all'); // 'all' | 'pending'
  const [approvingUserId, setApprovingUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchUsers = useCallback(async () => {
    if (authState.token) {
      setLoading(true);
      setError('');
      try {
        const params = approvalFilter === 'pending' ? { approved: 'false' } : {};
        const data = await adminGetAllUsers(authState.token, params);
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Não foi possível carregar os utilizadores.');
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token, approvalFilter]);

  // Filtrar utilizadores com base no termo de pesquisa
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }
    const term = searchTerm.toLowerCase().trim();
    return users.filter(user => 
      (user.firstName || '').toLowerCase().includes(term) ||
      (user.lastName || '').toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Reset página quando muda pesquisa/filtro/tamanho de página
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, approvalFilter, pageSize]);

  const safePageSize = useMemo(() => {
    const n = Number(pageSize);
    if (!Number.isFinite(n)) return 20;
    return Math.min(200, Math.max(5, Math.floor(n)));
  }, [pageSize]);

  const totalResults = filteredUsers.length;
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalResults / safePageSize));
  }, [totalResults, safePageSize]);

  const pageUsers = useMemo(() => {
    const clampedPage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (clampedPage - 1) * safePageSize;
    return filteredUsers.slice(start, start + safePageSize);
  }, [filteredUsers, currentPage, totalPages, safePageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
      phone: user.phone || '',
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
      phone: currentUserData.phone ? String(currentUserData.phone).trim() : null,
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

  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    setError('');
    setSuccessMessage('');
    setShowDeleteConfirmModal(false);
    try {
      await adminDeleteUser(userToDelete, authState.token);
      setSuccessMessage('Utilizador eliminado com sucesso.');
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Falha ao eliminar utilizador.');
      setUserToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    setApprovingUserId(userId);
    setError('');
    setSuccessMessage('');
    try {
      await adminApproveUser(userId, authState.token);
      setSuccessMessage('Utilizador aprovado com sucesso. Já pode iniciar sessão.');
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Falha ao aprovar utilizador.');
    } finally {
      setApprovingUserId(null);
    }
  };

  if (loading && !showModal) {
    return <PageContainer><LoadingText>A carregar utilizadores...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <HeaderContainer>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackArrow to="/admin/dashboard" />
          <Title>Clientes</Title>
        </div>
        <CreateButton onClick={handleOpenCreateModal}><FaUserPlus /> Novo Cliente</CreateButton>
      </HeaderContainer>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

      <SearchContainer>
        <SearchInputWrapper>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="Pesquisar por nome, apelido ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchInputWrapper>
        <ToolbarRight>
          <ApprovalToggle>
            <span style={{ fontSize: '0.9rem', color: theme.colors.textMuted, whiteSpace: 'nowrap' }}>Estado:</span>
            <ApprovalButtons>
              <ActionButton
                onClick={() => setApprovalFilter('all')}
                style={{
                  background: approvalFilter === 'all' ? theme.colors.primary : theme.colors.buttonSecondaryBg,
                  color: approvalFilter === 'all' ? theme.colors.textDark : theme.colors.textMain,
                }}
              >
                Todos
              </ActionButton>
              <ActionButton
                onClick={() => setApprovalFilter('pending')}
                style={{
                  background: approvalFilter === 'pending' ? theme.colors.primary : theme.colors.buttonSecondaryBg,
                  color: approvalFilter === 'pending' ? theme.colors.textDark : theme.colors.textMain,
                }}
              >
                Pendentes
              </ActionButton>
            </ApprovalButtons>
          </ApprovalToggle>

          <ResultsMeta>
            <span>{totalResults} resultado{totalResults === 1 ? '' : 's'}</span>
            <span>•</span>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>Por página</span>
              <PageSizeSelect
                value={safePageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Resultados por página"
              >
                {[10, 20, 30, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </PageSizeSelect>
            </label>
          </ResultsMeta>
        </ToolbarRight>
      </SearchContainer>

      {pageUsers.length > 0 ? (
        <>
          <UsersGrid>
            {pageUsers.map(user => (
              <UserCard key={user.id}>
                <UserCardHeader>
                  <UserNameBlock>
                    <UserName title={`${user.firstName || ''} ${user.lastName || ''}`.trim()}>
                      {(user.firstName || '').trim()} {(user.lastName || '').trim()}
                    </UserName>
                    <UserSubtitle title={user.email || ''}>{user.email}</UserSubtitle>
                  </UserNameBlock>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Badge variant={user.approvedAt ? 'success' : 'warning'}>
                      {user.approvedAt ? 'Aprovado' : 'Pendente'}
                    </Badge>
                    {user.isAdmin && <Badge>Admin</Badge>}
                  </div>
                </UserCardHeader>

                <UserCardBody>
                  <FieldRow>
                    <FieldLabel>ID</FieldLabel>
                    <FieldValue title={String(user.id)}>{user.id}</FieldValue>
                  </FieldRow>
                  <FieldRow>
                    <FieldLabel>Email</FieldLabel>
                    <FieldValue title={user.email || ''}>{user.email}</FieldValue>
                  </FieldRow>
                </UserCardBody>

                <UserCardFooter>
                  {!user.approvedAt && (
                    <ActionButton
                      onClick={() => handleApproveUser(user.id)}
                      disabled={approvingUserId === user.id}
                      style={{ background: theme.colors.success || '#28a745', color: 'white' }}
                    >
                      <FaCheckCircle /> {approvingUserId === user.id ? 'A aprovar...' : 'Aprovar'}
                    </ActionButton>
                  )}
                  <ActionButton details onClick={() => navigate(`/admin/users/${user.id}/details`)}>
                    <FaEye /> Detalhes
                  </ActionButton>
                  <ActionButton onClick={() => handleOpenEditModal(user)}>
                    <FaEdit /> Editar
                  </ActionButton>
                  <ActionButton danger onClick={() => handleDeleteUser(user.id)}>
                    <FaTrashAlt /> Eliminar
                  </ActionButton>
                </UserCardFooter>
              </UserCard>
            ))}
          </UsersGrid>

          <PaginationBar>
            <PageIndicator>
              Página {Math.min(currentPage, totalPages)} de {totalPages}
            </PageIndicator>
            <PaginationControls>
              <ActionButton
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                Anterior
              </ActionButton>
              <ActionButton
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Seguinte
              </ActionButton>
            </PaginationControls>
          </PaginationBar>
        </>
      ) : (
        <ErrorText style={{ backgroundColor: 'transparent', borderColor: 'transparent', color: theme.colors.textMuted }}>
          {searchTerm
            ? 'Nenhum utilizador encontrado com o termo de pesquisa.'
            : approvalFilter === 'pending'
              ? 'Nenhum utilizador pendente de aprovação.'
              : 'Nenhum utilizador encontrado.'}
        </ErrorText>
      )}

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

              <ModalLabel htmlFor="phoneModal">Telemóvel (WhatsApp)</ModalLabel>
              <ModalInput
                type="tel"
                name="phone"
                id="phoneModal"
                placeholder="Ex.: +3519XXXXXXXX"
                value={currentUserData.phone}
                onChange={handleFormChange}
              />

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

      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => {
          if (!deleteLoading) {
            setShowDeleteConfirmModal(false);
            setUserToDelete(null);
          }
        }}
        onConfirm={handleDeleteUserConfirm}
        title="Eliminar Utilizador"
        message={userToDelete ? `Tens a certeza que queres eliminar o utilizador ID ${userToDelete}? Esta ação não pode ser desfeita.` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger={true}
        loading={deleteLoading}
      />
    </PageContainer>
  );
};

export default AdminManageUsersPage;