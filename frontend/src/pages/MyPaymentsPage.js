// src/pages/MyPaymentsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

import { clientGetMyPayments, createStripePaymentIntentForSignal, clientConfirmManualPayment } from '../services/paymentService';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckoutForm from '../components/Forms/StripeCheckoutForm';
import { useToast } from '../components/Toast/ToastProvider';
import BackArrow from '../components/BackArrow';
import ConfirmationModal from '../components/Common/ConfirmationModal';

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
  position: relative;
  background-color: ${props => props.theme.colors.cardBackground};

  /* Estilos da Scrollbar */
  &::-webkit-scrollbar { height: 8px; }
  &::-webkit-scrollbar-track { background: ${({ theme }) => theme.colors.scrollbarTrackBg}; border-radius: 4px; }
  &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colors.scrollbarThumbBg}; border-radius: 4px; }
  &::-webkit-scrollbar-thumb:hover { background: ${({ theme }) => theme.colors.buttonSecondaryHoverBg}; }
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
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }
  &:disabled {
    background-color: ${props => props.theme.colors.buttonSecondaryBg};
    color: ${props => props.theme.colors.textMuted};
    cursor: not-allowed;
  }
`;


const ConfirmButton = styled(ActionButton)`
    background-color: ${({ theme }) => theme.colors.success};
    &:hover:not(:disabled) {
        background-color: ${({ theme }) => theme.colors.successDark};
    }
`;

const RefreshButton = styled.button`
  padding: 8px 12px;
  font-size: 0.85rem;
  border-radius: ${props => props.theme.borderRadius};
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease;
  font-weight: 500;
  min-width: 80px;
  margin: 2px;
  
  background-color: ${({ theme }) => theme.colors.primary}; 
  color: ${({ theme }) => theme.colors.textButton};

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  &:disabled {
    background-color: ${props => props.theme.colors.buttonSecondaryBg};
    color: ${props => props.theme.colors.textMuted};
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

const HeaderActions = styled.div`
  text-align: center;
  margin-bottom: 20px;
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
  background-color: ${({ theme }) => theme.colors.hoverRowBg};
  border-color: ${({ theme }) => theme.colors.cardBorder};
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
    color: ${({ theme }) => theme.colors.textMain};
  }
`;

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: ${({ theme }) => theme.colors.overlayBg};
  display: flex; justify-content: center; align-items: center;
  z-index: 1050; padding: 20px;
`;
const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker};
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
  color: ${({ theme }) => theme.colors.textMuted}; font-size: 1.8rem; cursor: pointer;
  &:hover { color: ${({ theme }) => theme.colors.textMain}; }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  justify-content: space-between;
`;

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const MyPaymentsPage = () => {
  const { authState } = useAuth();
  const { addToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [pageSuccessMessage, setPageSuccessMessage] = useState('');
  const [pageInfoMessage, setPageInfoMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [currentPaymentDetails, setCurrentPaymentDetails] = useState(null);
  const [viewDirection, setViewDirection] = useState('right');
  const [showConfirmPaymentModal, setShowConfirmPaymentModal] = useState(false);
  const [paymentToConfirm, setPaymentToConfirm] = useState(null);

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
addToast('Falha ao carregar pagamentos.', { type: 'error', category: 'payment' });
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
addToast('Não foi possível iniciar o pagamento online.', { type: 'error', category: 'payment' });
      }
    } catch (err) {
      setPageError(err.message || 'Falha ao iniciar o processo de pagamento. Tente novamente.');
addToast('Falha ao iniciar o pagamento.', { type: 'error', category: 'payment' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPayment = (payment) => {
    if (payment.status !== 'pendente' || payment.category !== 'mensalidade_treino') {
        setPageError("Apenas mensalidades pendentes podem ser confirmadas desta forma.");
        return;
    }
    setPaymentToConfirm(payment);
    setShowConfirmPaymentModal(true);
  };

  const handleConfirmPaymentConfirm = async () => {
    if (!paymentToConfirm) return;
    setActionLoading(paymentToConfirm.id);
    setPageError(''); 
    setPageSuccessMessage(''); 
    setPageInfoMessage('');
    setShowConfirmPaymentModal(false);
    try {
      await clientConfirmManualPayment(paymentToConfirm.id, authState.token);
      setPageSuccessMessage(`Pagamento ID ${paymentToConfirm.id} confirmado com sucesso!`);
      addToast('Pagamento confirmado!', { type: 'success', category: 'payment' });
      setPaymentToConfirm(null);
      setTimeout(() => fetchMyPayments(false), 2000);
    } catch (err) {
      setPageError(err.message || `Falha ao confirmar o pagamento ID ${paymentToConfirm.id}. Tente novamente.`);
      addToast('Falha ao confirmar pagamento.', { type: 'error', category: 'payment' });
      setPaymentToConfirm(null);
    } finally {
      setActionLoading(null);
    }
  };



  const handleStripePaymentSuccess = (paymentIntent) => {
    setShowStripeModal(false);
    setStripeClientSecret(null);
    setPageSuccessMessage(`O pagamento para \"${currentPaymentDetails?.description}\" foi processado! O estado atualizará em breve.`);
addToast('Pagamento processado com sucesso!', { type: 'success', category: 'payment' });
    setCurrentPaymentDetails(null);
    setTimeout(() => fetchMyPayments(false), 3000);
  };

  const handleStripePaymentError = (errorMessage) => {
    console.error("Stripe Payment Error:", errorMessage);
addToast('Erro no pagamento Stripe.', { type: 'error', category: 'payment' });
  };

  const handleStripeRequiresAction = (paymentIntent) => {
    console.log("Stripe - Ação Requerida:", paymentIntent);
    setPageInfoMessage("Foram geradas referências. Utilize os dados no formulário para completar o pagamento.");
addToast('Referência gerada. Siga as instruções no formulário.', { type: 'info', category: 'payment' });
  };

  const handleRefreshPayments = () => {
    setPageInfoMessage('A atualizar...');
    setPageError(''); setPageSuccessMessage('');
    fetchMyPayments().finally(() => setTimeout(() => setPageInfoMessage(''), 2000));
  };

if (loading && !showStripeModal) {
    return (
      <PageContainer>
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
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j}>
                      <div style={{height: 12, background: '#444', borderRadius: 6, opacity: 0.25, animation: 'pulse 1.2s ease-in-out infinite'}} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
        <style>{`@keyframes pulse { 0%{opacity:.2} 50%{opacity:.5} 100%{opacity:.2} }`}</style>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <BackArrow to="/dashboard" />
          <Title style={{ margin: 0, textAlign: 'left', flex: 1 }}>Pagamentos</Title>
        </div>
        <HeaderActions>
          <RefreshButton onClick={handleRefreshPayments} disabled={loading}>
            {loading ? 'A atualizar...' : 'Atualizar Lista'}
          </RefreshButton>
        </HeaderActions>
      </Header>

      {pageError && !showStripeModal && <ErrorText>{pageError}</ErrorText>}
      {pageSuccessMessage && !showStripeModal && <MessageText>{pageSuccessMessage}</MessageText>}
      {pageInfoMessage && !showStripeModal && <InfoText>{pageInfoMessage}</InfoText>}

      {payments.length > 0 ? (
        <>
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
{payments.slice(0, visibleCount).map(payment => (
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
        {payments.length > visibleCount && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <RefreshButton onClick={() => setVisibleCount(c => c + 20)}>Mostrar mais</RefreshButton>
          </div>
        )}
        </>
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

      <ConfirmationModal
        isOpen={showConfirmPaymentModal}
        onClose={() => {
          if (actionLoading === null) {
            setShowConfirmPaymentModal(false);
            setPaymentToConfirm(null);
          }
        }}
        onConfirm={handleConfirmPaymentConfirm}
        title="Confirmar Pagamento"
        message={paymentToConfirm ? `Tem a certeza que deseja marcar a mensalidade ID ${paymentToConfirm.id} como paga?` : ''}
        confirmText="Confirmar"
        cancelText="Cancelar"
        danger={false}
        loading={actionLoading !== null}
      />
    </PageContainer>
  );
};

export default MyPaymentsPage;