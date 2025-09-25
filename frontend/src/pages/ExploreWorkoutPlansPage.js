// src/pages/ExploreWorkoutPlansPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getVisibleWorkoutPlansService } from '../services/workoutPlanService'; 
import { FaSearch, FaArrowLeft, FaClipboardList, FaInfoCircle, FaChevronDown } from 'react-icons/fa';



// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 25px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
`;

const HeaderContainer = styled.div`
  display: grid; 
  grid-template-columns: auto 1fr auto; 
  align-items: center;
  margin-bottom: 20px;
  gap: 15px; 
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

const BackButton = styled.button` // MUDOU de Link para button
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.2s;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const HeaderSpacer = styled.div``;

const SearchContainer = styled.form`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 15px;
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};
`;

const SearchInput = styled.input`
  flex-grow: 1;
  padding: 10px 14px;
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.95rem;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 10px 20px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
  &:hover {
    background-color: #e6c358; 
  }
`;

const PlanList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  align-items: start;
`;

const PlanCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px;
  border-radius: ${({ theme }) => theme.borderRadius};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  display: flex;
  flex-direction: column;
  cursor: pointer;
  justify-content: space-between;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.25);
  }
`;

const PlanCardTitle = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.25rem;
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
`;

const ChevronIcon = styled(FaChevronDown)`
  transition: transform 0.3s ease;
  transform: ${props => (props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
  font-size: 0.9em;
`;

const PlanCardNotes = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 15px;
  line-height: 1.5;
  flex-grow: 1;
`;

const ExercisePreviewList = styled.ul`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  padding-left: 20px;
  margin-top: 10px;
  margin-bottom: 15px;
  max-height: 100px;
  overflow-y: auto;
  border-top: 1px dashed ${({ theme }) => theme.colors.cardBorder};
  padding-top: 10px;
`;

const ExercisePreviewItem = styled.li`
    margin-bottom: 3px;
`;

const UsePlanButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textButton};
  padding: 10px 15px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: none;
  font-weight: 600;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s;
  width: 100%;
  text-decoration: none;

  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundSelect};
  }
`;

const ExpandableContent = styled.div`
  overflow: hidden;
  transition: max-height 0.4s ease-in-out, opacity 0.4s ease-in-out;
  max-height: ${props => (props.isOpen ? '500px' : '0')};
  opacity: ${props => (props.isOpen ? '1' : '0')};
`;

const LoadingText = styled.p` text-align: center; font-size: 1.1rem; color: ${({ theme }) => theme.colors.primary}; padding: 20px; font-style: italic; `;
const ErrorText = styled.p` text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.error}; padding: 15px; background-color: ${({ theme }) => theme.colors.errorBg}; border: 1px solid ${({ theme }) => theme.colors.error}; border-radius: ${({ theme }) => theme.borderRadius}; margin: 20px auto; max-width: 600px;`;
const NoItemsText = styled.p` text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.textMuted}; padding: 30px 15px; background-color: rgba(0,0,0,0.1); border-radius: ${({ theme }) => theme.borderRadius}; `;

const ExploreWorkoutPlansPage = () => {
  const theme = useTheme();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [viewDirection, setViewDirection] = useState('right');

  const handleToggleExpand = (planId) => {
    setExpandedPlanId(prevId => (prevId === planId ? null : planId));
  };

  const fetchPlans = useCallback(async (term = '') => {
    if (!authState.token) {
      setError("Autenticação necessária.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getVisibleWorkoutPlansService(authState.token, term);
      setPlans(data || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar planos de treino.');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPlans(searchTerm);
  };

  const handleBack = () => {
    setViewDirection('left');
    navigate('/dashboard');
  };

  const handleUseThisPlan = (planId) => {
    navigate(`/meu-progresso/usar-plano/${planId}`);
  };

  if (loading) return <PageContainer><LoadingText>A carregar planos disponíveis...</LoadingText></PageContainer>;

  return (
    <PageContainer>
      <HeaderContainer>
        <BackButton onClick={handleBack}><FaArrowLeft /></BackButton>
        <Title>Explorar Planos de Treino</Title>
        <HeaderSpacer />
      </HeaderContainer>

      <SearchContainer onSubmit={handleSearchSubmit}>
        <SearchInput
          type="text"
          placeholder="Pesquisar planos por nome ou notas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <SearchButton type="submit"><FaSearch /> Pesquisar</SearchButton>
      </SearchContainer>

      {error && <ErrorText>{error}</ErrorText>}

      {!loading && !error && plans.length === 0 && (
        <NoItemsText>Nenhum plano de treino visível encontrado ou que corresponda à sua pesquisa.</NoItemsText>
      )}

      <PlanList>
        {plans.map(plan => {
          const isExpanded = expandedPlanId === plan.id;

          return (
            <PlanCard key={plan.id} onClick={() => handleToggleExpand(plan.id)}>
              <div>
                <PlanCardTitle>
                  {plan.name}
                  <ChevronIcon isOpen={isExpanded} /> {/* Seta adicionada */}
                </PlanCardTitle>
                {plan.notes && <PlanCardNotes><i><FaInfoCircle /> {plan.notes}</i></PlanCardNotes>}
              </div>
              
              {/* Conteúdo que expande e colapsa */}
              <ExpandableContent isOpen={isExpanded}>
                {plan.planExercises && plan.planExercises.length > 0 && (
                  <ExercisePreviewList>
                    {plan.planExercises.slice(0, 3).map(ex => (
                      <ExercisePreviewItem key={ex.id}>
                        {ex.exerciseDetails?.name || 'Exercício desconhecido'}
                        {ex.reps && ` - ${ex.reps} reps`}
                        {ex.sets && ` (${ex.sets} séries)`}
                      </ExercisePreviewItem>
                    ))}
                    {plan.planExercises.length > 3 && <li>... e mais.</li>}
                  </ExercisePreviewList>
                )}
                <UsePlanButton as={Link} to={`/treino-ao-vivo/plano/${plan.id}`} onClick={(e) => e.stopPropagation()}>
                    Iniciar treino
                </UsePlanButton>
              </ExpandableContent>
            </PlanCard>
          );
        })}
      </PlanList>
    </PageContainer>
  );
};

export default ExploreWorkoutPlansPage;