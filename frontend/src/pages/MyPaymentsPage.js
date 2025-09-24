// src/pages/MyPaymentsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

import { clientGetMyPayments, createStripePaymentIntentForSignal, clientConfirmManualPayment } from '../services/paymentService';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckoutForm from '../components/Forms/StripeCheckoutForm';
import { FaArrowLeft} from 'react-icons/fa';

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textMain};
  min-height: 100vh;
  padding: 20px 40px;
  font-family: ${props => props.theme.fonts.main};
  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const Title = styled.h1`
  font-size: 2.2rem;
  color: ${props => props.theme.colors.textMain};
  margin-bottom: 25px;
  text-align: center;
  @media (max-width: 480px) {
    font-size: 1.8rem;
  }
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto; /* Permite scroll horizontal */
  -webkit-overflow-scrolling: touch;
  margin-top: 20px;
  border-radius: ${props => props.theme.borderRadius};
  box-shadow: ${props => props.theme.boxShadow};
  position: relative;
  background-color: ${props => props.theme.colors.cardBackground};

  /* Estilos da Scrollbar */
  &::-webkit-scrollbar { height: 8px; }
  &::-webkit-scrollbar-track { background: #2c2c2c; border-radius: 4px; }
  &::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
  &::-webkit-scrollbar-thumb:hover { background: #666; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;

  th, td {
    border-bottom: 1px solid ${props => props.theme.colors.cardBorder};
    padding: 10px 12px;
    text-align: left;
    font-size: 0.9rem;
    white-space: nowrap;
    vertical-align: middle;
  }

  th {
    background-color: ${ props => props.theme.colors.cardBackground};
    color: ${props => props.theme.colors.primary};
    font-weight: 600;
    position: sticky;
    z-index: 10;
  }

  thead {
      background-color: ${ props => props.theme.colors.cardBackground};
  }

  tbody tr {
      background-color: ${props => props.theme.colors.background};
      &:hover {
         background-color: ${ props => props.theme.colors.backgroundSelect};
      }
  }

  tr:last-child td {
    border-bottom: none;
  }

  td:last-child {
    text-align: center;
    white-space: normal;
  }

  @media (min-width: 768px) {
    th, td {
        padding: 12px 15px;
        font-size: 0.95rem;
    }
  }
`;


const ActionButton = styled.button`
  padding: 8px 12px;
  font-size: 0.85rem;
  border-radius: ${props => props.theme.borderRadius};
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease;
  background-color: ${({ theme }) => theme.colors.primary}; 
  color: ${({ theme }) => theme.colors.textDark};
  font-weight: 500;
  min-width: 80px;
  margin: 2px;

  &:hover:not(:disabled) {
    background-color: #e6c358;
  }
  &:disabled {
    background-color: ${props => props.theme.colors.buttonSecondaryBg};
    color: ${props => props.theme.colors.textMuted};
    cursor: not-allowed;
  }
`;

const BackButton = styled.button` // MUDOU de Link para button
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.2s;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ConfirmButton = styled(ActionButton)`
    background-color: #4CAF50; // Verde
    &:hover:not(:disabled) {
        background-color: #66BB6A;
    }
`;

const RefreshButton = styled(ActionButton)`
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.textButton};
  margin-top: 10px;
  &:hover:not(:disabled) {
    background-color: #e6c358;
  }
`;

const StatusBadge = styled.span`
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: capitalize;
  color: white;
  min-width: 80px;
  display: inline-block;
  text-align: center;

  &.pendente { background-color: #FFA000; }
  &.pago, &.confirmada { background-color: ${props => props.theme.colors.success || '#66BB6A'}; }
  &.cancelado, &.rejeitado { background-color: ${props => props.theme.colors.error || '#FF6B6B'}; }
  &.processando { background-color: #2196F3; }
`;

const LoadingText = styled.p`
  font-size: 1.1rem;
  text-align: center;
  padding: 20px;
  color: ${props => props.theme.colors.primary};
`;
const ErrorText = styled.p`
  font-size: 1rem;
  text-align: center;
  padding: 12px;
  color: ${props => props.theme.colors.error};
  background-color: ${props => props.theme.colors.errorBg};
  border: 1px solid ${props => props.theme.colors.error};
  border-radius: ${props => props.theme.borderRadius};
  margin: 15px auto;
  max-width: 600px;
`;
const MessageText = styled.p`
  font-size: 1rem;
  text-align: center;
  padding: 12px;
  color: ${props => props.theme.colors.success};
  background-color: ${props => props.theme.colors.successBg};
  border: 1px solid ${props => props.theme.colors.success};
  border-radius: ${props => props.theme.borderRadius};
  margin: 15px auto;
  max-width: 600px;
`;
const InfoText = styled(MessageText)`
  color: ${props => props.theme.colors.textMuted};
  background-color: #2a2a2a;
  border-color: #444;
`;
const NoItemsText = styled.p`
  font-size: 1rem;
  color: ${props => props.theme.colors.textMuted};
  text-align: center;
  padding: 20px 0;
`;
const StyledLink = styled(Link)`
  color: ${props => props.theme.colors.primary};
  font-size: 1.1rem;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
    color: #fff;
  }
`;

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.85);
  display: flex; justify-content: center; align-items: center;
  z-index: 1050; padding: 20px;
`;
const ModalContent = styled.div`
  background-color: #1F1F1F;
  padding: 25px 30px;
  border-radius: 10px; width: 100%; max-width: 500px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.6); position: relative;
`;
const ModalTitle = styled.h2`
  color: ${props => props.theme.colors.primary};
  margin-top: 0; margin-bottom: 20px;
  font-size: 1.5rem; text-align: center;
`;
const CloseButton = styled.button`
  position: absolute; top: 10px; right: 15px;
  background: transparent; border: none;
  color: #aaa; font-size: 1.8rem; cursor: pointer;
  &:hover { color: #fff; }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
`;

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const MyPaymentsPage = () => {
  const { authState } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [pageSuccessMessage, setPageSuccessMessage] = useState('');
  const [pageInfoMessage, setPageInfoMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [currentPaymentDetails, setCurrentPaymentDetails] = useState(null);
  const [viewDirection, setViewDirection] = useState('right');

  const location = useLocation();
  const navigate = useNavigate();

  const fetchMyPayments = useCallback(async (showLoadingIndicator = true) => {
    if (authState.token) {
      try {
        if (showLoadingIndicator) setLoading(true);
        const data = await clientGetMyPayments(authState.token);
        setPayments(data);
        setPageError('');
      } catch (err) {
        setPageError(err.message || 'Não foi possível carregar os seus pagamentos.');
      } finally {
        if (showLoadingIndicator) setLoading(false);
      }
    }
  }, [authState.token]);

  useEffect(() => {
    fetchMyPayments();
  }, [fetchMyPayments]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('payment_attempted') === 'true') {
        const internalPaymentId = queryParams.get('internal_payment_id');
        setPageInfoMessage(
          `O pagamento para ID ${internalPaymentId} foi recebido pelo Stripe. O estado final será atualizado aqui em breve. Pode precisar de atualizar.`
        );
        navigate(location.pathname, { replace: true });
        const timer = setTimeout(() => {
            fetchMyPayments(false);
        }, 5000);
        return () => clearTimeout(timer);
    }
  }, [location, navigate, fetchMyPayments]);

  const handleInitiateStripePayment = async (payment) => {
    const pagableOnlineCategories = ['sinal_consulta', 'consulta_fisioterapia'];
    if (payment.status !== 'pendente' || !pagableOnlineCategories.includes(payment.category)) {
        setPageError("Este tipo de pagamento não está configurado para pagamento online ou já não está pendente.");
        return;
    }
    setActionLoading(payment.id);
    setPageError(''); setPageSuccessMessage(''); setPageInfoMessage('');
    try {
      const intentResponse = await createStripePaymentIntentForSignal(payment.id, authState.token);
      if (intentResponse && intentResponse.clientSecret) {
        setStripeClientSecret(intentResponse.clientSecret);
        setCurrentPaymentDetails({ id: payment.id, amount: payment.amount, description: payment.description || `Pagamento ID ${payment.id}` });
        setShowStripeModal(true);
      } else {
        setPageError('Não foi possível iniciar o pagamento. Detalhes não recebidos do servidor.');
      }
    } catch (err) {
      setPageError(err.message || 'Falha ao iniciar o processo de pagamento. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPayment = async (payment) => {
    if (payment.status !== 'pendente' || payment.category !== 'mensalidade_treino') {
        setPageError("Apenas mensalidades pendentes podem ser confirmadas desta forma.");
        return;
    }
    if (!window.confirm(`Tem a certeza que deseja marcar a mensalidade ID ${payment.id} como paga?`)) {
        return;
    }
    setActionLoading(payment.id);
    setPageError(''); setPageSuccessMessage(''); setPageInfoMessage('');
    try {
      await clientConfirmManualPayment(payment.id, authState.token);
      setPageSuccessMessage(`Pagamento ID ${payment.id} confirmado com sucesso!`);
      setTimeout(() => fetchMyPayments(false), 2000);
    } catch (err) {
      setPageError(err.message || `Falha ao confirmar o pagamento ID ${payment.id}. Tente novamente.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBack = () => {
    setViewDirection('left');
    navigate('/dashboard');
  };


  const handleStripePaymentSuccess = (paymentIntent) => {
    setShowStripeModal(false);
    setStripeClientSecret(null);
    setPageSuccessMessage(`O pagamento para "${currentPaymentDetails?.description}" foi processado! O estado atualizará em breve.`);
    setCurrentPaymentDetails(null);
    setTimeout(() => fetchMyPayments(false), 3000);
  };

  const handleStripePaymentError = (errorMessage) => {
    console.error("Stripe Payment Error:", errorMessage);
  };

  const handleStripeRequiresAction = (paymentIntent) => {
    console.log("Stripe - Ação Requerida:", paymentIntent);
    setPageInfoMessage("Foram geradas referências. Utilize os dados no formulário para completar o pagamento.");
  };

  const handleRefreshPayments = () => {
    setPageInfoMessage('A atualizar...');
    setPageError(''); setPageSuccessMessage('');
    fetchMyPayments().finally(() => setTimeout(() => setPageInfoMessage(''), 2000));
  };

  if (loading && !showStripeModal) {
    return <PageContainer><LoadingText>A carregar os seus pagamentos...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={handleBack}><FaArrowLeft /></BackButton>
        <Title>Pagamentos</Title>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <RefreshButton onClick={handleRefreshPayments} disabled={loading}>
            {loading ? 'A atualizar...' : 'Atualizar Lista'}
          </RefreshButton>
        </div>
      </Header>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <StyledLink to="/dashboard">
            ‹ Voltar ao Meu Painel
        </StyledLink>
      </div>

      {pageError && !showStripeModal && <ErrorText>{pageError}</ErrorText>}
      {pageSuccessMessage && !showStripeModal && <MessageText>{pageSuccessMessage}</MessageText>}
      {pageInfoMessage && !showStripeModal && <InfoText>{pageInfoMessage}</InfoText>}

      {payments.length > 0 ? (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <th>Data Registo</th>
                <th>Mês Ref.</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td>{new Date(payment.paymentDate).toLocaleDateString('pt-PT')}</td>
                  <td>{payment.referenceMonth || 'N/A'}</td>
                  <td>{payment.description || 'N/A'}</td>
                  <td>{payment.category ? payment.category.replace(/_/g, ' ') : 'N/A'}</td>
                  <td>{Number(payment.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</td>
                  <td>
                    <StatusBadge className={payment.status ? payment.status.toLowerCase() : ''}>
                      {payment.status ? payment.status.replace(/_/g, ' ') : 'N/A'}
                    </StatusBadge>
                  </td>
                  <td>
                    {payment.status === 'pendente' &&
                     (payment.category === 'sinal_consulta' || payment.category === 'consulta_fisioterapia') && (
                      <ActionButton
                          onClick={() => handleInitiateStripePayment(payment)}
                          disabled={actionLoading === payment.id}
                      >
                        {actionLoading === payment.id ? 'Aguarde...' : `Pagar Online`}
                      </ActionButton>
                    )}
                    {payment.status === 'pendente' &&
                     (payment.category === 'mensalidade_treino') && (
                      <ConfirmButton
                          onClick={() => handleConfirmPayment(payment)}
                          disabled={actionLoading === payment.id}
                      >
                        {actionLoading === payment.id ? 'Aguarde...' : `Confirmar Pagamento`}
                      </ConfirmButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      ) : (
        !loading && !pageError && <NoItemsText>Ainda não tens pagamentos registados.</NoItemsText>
      )}

      {showStripeModal && stripeClientSecret && currentPaymentDetails && (
        <ModalOverlay onClick={() => { setShowStripeModal(false); } }>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => { setShowStripeModal(false); } }>&times;</CloseButton>
            <ModalTitle>Pagamento Seguro: {currentPaymentDetails.description}</ModalTitle>
            <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret, appearance: { theme: 'night', labels: 'floating' } }}>
              <StripeCheckoutForm
                paymentDetails={currentPaymentDetails}
                onSuccess={handleStripePaymentSuccess}
                onError={handleStripePaymentError}
                onRequiresAction={handleStripeRequiresAction}
              />
            </Elements>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default MyPaymentsPage;