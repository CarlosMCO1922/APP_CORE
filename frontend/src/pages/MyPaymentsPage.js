// src/pages/MyPaymentsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { clientGetMyPayments, clientAcceptPayment } from '../services/paymentService';
import { createStripePaymentIntentForSignal } from '../services/paymentService'; // Precisamos desta nova função no service

// Importações do Stripe
import { loadStripe } from '@stripe/stripe-js'; // ADICIONAR IMPORT
import { Elements } from '@stripe/react-stripe-js'; // ADICIONAR IMPORT
import StripeCheckoutForm from '../components/Forms/StripeCheckoutForm';

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

const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 1050; padding: 20px;`;
const ModalContent = styled.div` background-color: #252525; /* Um pouco mais claro para o modal */ padding: 25px 30px; border-radius: 10px; width: 100%; max-width: 500px; box-shadow: 0 8px 25px rgba(0,0,0,0.5); position: relative;`;
const ModalTitle = styled.h2` color: #D4AF37; margin-top: 0; margin-bottom: 20px; font-size: 1.5rem; text-align: center;`;
const CloseButton = styled.button` position: absolute; top: 10px; right: 15px; background: transparent; border: none; color: #aaa; font-size: 1.8rem; cursor: pointer; &:hover { color: #fff; } `;

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
        setPageError('');
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
    if (queryParams.get('payment_confirmed') === 'true') {
        const paymentIntentId = queryParams.get('payment_intent_id');
        setPageSuccessMessage(`Processamento do pagamento ${paymentIntentId ? `(ID: ${paymentIntentId})` : ''} iniciado. O status será atualizado em breve.`);
        fetchMyPayments();
        navigate(location.pathname, { replace: true });
    } else if (queryParams.get('payment_error')) {
        setPageError(`Ocorreu um erro com o pagamento: ${queryParams.get('payment_error_message') || 'Tente novamente.'}`);
        navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, fetchMyPayments]);


  const handleInitiateStripePayment = async (payment) => {
    if (payment.status !== 'pendente' || (payment.category !== 'sinal_consulta' && payment.category !== 'consulta_fisioterapia' && payment.category !== 'mensalidade_treino' /* Adapta categorias pagáveis */)) {
        setPageError("Este tipo de pagamento não pode ser processado online ou já não está pendente.");
        return;
    }

    setActionLoading(payment.id);
    setStripeError('');
    setPageSuccessMessage('');
    setPageError('');

    try {
      const intentResponse = await createStripePaymentIntentForSignal(payment.id, authState.token);
      setStripeClientSecret(intentResponse.clientSecret);
      setCurrentPaymentDetails({
        id: payment.id,
        amount: payment.amount,
        description: payment.description || `Pagamento ID ${payment.id}` // Melhorar descrição se possível
      });
      setShowStripeModal(true);
    } catch (err) {
      setPageError(err.message || 'Falha ao iniciar o processo de pagamento. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStripePaymentSuccess = (paymentIntent) => {
    setShowStripeModal(false);
    setStripeClientSecret(null);
    setPageSuccessMessage(`Pagamento para "${currentPaymentDetails?.description}" processado! O status será atualizado em breve.`);
    setCurrentPaymentDetails(null);
    fetchMyPayments();
  };

  const handleStripePaymentError = (errorMessage) => {
    setStripeError(errorMessage);
    // Opcional: não fechar o modal para que o utilizador possa ver o erro no formulário
    // setShowStripeModal(false);
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

      {pageError && <ErrorText>{pageError}</ErrorText>}
      {pageSuccessMessage && <MessageText>{pageSuccessMessage}</MessageText>}

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
                <td><StatusBadge className={payment.status.toLowerCase()}>{payment.status ? payment.status.replace(/_/g, ' ') : 'N/A'}</StatusBadge></td>
                <td>
                  {payment.status === 'pendente' && 
                   (payment.category === 'sinal_consulta' || payment.category === 'consulta_fisioterapia' || payment.category === 'mensalidade_treino' /* Adapta categorias */) && (
                    <ActionButton
                        onClick={() => handleInitiateStripePayment(payment)}
                        disabled={actionLoading === payment.id}
                    >
                      {actionLoading === payment.id ? 'Aguarde...' : `Pagar ${payment.category === 'sinal_consulta' ? 'Sinal' : 'Online'}`}
                    </ActionButton>
                  )}
                  {/* Considerar outros status/categorias se necessário */}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        !pageError && <NoItemsText>Ainda não tens pagamentos registados.</NoItemsText>
      )}

      {/* Modal para Pagamento com Stripe */}
      {showStripeModal && stripeClientSecret && currentPaymentDetails && (
        <ModalOverlay onClick={() => { setShowStripeModal(false); setStripeError('');} }>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px'}}>
            <CloseButton onClick={() => { setShowStripeModal(false); setStripeError('');} }>&times;</CloseButton>
            <ModalTitle>Pagar: {currentPaymentDetails.description}</ModalTitle>
            {stripeError && <ErrorText style={{textAlign: 'left', margin: '0 0 15px 0'}}>{stripeError}</ErrorText>}
            {/* O Elements provider agora deve vir do index.js ou App.js */}
            {/* Garante que stripePromise está acessível ou é recriado aqui se Elements estiver aqui */}
            <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret, appearance: { theme: 'night', labels: 'floating' } }}>
              <StripeCheckoutForm
                clientSecret={stripeClientSecret}
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