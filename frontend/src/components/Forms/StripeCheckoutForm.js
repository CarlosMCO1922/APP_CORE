// src/components/Forms/StripeCheckoutForm.js
import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styled from 'styled-components';

const FormContainer = styled.form`
  padding: 20px;
  background-color: #2C2C2C;
  border-radius: 8px;
`;

const ErrorMessage = styled.p`
  color: ${props => props.theme.colors.error || '#FF6B6B'};
  font-size: 0.9rem;
  margin-top: 15px;
  margin-bottom: 0;
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
    if (!stripe) {
      setMessage('Stripe.js não carregou.');
      console.error("StripeCheckoutForm: Instância Stripe não disponível.");
    } else if (!elements) {
      setMessage('Elementos do Stripe não carregaram.');
      console.error("StripeCheckoutForm: Instância Elements não disponível.");
    } else {
      setMessage(null);
    }
  }, [stripe, elements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setMessage("Formulário de pagamento não está pronto. Tente novamente em instantes.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setMessage(null);

    // CORREÇÃO E SIMPLIFICAÇÃO DA RETURN_URL:
    const returnUrl = `${window.location.origin}/meus-pagamentos?payment_attempted=true&internal_payment_id=${paymentDetails?.id || 'unknown'}`;
    console.log("A tentar confirmar pagamento com return_url:", returnUrl); // DEBUG

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'if_required',
    });

    if (error) {
      const errorMessage = error.message || "Ocorreu um erro inesperado durante o pagamento.";
      console.error("Erro no stripe.confirmPayment:", error);
      setMessage(errorMessage);
      if (onError) onError(errorMessage);
      setIsLoading(false);
      return;
    }

    if (paymentIntent) {
      console.log("Resultado da PaymentIntent (StripeCheckoutForm):", paymentIntent);
      if (paymentIntent.status === 'succeeded') {
        setMessage(`Pagamento de ${Number(paymentDetails.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} realizado com sucesso!`);
        if (onSuccess) onSuccess(paymentIntent);
      } else if (paymentIntent.status === 'processing') {
        setMessage("O seu pagamento está a ser processado.");
      } else {
        setMessage(`Status do pagamento: ${paymentIntent.status}. ${paymentIntent.last_payment_error?.message || 'Por favor, siga as instruções ou tente novamente.'}`);
        if (onError) onError(`Status do pagamento: ${paymentIntent.status}. ${paymentIntent.last_payment_error?.message || ''}`);
      }
    }
    setIsLoading(false);
  };

  if (!stripe || !elements) {
    return <ErrorMessage>{message || "A inicializar formulário de pagamento..."}</ErrorMessage>;
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