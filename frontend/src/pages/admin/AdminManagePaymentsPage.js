// src/pages/admin/AdminManagePaymentsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { 
    adminGetAllPayments, 
    adminCreatePayment, 
    adminUpdatePaymentStatus, 
    adminDeletePayment, // Certifica-te que esta função existe e está correta no service
    adminGetTotalPaid
} from '../../services/paymentService';
import { adminGetAllUsers } from '../../services/userService';

// --- Styled Components ---
const PageContainer = styled.div` background-color: #1A1A1A; color: #E0E0E0; min-height: 100vh; padding: 20px 40px; font-family: 'Inter', sans-serif; `;
const Title = styled.h1` font-size: 2.2rem; color: #D4AF37; margin-bottom: 10px; `;
const Subtitle = styled.h2` font-size: 1.5rem; color: #b0b0b0; margin-bottom: 25px; font-weight: 400;`;
const Table = styled.table` width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #252525; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5); th, td { border-bottom: 1px solid #383838; padding: 10px 12px; text-align: left; font-size: 0.9rem; } th { background-color: #303030; color: #D4AF37; font-weight: 600; } tr:last-child td { border-bottom: none; } tr:hover { background-color: #2c2c2c; } `;
const ActionButton = styled.button` margin-right: 8px; padding: 6px 10px; font-size: 0.85rem; border-radius: 5px; cursor: pointer; border: none; transition: background-color 0.2s ease; background-color: ${props => props.danger ? '#D32F2F' : (props.secondary ? '#555' : '#D4AF37')}; color: ${props => props.danger ? 'white' : (props.secondary ? '#E0E0E0' : '#1A1A1A')}; &:hover { background-color: ${props => props.danger ? '#C62828' : (props.secondary ? '#666' : '#e6c358')}; } &:disabled { background-color: #404040; color: #777; cursor: not-allowed; } `;
const TopActionsContainer = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;`;
const CreateButtonStyled = styled.button` background-color: #D4AF37; color: #1A1A1A; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; border: none; cursor: pointer; transition: background-color 0.2s ease; &:hover { background-color: #e6c358; } `;
const LoadingText = styled.p` font-size: 1.1rem; text-align: center; padding: 20px; color: #D4AF37;`;
const ErrorText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #FF6B6B; background-color: rgba(255,107,107,0.15); border: 1px solid #FF6B6B; border-radius: 8px; margin: 15px 0;`;
const MessageText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #66BB6A; background-color: rgba(102,187,106,0.15); border: 1px solid #66BB6A; border-radius: 8px; margin: 15px 0;`;
const TotalPaidContainer = styled.div`
  background-color: #2C2C2C; padding: 15px 20px; border-radius: 8px;
  margin-bottom: 20px; text-align: center; font-size: 1.2rem;
  color: #D4AF37; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  span { color: white; font-size: 1.5rem; }
`;
const FiltersContainer = styled.div`
  display: flex; gap: 15px; margin-bottom: 20px; padding: 15px;
  background-color: #2C2C2C; border-radius: 8px; flex-wrap: wrap; align-items: flex-end;
  select, input[type="month"], input[type="text"] { /* Adicionado input text para ID Cliente */
    padding: 8px 10px; background-color: #383838; border: 1px solid #555;
    border-radius: 6px; color: #E0E0E0; font-size: 0.9rem; min-width: 150px;
  }
  button { 
    padding: 8px 15px; background-color: #D4AF37; color: #1A1A1A;
    border: none; border-radius: 6px; cursor: pointer; font-weight: 500;
    &:hover { background-color: #e6c358; }
  }
`;
const FilterGroup = styled.div` display: flex; flex-direction: column; gap: 5px;`;


const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.75); display: flex; justify-content: center; align-items: center; z-index: 1000; `;
const ModalContent = styled.div` background-color: #2C2C2C; padding: 30px 40px; border-radius: 10px; width: 100%; max-width: 550px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); position: relative; max-height: 90vh; overflow-y: auto; `;
const ModalTitle = styled.h2` color: #D4AF37; margin-top: 0; margin-bottom: 25px; font-size: 1.6rem; `;
const ModalForm = styled.form` display: flex; flex-direction: column; gap: 15px; `;
const ModalLabel = styled.label` font-size: 0.9rem; color: #b0b0b0; margin-bottom: 5px; display: block; `;
const ModalInput = styled.input` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; &:focus { outline: none; border-color: #D4AF37; } `;
const ModalTextarea = styled.textarea` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; min-height: 80px; &:focus { outline: none; border-color: #D4AF37; } `;
const ModalSelect = styled.select` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; &:focus { outline: none; border-color: #D4AF37; } `;
const ModalActions = styled.div` display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; `;
const ModalButton = styled.button` padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer; font-weight: 500; transition: background-color 0.2s ease; background-color: ${props => props.primary ? '#D4AF37' : '#555'}; color: ${props => props.primary ? '#1A1A1A' : '#E0E0E0'}; &:hover { background-color: ${props => props.primary ? '#e6c358' : '#666'}; } &:disabled { background-color: #404040; color: #777; cursor: not-allowed; } `;
const CloseButton = styled.button` 
  position: absolute; top: 15px; right: 20px; 
  background: transparent; border: none; 
  color: #aaa; font-size: 1.8rem; cursor: pointer;
  line-height: 1; padding: 0;
  &:hover { color: #fff; } 
`;

const initialPaymentFormState = {
  userId: '', amount: '',
  paymentDate: new Date().toISOString().split('T')[0],
  referenceMonth: `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`,
  category: 'mensalidade_treino', description: '', status: 'pendente',
};

const paymentCategories = ['treino_aula_avulso', 'mensalidade_treino', 'consulta_fisioterapia', 'outro'];
const paymentStatusesForFilter = ['', 'pendente', 'pago', 'cancelado', 'rejeitado']; // Para filtros
const paymentStatusesForAdminSet = ['pendente', 'pago', 'cancelado', 'rejeitado']; // Status que o admin pode definir na tabela
const paymentStatusesForCreate = ['pendente', 'pago']; // Status que admin pode definir ao criar


const AdminManagePaymentsPage = () => {
  const { authState } = useAuth();
  const [payments, setPayments] = useState([]);
  const [userList, setUserList] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [filters, setFilters] = useState({ userId: '', status: '', category: '', year: '', month: '' });

  const [showModal, setShowModal] = useState(false);
  const [currentPaymentData, setCurrentPaymentData] = useState(initialPaymentFormState);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');


  const fetchPageData = useCallback(async (currentFilters) => {
    if (authState.token) {
      try {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        
        const apiFilters = { ...currentFilters };
        if (currentFilters.year && currentFilters.month) {
            apiFilters.referenceMonth = `${currentFilters.year}-${currentFilters.month.padStart(2, '0')}`;
        } else if (currentFilters.year) {
            apiFilters.referenceMonth = `${currentFilters.year}-%`; // Para buscar por ano
        }
        delete apiFilters.year; // Remover para não enviar ao backend
        delete apiFilters.month;


        const [paymentsData, usersData, totalPaidData] = await Promise.all([
          adminGetAllPayments(apiFilters, authState.token),
          adminGetAllUsers(authState.token),
          adminGetTotalPaid(authState.token)
        ]);
        setPayments(paymentsData);
        setUserList(usersData);
        setTotalPaid(totalPaidData.totalPaid);
      } catch (err) {
        setError(err.message || 'Não foi possível carregar os dados da página de pagamentos.');
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token]);

  useEffect(() => {
    fetchPageData(filters);
  }, [fetchPageData, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMonthYearFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === "referenceMonthInput") {
        if (value) {
            const [year, month] = value.split('-');
            setFilters(prev => ({ ...prev, year, month }));
        } else {
            setFilters(prev => ({ ...prev, year: '', month: ''}));
        }
    } else {
       setFilters(prev => ({ ...prev, [name]: value }));
    }
  };


  const applyFilters = () => {
      fetchPageData(filters);
  };


  const handleOpenCreateModal = () => {
    setCurrentPaymentData(initialPaymentFormState);
    setModalError(''); 
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setModalError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setModalError('');
    setError(''); 
    setSuccessMessage('');

    const dataToSend = {
      ...currentPaymentData,
      amount: parseFloat(currentPaymentData.amount),
    };

    if (!dataToSend.userId || isNaN(dataToSend.amount) || dataToSend.amount <= 0 || !dataToSend.paymentDate || !dataToSend.referenceMonth || !dataToSend.category) {
        setModalError("Campos obrigatórios: Cliente, Valor, Data do Pagamento, Mês de Referência, Categoria.");
        setFormLoading(false);
        return;
    }

    try {
      await adminCreatePayment(dataToSend, authState.token);
      setSuccessMessage('Pagamento criado com sucesso!');
      fetchPageData(filters);
      handleCloseModal();
    } catch (err) {
      setModalError(err.message || 'Falha ao criar pagamento.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangePaymentStatus = async (paymentId, newStatus) => {
    if (!window.confirm(`Tens a certeza que queres alterar o status do pagamento ID ${paymentId} para "${newStatus}"?`)) return;
    setError(''); setSuccessMessage('');
    try {
        await adminUpdatePaymentStatus(paymentId, newStatus, authState.token);
        setSuccessMessage(`Status do pagamento ID ${paymentId} atualizado para "${newStatus}".`);
        fetchPageData(filters); // Recarrega com os filtros atuais
    } catch (err) {
        setError(err.message || 'Falha ao atualizar status do pagamento.');
    }
  };

  const handleDeletePayment = async (paymentId) => { 
    if (!window.confirm(`Tens a certeza que queres eliminar o pagamento ID ${paymentId}?`)) return;
    setError(''); setSuccessMessage('');
    try {
        await adminDeletePayment(paymentId, authState.token);
        setSuccessMessage('Pagamento eliminado com sucesso.');
        fetchPageData(filters);
    } catch (err) {
        setError(err.message || 'Falha ao eliminar pagamento.');
    }
  };

  if (loading && !showModal) {
    return <PageContainer><LoadingText>A carregar pagamentos...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <TopActionsContainer>
        <div>
            <Title>Gestão de Pagamentos</Title>
            <Subtitle>Registar e acompanhar pagamentos dos clientes.</Subtitle>
        </div>
        <CreateButtonStyled onClick={handleOpenCreateModal}>Registar Novo Pagamento</CreateButtonStyled>
      </TopActionsContainer>
      <Link to="/admin/dashboard" style={{color: '#D4AF37', marginBottom: '20px', display: 'inline-block', textDecoration:'none'}}>‹ Voltar ao Painel Admin</Link>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

      <TotalPaidContainer>
        Total Recebido (Status "Pago"): <span>{Number(totalPaid).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
      </TotalPaidContainer>

      <FiltersContainer>
        <FilterGroup>
          <ModalLabel htmlFor="filterUserId">Cliente:</ModalLabel>
          <ModalSelect name="userId" id="filterUserId" value={filters.userId} onChange={handleFilterChange}>
              <option value="">Todos</option>
              {userList.map(user => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
          </ModalSelect>
        </FilterGroup>
        <FilterGroup>
          <ModalLabel htmlFor="filterStatus">Status:</ModalLabel>
          <ModalSelect name="status" id="filterStatus" value={filters.status} onChange={handleFilterChange}>
              {paymentStatusesForFilter.map(s => <option key={s} value={s}>{s ? (s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')) : 'Todos'}</option>)}
          </ModalSelect>
        </FilterGroup>
        <FilterGroup>
          <ModalLabel htmlFor="filterCategory">Categoria:</ModalLabel>
          <ModalSelect name="category" id="filterCategory" value={filters.category} onChange={handleFilterChange}>
              <option value="">Todas</option>
              {paymentCategories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ')}</option>)}
          </ModalSelect>
        </FilterGroup>
        <FilterGroup>
          <ModalLabel htmlFor="referenceMonthInput">Mês/Ano Referência:</ModalLabel>
          <ModalInput type="month" name="referenceMonthInput" id="referenceMonthInput" value={filters.year && filters.month ? `${filters.year}-${filters.month.padStart(2, '0')}` : ''} onChange={handleMonthYearFilterChange} />
        </FilterGroup>
        <button onClick={applyFilters} style={{ alignSelf: 'flex-end', height: '38px' }}>Filtrar</button>
      </FiltersContainer>

      <Table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Valor</th>
            <th>Data Pag.</th>
            <th>Mês Ref.</th>
            <th>Categoria</th>
            <th>Status</th>
            <th>Registado Por</th>
            <th>Ações</th>
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
              <td>
                <ModalSelect 
                    value={p.status} 
                    onChange={(e) => handleChangePaymentStatus(p.id, e.target.value)}
                    style={{padding: '4px 6px', fontSize: '0.85rem', width: 'auto', minWidth: '100px'}}
                >
                    {paymentStatusesForAdminSet.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')}</option>)}
                </ModalSelect>
              </td>
              <td>{p.registeredBy ? p.registeredBy.firstName : 'N/A'}</td>
              <td>
                <ActionButton danger onClick={() => handleDeletePayment(p.id)}>Eliminar</ActionButton>
              </td>
            </tr>
          )) : (
            <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Nenhum pagamento encontrado com os filtros atuais.</td></tr>
          )}
        </tbody>
      </Table>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}>&times;</CloseButton>
            <ModalTitle>Registar Novo Pagamento</ModalTitle>
            {modalError && <ErrorText style={{marginBottom: '15px'}}>{modalError}</ErrorText>}
            <ModalForm onSubmit={handleFormSubmit}>
              <ModalLabel htmlFor="modalUserId">Cliente*</ModalLabel>
              <ModalSelect name="userId" id="modalUserId" value={currentPaymentData.userId} onChange={handleFormChange} required>
                <option value="">Selecione um cliente</option>
                {userList.map(user => (
                  <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.email})</option>
                ))}
              </ModalSelect>

              <ModalLabel htmlFor="modalAmount">Valor (EUR)*</ModalLabel>
              <ModalInput type="number" name="amount" id="modalAmount" value={currentPaymentData.amount} onChange={handleFormChange} required step="0.01" min="0.01" />
              
              <ModalLabel htmlFor="modalPaymentDate">Data do Pagamento*</ModalLabel>
              <ModalInput type="date" name="paymentDate" id="modalPaymentDate" value={currentPaymentData.paymentDate} onChange={handleFormChange} required />

              <ModalLabel htmlFor="modalReferenceMonth">Mês de Referência*</ModalLabel>
              <ModalInput type="month" name="referenceMonth" id="modalReferenceMonth" value={currentPaymentData.referenceMonth} onChange={handleFormChange} required />

              <ModalLabel htmlFor="modalCategory">Categoria*</ModalLabel>
              <ModalSelect name="category" id="modalCategory" value={currentPaymentData.category} onChange={handleFormChange} required>
                {paymentCategories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ')}</option>
                ))}
              </ModalSelect>

              <ModalLabel htmlFor="modalStatus">Status Inicial*</ModalLabel>
              <ModalSelect name="status" id="modalStatus" value={currentPaymentData.status} onChange={handleFormChange} required>
                {paymentStatusesForCreate.map(status => (
                  <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}</option>
                ))}
              </ModalSelect>

              <ModalLabel htmlFor="modalDescription">Descrição (Opcional)</ModalLabel>
              <ModalTextarea name="description" id="modalDescription" value={currentPaymentData.description} onChange={handleFormChange} />

              <ModalActions>
                <ModalButton type="button" onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}>
                  {formLoading ? 'A Registar...' : 'Registar Pagamento'}
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