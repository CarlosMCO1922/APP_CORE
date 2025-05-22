// src/pages/MyPaymentsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { clientGetMyPayments, createStripePaymentIntentForSignal } from '../services/paymentService';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckoutForm from '../components/Forms/StripeCheckoutForm';

// --- Styled Components (Mantidos os mesmos da tua versão anterior) ---
const PageContainer = styled.div`
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textMain};
  min-height: 100vh;
  padding: 20px 40px;
  font-family: ${props => props.theme.fonts.main};
`;

const Title = styled.h1`
  font-size: 2.2rem;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 25px;
  text-align: center;
`;

const Table = styled.table`
  width: 100%;
  max-width: 900px; 
  margin: 20px auto;
  border-collapse: collapse;
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius};
  overflow: hidden;
  box-shadow: ${props => props.theme.boxShadow};

  th, td {
    border-bottom: 1px solid ${props => props.theme.colors.cardBorder};
    padding: 12px 15px;
    text-align: left;
    font-size: 0.95rem;
  }
  th {
    background-color: #303030;
    color: ${props => props.theme.colors.primary};
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
  border-radius: ${props => props.theme.borderRadius};
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease;
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.textDark};
  font-weight: 500;
  min-width: 100px;

  &:hover:not(:disabled) {
    background-color: #e6c358;
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

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const MyPaymentsPage = () => {
  const { authState } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [pageSuccessMessage, setPageSuccessMessage] = useState('');
  
  const [actionLoading, setActionLoading] = useState(null); 

  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [currentPaymentDetails, setCurrentPaymentDetails] = useState(null);
  const [stripeError, setStripeError] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  const fetchMyPayments = useCallback(async () => {
    if (authState.token) {
      try {
        setLoading(true);
        // Não limpa pageError e pageSuccessMessage aqui para que persistam se vierem de outras ações
        const data = await clientGetMyPayments(authState.token);
        setPayments(data);
      } catch (err) {
        setPageError(err.message || 'Não foi possível carregar os seus pagamentos.');
      } finally {
        setLoading(false);
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
        // ***** INÍCIO DA ALTERAÇÃO *****
        setPageSuccessMessage(
          `Tentativa de pagamento para ID ${internalPaymentId} recebida pelo Stripe. O estado final será atualizado aqui em breve (normalmente alguns segundos). Por favor, aguarde.`
        );
        // ***** FIM DA ALTERAÇÃO *****
        fetchMyPayments(); 
        navigate(location.pathname, { replace: true }); 
    }
  }, [location, navigate, fetchMyPayments]);


  const handleInitiateStripePayment = async (payment) => {
    const pagableOnlineCategories = ['sinal_consulta', 'consulta_fisioterapia', 'mensalidade_treino'];
    if (payment.status !== 'pendente' || !pagableOnlineCategories.includes(payment.category)) {
        setPageError("Este tipo de pagamento não está configurado para pagamento online ou já não está pendente.");
        return;
    }

    setActionLoading(payment.id); 
    setStripeError('');
    setPageSuccessMessage(''); 
    setPageError('');

    try {
      const intentResponse = await createStripePaymentIntentForSignal(payment.id, authState.token);
      if (intentResponse && intentResponse.clientSecret) {
        setStripeClientSecret(intentResponse.clientSecret);
        setCurrentPaymentDetails({
          id: payment.id,
          amount: payment.amount,
          description: payment.description || `Pagamento ID ${payment.id}`
        });
        setShowStripeModal(true);
      } else {
        setPageError('Não foi possível iniciar o pagamento. Detalhes não recebidos do servidor.');
      }
    } catch (err) {
      console.error("Erro ao iniciar pagamento Stripe:", err);
      setPageError(err.message || 'Falha ao iniciar o processo de pagamento. Tente novamente.');
    } finally {
      setActionLoading(null); 
    }
  };

  const handleStripePaymentSuccess = (paymentIntent) => {
    setShowStripeModal(false);
    setStripeClientSecret(null);
    // ***** INÍCIO DA ALTERAÇÃO *****
    setPageSuccessMessage(`O pagamento para "${currentPaymentDetails?.description}" foi processado pelo Stripe! O estado na lista será atualizado em instantes.`);
    // ***** FIM DA ALTERAÇÃO *****
    setCurrentPaymentDetails(null);
    // Adiciona um pequeno delay antes de buscar novamente para dar tempo ao webhook
    setTimeout(() => {
        fetchMyPayments();
        // Opcional: limpar a mensagem de sucesso após alguns segundos
        // setTimeout(() => setPageSuccessMessage(''), 5000);
    }, 2500); // Aumentar ligeiramente o delay pode ajudar
  };

  const handleStripePaymentError = (errorMessage) => {
    // O erro já é mostrado dentro do StripeCheckoutForm.
    // Se o modal não fechar sozinho no erro, podemos adicionar lógica aqui para fechar ou mostrar erro global.
    console.error("Stripe Payment Error (capturado em MyPaymentsPage):", errorMessage);
    // Não é necessário setStripeError aqui pois o form interno já trata disso.
  };


  if (loading && !showStripeModal) {
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

      {pageError && !showStripeModal && <ErrorText>{pageError}</ErrorText>}
      {pageSuccessMessage && !showStripeModal && <MessageText>{pageSuccessMessage}</MessageText>}

      {payments.length > 0 ? (
        <Table>
          <thead>
            <tr>
              <th>ID</th>
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
                <td>{payment.id}</td>
                <td>{new Date(payment.paymentDate).toLocaleDateString('pt-PT')}</td>
                <td>{payment.referenceMonth}</td>
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
                   (payment.category === 'sinal_consulta' || payment.category === 'consulta_fisioterapia' || payment.category === 'mensalidade_treino') && (
                    <ActionButton
                        onClick={() => handleInitiateStripePayment(payment)}
                        disabled={actionLoading === payment.id}
                    >
                      {actionLoading === payment.id ? 'Aguarde...' : `Pagar Online`}
                    </ActionButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        !loading && !pageError && <NoItemsText>Ainda não tens pagamentos registados.</NoItemsText>
      )}

      {showStripeModal && stripeClientSecret && currentPaymentDetails && (
        <ModalOverlay onClick={() => { setShowStripeModal(false); setStripeError('');} }>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => { setShowStripeModal(false); setStripeError('');} }>&times;</CloseButton>
            <ModalTitle>Pagamento Seguro: {currentPaymentDetails.description}</ModalTitle>
            
            <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret, appearance: { theme: 'night', labels: 'floating' } }}>
              <StripeCheckoutForm
                paymentDetails={currentPaymentDetails}
                onSuccess={handleStripePaymentSuccess}
                onError={handleStripePaymentError}
              />
            </Elements>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default MyPaymentsPage;