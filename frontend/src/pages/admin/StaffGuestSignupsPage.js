// src/pages/admin/StaffGuestSignupsPage.js
// Lista inscrições de visitantes em treinos experimentais pendentes e permite aprovar/rejeitar.
import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import BackArrow from '../../components/BackArrow';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { getGuestSignupsPending, respondToGuestSignup } from '../../services/trainingService';
import { FaUserCircle, FaClock, FaCalendarDay, FaDumbbell, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

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

  background-color: ${(p) => (p.accept ? p.theme.colors.success : p.theme.colors.error)};
  color: white;

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

function StaffGuestSignupsPage() {
  const { authState } = useAuth();
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [pageSuccess, setPageSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [signupToReject, setSignupToReject] = useState(null);

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
                  <ActionButton
                    accept
                    type="button"
                    disabled={busy}
                    onClick={() => handleAccept(s.id)}
                  >
                    <FaCheckCircle /> Aprovar
                  </ActionButton>
                  <ActionButton
                    type="button"
                    disabled={busy}
                    onClick={() => handleRejectClick(s)}
                  >
                    <FaTimesCircle /> Rejeitar
                  </ActionButton>
                </ActionButtonGroup>
              </SignupCard>
            );
          })}
        </SignupGrid>
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
