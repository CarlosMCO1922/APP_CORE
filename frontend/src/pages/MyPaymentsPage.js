// src/pages/MyPaymentsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { clientGetMyPayments, createStripePaymentIntentForSignal } from '../services/paymentService';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckoutForm from '../components/Forms/StripeCheckoutForm';

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
  color: ${props => props.theme.colors.primary};
  margin-bottom: 25px;
  text-align: center;
  @media (max-width: 480px) {
    font-size: 1.8rem;
  }
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto; /* Permite scroll horizontal se a tabela for mais larga que o contentor */
  -webkit-overflow-scrolling: touch; /* Melhora a experiência de scroll em iOS */
  margin-top: 20px;

  &::-webkit-scrollbar {
    height: 8px;
    background-color: #252525; /* Fundo da track da scrollbar */
  }
  &::-webkit-scrollbar-track {
    background: #2c2c2c;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #666;
  }
`;

const Table = styled.table`
  width: 100%;
  /* max-width: 900px; // Removido para permitir que TableWrapper controle o scroll */
  border-collapse: collapse;
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius};
  /* overflow: hidden; // Removido se causar problemas com sticky, TableWrapper pode ter border-radius */
  box-shadow: ${props => props.theme.boxShadow};

  th, td {
    border-bottom: 1px solid ${props => props.theme.colors.cardBorder};
    padding: 10px 12px;
    text-align: left;
    font-size: 0.9rem;
    white-space: nowrap; // Impede que o texto quebre e force as colunas a serem largas
  }

  th {
    background-color: #303030; 
    color: ${props => props.theme.colors.primary};
    font-weight: 600;
    position: sticky;
    top: 60px; /* ALTURA DA TUA NAVBAR FIXA. AJUSTA ESTE VALOR SE NECESSÁRIO! */
    z-index: 10; // Para ficar acima do tbody mas abaixo da navbar principal (que deve ter z-index maior)
  }
  
  thead th { // Garante que o fundo do cabeçalho é opaco ao fazer scroll
      background-color: #303030; // Deve ser a mesma cor de fundo do th
  }

  tr:last-child td {
    border-bottom: none;
  }
  
  td:last-child { 
    text-align: center;
    white-space: normal; // Permite que os botões nesta coluna quebrem linha se necessário
  }

  @media (min-width: 768px) { // Estilos para ecrãs maiores
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
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.textDark};
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

const RefreshButton = styled(ActionButton)`
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

  const location = useLocation();
  const navigate = useNavigate();

  const fetchMyPayments = useCallback(async (showLoadingIndicator = true) => {
    if (authState.token) {
      try {
        if (showLoadingIndicator) setLoading(true);
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
  }, [fetchMyPayments]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('payment_attempted') === 'true') {
        const internalPaymentId = queryParams.get('internal_payment_id');
        setPageInfoMessage(
          `O pagamento para ID ${internalPaymentId} foi recebido pelo Stripe. O estado final será atualizado aqui em breve (normalmente alguns segundos). Pode precisar de atualizar a página.`
        );
        navigate(location.pathname, { replace: true }); 
        const timer = setTimeout(() => {
            setPageInfoMessage(msg => msg ? (msg + " A verificar novamente...") : "A verificar estado do pagamento...");
            fetchMyPayments(false);
        }, 5000);
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
    setPageInfoMessage('');
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

  const handleStripePaymentSuccess = (paymentIntent) => {
    setShowStripeModal(false);
    setStripeClientSecret(null);
    setPageSuccessMessage(`O pagamento para "${currentPaymentDetails?.description}" foi processado pelo Stripe! O estado na lista deverá atualizar em breve.`);
    setCurrentPaymentDetails(null);
    setTimeout(() => {
        fetchMyPayments(false); 
        setPageInfoMessage(''); 
    }, 3000);
  };

  const handleStripePaymentError = (errorMessage) => { 
    console.error("Stripe Payment Error (MyPaymentsPage):", errorMessage);
    // O erro já é mostrado no StripeCheckoutForm.
  };

  const handleStripeRequiresAction = (paymentIntent) => { 
    console.log("Stripe - Ação Requerida (ex: Multibanco):", paymentIntent);
    setPageInfoMessage("Foram geradas referências para o método de pagamento escolhido. Por favor, utiliza os dados apresentados no formulário para completar o pagamento.");
    // O modal permanece aberto para mostrar os detalhes do Multibanco
  };

  const handleRefreshPayments = () => {
    setPageInfoMessage('A atualizar lista de pagamentos...');
    setPageError('');
    setPageSuccessMessage('');
    fetchMyPayments().finally(() => setTimeout(() => setPageInfoMessage(''), 3000)); // Limpa a mensagem de info após um tempo
  };

  if (loading && !showStripeModal) {
    return <PageContainer><LoadingText>A carregar os seus pagamentos...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <Title>Meus Pagamentos</Title>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <StyledLink to="/dashboard">
            ‹ Voltar ao Meu Painel
        </StyledLink>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <RefreshButton onClick={handleRefreshPayments} disabled={loading}>
          {loading && actionLoading !== 'refresh' ? 'A atualizar...' : 'Atualizar Lista'}
        </RefreshButton>
      </div>

      {pageError && !showStripeModal && <ErrorText>{pageError}</ErrorText>}
      {pageSuccessMessage && !showStripeModal && <MessageText>{pageSuccessMessage}</MessageText>}
      {pageInfoMessage && !showStripeModal && <InfoText>{pageInfoMessage}</InfoText>}

      {payments.length > 0 ? (
        <TableWrapper>
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