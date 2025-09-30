// src/pages/ClientProgressOverviewPage.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getMyRecordsService, getMyPerformanceHistoryForExerciseService } from '../services/progressService';
import { FaTrophy, FaArrowLeft, FaDumbbell, FaUserCircle, FaChartLine, FaTimes } from 'react-icons/fa';
import AdvancedProgressChart from '../components/Workout/AdvancedProgressChart';
import { useNavigate } from 'react-router-dom';


// --- Styled Components (podes copiar os estilos da AdminClientProgressDetailPage) ---
const PageContainer = styled.div`
  max-width: 900px; margin: 20px auto;
  padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
`;
const Header = styled.div`
  text-align: center; margin-bottom: 30px;
  h1 { font-size: 2.2rem; color: ${({ theme }) => theme.colors.primary}; margin: 0; display: flex; align-items: center; justify-content: center; gap: 12px;}
`;
const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary}; text-decoration: none; font-weight: 500;
  display: inline-flex; align-items: center; gap: 8px; margin-bottom: 25px;
  padding: 9px 16px; border-radius: ${({ theme }) => theme.borderRadius};
  transition: background-color 0.2s;
  &:hover { background-color: ${({ theme }) => theme.colors.cardBackground}; color: #fff; }
`;
const LoadingText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.primary}; padding: 40px; font-size: 1.2rem;`;
const ErrorText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.error}; padding: 20px; background-color: ${({theme}) => theme.colors.errorBg}; border: 1px solid ${({theme}) => theme.colors.error}; border-radius: 8px;`;
const EmptyText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.textMuted}; padding: 30px 15px; font-style: italic; background-color: rgba(0,0,0,0.05); border-radius: 8px;`;
const RecordsGrid = styled.div`display: flex; flex-direction: column; gap: 25px;`;
const ExerciseRecordCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px; border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  h2 { font-size: 1.5rem; color: ${({ theme }) => theme.colors.primary}; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder}; display: flex; justify-content: space-between; align-items: center; }
`;
const RecordList = styled.ul`list-style: none; padding: 0; margin: 0;`;
const RecordItem = styled.li`
  display: flex; justify-content: space-between; align-items: center; padding: 8px 0;
  font-size: 1rem; border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha || 'rgba(255,255,255,0.08)'};
  &:last-child { border-bottom: none; }
  span:first-child { color: ${({ theme }) => theme.colors.textMuted}; }
  span:last-child { font-weight: 600; color: ${({ theme }) => theme.colors.textMuted}; }
`;
const ViewChartButton = styled.button`
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primary};
  padding: 8px 15px; border-radius: 6px; cursor: pointer;
  font-weight: 500; font-size: 0.85rem; transition: all 0.2s;
  display: inline-flex; align-items: center; gap: 8px;
  &:hover { background-color: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.textDark}; }
`;
const ModalOverlay = styled.div`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0,0,0,0.75); display: flex;
    justify-content: center; align-items: center;
    z-index: 2100; padding: 20px;
`;
const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  padding: 32px 36px 28px 28px;
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow}, 0 8px 32px rgba(0,0,0,0.18);
  border-left: 5px solid ${({ theme }) => theme.colors.primary};
  width: 100%; max-width: 540px;
  position: relative;
  display: flex; flex-direction: column;
  max-height: 90vh; overflow-y: auto;
  transition: background 0.2s;
`;

const ModalTitle = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 0 18px 0;
  font-size: 1.35rem;
  text-align: center;
  font-weight: 700;
  letter-spacing: 0.01em;
`;

const CloseButton = styled.button`
  position: absolute; top: 18px; right: 18px;
  background: transparent; border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 2rem; cursor: pointer; line-height: 1;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

const ChartMetricSelector = styled.div`
  display: flex; justify-content: center; align-items: center;
  gap: 10px; margin-bottom: 20px;
  label { color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.9rem; }
  select {
    padding: 8px 12px; background-color: #383838;
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    border-radius: ${({ theme }) => theme.borderRadius};
    color: ${({ theme }) => theme.colors.textMain}; font-size: 0.9rem;
    &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 8px 0 0;
  display: flex;
  align-items: center;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.textMain}; }
`;

const HeaderSpacer = styled.div`
  width: 32px;
  height: 32px;
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content:center;
  text-align: center;
`;

const ClientProgressOverviewPage = () => {
  const theme = useTheme();
  const { authState } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [viewDirection, setViewDirection] = useState('right');
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartData, setChartData] = useState({ exerciseName: '', history: [] });
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartMetric, setChartMetric] = useState('estimated1RM');

  const fetchRecords = useCallback(async () => {
    if (!authState.token) return;
    setLoading(true);
    try {
      const data = await getMyRecordsService(authState.token);
      setRecords(data.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName)));
    } catch (err) {
      setError(err.message || 'Erro ao carregar os teus recordes.');
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleOpenChartModal = async (planExerciseId, exerciseName) => {
    setShowChartModal(true);
    setLoadingChart(true);
    setChartData({ exerciseName, history: [] });
    try {
      // O cliente chama o serviço normal, que já usa o seu próprio ID de utilizador
      const historyData = await getMyPerformanceHistoryForExerciseService(planExerciseId, authState.token);
      setChartData({ exerciseName, history: historyData });
    } catch (err) {
      console.error("Erro ao carregar histórico para o gráfico:", err);
    } finally {
      setLoadingChart(false);
    }
  };

  const handleCloseChartModal = () => {
    setShowChartModal(false);
    setChartData({ exerciseName: '', history: [] });
  };

  const handleBack = () => {
    setViewDirection('left');
    navigate('/dashboard');
  };

  if (loading) return <PageContainer><LoadingText>A carregar o teu progresso...</LoadingText></PageContainer>;
  if (error) return <PageContainer><ErrorText>{error}</ErrorText></PageContainer>;

  return (
    <>
      <PageContainer>
        <HeaderContainer>
          <BackButton onClick={handleBack}><FaArrowLeft /></BackButton>
          <Title>Progresso e Recordes</Title>
          <HeaderSpacer />
        </HeaderContainer>
        
        {records.length > 0 ? (
          <RecordsGrid>
            {records.map(item => (
              <ExerciseRecordCard key={item.planExerciseId}>
                <h2>
                  <span><FaDumbbell /> {item.exerciseName}</span>
                  <ViewChartButton onClick={() => handleOpenChartModal(item.planExerciseId, item.exerciseName)}>
                    <FaChartLine /> Ver Gráfico
                  </ViewChartButton>
                </h2>
                <RecordList>
                  {item.records.map((record, index) => (
                    <RecordItem key={index}>
                      <span>{record.type}</span>
                      <span>{record.value}</span>
                    </RecordItem>
                  ))}
                </RecordList>
              </ExerciseRecordCard>
            ))}
          </RecordsGrid>
        ) : (
          <EmptyText>Ainda não tens recordes registados. Conclui um treino para começar!</EmptyText>
        )}
      </PageContainer>

      {showChartModal && (
        <ModalOverlay onClick={handleCloseChartModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <CloseButton onClick={handleCloseChartModal}><FaTimes /></CloseButton>
            <ModalTitle>A Tua Progressão: {chartData.exerciseName}</ModalTitle>
            {loadingChart ? <LoadingText>A carregar dados do gráfico...</LoadingText> : (
              <>
                <ChartMetricSelector>
                  <label htmlFor="metric-select">Ver Métrica:</label>
                  <select id="metric-select" value={chartMetric} onChange={e => setChartMetric(e.target.value)}>
                    <option value="estimated1RM">1-Rep Max (Estimado)</option>
                    <option value="volume">Volume (Peso x Reps)</option>
                  </select>
                </ChartMetricSelector>
                <AdvancedProgressChart historyLogs={chartData.history} metric={chartMetric} theme={theme} />
              </>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default ClientProgressOverviewPage;