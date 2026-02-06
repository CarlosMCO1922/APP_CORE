// src/pages/admin/StaffGuestSignupsPage.js
// Lista inscrições de visitantes em treinos experimentais pendentes e permite aprovar/rejeitar.
import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import BackArrow from '../../components/BackArrow';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { getGuestSignupsPending, respondToGuestSignup, proposeGuestSignupReschedule, getAllTrainings } from '../../services/trainingService';
import { FaUserCircle, FaClock, FaCalendarDay, FaDumbbell, FaCheckCircle, FaTimesCircle, FaCalendarAlt } from 'react-icons/fa';

const PageContainer = styled.div`
  background-color: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.textMain};
  min-height: 100vh;
  padding: 20px 40px;
  font-family: ${(p) => p.theme.fonts.main};

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: ${(p) => p.theme.colors.primary};
  margin-bottom: 8px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: ${(p) => p.theme.colors.textMuted};
  margin: 0;
`;

const LoadingText = styled.p`
  font-size: 1.1rem;
  text-align: center;
  padding: 40px 20px;
  color: ${(p) => p.theme.colors.primary};
  font-weight: 500;
`;

const ErrorText = styled.p`
  text-align: center;
  padding: 15px 20px;
  margin: 20px auto;
  border-radius: 8px;
  border: 1px solid ${(p) => p.theme.colors.error};
  background-color: ${(p) => p.theme.colors.errorBg};
  color: ${(p) => p.theme.colors.error};
  max-width: 600px;
  font-size: 0.95rem;
`;

const SuccessText = styled.p`
  text-align: center;
  padding: 15px 20px;
  margin: 20px auto;
  border-radius: 8px;
  border: 1px solid ${(p) => p.theme.colors.success};
  background-color: ${(p) => p.theme.colors.successBg};
  color: ${(p) => p.theme.colors.success};
  max-width: 600px;
  font-size: 0.95rem;
`;

const NoItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  background-color: ${(p) => p.theme.colors.cardBackground};
  border-radius: 10px;
  box-shadow: ${(p) => p.theme.boxShadow};
  text-align: center;
  color: ${(p) => p.theme.colors.textMuted};
  margin-top: 24px;

  svg {
    font-size: 3rem;
    color: ${(p) => p.theme.colors.primary};
    margin-bottom: 16px;
  }
  p {
    font-size: 1.05rem;
    margin: 0;
  }
`;

const SignupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const SignupCard = styled.div`
  background-color: ${(p) => p.theme.colors.cardBackground};
  border-radius: 10px;
  box-shadow: ${(p) => p.theme.boxShadow};
  border: 1px solid ${(p) => p.theme.colors.cardBorder};
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${(p) => p.theme.colors.cardBorder};

  svg {
    font-size: 1.6rem;
    color: ${(p) => p.theme.colors.primary};
    flex-shrink: 0;
  }
  h3 {
    margin: 0;
    font-size: 1.2rem;
    color: ${(p) => p.theme.colors.textMain};
    font-weight: 600;
  }
`;

const DetailItem = styled.p`
  margin: 4px 0;
  font-size: 0.9rem;
  color: ${(p) => p.theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: ${(p) => p.theme.colors.primary};
    font-size: 1em;
    flex-shrink: 0;
  }
  strong {
    font-weight: 500;
    color: ${(p) => p.theme.colors.textMain};
  }
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid ${(p) => p.theme.colors.cardBorder};
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 10px 14px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s, transform 0.15s;
  min-width: 0;

  background-color: ${(p) => (p.accept ? p.theme.colors.success : p.primary ? p.theme.colors.primary : p.theme.colors.error)};
  color: ${(p) => (p.primary ? (p.theme.colors.textDark || '#1a1a1a') : 'white')};

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  svg {
    margin-right: 6px;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  padding: 20px;
`;
const ModalContent = styled.div`
  background: ${(p) => p.theme.colors.cardBackground || '#2C2C2C'};
  padding: 24px 28px;
  border-radius: 10px;
  max-width: 440px;
  width: 100%;
  position: relative;
  border: 1px solid ${(p) => p.theme.colors.cardBorder};
`;
const ModalTitle = styled.h2`
  margin: 0 0 12px 0;
  font-size: 1.25rem;
  color: ${(p) => p.theme.colors.primary};
`;
const ModalLabel = styled.label`
  display: block;
  font-size: 0.9rem;
  color: ${(p) => p.theme.colors.textMuted};
  margin-bottom: 6px;
`;
const ModalSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  background: ${(p) => p.theme.colors.buttonSecondaryBg};
  border: 1px solid ${(p) => p.theme.colors.cardBorder};
  border-radius: 6px;
  color: ${(p) => p.theme.colors.textMain};
  font-size: 1rem;
  margin-bottom: 16px;
`;
const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
`;
const ModalButton = styled.button`
  padding: 10px 18px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  background: ${(p) => (p.primary ? p.theme.colors.primary : p.theme.colors.buttonSecondaryBg)};
  color: ${(p) => (p.primary ? (p.theme.colors.textDark || '#1a1a1a') : p.theme.colors.textMain)};
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: ${(p) => p.theme.colors.textMuted};
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
`;

function StaffGuestSignupsPage() {
  const { authState } = useAuth();
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [pageSuccess, setPageSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [signupToReject, setSignupToReject] = useState(null);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [signupToReschedule, setSignupToReschedule] = useState(null);
  const [trainingsForReschedule, setTrainingsForReschedule] = useState([]);
  const [selectedProposedTrainingId, setSelectedProposedTrainingId] = useState('');
  const [rescheduleModalError, setRescheduleModalError] = useState('');
  const [rescheduleFormLoading, setRescheduleFormLoading] = useState(false);

  const fetchSignups = useCallback(async () => {
    if (!authState.token) return;
    try {
      setLoading(true);
      setPageError('');
      setPageSuccess('');
      const data = await getGuestSignupsPending(authState.token);
      setSignups(data);
    } catch (err) {
      setPageError(err.message || 'Não foi possível carregar as inscrições pendentes.');
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchSignups();
  }, [fetchSignups]);

  const handleAccept = async (signupId) => {
    setActionLoading(signupId);
    setPageError('');
    setPageSuccess('');
    try {
      await respondToGuestSignup(signupId, { decision: 'accept' }, authState.token);
      setPageSuccess('Inscrição aprovada. O visitante receberá um email.');
      fetchSignups();
    } catch (err) {
      setPageError(err.message || 'Erro ao aprovar.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (signup) => {
    setSignupToReject(signup);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!signupToReject) return;
    const id = signupToReject.id;
    setActionLoading(id);
    setPageError('');
    setPageSuccess('');
    setShowRejectModal(false);
    try {
      await respondToGuestSignup(id, { decision: 'reject' }, authState.token);
      setPageSuccess('Inscrição rejeitada. O visitante receberá um email.');
      setSignupToReject(null);
      fetchSignups();
    } catch (err) {
      setPageError(err.message || 'Erro ao rejeitar.');
      setSignupToReject(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRescheduleModal = async (signup) => {
    setSignupToReschedule(signup);
    setSelectedProposedTrainingId('');
    setRescheduleModalError('');
    setShowRescheduleModal(true);
    try {
      const list = await getAllTrainings(authState.token, {});
      const today = new Date().toISOString().slice(0, 10);
      const future = (list || []).filter((t) => t.date >= today && t.id !== signup.training?.id);
      setTrainingsForReschedule(future);
    } catch (err) {
      setRescheduleModalError(err.message || 'Erro ao carregar treinos.');
    }
  };

  const handleCloseRescheduleModal = () => {
    setShowRescheduleModal(false);
    setSignupToReschedule(null);
    setRescheduleFormLoading(false);
    setRescheduleModalError('');
  };

  const handleRescheduleSubmit = async () => {
    if (!signupToReschedule || !selectedProposedTrainingId) {
      setRescheduleModalError('Escolhe o treino para o qual queres propor o reagendamento.');
      return;
    }
    setRescheduleFormLoading(true);
    setRescheduleModalError('');
    setPageError('');
    setPageSuccess('');
    try {
      await proposeGuestSignupReschedule(signupToReschedule.id, { proposedTrainingId: parseInt(selectedProposedTrainingId, 10) }, authState.token);
      setPageSuccess('Proposta de reagendamento enviada por email. O visitante deve confirmar pelo link recebido.');
      fetchSignups();
      handleCloseRescheduleModal();
    } catch (err) {
      setRescheduleModalError(err.message || 'Falha ao enviar proposta.');
    } finally {
      setRescheduleFormLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingText>A carregar inscrições pendentes...</LoadingText>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <HeaderSection>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <BackArrow to="/admin/dashboard" />
          <div>
            <Title style={{ margin: 0 }}>Inscrições em treino experimental</Title>
            <Subtitle>Visitantes sem conta. Aprova ou rejeita as inscrições pendentes.</Subtitle>
          </div>
        </div>
      </HeaderSection>

      {pageError && <ErrorText>{pageError}</ErrorText>}
      {pageSuccess && <SuccessText>{pageSuccess}</SuccessText>}

      {signups.length === 0 ? (
        <NoItemsContainer>
          <FaDumbbell />
          <p>Não há inscrições de visitantes pendentes.</p>
        </NoItemsContainer>
      ) : (
        <SignupGrid>
          {signups.map((s) => {
            const training = s.training || {};
            const instructor = training.instructor;
            const instructorName = instructor
              ? `${instructor.firstName} ${instructor.lastName}`
              : '—';
            const timeStr = training.time ? String(training.time).substring(0, 5) : '—';
            const busy = actionLoading === s.id;

            return (
              <SignupCard key={s.id}>
                <CardHeader>
                  <FaUserCircle />
                  <h3>{s.guestName || 'Visitante'}</h3>
                </CardHeader>
                <DetailItem>
                  <FaUserCircle />
                  <strong>Email:</strong> {s.guestEmail}
                </DetailItem>
                <DetailItem>
                  <FaUserCircle />
                  <strong>Telemóvel:</strong> {s.guestPhone}
                </DetailItem>
                <DetailItem>
                  <FaDumbbell />
                  <strong>Treino:</strong> {training.name || `ID ${training.id}`}
                </DetailItem>
                <DetailItem>
                  <FaCalendarDay />
                  <strong>Data:</strong> {training.date}
                </DetailItem>
                <DetailItem>
                  <FaClock />
                  <strong>Hora:</strong> {timeStr} · Instrutor: {instructorName}
                </DetailItem>
                <ActionButtonGroup>
                  <ActionButton accept type="button" disabled={busy} onClick={() => handleAccept(s.id)}>
                    <FaCheckCircle /> Aprovar
                  </ActionButton>
                  <ActionButton primary type="button" disabled={busy} onClick={() => handleOpenRescheduleModal(s)}>
                    <FaCalendarAlt /> Reagendar
                  </ActionButton>
                  <ActionButton type="button" disabled={busy} onClick={() => handleRejectClick(s)}>
                    <FaTimesCircle /> Rejeitar
                  </ActionButton>
                </ActionButtonGroup>
              </SignupCard>
            );
          })}
        </SignupGrid>
      )}

      {showRescheduleModal && (
        <ModalOverlay onClick={handleCloseRescheduleModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseBtn onClick={handleCloseRescheduleModal}>&times;</CloseBtn>
            <ModalTitle>Propor reagendamento</ModalTitle>
            <p style={{ fontSize: '0.9rem', color: 'var(--textMuted,#888)', marginBottom: 12 }}>
              O visitante receberá um email com o novo treino e um link para confirmar. Após confirmar, a inscrição fica válida para o novo treino.
            </p>
            {rescheduleModalError && <p style={{ color: 'var(--error)', fontSize: '0.9rem', marginBottom: 12 }}>{rescheduleModalError}</p>}
            <ModalLabel>Novo treino *</ModalLabel>
            <ModalSelect
              value={selectedProposedTrainingId}
              onChange={(e) => setSelectedProposedTrainingId(e.target.value)}
            >
              <option value="">— Escolher treino —</option>
              {trainingsForReschedule.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || `Treino ${t.id}`} — {t.date} {String(t.time).substring(0, 5)}
                </option>
              ))}
            </ModalSelect>
            <ModalActions>
              <ModalButton type="button" onClick={handleCloseRescheduleModal} disabled={rescheduleFormLoading}>Cancelar</ModalButton>
              <ModalButton primary onClick={handleRescheduleSubmit} disabled={rescheduleFormLoading || !selectedProposedTrainingId}>
                {rescheduleFormLoading ? 'A enviar...' : 'Enviar proposta'}
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => {
          if (actionLoading === null) {
            setShowRejectModal(false);
            setSignupToReject(null);
          }
        }}
        onConfirm={handleRejectConfirm}
        title="Rejeitar inscrição"
        message="Tens a certeza que queres rejeitar esta inscrição em treino experimental? O visitante receberá um email."
        confirmText="Rejeitar"
        cancelText="Cancelar"
        danger
        loading={actionLoading !== null}
      />
    </PageContainer>
  );
}

export default StaffGuestSignupsPage;
