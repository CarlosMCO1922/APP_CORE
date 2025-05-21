// src/components/Forms/StripeCheckoutForm.js
import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styled from 'styled-components'; // Se quiseres estilizar

// Podes usar os teus styled components para botões, mensagens, etc.
// Exemplo:
const FormContainer = styled.form`
  padding: 20px;
  background-color: #2C2C2C; // Cor de fundo do modal
  border-radius: 8px;
`;

const ErrorMessage = styled.p`
  color: #FF6B6B; // errorColor
  font-size: 0.9rem;
  margin-top: 10px;
  text-align: center;
`;

const SubmitButton = styled.button`
  background-color: #D4AF37; // coreGold
  color: #1A1A1A; // coreBlack
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  width: 100%;
  margin-top: 20px;

  &:hover:not(:disabled) {
    background-color: #e6c358;
  }
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

const StripeCheckoutForm = ({ clientSecret, paymentDetails, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setMessage("Stripe.js ainda não carregou.");
      return;
    }
    setIsLoading(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // URL para onde o utilizador será redirecionado após o pagamento (ou após autenticação 3D Secure)
        // Esta URL deve ser uma página na tua app que pode mostrar uma mensagem de sucesso/erro
        // ou verificar o status do PaymentIntent.
        // Para pagamentos de sinal, podes redirecionar de volta para MyPaymentsPage ou uma página de confirmação.
        return_url: `${window.location.origin}/meus-pagamentos?payment_confirmed=true&payment_intent_id=${clientSecret.substring(0, clientSecret.indexOf('_secret_'))}`, // Simplificado
      },
      redirect: 'if_required', // Só redireciona se for necessário para autenticação (ex: 3D Secure)
    });

    if (error) {
      setMessage(error.message || "Ocorreu um erro inesperado.");
      if (onError) onError(error.message);
      setIsLoading(false);
      return;
    }

    // Se redirect: 'if_required' e não houve redirecionamento, o pagamento foi bem-sucedido aqui
    // (ou falhou e foi tratado acima).
    // O status final é melhor confirmado via webhooks no backend.
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage(`Pagamento de ${Number(paymentDetails.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} realizado com sucesso!`);
      if (onSuccess) onSuccess(paymentIntent);
    } else if (paymentIntent && paymentIntent.status === 'processing') {
      setMessage("O seu pagamento está a ser processado.");
    } else if (paymentIntent) {
       // Ex: 'requires_payment_method', 'requires_confirmation', 'requires_action'
      setMessage(`Status do pagamento: ${paymentIntent.status}. Siga as instruções, se houver.`);
    }
    // Não precisamos fazer nada mais aqui se foi redirecionado, pois o return_url tratará disso.

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "tabs" // ou "accordion" ou "auto"
  }

  return (
    <FormContainer onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      <SubmitButton disabled={isLoading || !stripe || !elements} id="submit">
        <span id="button-text">
          {isLoading ? "A processar..." : `Pagar ${Number(paymentDetails.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}`}
        </span>
      </SubmitButton>
      {message && <ErrorMessage id="payment-message">{message}</ErrorMessage>}
    </FormContainer>
  );
};

export default StripeCheckoutForm;