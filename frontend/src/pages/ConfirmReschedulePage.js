// Página pública para confirmar reagendamento (consulta ou treino) via link do email.
// Rotas: /confirmar-reagendamento-consulta?token=... e /confirmar-reagendamento-treino?token=...
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { confirmAppointmentReschedule, confirmTrainingReschedule } from '../services/publicBookingService';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.textMain};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: ${(p) => p.theme.fonts.main};
`;

const Card = styled.div`
  max-width: 440px;
  width: 100%;
  background: ${(p) => p.theme.colors.cardBackground};
  border-radius: 12px;
  padding: 32px 28px;
  text-align: center;
  border: 1px solid ${(p) => p.theme.colors.cardBorder};
  box-shadow: ${(p) => p.theme.boxShadow};
`;

const Title = styled.h1`
  font-size: 1.5rem;
  color: ${(p) => p.theme.colors.primary};
  margin: 0 0 16px 0;
`;

const Message = styled.p`
  color: ${(p) => p.theme.colors.textMuted};
  margin: 0;
  line-height: 1.5;
`;

const ErrorMessage = styled.p`
  color: ${(p) => p.theme.colors.error};
  margin: 16px 0 0 0;
`;

const SuccessDetail = styled.p`
  margin: 12px 0 0 0;
  font-size: 0.95rem;
  color: ${(p) => p.theme.colors.textMain};
`;

function ConfirmReschedulePage({ type }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link inválido. Falta o código de confirmação.');
      return;
    }

    const confirm = type === 'treino' ? confirmTrainingReschedule : confirmAppointmentReschedule;
    confirm(token)
      .then((data) => {
        setStatus('success');
        setMessage(data.message || 'Reagendamento confirmado com sucesso.');
        if (data.appointment) setDetail(`Consulta: ${data.appointment.date} às ${data.appointment.time}`);
        if (data.training) setDetail(`Treino: ${data.training.name} — ${data.training.date} ${data.training.time}`);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Não foi possível confirmar o reagendamento.');
      });
  }, [token, type]);

  return (
    <PageContainer>
      <Card>
        <Title>
          {status === 'loading' && 'A confirmar...'}
          {status === 'success' && 'Confirmado'}
          {status === 'error' && 'Erro'}
        </Title>
        {status === 'loading' && <Message>Aguarde enquanto confirmamos o seu reagendamento.</Message>}
        {status === 'success' && (
          <>
            <Message>{message}</Message>
            {detail && <SuccessDetail>{detail}</SuccessDetail>}
          </>
        )}
        {status === 'error' && <ErrorMessage>{message}</ErrorMessage>}
      </Card>
    </PageContainer>
  );
}

export default ConfirmReschedulePage;
