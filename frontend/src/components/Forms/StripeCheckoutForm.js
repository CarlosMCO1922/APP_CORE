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

  // Adicionado para verificar se o clientSecret mudou, o que pode indicar um problema
  // ou a necessidade de re-renderizar o PaymentElement.
  // No entanto, o PaymentElement deve lidar com isso internamente se o Elements provider for atualizado.
  useEffect(() => {
    if (!clientSecret) {
      setMessage("Detalhes de pagamento em falta. Tente novamente.");
    } else {
        setMessage(null); // Limpa mensagens antigas se o clientSecret for válido
    }
  }, [clientSecret]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setMessage("Stripe.js ainda não carregou. Aguarde um momento.");
      return;
    }
    if (!clientSecret) {
        setMessage("Não foi possível iniciar o pagamento: detalhes em falta. Por favor, feche e tente novamente.");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setMessage(null);

    // Verifica o clientSecret antes de usá-lo no return_url para evitar erros.
    const paymentIntentIdPart = clientSecret ? clientSecret.substring(0, clientSecret.indexOf('_secret_')) : 'unknown_intent';

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/meus-pagamentos?payment_attempted=true&payment_id=${paymentDetails.id}&payment_intent_id=${paymentIntentIdPart}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      const errorMessage = error.type === "validation_error" ? error.message : "Ocorreu um erro inesperado durante o pagamento.";
      setMessage(errorMessage);
      if (onError) onError(errorMessage);
      setIsLoading(false);
      return;
    }

    if (paymentIntent) {
      if (paymentIntent.status === 'succeeded') {
        setMessage(`Pagamento de ${Number(paymentDetails.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} realizado com sucesso! O status será atualizado em breve.`);
        if (onSuccess) onSuccess(paymentIntent);
      } else if (paymentIntent.status === 'processing') {
        setMessage("O seu pagamento está a ser processado.");
      } else {
        setMessage(`Status do pagamento: ${paymentIntent.status}. Tente novamente ou contacte o suporte se o problema persistir.`);
      }
    }
    // Se for redirecionado, o useEffect no MyPaymentsPage tratará da mensagem.
    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "tabs",
    // Podes adicionar outros campos aqui se necessário, ex: defaultValues para billingDetails
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      {/* O PaymentElement só deve ser renderizado se stripe e elements estiverem disponíveis */}
      {stripe && elements && clientSecret && (
        <PaymentElement id="payment-element" options={paymentElementOptions} />
      )}
      <SubmitButton disabled={isLoading || !stripe || !elements || !clientSecret} id="submit">
        <span id="button-text">
          {isLoading ? "A processar..." : `Pagar ${Number(paymentDetails?.amount || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}`}
        </span>
      </SubmitButton>
      {message && <ErrorMessage id="payment-message">{message}</ErrorMessage>}
    </FormContainer>
  );
};

export default StripeCheckoutForm;