// src/pages/admin/StaffManageRequestsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { getAllAppointments, staffRespondToRequest } from '../../services/appointmentService';

// --- Styled Components (Mantidos os mesmos) ---
const PageContainer = styled.div` /* ... */ `;
const Title = styled.h1` /* ... */ `;
const LoadingText = styled.p` /* ... */ `;
const ErrorText = styled.p` /* ... */ `; // Geral para a página
const MessageText = styled.p` /* ... */ `;
const NoItemsText = styled.p` /* ... */ `;
const RequestList = styled.ul` /* ... */ `;
const RequestItem = styled.li` /* ... */ `;
const ActionButtonGroup = styled.div` /* ... */ `;
const RespondButton = styled.button` /* ... */ `;

// Modal para definir o custo ao aceitar
const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.75); display: flex; justify-content: center; align-items: center; z-index: 1000; `;
const ModalContent = styled.div` background-color: #2C2C2C; padding: 30px 40px; border-radius: 10px; width: 100%; max-width: 450px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); position: relative; max-height: 90vh; overflow-y: auto; `;
const ModalTitle = styled.h2` color: #D4AF37; margin-top: 0; margin-bottom: 25px; font-size: 1.6rem; `;
const ModalLabel = styled.label` font-size: 0.9rem; color: #b0b0b0; margin-bottom: 5px; display: block; `;
const ModalInput = styled.input` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; margin-bottom:15px; &:focus { outline: none; border-color: #D4AF37; } `;
const ModalActions = styled.div` display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; `;
const ModalButton = styled.button`
  padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer;
  font-weight: 500; transition: background-color 0.2s ease;
  background-color: ${props => props.primary ? '#D4AF37' : '#555'};
  color: ${props => props.primary ? '#1A1A1A' : '#E0E0E0'};
  &:hover { background-color: ${props => props.primary ? '#e6c358' : '#666'}; }
  &:disabled { background-color: #404040; color: #777; cursor: not-allowed; }
`;
const CloseButton = styled.button` 
  position: absolute; top: 15px; right: 20px; 
  background: transparent; border: none; 
  color: #aaa; font-size: 1.8rem; cursor: pointer;
  line-height: 1; padding: 0;
  &:hover { color: #fff; } 
`;
const ModalErrorText = styled(ErrorText)`margin: 0 0 15px 0;`; // Erro específico para o modal

// COPIAR OS STYLED COMPONENTS DE UMA DAS VERSÕES ANTERIORES COMPLETAS DESTA PÁGINA


const StaffManageRequestsPage = () => {
  const { authState } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // ID da consulta sendo processada

  const [showCostModal, setShowCostModal] = useState(false);
  const [costModalData, setCostModalData] = useState({ appointmentId: null, totalCost: '' });
  const [costModalError, setCostModalError] = useState('');
  const [costFormLoading, setCostFormLoading] = useState(false);


  const fetchPendingRequests = useCallback(async () => {
    if (authState.token && authState.user) {
      try {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        
        let filters = { status: 'pendente_aprovacao_staff' };
        // Se não for admin, filtra apenas pelos pedidos associados ao ID do staff logado
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

  const handleOpenCostModal = (appointmentId) => {
    setCostModalData({ appointmentId, totalCost: '' });
    setCostModalError('');
    setShowCostModal(true);
  };

  const handleCloseCostModal = () => {
    setShowCostModal(false);
    setCostModalError('');
  };

  const handleCostChange = (e) => {
    setCostModalData(prev => ({ ...prev, totalCost: e.target.value }));
  };

  const handleConfirmAcceptRequest = async () => {
    if (!costModalData.appointmentId || !costModalData.totalCost || parseFloat(costModalData.totalCost) <= 0) {
      setCostModalError('Por favor, insira um custo total válido para a consulta.');
      return;
    }
    setCostFormLoading(true);
    setError(''); setSuccessMessage(''); setCostModalError('');
    
    try {
      await staffRespondToRequest(costModalData.appointmentId, 'accept', authState.token, parseFloat(costModalData.totalCost));
      setSuccessMessage('Pedido aceite e agendado! Sinal de pagamento pendente para o cliente.');
      fetchPendingRequests();
      handleCloseCostModal();
    } catch (err) {
      // Se o erro vier da API e tiver um campo 'message', ele será usado.
      // Caso contrário, uma mensagem genérica.
      setCostModalError(err.message || 'Falha ao aceitar o pedido. Verifique se há conflitos de horário.');
    } finally {
      setCostFormLoading(false);
      setActionLoading(null); // Limpa o loading geral de ação
    }
  };


  const handleRespondToRequest = async (appointmentId, decision) => {
    if (decision === 'accept') {
      // Abre o modal para o staff inserir o custo
      handleOpenCostModal(appointmentId);
    } else { // Para 'reject'
      if (!window.confirm('Tens a certeza que queres REJEITAR este pedido de consulta?')) {
        return;
      }
      setActionLoading(appointmentId); // Usar para feedback no botão específico se desejar
      setError(''); setSuccessMessage('');
      try {
        await staffRespondToRequest(appointmentId, 'reject', authState.token); // Não precisa de totalCost para rejeitar
        setSuccessMessage('Pedido rejeitado com sucesso.');
        fetchPendingRequests();
      } catch (err) {
        setError(err.message || 'Falha ao rejeitar o pedido.');
      } finally {
        setActionLoading(null);
      }
    }
  };

  if (loading && !showCostModal) { // Não mostrar loading da página se o modal estiver aberto
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
                  {actionLoading === request.id && costFormLoading ? 'A processar...' : 'Aceitar'}
                </RespondButton>
                <RespondButton
                  onClick={() => handleRespondToRequest(request.id, 'reject')}
                  disabled={actionLoading === request.id}
                >
                  {actionLoading === request.id && !costFormLoading ? 'A processar...' : 'Rejeitar'}
                </RespondButton>
              </ActionButtonGroup>
            </RequestItem>
          ))}
        </RequestList>
      ) : (
        <NoItemsText>Não há pedidos de consulta pendentes de momento.</NoItemsText>
      )}

      {showCostModal && (
        <ModalOverlay onClick={handleCloseCostModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseCostModal}>&times;</CloseButton>
            <ModalTitle>Definir Custo da Consulta</ModalTitle>
            {costModalError && <ModalErrorText>{costModalError}</ModalErrorText>}
            <ModalLabel htmlFor="totalCostInput">Custo Total (EUR)*</ModalLabel>
            <ModalInput
              type="number"
              id="totalCostInput"
              value={costModalData.totalCost}
              onChange={handleCostChange}
              placeholder="Ex: 50.00"
              step="0.01"
              min="0.01"
              required
            />
            <ModalActions>
              <ModalButton type="button" onClick={handleCloseCostModal} disabled={costFormLoading}>Cancelar</ModalButton>
              <ModalButton primary onClick={handleConfirmAcceptRequest} disabled={costFormLoading}>
                {costFormLoading ? 'A Confirmar...' : 'Confirmar e Aceitar'}
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default StaffManageRequestsPage;