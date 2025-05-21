// src/pages/MyPaymentsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { clientGetMyPayments, clientAcceptPayment } from '../services/paymentService';

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
  text-align: center;
`;

const Table = styled.table`
  width: 100%;
  max-width: 900px; 
  margin: 20px auto;
  border-collapse: collapse;
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
  tr:last-child td {
    border-bottom: none;
  }
  td:last-child { 
    text-align: center;
  }
`;

const ActionButton = styled.button`
  padding: 8px 15px;
  font-size: 0.9rem;
  border-radius: 5px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease;
  background-color: #D4AF37;
  color: #1A1A1A;
  font-weight: 500;

  &:hover {
    background-color: #e6c358;
  }
  &:disabled {
    background-color: #555;
    color: #888;
    cursor: not-allowed;
  }
`;

const StatusBadge = styled.span`
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: capitalize;
  color: white;
  min-width: 80px; /* Largura mínima para consistência */
  display: inline-block; /* Para que padding e text-align funcionem bem */
  text-align: center;

  &.pendente { background-color: #FFA000; }
  &.pago { background-color: #4CAF50; }
  &.cancelado, &.rejeitado { background-color: #D32F2F; }
`;

const LoadingText = styled.p` font-size: 1.1rem; text-align: center; padding: 20px; color: #D4AF37;`;
const ErrorText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #FF6B6B; background-color: rgba(255,107,107,0.15); border: 1px solid #FF6B6B; border-radius: 8px; margin: 15px auto; max-width: 600px;`;
const MessageText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #66BB6A; background-color: rgba(102,187,106,0.15); border: 1px solid #66BB6A; border-radius: 8px; margin: 15px auto; max-width: 600px;`;
const NoItemsText = styled.p` font-size: 1rem; color: #a0a0a0; text-align: center; padding: 20px 0; `;

const StyledLink = styled(Link)`
  color: #D4AF37;
  font-size: 1.1rem;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const MyPaymentsPage = () => {
  const { authState } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // Para desabilitar o botão específico

  const fetchMyPayments = useCallback(async () => {
    if (authState.token) {
      try {
        setLoading(true);
        setError('');
        setSuccessMessage(''); // Limpa mensagens anteriores
        const data = await clientGetMyPayments(authState.token);
        setPayments(data);
      } catch (err) {
        setError(err.message || 'Não foi possível carregar os seus pagamentos.');
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token]);

  useEffect(() => {
    fetchMyPayments();
  }, [fetchMyPayments]);

  const handleAcceptPayment = async (paymentId) => {
    // Adicionar uma confirmação mais explícita para pagamentos de sinal
    const paymentToAccept = payments.find(p => p.id === paymentId);
    let confirmMessage = 'Confirmas que este pagamento foi realizado e queres marcá-lo como pago?';
    if (paymentToAccept && paymentToAccept.category === 'sinal_consulta') {
      confirmMessage = `Confirmas o pagamento do sinal de ${Number(paymentToAccept.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} para esta consulta? Após a confirmação, a consulta será marcada como confirmada.`;
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }
    setActionLoading(paymentId); // Desabilita o botão específico
    setError('');
    setSuccessMessage('');
    try {
      const response = await clientAcceptPayment(paymentId, authState.token);
      setSuccessMessage(response.message || 'Pagamento aceite com sucesso!');
      // Atualizar a lista de pagamentos para refletir a mudança de status
      setPayments(prevPayments => 
        prevPayments.map(p => 
          p.id === paymentId ? { ...p, status: 'pago' } : p
        )
      );
      // Opcional: forçar um re-fetch completo se houver mais dados que possam mudar
      // fetchMyPayments();
    } catch (err) {
      setError(err.message || 'Falha ao aceitar o pagamento.');
    } finally {
      setActionLoading(null); // Re-habilita o botão (ou remove-o se já não for uma ação válida)
    }
  };

  if (loading) {
    return <PageContainer><LoadingText>A carregar os seus pagamentos...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <Title>Meus Pagamentos</Title>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <StyledLink to="/dashboard">
            ‹ Voltar ao Meu Painel
        </StyledLink>
      </div>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

      {payments.length > 0 ? (
        <Table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data Registo</th>
              <th>Mês Ref.</th>
              <th>Descrição</th> {/* Adicionado para mais detalhes */}
              <th>Categoria</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td>{payment.id}</td>
                <td>{new Date(payment.paymentDate).toLocaleDateString('pt-PT')}</td>
                <td>{payment.referenceMonth}</td>
                <td>{payment.description || 'N/A'}</td> {/* Mostrar descrição */}
                <td>{payment.category.replace(/_/g, ' ')}</td>
                <td>{Number(payment.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</td>
                <td><StatusBadge className={payment.status.toLowerCase()}>{payment.status.replace(/_/g, ' ')}</StatusBadge></td>
                <td>
                  {payment.status === 'pendente' && (
                    <ActionButton
                        onClick={() => handleAcceptPayment(payment.id)}
                        disabled={actionLoading === payment.id}
                    >
                      {actionLoading === payment.id ? 'A processar...' : (payment.category === 'sinal_consulta' ? 'Pagar Sinal' : 'Aceitar Pagamento')}
                    </ActionButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <NoItemsText>Ainda não tens pagamentos registados.</NoItemsText>
      )}
    </PageContainer>
  );
};

export default MyPaymentsPage;