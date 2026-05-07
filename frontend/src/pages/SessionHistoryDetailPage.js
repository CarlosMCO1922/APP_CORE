import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getSessionDetailsService } from '../services/sessionService';
import BackArrow from '../components/BackArrow';
import { FaDumbbell, FaClock, FaTrophy } from 'react-icons/fa';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.pageBackground};
  padding: 18px 16px 90px;
`;

const Header = styled.div`
  position: sticky;
  top: 0;
  z-index: 20;
  background: ${({ theme }) => theme.colors.pageBackground};
  padding: 10px 0 14px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TitleBlock = styled.div`
  min-width: 0;
  flex: 1;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.35rem, 4vw, 1.8rem);
  color: ${({ theme }) => theme.colors.textMain};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Subtitle = styled.div`
  margin-top: 4px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const TopStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 12px;
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 12px;
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const StatValue = styled.div`
  font-weight: 800;
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1.05rem;
`;

const Section = styled.div`
  margin-top: 16px;
`;

const ExerciseCard = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
`;

const ExerciseHeader = styled.div`
  padding: 12px 12px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const ExerciseName = styled.div`
  font-weight: 900;
  color: ${({ theme }) => theme.colors.primary};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MetricChips = styled.div`
  display: flex;
  gap: 8px;
`;

const Chip = styled.button`
  border-radius: 999px;
  padding: 6px 10px;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  background: ${({ $active, theme }) => ($active ? `${theme.colors.primary}22` : 'transparent')};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 800;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
`;

const SetsTable = styled.div`
  padding: 10px 12px 12px;
`;

const RowHead = styled.div`
  display: grid;
  grid-template-columns: 52px 1fr 74px;
  gap: 10px;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0 0 8px 0;
`;

const SetRow = styled.div`
  display: grid;
  grid-template-columns: 52px 1fr 74px;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha || 'rgba(255,255,255,0.08)'};
`;

const SetIdx = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 900;
`;

const SetMain = styled.div`
  color: ${({ theme }) => theme.colors.textMain};
  font-weight: 800;
`;

const SetMetric = styled.div`
  color: ${({ theme }) => theme.colors.textMain};
  text-align: right;
  font-weight: 900;
`;

const Loading = styled.div`
  padding: 28px 0;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
`;

function formatDateTimePt(dateStr, timeStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + (timeStr ? `T${timeStr}` : ''));
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('pt-PT', { dateStyle: 'long', timeStyle: 'short' });
}

function formatDuration(seconds) {
  const s = parseInt(seconds || 0, 10);
  if (!s) return '-';
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function estimate1RM(weight, reps) {
  const w = parseFloat(weight || 0);
  const r = parseInt(reps || 0, 10);
  if (!w || !r) return 0;
  return w * (1 + r / 30);
}

export default function SessionHistoryDetailPage() {
  const { authState } = useAuth();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [metric, setMetric] = useState('1rm'); // 1rm | vol | peso

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const details = await getSessionDetailsService(parseInt(sessionId, 10), authState.token);
        if (mounted) setSession(details);
      } catch (e) {
        if (mounted) setSession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (authState.token && sessionId) run();
    return () => { mounted = false; };
  }, [authState.token, sessionId]);

  const exercises = useMemo(() => session?.exercises || [], [session]);

  return (
    <PageContainer>
      <Header>
        <HeaderRow>
          <BackArrow onClick={() => navigate(-1)} />
          <TitleBlock>
            <Title>{session?.workoutPlanName || 'Treino'}</Title>
            <Subtitle>{session?.trainingDate ? formatDateTimePt(session.trainingDate, session?.trainingTime) : (session?.completedAt ? new Date(session.completedAt).toLocaleString('pt-PT') : '')}</Subtitle>
          </TitleBlock>
        </HeaderRow>

        {!!session && (
          <TopStats>
            <StatCard>
              <StatLabel><FaClock /> Duração</StatLabel>
              <StatValue>{formatDuration(session.totalDurationSeconds)}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel><FaDumbbell /> Volume</StatLabel>
              <StatValue>{session.totalVolume ? `${Math.round(session.totalVolume)}kg` : '-'}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel><FaTrophy /> PRs</StatLabel>
              <StatValue>{Array.isArray(session.metadata?.prs) ? session.metadata.prs.length : (session.metadata?.prsCount ?? '-')}</StatValue>
            </StatCard>
          </TopStats>
        )}
      </Header>

      {loading && <Loading>A carregar treino…</Loading>}
      {!loading && !session && <Loading>Não foi possível carregar o treino.</Loading>}

      {!loading && session && (
        <Section>
          {exercises.map((ex) => (
            <ExerciseCard key={ex.planExerciseId || ex.exerciseId || ex.exerciseName}>
              <ExerciseHeader>
                <ExerciseName>{ex.exerciseName}</ExerciseName>
                <MetricChips>
                  <Chip type="button" $active={metric === '1rm'} onClick={() => setMetric('1rm')}>1 RM</Chip>
                  <Chip type="button" $active={metric === 'vol'} onClick={() => setMetric('vol')}>Vol.</Chip>
                  <Chip type="button" $active={metric === 'peso'} onClick={() => setMetric('peso')}>Peso</Chip>
                </MetricChips>
              </ExerciseHeader>
              <SetsTable>
                <RowHead>
                  <div>Série</div>
                  <div>Registo</div>
                  <div style={{ textAlign: 'right' }}>{metric === '1rm' ? '1 RM' : (metric === 'vol' ? 'Vol.' : 'kg')}</div>
                </RowHead>
                {(ex.sets || []).map((s) => {
                  const w = parseFloat(s.performedWeight || 0);
                  const r = parseInt(s.performedReps || 0, 10);
                  const vol = w && r ? w * r : 0;
                  const rm = estimate1RM(w, r);
                  const metricValue =
                    metric === '1rm'
                      ? (rm ? Math.round(rm) : '-')
                      : metric === 'vol'
                        ? (vol ? Math.round(vol) : '-')
                        : (w ? w : '-');
                  return (
                    <SetRow key={s.id || `${ex.planExerciseId}-${s.setNumber}-${s.performedAt}`}>
                      <SetIdx>{s.setNumber || '-'}</SetIdx>
                      <SetMain>{w ? `${w} kg × ${r || 0}` : `— × ${r || 0}`}</SetMain>
                      <SetMetric>{metricValue}</SetMetric>
                    </SetRow>
                  );
                })}
              </SetsTable>
            </ExerciseCard>
          ))}
        </Section>
      )}
    </PageContainer>
  );
}

