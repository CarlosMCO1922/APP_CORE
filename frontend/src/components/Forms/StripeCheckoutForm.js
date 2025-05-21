// frontend/src/components/Forms/StripeCheckoutForm.js
import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styled from 'styled-components';

const FormContainer = styled.form`
  padding: 20px;
  border-radius: 8px;
`;
const SubmitButton = styled.button`
  background-color: ${props => props.theme.colors.primary || '#D4AF37'};
  color: ${props => props.theme.colors.textDark || '#1A1A1A'};
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
  margin-top: 20px;
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;
const ErrorMessage = styled.p`
  color: red;
  font-size: 0.9rem;
  margin-top: 10px;
  text-align: center;
`;

const StripeCheckoutForm = ({ paymentDetails, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  console.log("StripeCheckoutForm: stripe instance", stripe);
  console.log("StripeCheckoutForm: elements instance", elements);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) {
      console.error("Stripe.js não carregou ou Elements não está disponível.");
      setMessage("Stripe.js não carregou. Tente novamente em instantes.");
      return;
    }
    setIsLoading(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `<span class="math-inline">\{window\.location\.origin\}/meus\-pagamentos?payment\_attempted\=true&payment\_id\=</span>{paymentDetails.id}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      const errorMessage = error.message || "Ocorreu um erro inesperado.";
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
        setMessage(`Status do pagamento: ${paymentIntent.status}. Tente novamente ou contacte o suporte.`);
      }
    }
    setIsLoading(false);
  };

  if (!stripe || !elements) {
    return <ErrorMessage>A carregar o formulário de pagamento...</ErrorMessage>;
  }

  return (
    <FormContainer onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <SubmitButton disabled={isLoading || !stripe || !elements}>
        {isLoading ? "A processar..." : `Pagar ${Number(paymentDetails?.amount || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}`}
      </SubmitButton>
      {message && <ErrorMessage>{message}</ErrorMessage>}
    </FormContainer>
  );
};
export default StripeCheckoutForm;