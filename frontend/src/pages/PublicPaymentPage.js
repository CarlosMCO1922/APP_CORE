import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCheckoutForm from '../components/Forms/StripeCheckoutForm';
import { publicCreateStripeIntentByToken, publicGetPaymentByToken } from '../services/paymentService';

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  padding: 22px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Card = styled.div`
  width: 100%;
  max-width: 520px;
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 14px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  overflow: hidden;
`;

const Header = styled.div`
  padding: 18px 18px 14px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.primary};
`;

const Sub = styled.div`
  margin-top: 6px;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Body = styled.div`
  padding: 12px 0 6px;
`;

const Msg = styled.div`
  padding: 16px 18px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey && typeof stripeKey === 'string' && stripeKey.startsWith('pk_')
  ? loadStripe(stripeKey)
  : null;

export default function PublicPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(() => new URLSearchParams(location.search).get('token'), [location.search]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!token) {
        setLoading(false);
        setError('Link inválido (token em falta).');
        return;
      }
      try {
        setLoading(true);
        setError('');
        const p = await publicGetPaymentByToken(token);
        const intent = await publicCreateStripeIntentByToken(token);
        if (!mounted) return;
        setPayment(p);
        setClientSecret(intent.clientSecret);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'Não foi possível iniciar o pagamento.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [token]);

  return (
    <Page>
      <Card>
        <Header>
          <Title>Pagamento Seguro</Title>
          <Sub>Conclui o pagamento para confirmar a consulta.</Sub>
        </Header>
        <Body>
          {loading && <Msg>A preparar checkout…</Msg>}
          {!loading && error && <Msg style={{ color: '#ff6b6b' }}>{error}</Msg>}
          {!loading && !error && stripePromise && clientSecret && payment && (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: 'night', labels: 'floating' } }}
            >
              <StripeCheckoutForm
                paymentDetails={{ id: payment.id, amount: payment.amount, description: payment.description }}
                onSuccess={() => {
                  // voltar ao início (ou mostrar confirmação)
                  navigate('/', { replace: true });
                }}
              />
            </Elements>
          )}
          {!loading && !error && !stripePromise && (
            <Msg style={{ color: '#ff6b6b' }}>
              Stripe não configurado (chave publicável em falta).
            </Msg>
          )}
        </Body>
      </Card>
    </Page>
  );
}

