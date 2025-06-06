// src/components/Forms/StripeCheckoutForm.js
import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styled from 'styled-components';

const FormContainer = styled.form`
  padding: 20px;
  background-color: #2C2C2C;
  border-radius: 8px;
`;

const StatusMessage = styled.p`
  color: ${props => {
    if (props.type === 'error') return props.theme.colors.error || '#FF6B6B';
    if (props.type === 'success') return props.theme.colors.success || '#66BB6A';
    if (props.type === 'info') return props.theme.colors.textMuted || '#a0a0a0'; 
    return props.theme.colors.textMuted || '#a0a0a0';
  }};
  background-color: ${props => {
    if (props.type === 'error') return props.theme.colors.errorBg || 'rgba(255,107,107,0.1)';
    if (props.type === 'success') return props.theme.colors.successBg || 'rgba(102,187,106,0.15)';
    if (props.type === 'info' && props.important) return '#3a3a3a'; 
    return 'transparent';
  }};
  border: 1px solid ${props => {
    if (props.type === 'error') return props.theme.colors.error || '#FF6B6B';
    if (props.type === 'success') return props.theme.colors.success || '#66BB6A';
    if (props.type === 'info' && props.important) return props.theme.colors.primary || '#D4AF37';
    return 'transparent';
  }};
  font-size: 0.9rem;
  margin-top: 15px;
  margin-bottom: ${props => (props.type === 'info' && props.important ? '20px' : '0')}; // Mais margem para detalhes MB
  padding: ${props => (props.type === 'error' || props.type === 'success' || (props.type === 'info' && props.important)) ? '10px 15px' : '0'};
  border-radius: ${props => (props.type === 'error' || props.type === 'success' || (props.type === 'info' && props.important)) ? (props.theme.borderRadius || '6px') : '0'};
  text-align: center;
  white-space: pre-wrap;
`;

const SubmitButton = styled.button`
  background-color: ${props => props.theme.colors.primary || '#D4AF37'};
  color: ${props => props.theme.colors.textDark || '#1A1A1A'};
  padding: 12px 20px;
  border: none;
  border-radius: ${props => props.theme.borderRadius || '6px'};
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  width: 100%;
  margin-top: 25px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background-color: #e6c358;
  }
  &:disabled {
    background-color: ${props => props.theme.colors.buttonSecondaryBg || '#555'};
    color: ${props => props.theme.colors.textMuted || '#888'};
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-left-color: ${props => props.theme.colors.textDark || '#1A1A1A'};
  border-radius: 50%;
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
  margin-right: 10px;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Componente para mostrar detalhes do Multibanco
const MultibancoDetailsContainer = styled.div`
  margin-top: 20px;
  padding: 20px;
  background-color: #383838; /* Cor de fundo ligeiramente diferente para destaque */
  border-radius: ${props => props.theme.borderRadius || '6px'};
  border: 1px solid ${props => props.theme.colors.primary || '#D4AF37'};
  color: ${props => props.theme.colors.textMain || '#E0E0E0'};

  h4 {
    color: ${props => props.theme.colors.primary || '#D4AF37'};
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 1.2rem; /* Aumentar um pouco */
    text-align: center;
  }
  p {
    margin: 8px 0;
    font-size: 1rem; /* Aumentar um pouco */
    line-height: 1.6;
    strong {
      font-weight: 600; /* Manter como estava ou ajustar para props.theme.colors.textMain se preferir */
      color: ${props => props.theme.colors.primary}; /* Destacar os valores */
    }
  }
  .instructions {
    margin-top: 15px;
    font-size: 0.9rem;
    color: ${props => props.theme.colors.textMuted};
  }
`;


const StripeCheckoutForm = ({ paymentDetails, onSuccess, onError, onRequiresAction }) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const [multibancoNextAction, setMultibancoNextAction] = useState(null);

  useEffect(() => {
    if (!stripe) {
      setMessage('Stripe.js não carregou. Por favor, verifica a tua ligação ou tenta mais tarde. Se o problema persistir, contacta o suporte.');
      setMessageType('error');
      console.error("StripeCheckoutForm: Instância Stripe não disponível. Verifica a chave publicável e a ligação.");
    } else if (!elements) {
      setMessage('Elementos do Stripe não carregaram. Por favor, tenta novamente em instantes.');
      setMessageType('error');
      console.error("StripeCheckoutForm: Instância Elements não disponível.");
    } else {
      setMessage(null); 
      setMessageType('info');
    }
  }, [stripe, elements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setMessage("Formulário de pagamento não está pronto. Tente novamente em instantes.");
      setMessageType('error');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setMultibancoNextAction(null); 
    setMessage("A processar o teu pagamento...");
    setMessageType('info');
    const returnUrl = `${window.location.origin}/meus-pagamentos?payment_attempted=true&internal_payment_id=${paymentDetails?.id || 'unknown'}&payment_method_confirmed=true`;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'if_required',
    });

    setIsLoading(false);

    if (error) {
      const errorMessage = error.message || "Ocorreu um erro inesperado durante o pagamento.";
      console.error("Erro no stripe.confirmPayment:", error);
      setMessage(errorMessage);
      setMessageType('error');
      if (onError) onError(errorMessage);
      return;
    }

    if (paymentIntent) {
      console.log("Resultado da PaymentIntent (StripeCheckoutForm):", paymentIntent);
      if (paymentIntent.status === 'succeeded') {
        setMessage(`Pagamento de ${Number(paymentDetails.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} realizado com sucesso!`);
        setMessageType('success');
        if (onSuccess) onSuccess(paymentIntent);
      } else if (paymentIntent.status === 'processing') {
        setMessage("O seu pagamento está a ser processado. Serás notificado em breve.");
        setMessageType('info');
        if (onSuccess) onSuccess(paymentIntent);
      } 
      else if (paymentIntent.status === 'requires_action' && paymentIntent.next_action?.type === 'multibanco_display_details') {
        setMessage("Referências Multibanco geradas. Por favor, usa os dados abaixo para completar o pagamento. O estado na página de 'Meus Pagamentos' será atualizado após a confirmação do pagamento.");
        setMessageType('info');
        setMultibancoNextAction(paymentIntent.next_action.multibanco_display_details);
        if (onRequiresAction) onRequiresAction(paymentIntent); 
      } 
      else if (paymentIntent.status === 'requires_payment_method') {
        setMessage(`O pagamento falhou: ${paymentIntent.last_payment_error?.message || 'Por favor, tenta outro método ou verifica os teus dados.'}`);
        setMessageType('error');
        if (onError) onError(paymentIntent.last_payment_error?.message || `Status: ${paymentIntent.status}`);
      }
      else {
        setMessage(`Status do pagamento: ${paymentIntent.status}. ${paymentIntent.last_payment_error?.message || 'Ocorreu um problema.'}`);
        setMessageType('error');
        if (onError) onError(`Status do pagamento: ${paymentIntent.status}. ${paymentIntent.last_payment_error?.message || ''}`);
      }
    } else if (!error) {
        setMessage("A redirecionar para passos adicionais de autenticação...");
        setMessageType('info');
    }
  };

  if (!stripe || !elements) {
    return <StatusMessage type={messageType}>{message || "A inicializar formulário de pagamento..."}</StatusMessage>;
  }

  return (
    <FormContainer onSubmit={handleSubmit}>
      {!multibancoNextAction && (
        <PaymentElement id="payment-element" options={{layout: "tabs"}} />
      )}
      
      {multibancoNextAction && (
        <MultibancoDetailsContainer>
          <h4>Pagamento por Multibanco</h4>
          <p>Utiliza os dados abaixo para efetuar o pagamento no Multibanco ou no teu Homebanking.</p>
          <p><strong>Entidade:</strong> {multibancoNextAction.entity}</p>
          <p><strong>Referência:</strong> {multibancoNextAction.reference}</p>
          <p><strong>Valor:</strong> {(multibancoNextAction.amount / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</p>
          {multibancoNextAction.expires_at && (
            <p><strong>Expira em:</strong> {new Date(multibancoNextAction.expires_at * 1000).toLocaleString('pt-PT', { dateStyle: 'full', timeStyle: 'short' })}</p>
          )}
          <p className="instructions">Após o pagamento, o estado será atualizado automaticamente na página "Meus Pagamentos" assim que o sistema confirmar a transação.</p>
        </MultibancoDetailsContainer>
      )}

      {/* O botão de pagar só aparece se não houver detalhes Multibanco para mostrar E o pagamento não estiver já num estado final (sucedido, processando) */}
      {!multibancoNextAction && messageType !== 'success' && !(isLoading && message === "A processar o teu pagamento...") && (
        <SubmitButton disabled={isLoading || !stripe || !elements} id="submit">
          {isLoading && <Spinner />} 
          <span id="button-text">
            {isLoading ? "A processar..." : `Pagar ${Number(paymentDetails?.amount || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}`}
          </span>
        </SubmitButton>
      )}
      {message && (!multibancoNextAction || messageType === 'error') && (
        <StatusMessage id="payment-message" type={messageType} important={!!multibancoNextAction}>
          {message}
        </StatusMessage>
      )}
    </FormContainer>
  );
};
export default StripeCheckoutForm;