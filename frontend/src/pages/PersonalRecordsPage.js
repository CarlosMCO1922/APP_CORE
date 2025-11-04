// src/pages/PersonalRecordsPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styled, { css } from 'styled-components';
import { getMyRecordsService } from '../services/progressService';
import { FaSearch, FaArrowLeft, FaClipboardList, FaInfoCircle, FaChevronDown, FaDumbbell} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

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

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 25px;
  padding: 9px 16px;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background-color 0.2s, color 0.2s;
  font-size: 0.95rem;

  &:hover {
    background-color: ${({ theme }) => theme.colors.cardBackground};
    color: ${({ theme }) => theme.colors.textMain};
  }
`;

const MessageBaseStyles = css`
  text-align: center;
  padding: 12px 18px;
  margin: 20px auto;
  border-radius: ${({ theme }) => theme.borderRadius};
  border-width: 1px;
  border-style: solid;
  max-width: 600px;
  font-size: 0.9rem;
  font-weight: 500;
`;

const LoadingText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.primary}; padding: 40px; font-size: 1.2rem;`;
const ErrorText = styled.p`text-align: center; color: ${({ theme }) => theme.colors.error}; padding: 20px; background-color: ${({theme}) => theme.colors.errorBg}; border: 1px solid ${({theme}) => theme.colors.error}; border-radius: 8px;`;
const EmptyText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  border-color: transparent;
  background-color: rgba(0,0,0,0.05);
  padding: 30px 15px;
`;

const FilterContainer = styled.div`
  position: sticky;
  top: 75px; /* Altura aproximada da tua Navbar. Ajusta se for diferente. */
  padding: 15px;
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 900;
  margin: 0 -15px 20px -15px; /* Compensa o padding para ir de ponta a ponta */
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 15px;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

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
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorderAlpha || 'rgba(255,255,255,0.08)'};
  
  &:last-child { border-bottom: none; }

  span:first-child { color: ${({ theme }) => theme.colors.textMuted}; }
  span:last-child { font-weight: 600; color: ${({ theme }) => theme.colors.textMain}; }
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

const PersonalRecordsPage = () => {
  const { authState } = useAuth();
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [viewDirection, setViewDirection] = useState('right');

  const fetchRecords = useCallback(async () => {
    if (!authState.token) return;
    try {
      setLoading(true);
      const data = await getMyRecordsService(authState.token);
      const sortedData = data.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
      setAllRecords(sortedData);
    } catch (err) {
      setError(err.message || 'Erro ao carregar os teus recordes.');
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm) {
      return allRecords;
    }
    return allRecords.filter(item =>
      item.exerciseName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allRecords, searchTerm]);

  const handleBack = () => {
    setViewDirection('left');
    navigate('/dashboard');
  };

  if (loading) return <PageContainer><LoadingText>A carregar recordes...</LoadingText></PageContainer>;
  if (error) return <PageContainer><ErrorText>{error}</ErrorText></PageContainer>;

  return (
    <PageContainer>
      <HeaderContainer>
        <BackButton onClick={handleBack}><FaArrowLeft /></BackButton>
        <Title>Progresso e Recordes</Title>
        <HeaderSpacer />
      </HeaderContainer>
      
      {allRecords.length > 0 && (
        <FilterContainer>
            <FaSearch style={{color: 'currentColor'}} />
            <SearchInput
                type="text"
                placeholder="Pesquisar exercício..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </FilterContainer>
      )}

      {filteredRecords.length > 0 ? (
        <RecordsGrid>
          {filteredRecords.map(item => (
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
        <EmptyText>
            {searchTerm ? 'Nenhum exercício encontrado para a tua pesquisa.' : 'Ainda não tens recordes registados. Conclui um treino para começar!'}
        </EmptyText>
      )}
    </PageContainer>
  );
};

export default PersonalRecordsPage;