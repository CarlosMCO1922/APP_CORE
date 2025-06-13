// src/pages/PersonalRecordsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyRecordsService } from '../services/progressService';
import { FaTrophy, FaArrowLeft, FaDumbbell } from 'react-icons/fa';

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
  h1 { font-size: 2.5rem; color: ${({ theme }) => theme.colors.primary}; margin: 0; }
`;

const BackLink = styled(Link)` /* ... (podes copiar de outra página) ... */ `;
const LoadingText = styled.p` /* ... (podes copiar de outra página) ... */ `;
const ErrorText = styled.p` /* ... (podes copiar de outra página) ... */ `;
const EmptyText = styled.p` /* ... (podes copiar de outra página) ... */ `;

const RecordsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const ExerciseRecordCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px;
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};

  h2 {
    font-size: 1.5rem;
    color: ${({ theme }) => theme.colors.primary};
    margin: 0 0 15px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const RecordList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const RecordItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha};
  
  &:last-child { border-bottom: none; }

  span:first-child { color: ${({ theme }) => theme.colors.textMuted}; }
  span:last-child { font-weight: 600; color: white; }
`;

const PersonalRecordsPage = () => {
  const { authState } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecords = useCallback(async () => {
    if (!authState.token) return;
    try {
      setLoading(true);
      const data = await getMyRecordsService(authState.token);
      setRecords(data);
    } catch (err) {
      setError(err.message || 'Erro ao carregar os teus recordes.');
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  if (loading) return <PageContainer><LoadingText>A carregar recordes...</LoadingText></PageContainer>;
  if (error) return <PageContainer><ErrorText>{error}</ErrorText></PageContainer>;

  return (
    <PageContainer>
      <BackLink to="/dashboard">‹ Voltar ao Painel</BackLink>
      <Header>
        <h1><FaTrophy /> Meus Recordes Pessoais</h1>
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
        <EmptyText>Ainda não tens recordes registados. Conclui um treino para começar!</EmptyText>
      )}
    </PageContainer>
  );
};

export default PersonalRecordsPage;