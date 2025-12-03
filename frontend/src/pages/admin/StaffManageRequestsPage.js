// src/pages/admin/StaffManageRequestsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import BackArrow from '../../components/BackArrow';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { getAllAppointments, staffRespondToRequest } from '../../services/appointmentService';
import { FaUserCircle, FaClock, FaCalendarDay, FaStickyNote, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import ConfirmationModal from '../../components/Common/ConfirmationModal';

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textMain};
  min-height: 100vh;
  padding: 20px 40px;
  font-family: ${props => props.theme.fonts.main};

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 10px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.textMuted};
  margin-bottom: 20px;
`;



const LoadingText = styled.p`
  font-size: 1.2rem;
  text-align: center;
  padding: 30px;
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
`;

const MessageBase = styled.p`
  text-align: center;
  padding: 15px 20px;
  margin: 20px auto;
  border-radius: ${props => props.theme.borderRadius};
  border-width: 1px;
  border-style: solid;
  max-width: 700px;
  font-size: 0.95rem;
`;

const ErrorText = styled(MessageBase)`
  color: ${props => props.theme.colors.error};
  background-color: ${props => props.theme.colors.errorBg};
  border-color: ${props => props.theme.colors.error};
`;

const MessageText = styled(MessageBase)`
  color: ${props => props.theme.colors.success};
  background-color: ${props => props.theme.colors.successBg};
  border-color: ${props => props.theme.colors.success};
`;

const NoItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius};
  box-shadow: ${props => props.theme.boxShadow};
  text-align: center;
  color: ${props => props.theme.colors.textMuted};
  margin-top: 30px;

  svg {
    font-size: 3rem;
    color: ${props => props.theme.colors.primary};
    margin-bottom: 15px;
  }

  p {
    font-size: 1.1rem;
    margin: 0;
  }
`;

const RequestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr; // Uma coluna em ecrãs muito pequenos
  }
`;

const RequestCard = styled.div`
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: 10px;
  box-shadow: ${props => props.theme.boxShadow};
  border: 1px solid ${props => props.theme.colors.cardBorder};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.4);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 15px;
  border-bottom: 1px solid ${props => props.theme.colors.cardBorder};

  svg {
    font-size: 1.8rem;
    color: ${props => props.theme.colors.primary};
    flex-shrink: 0;
  }

  h3 {
    margin: 0;
    font-size: 1.3rem;
    color: ${props => props.theme.colors.textMain};
    font-weight: 600;
  }
`;

const DetailItem = styled.p`
  margin: 5px 0;
  font-size: 0.95rem;
  color: ${props => props.theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: ${props => props.theme.colors.primary};
    font-size: 1.1em;
    flex-shrink: 0;
  }

  strong {
    font-weight: 500;
    color: ${props => props.theme.colors.textMain};
  }
`;

const NotesArea = styled.div`
  background-color: rgba(0,0,0,0.1);
  padding: 10px 15px;
  border-radius: 6px;
  border-left: 3px solid ${props => props.theme.colors.primary};
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textMuted};
  line-height: 1.5;
  margin-top: 5px;

  p { margin: 0; }
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: auto; /* Empurra para o final do card */
  padding-top: 15px;
  border-top: 1px solid ${props => props.theme.colors.cardBorder};
`;

const RespondButton = styled.button`
  flex-grow: 1;
  padding: 10px 15px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease, transform 0.15s ease;
  
  background-color: ${props => props.accept ? props.theme.colors.success : props.theme.colors.error};
  color: white;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    opacity: 0.9;
  }
  &:disabled {
    background-color: ${props => props.theme.colors.buttonSecondaryBg};
    color: ${props => props.theme.colors.textMuted};
    cursor: not-allowed;
  }
  svg {
    margin-right: 8px;
  }
`;

// Modal components
const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 1050; padding:20px;`;
const ModalContent = styled.div` background-color: #2C2C2C; padding: 30px 40px; border-radius: 10px; width: 100%; max-width: 450px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); position: relative; max-height: 90vh; overflow-y: auto; `;
const ModalTitle = styled.h2` color: #D4AF37; margin-top: 0; margin-bottom: 25px; font-size: 1.6rem; text-align: center; `;
const ModalLabel = styled.label` font-size: 0.9rem; color: #b0b0b0; margin-bottom: 5px; display: block; `;
const ModalInput = styled.input` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; margin-bottom:15px; &:focus { outline: none; border-color: #D4AF37; } `;
const ModalActions = styled.div` display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; `;
const ModalButton = styled.button`
  padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer;
  font-weight: 500; transition: background-color 0.2s ease;
  background-color: ${props => props.primary ? props.theme.colors.primary : props.theme.colors.buttonSecondaryBg};
  color: ${props => props.primary ? props.theme.colors.textDark : props.theme.colors.textMain};
  &:hover:not(:disabled) { 
    background-color: ${props => props.primary ? '#e6c358' : props.theme.colors.buttonSecondaryHoverBg}; 
  }
  &:disabled { 
    background-color: #404040; 
    color: #777; cursor: not-allowed; 
  }
`;
const CloseButton = styled.button` 
  position: absolute; top: 15px; right: 20px; 
  background: transparent; border: none; 
  color: #aaa; font-size: 1.8rem; cursor: pointer;
  line-height: 1; padding: 0;
  &:hover { color: #fff; } 
`;
const ModalErrorText = styled(ErrorText)`margin: 0 0 15px 0; text-align:left; font-size: 0.85rem;`


const StaffManageRequestsPage = () => {
  const { authState } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [pageSuccessMessage, setPageSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const [showCostModal, setShowCostModal] = useState(false);
  const [costModalData, setCostModalData] = useState({ appointmentId: null, totalCost: '' });
  const [costModalError, setCostModalError] = useState('');
  const [costFormLoading, setCostFormLoading] = useState(false);
  const [showRejectConfirmModal, setShowRejectConfirmModal] = useState(false);
  const [appointmentToReject, setAppointmentToReject] = useState(null);

  const fetchPendingRequests = useCallback(async () => {
    if (authState.token && authState.user) {
      try {
        setLoading(true);
        setPageError('');
        setPageSuccessMessage('');
        
        let filters = { status: 'pendente_aprovacao_staff' };
        if (authState.role !== 'admin') {
          filters.staffId = authState.user.id;
        }

        const data = await getAllAppointments(authState.token, filters);
        setPendingRequests(data);
      } catch (err) {
        setPageError(err.message || 'Não foi possível carregar os pedidos pendentes.');
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
    setActionLoading(null);
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
    setPageError(''); setPageSuccessMessage(''); setCostModalError('');
    
    try {
      await staffRespondToRequest(costModalData.appointmentId, 'accept', authState.token, parseFloat(costModalData.totalCost));
      setPageSuccessMessage('Pedido aceite e agendado! Sinal de pagamento pendente para o cliente.');
      fetchPendingRequests();
      handleCloseCostModal();
    } catch (err) {
      setCostModalError(err.message || 'Falha ao aceitar o pedido. Verifique se há conflitos de horário.');
    } finally {
      setCostFormLoading(false);
    }
  };

  const handleRespondToRequest = (appointmentId, decision) => {
    if (decision === 'accept') {
      handleOpenCostModal(appointmentId);
    } else {
      setAppointmentToReject(appointmentId);
      setShowRejectConfirmModal(true);
    }
  };

  const handleRejectConfirm = async () => {
    if (!appointmentToReject) return;
    setActionLoading(appointmentToReject);
    setPageError(''); 
    setPageSuccessMessage('');
    setShowRejectConfirmModal(false);
    try {
      await staffRespondToRequest(appointmentToReject, 'reject', authState.token);
      setPageSuccessMessage('Pedido rejeitado com sucesso.');
      setAppointmentToReject(null);
      fetchPendingRequests();
    } catch (err) {
      setPageError(err.message || 'Falha ao rejeitar o pedido.');
      setAppointmentToReject(null);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !showCostModal) {
    return <PageContainer><LoadingText>A carregar pedidos pendentes...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <HeaderSection>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <BackArrow to="/admin/dashboard" />
          <div>
            <Title style={{ margin: 0 }}>Pedidos de Consulta</Title>
            <Subtitle style={{ marginTop: 6 }}>Analise e responda aos pedidos pendentes dos clientes.</Subtitle>
          </div>
        </div>
      </HeaderSection>

      {pageError && <ErrorText>{pageError}</ErrorText>}
      {pageSuccessMessage && <MessageText>{pageSuccessMessage}</MessageText>}

      {pendingRequests.length > 0 ? (
        <RequestGrid>
          {pendingRequests.map(request => (
            <RequestCard key={request.id}>
              <CardHeader>
                <FaUserCircle />
                <h3>{request.client?.firstName} {request.client?.lastName}</h3>
              </CardHeader>
              <DetailItem><FaUserCircle /> <strong>Profissional:</strong> {request.professional?.firstName} {request.professional?.lastName}</DetailItem>
              <DetailItem><FaCalendarDay /> <strong>Data:</strong> {new Date(request.date).toLocaleDateString('pt-PT')} às {request.time.substring(0,5)}</DetailItem>
              <DetailItem><FaClock /> <strong>Duração:</strong> {request.durationMinutes} min</DetailItem>
              {request.notes && (
                <NotesArea>
                  <DetailItem style={{alignItems: 'flex-start'}}>
                    <FaStickyNote style={{marginTop: '3px'}}/> 
                    <div><strong>Notas do Cliente:</strong><br/>{request.notes}</div>
                  </DetailItem>
                </NotesArea>
              )}
              <ActionButtonGroup>
                <RespondButton
                  accept
                  onClick={() => handleRespondToRequest(request.id, 'accept')}
                  disabled={actionLoading === request.id || costFormLoading}
                >
                  <FaCheckCircle /> {actionLoading === request.id && costFormLoading ? 'A processar...' : 'Aceitar'}
                </RespondButton>
                <RespondButton
                  onClick={() => handleRespondToRequest(request.id, 'reject')}
                  disabled={actionLoading === request.id}
                >
                  <FaTimesCircle /> {actionLoading === request.id && !costFormLoading ? 'A processar...' : 'Rejeitar'}
                </RespondButton>
              </ActionButtonGroup>
            </RequestCard>
          ))}
        </RequestGrid>
      ) : (
        !loading && !pageError && (
          <NoItemsContainer>
            <FaExclamationTriangle />
            <p>Não há pedidos de consulta pendentes de momento.</p>
          </NoItemsContainer>
        )
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
              autoFocus
            />
            <ModalActions>
              <ModalButton type="button" onClick={handleCloseCostModal} disabled={costFormLoading}>Cancelar</ModalButton>
              <ModalButton primary onClick={handleConfirmAcceptRequest} disabled={costFormLoading}>
                {costFormLoading ? 'Confirmando...' : 'Confirmar e Aceitar'}
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      <ConfirmationModal
        isOpen={showRejectConfirmModal}
        onClose={() => {
          if (actionLoading === null) {
            setShowRejectConfirmModal(false);
            setAppointmentToReject(null);
          }
        }}
        onConfirm={handleRejectConfirm}
        title="Rejeitar Pedido de Consulta"
        message="Tens a certeza que queres REJEITAR este pedido de consulta?"
        confirmText="Rejeitar"
        cancelText="Cancelar"
        danger={true}
        loading={actionLoading !== null}
      />
    </PageContainer>
  );
};

export default StaffManageRequestsPage;