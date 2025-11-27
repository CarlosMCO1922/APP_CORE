// src/pages/admin/AdminClientProgressDetailPage.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { adminGetRecordsForUserService, adminGetFullExerciseHistoryForUserService } from '../../services/progressService';
import { adminGetUserById } from '../../services/userService';
import { FaTrophy, FaDumbbell, FaUserCircle, FaChartLine, FaTimes } from 'react-icons/fa';
import BackArrow from '../../components/BackArrow';
import AdvancedProgressChart from '../../components/Workout/AdvancedProgressChart';



// --- Styled Components ---
const PageContainer = styled.div`
  max-width: 900px;
  margin: 20px auto;
  padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
  h1 {
    font-size: 2.2rem;
    color: ${({ theme }) => theme.colors.primary};
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
`;


const LoadingText = styled.p`
    text-align: center; color: ${({ theme }) => theme.colors.primary}; padding: 40px; font-size: 1.2rem;
`;
const ErrorText = styled.p`
    text-align: center; color: ${({ theme }) => theme.colors.error}; padding: 20px;
    background-color: ${({theme}) => theme.colors.errorBg};
    border: 1px solid ${({theme}) => theme.colors.error}; border-radius: 8px;
`;
const EmptyText = styled.p`
    text-align: center; color: ${({ theme }) => theme.colors.textMuted}; padding: 30px 15px;
    font-style: italic; background-color: rgba(0,0,0,0.05); border-radius: 8px;
`;
const RecordsGrid = styled.div`display: flex; flex-direction: column; gap: 25px;`;
const ExerciseRecordCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px; border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};

  h2 {
    font-size: 1.5rem; color: ${({ theme }) => theme.colors.primary};
    margin: 0 0 15px 0; padding-bottom: 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
    display: flex; justify-content: space-between; align-items: center;
  }
`;
const RecordList = styled.ul`list-style: none; padding: 0; margin: 0;`;
const RecordItem = styled.li`
  display: flex; justify-content: space-between; align-items: center; padding: 8px 0;
  font-size: 1rem; border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha || 'rgba(255,255,255,0.08)'};
  &:last-child { border-bottom: none; }
  span:first-child { color: ${({ theme }) => theme.colors.textMuted}; }
  span:last-child { font-weight: 600; color: ${({ theme }) => theme.colors.textMain}; }
`;
const ViewChartButton = styled.button`
  background-color: transparent;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primary};
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textDark};
  }
`;

// --- Styled Components para o Modal e Gráfico ---
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: ${({ theme }) => theme.colors.overlayBg}; display: flex;
  justify-content: center; align-items: center;
  z-index: 2100; padding: 20px;
`;
const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker}; padding: 25px 35px;
  border-radius: 10px; width: 100%; max-width: 800px; /* Aumentado para o gráfico */
  box-shadow: 0 8px 25px rgba(0,0,0,0.5); position: relative;
  max-height: 90vh; display: flex; flex-direction: column;
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
`;
const ModalTitle = styled.h2`
  color: ${({ theme }) => theme.colors.primary}; margin-top: 0; margin-bottom: 20px;
  font-size: 1.6rem; text-align: center;
`;
const CloseButton = styled.button`
  position: absolute; top: 15px; right: 15px; background: transparent; border: none;
  color: ${({ theme }) => theme.colors.textMuted}; font-size: 1.8rem; cursor: pointer; line-height: 1;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.textMain}; }
`;
const ChartMetricSelector = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  
  label {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.9rem;
  }

  select {
    padding: 8px 12px;
    background-color: ${({ theme }) => theme.colors.inputBg};
    border: 1px solid ${({ theme }) => theme.colors.inputBorder};
    border-radius: ${({ theme }) => theme.borderRadius};
    color: ${({ theme }) => theme.colors.inputText};
    font-size: 0.9rem;
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const AdminClientProgressDetailPage = () => {
    const theme = useTheme();
    const { userId } = useParams();
    const { authState } = useAuth();
    const [client, setClient] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showChartModal, setShowChartModal] = useState(false);
    const [chartData, setChartData] = useState({ exerciseName: '', history: [] });
    const [loadingChart, setLoadingChart] = useState(false);
    const [chartMetric, setChartMetric] = useState('estimated1RM');

    const fetchData = useCallback(async () => {
        if (!authState.token || !userId) return;
        setLoading(true);
        try {
            const [clientData, recordsData] = await Promise.all([
                adminGetUserById(userId, authState.token),
                adminGetRecordsForUserService(userId, authState.token)
            ]);
            setClient(clientData);
            setRecords(recordsData.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName)));
        } catch (err) {
            setError(err.message || 'Erro ao carregar dados do cliente.');
        } finally {
            setLoading(false);
        }
    }, [authState.token, userId]);

    useEffect(() => { fetchData(); }, [fetchData]);
    
    const handleOpenChartModal = async (planExerciseId, exerciseName) => {
        setShowChartModal(true);
        setLoadingChart(true);
        setChartData({ exerciseName, history: [] });
        try {
            const historyData = await adminGetFullExerciseHistoryForUserService(userId, planExerciseId, authState.token);
            setChartData({ exerciseName, history: historyData });
        } catch(err) {
            console.error("Erro ao carregar histórico para o gráfico:", err);
            // Poderíamos mostrar um erro no modal aqui
        } finally {
            setLoadingChart(false);
        }
    };
    
    const handleCloseChartModal = () => {
        setShowChartModal(false);
        setChartData({ exerciseName: '', history: [] });
    };

    if (loading) return <PageContainer><LoadingText>A carregar progresso do cliente...</LoadingText></PageContainer>;
    if (error) return <PageContainer><ErrorText>{error}</ErrorText></PageContainer>;

    return (
        <>
            <PageContainer>
                <Header>
                    <h1>
                      <BackArrow to="/admin/progresso-clientes" />
                      <span><FaUserCircle /> Progresso de {client?.firstName} {client?.lastName}</span>
                    </h1>
                </Header>
                
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
                    <EmptyText>Este cliente ainda não tem recordes pessoais registados.</EmptyText>
                )}
            </PageContainer>

            {showChartModal && (
                <ModalOverlay onClick={handleCloseChartModal}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <CloseButton onClick={handleCloseChartModal}><FaTimes /></CloseButton>
                        <ModalTitle>Progressão: {chartData.exerciseName}</ModalTitle>
                        {loadingChart ? <LoadingText>A carregar dados...</LoadingText> : (
                            <>
                                <ChartMetricSelector>
                                    <label htmlFor="metric-select">Ver Métrica:</label>
                                    <select id="metric-select" value={chartMetric} onChange={e => setChartMetric(e.target.value)}>
                                        <option value="estimated1RM">1-Rep Max (Estimado)</option>
                                        <option value="volume">Volume (Peso x Reps)</option>
                                        {/*<option value="performedWeight">Peso Levantado</option>*/}
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
export default AdminClientProgressDetailPage;