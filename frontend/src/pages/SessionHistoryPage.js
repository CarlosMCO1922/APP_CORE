// frontend/src/pages/SessionHistoryPage.js
import React, { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getSessionsHistoryService } from '../services/sessionService';
import { FaChevronLeft, FaCalendarAlt, FaChartLine } from 'react-icons/fa';

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.pageBackground};
  padding-bottom: 80px;
`;

const Header = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 10;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  margin-right: 12px;
  display: flex;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0;
`;

const Content = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const MonthBlock = styled.div`
  margin-bottom: 18px;
`;

const MonthTitle = styled.div`
  font-weight: 900;
  letter-spacing: 0.02em;
  color: ${({ theme }) => theme.colors.textMain};
  margin: 12px 0 10px;
  display: flex;
  align-items: baseline;
  gap: 10px;
`;

const MonthMeta = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 700;
`;

const SessionCard = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
`;

const SessionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const SessionName = styled.h3`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0 0 4px 0;
`;

const SessionDate = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SessionStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: ${({ theme }) => theme.colors.pageBackground};
  border-radius: 8px;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
`;

// Modal antigo removido: agora existe página dedicada de detalhe (/treino/historico/:sessionId)

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const SessionHistoryPage = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSessionsHistoryService(authState.token, {
        limit: 50,
        offset: 0,
      });
      setSessions(response.sessions || []);
    } catch (err) {
      console.error('Erro ao carregar sessões:', err);
      setError('Erro ao carregar histórico de treinos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (sessionId) => {
    if (!sessionId) return;
    navigate(`/treino/historico/${sessionId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const monthGroups = useMemo(() => {
    const items = (sessions || []).slice().sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    const groups = new Map();
    for (const s of items) {
      const d = new Date(s.completedAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    }
    return Array.from(groups.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, list]) => {
        const [year, month] = key.split('-').map((x) => parseInt(x, 10));
        const dt = new Date(year, month - 1, 1);
        const label = dt.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
        return { key, label, sessions: list };
      });
  }, [sessions]);

  return (
    <PageContainer>
      <Header>
        <HeaderTop>
          <BackButton onClick={() => navigate(-1)}>
            <FaChevronLeft />
          </BackButton>
          <Title>Histórico</Title>
        </HeaderTop>
      </Header>

      <Content>
        {loading && <LoadingMessage>A carregar histórico...</LoadingMessage>}
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        {!loading && !error && sessions.length === 0 && (
          <EmptyState>
            <EmptyIcon><FaChartLine /></EmptyIcon>
            <p>Ainda não tens treinos concluídos.</p>
            <p>Completa o teu primeiro treino para veres o histórico aqui!</p>
          </EmptyState>
        )}
        
        {!loading && !error && sessions.length > 0 && monthGroups.map((group) => (
          <MonthBlock key={group.key}>
            <MonthTitle>
              <span style={{ textTransform: 'capitalize' }}>{group.label}</span>
              <MonthMeta>{group.sessions.length} {group.sessions.length === 1 ? 'treino' : 'treinos'}</MonthMeta>
            </MonthTitle>
            {group.sessions.map((session) => (
              <SessionCard key={session.id} onClick={() => handleSessionClick(session.id)}>
                <SessionHeader>
                  <div>
                    <SessionName>{session.workoutPlanName}</SessionName>
                    <SessionDate>
                      <FaCalendarAlt /> {formatDate(session.completedAt)}
                    </SessionDate>
                  </div>
                </SessionHeader>
                
                <SessionStats>
                  <StatItem>
                    <StatLabel>Séries</StatLabel>
                    <StatValue>{session.totalSets || 0}</StatValue>
                  </StatItem>
                  
                  <StatItem>
                    <StatLabel>Volume</StatLabel>
                    <StatValue>
                      {session.totalVolume 
                        ? `${Math.round(session.totalVolume)}kg`
                        : '-'}
                    </StatValue>
                  </StatItem>

                  <StatItem>
                    <StatLabel>Estado</StatLabel>
                    <StatValue style={{ fontSize: '0.95rem' }}>Concluído</StatValue>
                  </StatItem>
                </SessionStats>
              </SessionCard>
            ))}
          </MonthBlock>
        ))}
      </Content>
    </PageContainer>
  );
};

export default SessionHistoryPage;
