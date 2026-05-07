// src/pages/admin/AdminManagePaymentsPage.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import {
    adminGetAllPayments,
    adminCreatePayment,
    adminUpdatePaymentStatus,
    adminDeletePayment,
    adminGetTotalPaid
} from '../../services/paymentService';
import { adminGetAllUsers } from '../../services/userService';
import { FaMoneyBillWave, FaPlus, FaTrashAlt, FaFilter, FaSyncAlt, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import BackArrow from '../../components/BackArrow';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import SearchableSelect from '../../components/Common/SearchableSelect';

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
  align-items: flex-start;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 15px;
`;

const TitleContainer = styled.div``;

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 0 5px 0;
`;

// Subtitle removido (header mais compacto)

const MonthRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const CalendarIconButton = styled.button`
  width: 52px;
  height: 46px;
  min-width: 52px;
  min-height: 46px;
  padding: 0;
  background-color: #333;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s, transform 0.15s, background-color 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-1px);
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  }

  svg {
    width: 82%;
    height: 82%;
    display: block;
    opacity: 0.95;
  }
`;

const HiddenDateInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
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
  align-self: center;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    transform: translateY(-2px);
  }
  @media (max-width: 550px) {
    width: 100%;
    justify-content: center;
    font-size: 1rem;
    padding: 12px;
  }
`;


const TotalPaidContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 18px 25px;
  border-radius: ${({ theme }) => theme.borderRadius};
  margin-bottom: 25px;
  text-align: center;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.textMain};
  font-weight: 500;
  box-shadow: ${({ theme }) => theme.boxShadow};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  span {
    color: ${({ theme }) => theme.colors.success};
    font-size: 1.6rem;
    font-weight: 700;
    margin-left: 10px;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  padding: 20px;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};
  flex-wrap: wrap;
  align-items: flex-end;

  select, input[type="month"], input[type="text"] {
    padding: 9px 12px;
    background-color: ${({ theme }) => theme.colors.inputBg};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    border-radius: ${({ theme }) => theme.borderRadius};
    color: ${({ theme }) => theme.colors.textMain};
    font-size: 0.9rem;
    min-width: 160px;
    flex-grow: 1;
    @media (min-width: 768px) {
        flex-grow: 0;
    }
  }
`;

const FilterToggleRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 14px;
`;

const FilterToggleButton = styled.button`
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  color: ${({ theme }) => theme.colors.textMain};
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.15s ease, border-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  &:hover {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-1px);
  }
`;

const PaymentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const PaymentCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 12px 14px;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const CardTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const CardTitle = styled.div`
  font-weight: 800;
  font-size: 0.98rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardSubtitle = styled.div`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Pill = styled.span`
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  color: ${({ theme }) => theme.colors.textMain};
  background: ${({ theme }) => theme.colors.buttonSecondaryBg};
  white-space: nowrap;
`;

const CardBody = styled.div`
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 10px;
  align-items: center;
  font-size: 0.85rem;
`;

const InfoLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;

const InfoValue = styled.span`
  color: ${({ theme }) => theme.colors.textMain};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardFooter = styled.div`
  padding: 12px 14px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    justify-content: space-between;
    & > button {
      flex: 1 1 calc(50% - 5px);
      justify-content: center;
    }
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 180px;
`;

const FilterButton = styled.button`
  padding: 9px 18px;
  background-color: ${({ theme, clear }) => clear ? theme.colors.buttonSecondaryBg : theme.colors.primary};
  color: ${({ theme, clear }) => clear ? theme.colors.textMain : theme.colors.textDark};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;
  height: 38px;

  &:hover {
    background-color: ${({ theme, clear }) => clear ? theme.colors.buttonSecondaryHoverBg : theme.colors.primaryHover};
  }
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};

  &::-webkit-scrollbar { height: 8px; background-color: ${({ theme }) => theme.colors.scrollbarTrackBg}; }
  &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colors.scrollbarThumbBg}; border-radius: 4px; }
`;

const Table = styled.table`
  width: 100%;
  min-width: 900px;
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
  td.actions-cell { text-align: right; }
  td.status-cell select {
    padding: 5px 8px;
    font-size: 0.8rem;
    background-color: ${({ theme }) => theme.colors.inputBg};
    color: ${({ theme }) => theme.colors.textMain};
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    border-radius: 4px;
    min-width: 100px;
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
  padding: 6px 10px; font-size: 0.8rem; border-radius: 5px;
  cursor: pointer; border: none; transition: background-color 0.2s ease, transform 0.15s ease;
  display: inline-flex; align-items: center; gap: 5px;
  background-color: ${props => (props.danger ? props.theme.colors.error : props.theme.colors.buttonSecondaryBg)};
  color: white;
  &:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
  &:disabled { background-color: ${({ theme }) => theme.colors.disabledBg}; color: ${({ theme }) => theme.colors.disabledText}; cursor: not-allowed; }
`;

const MessageBaseStyles = css`
  text-align: center; padding: 12px 18px; margin: 20px auto;
  border-radius: ${({ theme }) => theme.borderRadius};
  border-width: 1px; border-style: solid; max-width: 600px;
  font-size: 0.9rem; font-weight: 500;
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
  background-color: rgba(0,0,0,0.85); display: flex;
  justify-content: center; align-items: center;
  z-index: 1050; padding: 20px;
`;
const ModalContent = styled.div`
  background-color: #2A2A2A; padding: clamp(25px, 4vw, 35px);
  border-radius: 10px; width: 100%; max-width: 550px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.6); position: relative;
  max-height: 90vh; overflow-y: auto;
`;
const ModalTitle = styled.h2`
  color: ${({ theme }) => theme.colors.primary}; margin-top: 0; margin-bottom: 20px;
  font-size: clamp(1.4rem, 3.5vw, 1.7rem); font-weight: 600; text-align: center;
  padding-bottom: 15px; border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;
const ModalForm = styled.form` display: flex; flex-direction: column; gap: 15px; `;
const ModalLabel = styled.label`
  font-size: 0.85rem; color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 4px; display: block; font-weight: 500;
`;
const ModalInput = styled.input`
  padding: 10px 14px; background-color: #333;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); }
`;
const ModalTextarea = styled.textarea`
  padding: 10px 14px; background-color: #333;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%;
  min-height: 80px; resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); }
`;
const ModalSelect = styled.select`
  padding: 10px 14px; background-color: #333;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain}; font-size: 0.95rem; width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); }
`;
const ModalActions = styled.div`
  display: flex; flex-direction: column; gap: 10px;
  margin-top: 12px; padding-top: 10px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  @media (min-width: 480px) { flex-direction: row; justify-content: flex-end; }
`;

const ModalButton = styled(ActionButton)`
  background-color: ${props => props.primary ? props.theme.colors.primary : props.theme.colors.buttonSecondaryBg};
  color: ${props => props.primary ? props.theme.colors.textDark : props.theme.colors.textMain};
  font-size: 0.9rem; 
  padding: 10px 18px;
  gap: 6px;
  width: 100%;
  @media (min-width: 480px) { width: auto; }

  &:hover:not(:disabled) {
    background-color: ${props => props.primary ? '#e6c358' : props.theme.colors.buttonSecondaryHoverBg};
  }
`;

const CloseButton = styled.button`
  position: absolute; top: 10px; right: 10px; background: transparent; border: none;
  color: #888; font-size: 1.8rem; cursor: pointer; line-height: 1; padding: 8px;
  transition: color 0.2s, transform 0.2s; border-radius: 50%;
  &:hover { color: #fff; transform: scale(1.1); }
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


const initialPaymentFormState = {
  userId: '', amount: '',
  paymentDate: new Date().toISOString().split('T')[0],
  referenceMonth: `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`,
  category: 'mensalidade_treino', description: '', status: 'pendente',
};
const paymentCategories = ['treino_aula_avulso', 'mensalidade_treino', 'consulta_fisioterapia', 'sinal_consulta', 'outro'];
const paymentStatusesForFilter = ['', 'pendente', 'pago', 'cancelado', 'rejeitado'];
const paymentStatusesForAdminSet = ['pendente', 'pago', 'cancelado', 'rejeitado'];
const paymentStatusesForCreate = ['pendente', 'pago'];


const AdminManagePaymentsPage = () => {
  const { authState } = useAuth();
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [userList, setUserList] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [pageSuccessMessage, setPageSuccessMessage] = useState('');

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const autoMonthFallbackRef = useRef(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(() => {
    const [year, month] = currentMonthStr.split('-');
    return { userId: '', status: '', category: '', year, month };
  });

  const [showModal, setShowModal] = useState(false);
  const [currentPaymentData, setCurrentPaymentData] = useState(initialPaymentFormState);
  const [clientMode, setClientMode] = useState('existing'); // existing | new
  const [newClientName, setNewClientName] = useState('');
  const paymentDateInputRef = useRef(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showStatusChangeConfirmModal, setShowStatusChangeConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [paymentToAction, setPaymentToAction] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPageData = useCallback(async (currentFilters) => {
    if (authState.token) {
      try {
        setLoading(true); setPageError(''); setPageSuccessMessage('');
        const apiFilters = { ...currentFilters };
        if (currentFilters.year && currentFilters.month) {
            apiFilters.referenceMonth = `${currentFilters.year}-${currentFilters.month.padStart(2, '0')}`;
        } else if (currentFilters.year && !currentFilters.month) { 
            apiFilters.referenceMonth = `${currentFilters.year}-%`;
        } else if (!currentFilters.year && currentFilters.month) { 
            apiFilters.referenceMonth = `${new Date().getFullYear()}-${currentFilters.month.padStart(2, '0')}`;
        }
        delete apiFilters.year; delete apiFilters.month;

        const [paymentsData, usersData, totalPaidData] = await Promise.all([
          adminGetAllPayments(apiFilters, authState.token),
          adminGetAllUsers(authState.token),
          adminGetTotalPaid(authState.token)
        ]);
        const sortedPayments = [...(paymentsData || [])].sort((a, b) => {
          const aKey = `${a.paymentDate || ''} ${String(a.id || 0).padStart(10, '0')}`;
          const bKey = `${b.paymentDate || ''} ${String(b.id || 0).padStart(10, '0')}`;
          return bKey.localeCompare(aKey);
        });
        setPayments(sortedPayments);
        setUserList(usersData);
        setTotalPaid(totalPaidData.totalPaid);

        // Default: mês atual; se não houver dados, recuar mês a mês até encontrar (sem filtros extra)
        const refMonth = currentFilters.year && currentFilters.month
          ? `${currentFilters.year}-${String(currentFilters.month).padStart(2, '0')}`
          : currentMonthStr;
        const isPureMonthFilter = !currentFilters.userId && !currentFilters.status && !currentFilters.category;
        if (isPureMonthFilter && refMonth === currentMonthStr && sortedPayments.length === 0 && !autoMonthFallbackRef.current) {
          autoMonthFallbackRef.current = true;
          const [y, m] = currentMonthStr.split('-').map(Number);
          // tentar até 12 meses para trás
          for (let i = 1; i <= 12; i += 1) {
            const d = new Date(y, (m - 1) - i, 1);
            const prevStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const [py, pm] = prevStr.split('-');
            // isto dispara novo fetch via useEffect
            setFilters(prev => ({ ...prev, year: py, month: pm }));
            break;
          }
        }
      } catch (err) {
        setPageError(err.message || 'Não foi possível carregar os dados da página de pagamentos.');
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token]);

  useEffect(() => { fetchPageData(filters); }, [fetchPageData, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMonthYearFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === "referenceMonthInput") {
        if (value) { const [year, month] = value.split('-'); setFilters(prev => ({ ...prev, year, month })); }
        else { setFilters(prev => ({ ...prev, year: '', month: ''})); }
    } else {
       setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const applyFilters = () => {
    autoMonthFallbackRef.current = false;
    fetchPageData(filters);
    setShowFilters(false);
  };
  const clearFilters = () => {
    autoMonthFallbackRef.current = false;
    const [year, month] = currentMonthStr.split('-');
    setFilters({ userId: '', status: '', category: '', year, month });
    setShowFilters(false);
  };


  const handleOpenCreateModal = (prefill = null) => {
    const base = { ...initialPaymentFormState };
    const next = { ...base, ...(prefill || {}) };
    setCurrentPaymentData(next);
    setClientMode('existing');
    setNewClientName('');
    setModalError('');
    setShowModal(true);
  };
  const handleCloseModal = () => { setShowModal(false); setModalError(''); };

  // Abrir modal ao navegar a partir do Dashboard
  useEffect(() => {
    if (location?.state?.openCreatePayment) {
      const today = new Date().toISOString().split('T')[0];
      const now2 = new Date();
      const ref = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`;
      handleOpenCreateModal({ paymentDate: today, referenceMonth: ref });
      // limpar state para evitar reabrir ao voltar
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state?.openCreatePayment]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Normalizar amount: substituir vírgula por ponto para facilitar parsing
    if (name === 'amount') {
      // Remover espaços e substituir vírgula por ponto
      const normalizedValue = String(value || '').replace(/\s/g, '').replace(',', '.');
      setCurrentPaymentData(prev => ({ ...prev, [name]: normalizedValue }));
    } 
    // Garantir que userId é sempre uma string (mesmo que vazia)
    else if (name === 'userId') {
      setCurrentPaymentData(prev => ({ ...prev, [name]: String(value || '') }));
    }
    // Garantir que outros campos são strings
    else {
      setCurrentPaymentData(prev => ({ ...prev, [name]: value || '' }));
    }
  };

  const openPaymentDatePicker = () => {
    const input = paymentDateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true); 
    setModalError(''); 
    setPageError(''); 
    setPageSuccessMessage('');
    
    // Debug: verificar valores atuais
    console.log('Form data antes de processar:', currentPaymentData);
    
    // Cliente: existente vs novo (externo)
    let userId = null;
    const clientName = String(newClientName || '').trim().replace(/\s+/g, ' ');

    if (clientMode === 'existing') {
      if (currentPaymentData.userId) {
        const userIdStr = String(currentPaymentData.userId).trim();
        userId = parseInt(userIdStr, 10);
        if (isNaN(userId) || userId <= 0) {
          setModalError("Por favor, selecione um cliente válido.");
          setFormLoading(false);
          return;
        }
      } else {
        setModalError("Por favor, selecione um cliente.");
        setFormLoading(false);
        return;
      }
    } else {
      if (!clientName || clientName.length < 2) {
        setModalError("Por favor, escreva o nome do cliente.");
        setFormLoading(false);
        return;
      }
    }
    
    // Converter amount: substituir vírgula por ponto e converter para número
    let amountValue = String(currentPaymentData.amount || '').trim();
    if (!amountValue) {
      setModalError("Por favor, insira um valor.");
      setFormLoading(false);
      return;
    }
    
    // Normalizar: remover espaços, substituir vírgula por ponto
    amountValue = amountValue.replace(/\s/g, '').replace(',', '.');
    const parsedAmount = parseFloat(amountValue);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setModalError(`O valor "${currentPaymentData.amount}" não é válido. Use um número maior que zero (ex: 42.75 ou 42,75).`);
      setFormLoading(false);
      return;
    }
    
    // Validar paymentDate - deve estar no formato YYYY-MM-DD
    const paymentDate = String(currentPaymentData.paymentDate || '').trim();
    if (!paymentDate) {
      setModalError("Por favor, selecione a data do pagamento.");
      setFormLoading(false);
      return;
    }
    
    // Validar formato de data (YYYY-MM-DD)
    if (!paymentDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setModalError("Data do pagamento inválida. Use o formato YYYY-MM-DD.");
      setFormLoading(false);
      return;
    }
    
    // Garantir que referenceMonth está no formato YYYY-MM
    let referenceMonth = String(currentPaymentData.referenceMonth || '').trim();
    if (!referenceMonth) {
      setModalError("Por favor, selecione o mês de referência.");
      setFormLoading(false);
      return;
    }
    
    // O input type="month" retorna YYYY-MM, mas vamos validar
    if (!referenceMonth.match(/^\d{4}-\d{2}$/)) {
      setModalError(`Mês de Referência inválido: "${referenceMonth}". Use o formato YYYY-MM (ex: 2026-01).`);
      setFormLoading(false);
      return;
    }
    
    // Validar category
    const category = String(currentPaymentData.category || '').trim();
    if (!category) {
      setModalError("Por favor, selecione uma categoria.");
      setFormLoading(false);
      return;
    }
    
    // Validar status
    const status = String(currentPaymentData.status || 'pendente').trim();
    
    // Preparar dados para envio - garantir tipos corretos
    const dataToSend = {
      ...(clientMode === 'existing' ? { userId: userId } : { clientName }),
      amount: parsedAmount, // número decimal
      paymentDate: paymentDate, // string YYYY-MM-DD
      referenceMonth: referenceMonth, // string YYYY-MM
      category: category, // string
      status: status, // string
      description: currentPaymentData.description && String(currentPaymentData.description).trim() ? String(currentPaymentData.description).trim() : null,
    };
    
    console.log('Dados a enviar:', dataToSend);
    
    try {
      await adminCreatePayment(dataToSend, authState.token);
      setPageSuccessMessage('Pagamento criado com sucesso!');
      fetchPageData(filters); 
      handleCloseModal();
    } catch (err) {
      console.error('Erro ao criar pagamento:', err);
      // Se o erro tiver detalhes de validação, mostrar mensagens mais específicas
      if (err.message && err.message.includes('Dados inválidos')) {
        const errorDetails = err.errors && Array.isArray(err.errors) 
          ? err.errors.map(e => `${e.path || 'campo'}: ${e.message}`).join(', ')
          : '';
        setModalError(`Dados inválidos${errorDetails ? ': ' + errorDetails : ''}`);
      } else {
        setModalError(err.message || 'Falha ao criar pagamento.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangePaymentStatus = (paymentId, newStatus) => {
    setPaymentToAction({ id: paymentId, status: newStatus });
    setActionType('status');
    setShowStatusChangeConfirmModal(true);
  };

  const handleChangeStatusConfirm = async () => {
    if (!paymentToAction || actionType !== 'status') return;
    setActionLoading(true);
    setPageError(''); 
    setPageSuccessMessage('');
    setShowStatusChangeConfirmModal(false);
    try {
        await adminUpdatePaymentStatus(paymentToAction.id, paymentToAction.status, authState.token);
        setPageSuccessMessage(`Status do pagamento ID ${paymentToAction.id} atualizado para "${paymentToAction.status}".`);
        setPaymentToAction(null);
        setActionType(null);
        fetchPageData(filters); 
    } catch (err) {
        setPageError(err.message || 'Falha ao atualizar status do pagamento.');
        setPaymentToAction(null);
        setActionType(null);
    } finally {
        setActionLoading(false);
    }
  };

  const handleDeletePayment = (paymentId) => {
    setPaymentToAction({ id: paymentId });
    setActionType('delete');
    setShowDeleteConfirmModal(true);
  };

  const handleDeletePaymentConfirm = async () => {
    if (!paymentToAction || actionType !== 'delete') return;
    setActionLoading(true);
    setPageError(''); 
    setPageSuccessMessage('');
    setShowDeleteConfirmModal(false);
    try {
        await adminDeletePayment(paymentToAction.id, authState.token);
        setPageSuccessMessage('Pagamento eliminado com sucesso.');
        setPaymentToAction(null);
        setActionType(null);
        fetchPageData(filters);
    } catch (err) {
        setPageError(err.message || 'Falha ao eliminar pagamento.');
        setPaymentToAction(null);
        setActionType(null);
    } finally {
        setActionLoading(false);
    }
  };

  if (loading && !showModal) {
    return <PageContainer><LoadingText>A carregar pagamentos...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <HeaderContainer>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackArrow to="/admin/dashboard" />
          <TitleContainer>
            <Title>Pagamentos</Title>
          </TitleContainer>
        </div>
        <CreateButton onClick={handleOpenCreateModal}><FaPlus /> Registar Pagamento</CreateButton>
      </HeaderContainer>

      {pageError && <ErrorText>{pageError}</ErrorText>}
      {pageSuccessMessage && <MessageText>{pageSuccessMessage}</MessageText>}

      <TotalPaidContainer>
        Total Recebido (Status "Pago"): <span>{Number(totalPaid).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
      </TotalPaidContainer>

      <FilterToggleRow>
        <FilterToggleButton type="button" onClick={() => setShowFilters(v => !v)}>
          <FaFilter /> {showFilters ? 'Fechar Filtros' : 'Filtros'}
        </FilterToggleButton>
      </FilterToggleRow>

      {showFilters && (
        <FiltersContainer>
          <FilterGroup>
            <ModalLabel htmlFor="filterUserIdPay">Cliente:</ModalLabel>
            <ModalSelect name="userId" id="filterUserIdPay" value={filters.userId} onChange={handleFilterChange}>
                <option value="">Todos</option>
                {userList.map(user => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
            </ModalSelect>
          </FilterGroup>
          <FilterGroup>
            <ModalLabel htmlFor="filterStatusPay">Status:</ModalLabel>
            <ModalSelect name="status" id="filterStatusPay" value={filters.status} onChange={handleFilterChange}>
                {paymentStatusesForFilter.map(s => <option key={s} value={s}>{s ? (s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')) : 'Todos'}</option>)}
            </ModalSelect>
          </FilterGroup>
          <FilterGroup>
            <ModalLabel htmlFor="filterCategoryPay">Categoria:</ModalLabel>
            <ModalSelect name="category" id="filterCategoryPay" value={filters.category} onChange={handleFilterChange}>
                <option value="">Todas</option>
                {paymentCategories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ')}</option>)}
            </ModalSelect>
          </FilterGroup>
          <FilterGroup>
            <ModalLabel htmlFor="referenceMonthInputPay">Mês/Ano Ref.:</ModalLabel>
            <ModalInput type="month" name="referenceMonthInput" id="referenceMonthInputPay" value={filters.year && filters.month ? `${filters.year}-${filters.month.padStart(2, '0')}` : ''} onChange={handleMonthYearFilterChange} />
          </FilterGroup>
          <FilterButton onClick={applyFilters}><FaFilter /> Filtrar</FilterButton>
          <FilterButton onClick={clearFilters} clear><FaSyncAlt /> Limpar</FilterButton>
        </FiltersContainer>
      )}

      {payments.length > 0 ? (
        <PaymentsGrid>
          {payments.map(p => {
            const clientName = p.client ? `${p.client.firstName} ${p.client.lastName}` : 'N/A';
            const amountText = Number(p.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
            const payDateText = p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('pt-PT') : 'N/A';
            const refMonthText = p.referenceMonth || 'N/A';
            const categoryText = (p.category || '').replace(/_/g, ' ') || 'N/A';
            const statusText = (p.status || '').replace(/_/g, ' ') || 'N/A';
            const registeredBy = p.registeredBy ? p.registeredBy.firstName : 'N/A';

            return (
              <PaymentCard key={p.id}>
                <CardHeader>
                  <CardTitleBlock>
                    <CardTitle title={clientName}>{clientName}</CardTitle>
                    <CardSubtitle title={`${refMonthText} • ${payDateText}`}>{refMonthText} • {payDateText}</CardSubtitle>
                  </CardTitleBlock>
                  <Pill title={amountText}>{amountText}</Pill>
                </CardHeader>

                <CardBody>
                  <InfoRow>
                    <InfoLabel>ID</InfoLabel>
                    <InfoValue title={String(p.id)}>{p.id}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Categoria</InfoLabel>
                    <InfoValue title={categoryText}>{categoryText}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Status</InfoLabel>
                    <InfoValue title={statusText}>{statusText}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Registado</InfoLabel>
                    <InfoValue title={registeredBy}>{registeredBy}</InfoValue>
                  </InfoRow>
                  <div>
                    <ModalLabel style={{ marginBottom: 6 }}>Atualizar Status</ModalLabel>
                    <ModalSelect
                      value={p.status}
                      onChange={(e) => handleChangePaymentStatus(p.id, e.target.value)}
                      style={{ width: '100%' }}
                    >
                      {paymentStatusesForAdminSet.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')}</option>
                      ))}
                    </ModalSelect>
                  </div>
                </CardBody>

                <CardFooter>
                  <ActionButton danger onClick={() => handleDeletePayment(p.id)} title="Eliminar" aria-label="Eliminar">
                    <FaTrashAlt />
                  </ActionButton>
                </CardFooter>
              </PaymentCard>
            );
          })}
        </PaymentsGrid>
      ) : (
        <ErrorText style={{ textAlign: 'center' }}>
          Nenhum pagamento encontrado com os filtros atuais.
        </ErrorText>
      )}

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}><FaTimes /></CloseButton>
            <ModalTitle>Registar Novo Pagamento</ModalTitle>
            {modalError && <ModalErrorText>{modalError}</ModalErrorText>}
            <ModalForm onSubmit={handleFormSubmit}>
              <ModalLabel>Cliente*</ModalLabel>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <FilterToggleButton
                  type="button"
                  onClick={() => setClientMode('existing')}
                  style={{ opacity: clientMode === 'existing' ? 1 : 0.75 }}
                >
                  Cliente existente
                </FilterToggleButton>
                <FilterToggleButton
                  type="button"
                  onClick={() => setClientMode('new')}
                  style={{ opacity: clientMode === 'new' ? 1 : 0.75 }}
                >
                  Novo cliente
                </FilterToggleButton>
              </div>

              {clientMode === 'existing' ? (
                <SearchableSelect
                  id="modalUserIdPayForm"
                  name="userId"
                  value={currentPaymentData.userId || ''}
                  onChange={handleFormChange}
                  options={userList}
                  getOptionLabel={(user) => {
                    const base = `${user.firstName} ${user.lastName}`;
                    const tag = user.isExternalClient ? ' (cliente externo)' : '';
                    return `${base}${tag} (${user.email})`;
                  }}
                  getOptionValue={(user) => user.id}
                  placeholder="Selecione um cliente..."
                  searchPlaceholder="Pesquisar cliente..."
                  searchable={true}
                  required={false}
                />
              ) : (
                <ModalInput
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Escreva o nome do cliente (ex.: João Silva)"
                  required={false}
                />
              )}

              <ModalLabel htmlFor="modalAmountPayForm">Valor (EUR)*</ModalLabel>
              <ModalInput type="number" name="amount" id="modalAmountPayForm" value={currentPaymentData.amount} onChange={handleFormChange} required step="0.01" min="0.01" />
              
              <ModalLabel htmlFor="modalReferenceMonthPayForm">Mês de Referência*</ModalLabel>
              <MonthRow>
                <ModalInput
                  type="month"
                  name="referenceMonth"
                  id="modalReferenceMonthPayForm"
                  value={currentPaymentData.referenceMonth}
                  onChange={handleFormChange}
                  required
                  style={{ flex: 1 }}
                />
                <CalendarIconButton type="button" onClick={openPaymentDatePicker} aria-label="Escolher data do pagamento">
                  <FaCalendarAlt />
                </CalendarIconButton>
              </MonthRow>

              <HiddenDateInput
                ref={paymentDateInputRef}
                type="date"
                name="paymentDate"
                id="modalPaymentDatePayForm"
                value={currentPaymentData.paymentDate}
                onChange={handleFormChange}
                required
              />

              <ModalLabel htmlFor="modalCategoryPayForm">Categoria*</ModalLabel>
              <ModalSelect name="category" id="modalCategoryPayForm" value={currentPaymentData.category} onChange={handleFormChange} required>
                {paymentCategories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ')}</option>
                ))}
              </ModalSelect>

              <ModalLabel htmlFor="modalStatusPayForm">Status Inicial*</ModalLabel>
              <ModalSelect name="status" id="modalStatusPayForm" value={currentPaymentData.status} onChange={handleFormChange} required>
                {paymentStatusesForCreate.map(status => (
                  <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}</option>
                ))}
              </ModalSelect>

              {/* Descrição removida para manter o modal compacto */}

              <ModalActions>
                <ModalButton type="button" secondary onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}>
                  <FaMoneyBillWave style={{marginRight: '8px'}} /> {formLoading ? 'A Registar...' : 'Registar Pagamento'}
                </ModalButton>
              </ModalActions>
            </ModalForm>
          </ModalContent>
        </ModalOverlay>
      )}

      <ConfirmationModal
        isOpen={showStatusChangeConfirmModal}
        onClose={() => {
          if (!actionLoading) {
            setShowStatusChangeConfirmModal(false);
            setPaymentToAction(null);
            setActionType(null);
          }
        }}
        onConfirm={handleChangeStatusConfirm}
        title="Alterar Status do Pagamento"
        message={paymentToAction && actionType === 'status' ? `Tens a certeza que queres alterar o status do pagamento ID ${paymentToAction.id} para "${paymentToAction.status}"?` : ''}
        confirmText="Confirmar"
        cancelText="Cancelar"
        danger={false}
        loading={actionLoading}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => {
          if (!actionLoading) {
            setShowDeleteConfirmModal(false);
            setPaymentToAction(null);
            setActionType(null);
          }
        }}
        onConfirm={handleDeletePaymentConfirm}
        title="Eliminar Pagamento"
        message={paymentToAction && actionType === 'delete' ? `Tens a certeza que queres eliminar o pagamento ID ${paymentToAction.id}?` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger={true}
        loading={actionLoading}
      />
    </PageContainer>
  );
};

export default AdminManagePaymentsPage;