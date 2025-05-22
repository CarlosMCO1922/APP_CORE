// src/components/Forms/StripeCheckoutForm.js
import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styled from 'styled-components';

const FormContainer = styled.form`
  padding: 20px;
  border-radius: 8px;
  background-color: #2C2C2C;
`;

const ErrorMessage = styled.p`
  color: ${props => props.theme.colors.error || '#FF6B6B'};
  font-size: 0.9rem;
  margin-top: 15px;
  margin-bottom: 0;
  text-align: center;
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

  &:hover:not(:disabled) {
    background-color: #e6c358;
  }
  &:disabled {
    background-color: ${props => props.theme.colors.buttonSecondaryBg || '#555'};
    color: ${props => props.theme.colors.textMuted || '#888'};
    cursor: not-allowed;
  }
`;

const StripeCheckoutForm = ({ paymentDetails, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe || !elements) {
      setMessage('Stripe não está pronto. Aguarde um momento.');
    } else {
      setMessage(null);
    }
  }, [stripe, elements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setMessage("Stripe.js ainda não carregou. Tente novamente em instantes.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setMessage(null);

    // CORREÇÃO DA RETURN_URL:
    // Usar o ID do seu pagamento interno para referência no retorno.
    const returnUrl = `${window.location.origin}/meus-pagamentos?payment_attempted=true&internal_payment_id=${paymentDetails?.id || 'unknown'}`;
    console.log("Return URL para Stripe (StripeCheckoutForm):", returnUrl);


    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'if_required',
    });

    if (error) {
      // Erros como "payment_intent_unexpected_state" podem acontecer se o PaymentIntent já foi processado.
      const errorMessage = error.message || "Ocorreu um erro inesperado durante o pagamento.";
      console.error("Erro no confirmPayment:", error);
      setMessage(errorMessage);
      if (onError) onError(errorMessage);
      setIsLoading(false);
      return;
    }

    if (paymentIntent) {
      if (paymentIntent.status === 'succeeded') {
        setMessage(`Pagamento de ${Number(paymentDetails.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} realizado com sucesso!`);
        if (onSuccess) onSuccess(paymentIntent);
      } else if (paymentIntent.status === 'processing') {
        setMessage("O seu pagamento está a ser processado.");
      } else {
        setMessage(`Status do pagamento: ${paymentIntent.status}. Tente novamente ou contacte o suporte se o problema persistir.`);
        if (onError) onError(`Status do pagamento: ${paymentIntent.status}`);
      }
    }
    setIsLoading(false);
  };

  if (!stripe || !elements) {
    return <ErrorMessage>{message || "A carregar formulário de pagamento..."}</ErrorMessage>;
  }

  return (
    <FormContainer onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={{layout: "tabs"}} />
      <SubmitButton disabled={isLoading || !stripe || !elements} id="submit">
        <span id="button-text">
          {isLoading ? "A processar..." : `Pagar ${Number(paymentDetails?.amount || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}`}
        </span>
      </SubmitButton>
      {message && <ErrorMessage id="payment-message">{message}</ErrorMessage>}
    </FormContainer>
  );
};

export default StripeCheckoutForm;