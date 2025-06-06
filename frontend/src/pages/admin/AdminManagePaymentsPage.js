// src/pages/admin/AdminManagePaymentsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
import { FaMoneyBillWave, FaPlus, FaTrashAlt, FaFilter, FaSyncAlt, FaArrowLeft, FaTimes } from 'react-icons/fa';

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

const Subtitle = styled.p`
  font-size: clamp(0.9rem, 2vw, 1rem);
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  font-weight: 300;
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
    background-color: #e6c358;
    transform: translateY(-2px);
  }
  @media (max-width: 550px) {
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
    background-color: #333;
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
    background-color: ${({ theme, clear }) => clear ? theme.colors.buttonSecondaryHoverBg : '#e6c358'};
  }
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};

  &::-webkit-scrollbar { height: 8px; background-color: #252525; }
  &::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
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
    background-color: #303030;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    position: sticky; 
    top: 0; 
    z-index: 1;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover { background-color: #2c2c2c; }
  td.actions-cell { text-align: right; }
  td.status-cell select {
    padding: 5px 8px;
    font-size: 0.8rem;
    background-color: #333;
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
  &:disabled { background-color: #404040; color: #777; cursor: not-allowed; }
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
  margin-top: 25px; padding-top: 15px;
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
  const [payments, setPayments] = useState([]);
  const [userList, setUserList] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [pageSuccessMessage, setPageSuccessMessage] = useState('');

  const [filters, setFilters] = useState({ userId: '', status: '', category: '', year: '', month: '' });

  const [showModal, setShowModal] = useState(false);
  const [currentPaymentData, setCurrentPaymentData] = useState(initialPaymentFormState);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');

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
        setPayments(paymentsData); setUserList(usersData); setTotalPaid(totalPaidData.totalPaid);
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

  const applyFilters = () => { fetchPageData(filters); };
  const clearFilters = () => { setFilters({ userId: '', status: '', category: '', year: '', month: '' }); };


  const handleOpenCreateModal = () => { setCurrentPaymentData(initialPaymentFormState); setModalError(''); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setModalError(''); };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true); setModalError(''); setPageError(''); setPageSuccessMessage('');
    const dataToSend = { ...currentPaymentData, amount: parseFloat(currentPaymentData.amount) };
    if (!dataToSend.userId || isNaN(dataToSend.amount) || dataToSend.amount <= 0 || !dataToSend.paymentDate || !dataToSend.referenceMonth || !dataToSend.category) {
        setModalError("Campos obrigatórios: Cliente, Valor (>0), Data do Pagamento, Mês de Referência, Categoria.");
        setFormLoading(false); return;
    }
    try {
      await adminCreatePayment(dataToSend, authState.token);
      setPageSuccessMessage('Pagamento criado com sucesso!');
      fetchPageData(filters); handleCloseModal();
    } catch (err) {
      setModalError(err.message || 'Falha ao criar pagamento.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangePaymentStatus = async (paymentId, newStatus) => {
    if (!window.confirm(`Tens a certeza que queres alterar o status do pagamento ID ${paymentId} para "${newStatus}"?`)) return;
    setPageError(''); setPageSuccessMessage('');
    try {
        await adminUpdatePaymentStatus(paymentId, newStatus, authState.token);
        setPageSuccessMessage(`Status do pagamento ID ${paymentId} atualizado para "${newStatus}".`);
        fetchPageData(filters); 
    } catch (err) {
        setPageError(err.message || 'Falha ao atualizar status do pagamento.');
    }
  };

  const handleDeletePayment = async (paymentId) => { 
    if (!window.confirm(`Tens a certeza que queres eliminar o pagamento ID ${paymentId}?`)) return;
    setPageError(''); setPageSuccessMessage('');
    try {
        await adminDeletePayment(paymentId, authState.token);
        setPageSuccessMessage('Pagamento eliminado com sucesso.');
        fetchPageData(filters);
    } catch (err) {
        setPageError(err.message || 'Falha ao eliminar pagamento.');
    }
  };

  if (loading && !showModal) {
    return <PageContainer><LoadingText>A carregar pagamentos...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <HeaderContainer>
        <TitleContainer>
            <Title>Gestão de Pagamentos</Title>
            <Subtitle>Registar e acompanhar pagamentos dos clientes.</Subtitle>
        </TitleContainer>
        <CreateButton onClick={handleOpenCreateModal}><FaPlus /> Registar Pagamento</CreateButton>
      </HeaderContainer>
      <BackLink to="/admin/dashboard"><FaArrowLeft /> Voltar ao Painel Admin</BackLink>

      {pageError && <ErrorText>{pageError}</ErrorText>}
      {pageSuccessMessage && <MessageText>{pageSuccessMessage}</MessageText>}

      <TotalPaidContainer>
        Total Recebido (Status "Pago"): <span>{Number(totalPaid).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
      </TotalPaidContainer>

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

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Valor</th>
              <th>Data Pag.</th>
              <th>Mês Ref.</th>
              <th>Categoria</th>
              <th style={{minWidth: '150px'}}>Status</th>
              <th>Registado Por</th>
              <th className="actions-cell">Ações</th>
            </tr>
          </thead>
          <tbody>
            {payments.length > 0 ? payments.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.client ? `${p.client.firstName} ${p.client.lastName}` : 'N/A'}</td>
                <td>{Number(p.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</td>
                <td>{new Date(p.paymentDate).toLocaleDateString('pt-PT')}</td>
                <td>{p.referenceMonth}</td>
                <td>{p.category.replace(/_/g, ' ')}</td>
                <td className="status-cell">
                  <ModalSelect 
                      value={p.status} 
                      onChange={(e) => handleChangePaymentStatus(p.id, e.target.value)}
                  >
                      {paymentStatusesForAdminSet.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')}</option>)}
                  </ModalSelect>
                </td>
                <td>{p.registeredBy ? p.registeredBy.firstName : 'N/A'}</td>
                <td className="actions-cell">
                  <ActionButtonContainer>
                    <ActionButton danger onClick={() => handleDeletePayment(p.id)}>
                        <FaTrashAlt /> Eliminar
                    </ActionButton>
                  </ActionButtonContainer>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Nenhum pagamento encontrado com os filtros atuais.</td></tr>
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}><FaTimes /></CloseButton>
            <ModalTitle>Registar Novo Pagamento</ModalTitle>
            {modalError && <ModalErrorText>{modalError}</ModalErrorText>}
            <ModalForm onSubmit={handleFormSubmit}>
              <ModalLabel htmlFor="modalUserIdPayForm">Cliente*</ModalLabel>
              <ModalSelect name="userId" id="modalUserIdPayForm" value={currentPaymentData.userId} onChange={handleFormChange} required>
                <option value="">Selecione um cliente</option>
                {userList.map(user => (
                  <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.email})</option>
                ))}
              </ModalSelect>

              <ModalLabel htmlFor="modalAmountPayForm">Valor (EUR)*</ModalLabel>
              <ModalInput type="number" name="amount" id="modalAmountPayForm" value={currentPaymentData.amount} onChange={handleFormChange} required step="0.01" min="0.01" />
              
              <ModalLabel htmlFor="modalPaymentDatePayForm">Data do Pagamento*</ModalLabel>
              <ModalInput type="date" name="paymentDate" id="modalPaymentDatePayForm" value={currentPaymentData.paymentDate} onChange={handleFormChange} required />

              <ModalLabel htmlFor="modalReferenceMonthPayForm">Mês de Referência*</ModalLabel>
              <ModalInput type="month" name="referenceMonth" id="modalReferenceMonthPayForm" value={currentPaymentData.referenceMonth} onChange={handleFormChange} required />

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

              <ModalLabel htmlFor="modalDescriptionPayForm">Descrição (Opcional)</ModalLabel>
              <ModalTextarea name="description" id="modalDescriptionPayForm" value={currentPaymentData.description} onChange={handleFormChange} />

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
    </PageContainer>
  );
};

export default AdminManagePaymentsPage;