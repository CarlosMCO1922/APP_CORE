// src/pages/MyPaymentsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { clientGetMyPayments, createStripePaymentIntentForSignal } from '../services/paymentService';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckoutForm from '../components/Forms/StripeCheckoutForm';

// --- Styled Components (como na tua versão ou na minha sugestão anterior) ---
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

const RefreshButton = styled(ActionButton)` // NOVO
  background-color: ${props => props.theme.colors.buttonSecondaryBg};
  color: ${props => props.theme.colors.textMain};
  margin-top: 10px;
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.colors.buttonSecondaryHoverBg};
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
  &.processando { background-color: #2196F3; } // NOVO ESTILO PARA PROCESSANDO
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

const InfoText = styled(MessageText)` // NOVO
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

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const MyPaymentsPage = () => {
  const { authState } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [pageSuccessMessage, setPageSuccessMessage] = useState('');
  const [pageInfoMessage, setPageInfoMessage] = useState(''); // NOVO
  
  const [actionLoading, setActionLoading] = useState(null); 

  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [currentPaymentDetails, setCurrentPaymentDetails] = useState(null);
  // const [stripeError, setStripeError] = useState(''); // Removido, pois o StripeCheckoutForm trata internamente

  const location = useLocation();
  const navigate = useNavigate();

  const fetchMyPayments = useCallback(async (showLoadingIndicator = true) => { // Adicionado parâmetro
    if (authState.token) {
      try {
        if (showLoadingIndicator) setLoading(true);
        // Não limpar pageSuccessMessage ou pageInfoMessage aqui para que persistam
        // setPageError(''); // Limpar erro antigo antes de tentar buscar
        const data = await clientGetMyPayments(authState.token);
        setPayments(data);
      } catch (err) {
        setPageError(err.message || 'Não foi possível carregar os seus pagamentos.');
      } finally {
        if (showLoadingIndicator) setLoading(false);
      }
    }
  }, [authState.token]);

  useEffect(() => {
    fetchMyPayments();
  }, [fetchMyPayments]); // fetchMyPayments não muda, então só roda uma vez no mount

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('payment_attempted') === 'true') {
        const internalPaymentId = queryParams.get('internal_payment_id');
        setPageInfoMessage( // MUDADO PARA InfoText
          `O pagamento para ID ${internalPaymentId} foi recebido pelo Stripe. O estado final será atualizado aqui em breve (normalmente alguns segundos). Pode precisar de atualizar a página.`
        );
        // fetchMyPayments(); // Opcional: pode já ter sido chamado pelo mount
        navigate(location.pathname, { replace: true }); 
        // Considerar um re-fetch após um delay maior aqui, ou um botão de refresh
        const timer = setTimeout(() => {
            setPageInfoMessage(msg => msg + " A verificar novamente...");
            fetchMyPayments(false); // Re-fetch sem mostrar o loading principal
        }, 5000); // Tenta atualizar após 5 segundos
        return () => clearTimeout(timer);
    }
  }, [location, navigate, fetchMyPayments]);


  const handleInitiateStripePayment = async (payment) => {
    const pagableOnlineCategories = ['sinal_consulta', 'consulta_fisioterapia', 'mensalidade_treino'];
    if (payment.status !== 'pendente' || !pagableOnlineCategories.includes(payment.category)) {
        setPageError("Este tipo de pagamento não está configurado para pagamento online ou já não está pendente.");
        return;
    }

    setActionLoading(payment.id); 
    setPageSuccessMessage(''); 
    setPageError('');
    setPageInfoMessage(''); // Limpar InfoMessage

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
    setPageSuccessMessage(`O pagamento para "${currentPaymentDetails?.description}" foi processado pelo Stripe! O estado na lista deverá atualizar em breve.`);
    setCurrentPaymentDetails(null);
    setTimeout(() => {
        fetchMyPayments(false); // Re-fetch sem loading indicator principal
        setPageInfoMessage(''); // Limpa qualquer info message anterior
    }, 3000); // Delay para dar tempo ao webhook
  };

  const handleStripePaymentError = (errorMessage) => {
    console.error("Stripe Payment Error (MyPaymentsPage):", errorMessage);
    // O erro já é mostrado no StripeCheckoutForm, mas podemos fechar o modal se desejado
    // setShowStripeModal(false);
    // setPageError(`Falha no pagamento: ${errorMessage}`); // Mostrar erro na página principal se modal fechar
  };

  const handleRefreshPayments = () => {
    setPageInfoMessage('A atualizar lista de pagamentos...');
    setPageError('');
    setPageSuccessMessage('');
    fetchMyPayments().finally(() => setPageInfoMessage(''));
  };

  const handleStripeRequiresAction = (paymentIntent) => {
    console.log("Stripe - Ação Requerida (ex: Multibanco):", paymentIntent);
    // O StripeCheckoutForm já está a mostrar os detalhes do Multibanco.
    // Podes querer mudar o título do modal ou adicionar uma mensagem informativa na página principal.
    setPageInfoMessage("Foram geradas referências Multibanco. Por favor, utiliza os dados apresentados no formulário para completar o pagamento.");
    // Normalmente, não fechas o modal aqui, pois o utilizador precisa de ver as referências.
    // O fetchMyPayments() não vai mostrar o pagamento como "pago" imediatamente, só após o webhook.
};


  if (loading && !showStripeModal) {
    return <PageContainer><LoadingText>A carregar os seus pagamentos...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <Title>Meus Pagamentos</Title>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}> {/* Ajustado margin */}
        <StyledLink to="/dashboard">
            ‹ Voltar ao Meu Painel
        </StyledLink>
      </div>
      {/* NOVO: Botão de Refresh */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <RefreshButton onClick={handleRefreshPayments} disabled={loading}>
          {loading ? 'A atualizar...' : 'Atualizar Lista de Pagamentos'}
        </RefreshButton>
      </div>


      {pageError && !showStripeModal && <ErrorText>{pageError}</ErrorText>}
      {pageSuccessMessage && !showStripeModal && <MessageText>{pageSuccessMessage}</MessageText>}
      {pageInfoMessage && !showStripeModal && <InfoText>{pageInfoMessage}</InfoText>} {/* NOVO */}


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
        <ModalOverlay onClick={() => { setShowStripeModal(false); /* setStripeError(''); Não é mais necessário */ } }>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => { setShowStripeModal(false); /* setStripeError(''); */ } }>&times;</CloseButton>
            <ModalTitle>Pagamento Seguro: {currentPaymentDetails.description}</ModalTitle>
            
            <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret, appearance: { theme: 'night', labels: 'floating' } }}>
              <StripeCheckoutForm
                paymentDetails={currentPaymentDetails}
                onSuccess={handleStripePaymentSuccess}
                onError={handleStripePaymentError}
                onRequiresAction={handleStripeRequiresAction} // <-- Adiciona esta prop
              />
            </Elements>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default MyPaymentsPage;