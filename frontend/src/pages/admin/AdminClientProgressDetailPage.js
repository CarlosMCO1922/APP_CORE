// src/pages/admin/AdminClientProgressDetailPage.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { adminGetRecordsForUserService } from '../../services/progressService';
import { adminGetUserById } from '../../services/userService';
import { FaTrophy, FaArrowLeft, FaDumbbell, FaUserCircle, FaSearch } from 'react-icons/fa';

// --- Styled Components ---
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
  h2 { font-size: 1.5rem; color: ${({ theme }) => theme.colors.primary}; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder}; display: flex; align-items: center; gap: 10px; }
`;
const RecordList = styled.ul`list-style: none; padding: 0; margin: 0;`;
const RecordItem = styled.li`
  display: flex; justify-content: space-between; align-items: center; padding: 8px 0;
  font-size: 1rem; border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha || 'rgba(255,255,255,0.08)'};
  &:last-child { border-bottom: none; }
  span:first-child { color: ${({ theme }) => theme.colors.textMuted}; }
  span:last-child { font-weight: 600; color: white; }
`;

const AdminClientProgressDetailPage = () => {
    const { userId } = useParams();
    const { authState } = useAuth();
    const [client, setClient] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    if (loading) return <PageContainer><LoadingText>A carregar progresso do cliente...</LoadingText></PageContainer>;
    if (error) return <PageContainer><ErrorText>{error}</ErrorText></PageContainer>;

    return (
        <PageContainer>
            <BackLink to="/admin/progresso-clientes"><FaArrowLeft /> Voltar à Seleção de Clientes</BackLink>
            <Header>
                <h1><FaUserCircle /> Progresso de {client?.firstName} {client?.lastName}</h1>
            </Header>
            
            {records.length > 0 ? (
                <RecordsGrid>
                    {records.map(item => (
                        <ExerciseRecordCard key={item.planExerciseId}>
                            <h2><FaDumbbell /> {item.exerciseName}</h2>
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

            {/* Futuramente, os gráficos avançados e 1RM entrarão aqui */}
        </PageContainer>
    );
};
export default AdminClientProgressDetailPage;