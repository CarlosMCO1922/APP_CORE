// src/pages/admin/StaffManageRequestsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { getAllAppointments, staffRespondToRequest } from '../../services/appointmentService';

// --- Reutilizar Styled Components ---
const PageContainer = styled.div` background-color: #1A1A1A; color: #E0E0E0; min-height: 100vh; padding: 20px 40px; font-family: 'Inter', sans-serif; `;
const Title = styled.h1` font-size: 2.2rem; color: #D4AF37; margin-bottom: 25px; `;
const LoadingText = styled.p` font-size: 1.1rem; text-align: center; padding: 20px; color: #D4AF37;`;
const ErrorText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #FF6B6B; background-color: rgba(255,107,107,0.15); border: 1px solid #FF6B6B; border-radius: 8px; margin: 15px 0;`;
const MessageText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #66BB6A; background-color: rgba(102,187,106,0.15); border: 1px solid #66BB6A; border-radius: 8px; margin: 15px 0;`;
const NoItemsText = styled.p` font-size: 1rem; color: #a0a0a0; text-align: center; padding: 20px 0; `;

const RequestList = styled.ul`
  list-style: none;
  padding: 0;
`;

const RequestItem = styled.li`
  background-color: #252525;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 15px;
  border-left: 4px solid #D4AF37;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;

  div h3 {
    margin-top: 0;
    margin-bottom: 8px;
    color: #E0E0E0;
    font-size: 1.2rem;
  }
  div p {
    margin: 4px 0;
    font-size: 0.9rem;
    color: #a0a0a0;
  }
  div p span {
    font-weight: bold;
    color: #c0c0c0;
  }
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
  @media (max-width: 600px) {
    width: 100%;
    justify-content: space-around;
  }
`;

const RespondButton = styled.button`
  padding: 8px 15px;
  font-size: 0.9rem;
  border-radius: 5px;
  cursor: pointer;
  border: none;
  font-weight: 500;
  transition: background-color 0.2s ease;
  background-color: ${props => props.accept ? '#4CAF50' : '#D32F2F'};
  color: white;

  &:hover {
    background-color: ${props => props.accept ? '#45a049' : '#C62828'};
  }
  &:disabled {
    background-color: #555;
    color: #888;
    cursor: not-allowed;
  }
`;

const StaffManageRequestsPage = () => {
  const { authState } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPendingRequests = useCallback(async () => {
    if (authState.token && authState.user) {
      try {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        
        let filters = { status: 'pendente_aprovacao_staff' };
        if (authState.role !== 'admin') {
          filters.staffId = authState.user.id;
        }

        const data = await getAllAppointments(authState.token, filters);
        setPendingRequests(data);
      } catch (err) {
        setError(err.message || 'Não foi possível carregar os pedidos pendentes.');
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token, authState.user, authState.role]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleRespondToRequest = async (appointmentId, decision) => {
    if (!window.confirm(`Tens a certeza que queres ${decision === 'accept' ? 'ACEITAR' : 'REJEITAR'} este pedido de consulta?`)) {
      return;
    }
    setActionLoading(appointmentId);
    setError('');
    setSuccessMessage('');
    try {
      await staffRespondToRequest(appointmentId, decision, authState.token);
      setSuccessMessage(`Pedido ${decision === 'accept' ? 'aceite e agendado' : 'rejeitado'} com sucesso.`);
      fetchPendingRequests(); 
    } catch (err) {
      setError(err.message || `Falha ao ${decision === 'accept' ? 'aceitar' : 'rejeitar'} o pedido.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <PageContainer><LoadingText>A carregar pedidos pendentes...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <Title>Gerir Pedidos de Consulta Pendentes</Title>
      <Link to="/admin/dashboard" style={{color: '#D4AF37', marginBottom: '20px', display: 'inline-block', textDecoration:'none'}}>
        ‹ Voltar ao Painel Staff
      </Link>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

      {pendingRequests.length > 0 ? (
        <RequestList>
          {pendingRequests.map(request => (
            <RequestItem key={request.id}>
              <div>
                <h3>Pedido de: {request.client?.firstName} {request.client?.lastName}</h3>
                <p><span>Email Cliente:</span> {request.client?.email}</p>
                <p><span>Profissional Solicitado:</span> {request.professional?.firstName} {request.professional?.lastName}</p>
                <p><span>Data:</span> {new Date(request.date).toLocaleDateString('pt-PT')} às {request.time.substring(0,5)}</p>
                <p><span>Duração:</span> {request.durationMinutes} min</p>
                <p><span>Notas do Cliente:</span> {request.notes || 'Nenhuma'}</p>
              </div>
              <ActionButtonGroup>
                <RespondButton 
                  accept 
                  onClick={() => handleRespondToRequest(request.id, 'accept')}
                  disabled={actionLoading === request.id}
                >
                  {actionLoading === request.id ? 'A processar...' : 'Aceitar'}
                </RespondButton>
                <RespondButton 
                  onClick={() => handleRespondToRequest(request.id, 'reject')}
                  disabled={actionLoading === request.id}
                >
                  {actionLoading === request.id ? 'A processar...' : 'Rejeitar'}
                </RespondButton>
              </ActionButtonGroup>
            </RequestItem>
          ))}
        </RequestList>
      ) : (
        <NoItemsText>Não há pedidos de consulta pendentes de momento.</NoItemsText>
      )}
    </PageContainer>
  );
};

export default StaffManageRequestsPage;