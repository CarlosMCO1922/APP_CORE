// src/pages/admin/AdminManageExercisesPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import BackArrow from '../../components/BackArrow';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../../components/Common/ConfirmationModal';
import {
    getAllExercises,
    createExercise,
    updateExercise,
    deleteExercise
} from '../../services/exerciseService';

const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
`;

const TopActionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
`;

const CreateButtonStyled = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 10px 18px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 800;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.15s ease;

  &:hover { background-color: ${({ theme }) => theme.colors.primaryHover}; transform: translateY(-1px); }
  @media (max-width: 480px) { width: 100%; padding: 12px; }
`;

const ExercisesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const ExerciseCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 12px 14px;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const CardTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const CardTitle = styled.div`
  font-weight: 900;
  font-size: 0.98rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardSubtitle = styled.div`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Thumb = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  background: ${({ theme }) => theme.colors.cardBackgroundDarker || theme.colors.cardBackground};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`;

const CardBody = styled.div`
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 10px;
  align-items: center;
  font-size: 0.85rem;
`;

const InfoLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;

const InfoValue = styled.span`
  color: ${({ theme }) => theme.colors.textMain};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardFooter = styled.div`
  padding: 12px 14px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    justify-content: space-between;
    & > button { flex: 1 1 calc(50% - 5px); justify-content: center; }
  }
`;

const IconActionButton = styled.button`
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  color: ${({ theme }) => theme.colors.textMain};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, transform 0.15s ease, border-color 0.2s ease;
  font-weight: 800;

  &:hover { background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg}; border-color: ${({ theme }) => theme.colors.primary}; transform: translateY(-1px); }
  &.danger { background-color: ${({ theme }) => theme.colors.error}; border-color: ${({ theme }) => theme.colors.error}; color: white; }
`;
const LoadingText = styled.p` font-size: 1.1rem; text-align: center; padding: 20px; color: #D4AF37;`;
const ErrorText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #FF6B6B; background-color: rgba(255,107,107,0.15); border: 1px solid #FF6B6B; border-radius: 8px; margin: 15px 0;`;
const MessageText = styled.p` font-size: 1rem; text-align: center; padding: 12px; color: #66BB6A; background-color: rgba(102,187,106,0.15); border: 1px solid #66BB6A; border-radius: 8px; margin: 15px 0;`;

const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.75); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; `;
const ModalContent = styled.div` background-color: #2C2C2C; padding: 30px 40px; border-radius: 10px; width: 100%; max-width: 600px; box-shadow: 0 5px 20px rgba(0,0,0,0.4); position: relative; max-height: 90vh; overflow-y: auto; `;
const ModalTitle = styled.h2` color: #D4AF37; margin-top: 0; margin-bottom: 25px; font-size: 1.6rem; text-align: center;`;
const ModalForm = styled.form` display: flex; flex-direction: column; gap: 15px; `;
const ModalLabel = styled.label` font-size: 0.9rem; color: #b0b0b0; margin-bottom: 5px; display: block; font-weight: 500; `;
const ModalInput = styled.input` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; &:focus { outline: none; border-color: #D4AF37; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const ModalTextarea = styled.textarea` padding: 10px 12px; background-color: #383838; border: 1px solid #555; border-radius: 6px; color: #E0E0E0; font-size: 0.95rem; width: 100%; min-height: 80px; resize: vertical; &:focus { outline: none; border-color: #D4AF37; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); } `;
const ModalActions = styled.div` display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; `;
const ModalButton = styled.button`
  padding: 10px 18px; border-radius: 6px; border: none; cursor: pointer;
  font-weight: 500; transition: background-color 0.2s ease;
  background-color: ${props => props.primary ? '#D4AF37' : '#555'};
  color: ${props => props.primary ? '#1A1A1A' : '#E0E0E0'};
  &:hover { background-color: ${props => props.primary ? '#e6c358' : '#666'}; }
  &:disabled { background-color: #404040; color: #777; cursor: not-allowed; }
`;
const CloseButton = styled.button`
  position: absolute; top: 15px; right: 20px;
  background: transparent; border: none;
  color: #aaa; font-size: 1.8rem; cursor: pointer;
  line-height: 1; padding: 0;
  &:hover { color: #fff; }
`;

const initialExerciseFormState = {
  name: '',
  description: '',
  imageUrl: '',
  videoUrl: '',
  muscleGroup: '',
};

function AdminManageExercisesPage() {
  const { authState } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExerciseData, setCurrentExerciseData] = useState(initialExerciseFormState);
  const [currentExerciseId, setCurrentExerciseId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchExercisesList = useCallback(async () => {
    if (authState.token) {
      try {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        const data = await getAllExercises(authState.token);
        data.sort((a, b) => a.id - b.id);
        setExercises(data);
      } catch (err) {
        setError(err.message || 'Não foi possível carregar os exercícios.');
        setExercises([]);
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token]);

  useEffect(() => {
    fetchExercisesList();
  }, [fetchExercisesList]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentExerciseData(initialExerciseFormState);
    setCurrentExerciseId(null);
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (exercise) => {
    setIsEditing(true);
    setCurrentExerciseData({
      name: exercise.name,
      description: exercise.description || '',
      imageUrl: exercise.imageUrl || '',
      videoUrl: exercise.videoUrl || '',
      muscleGroup: exercise.muscleGroup || '',
    });
    setCurrentExerciseId(exercise.id);
    setModalError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentExerciseData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!currentExerciseData.name) {
        setModalError("O nome do exercício é obrigatório.");
        return;
    }

    const isDuplicate = exercises.some(
      ex => 
        ex.name.trim().toLowerCase() === currentExerciseData.name.toLowerCase() &&
        ex.id !== currentExerciseData.id 
    );

    if (isDuplicate) {
      setModalError('Já existe um exercício com este nome.');
      return;
    }

    setFormLoading(true);
    setModalError(''); setError(''); setSuccessMessage('');

    try {
      if (isEditing) {
        await updateExercise(currentExerciseId, currentExerciseData, authState.token);
        setSuccessMessage('Exercício atualizado com sucesso!');
      } else {
        await createExercise(currentExerciseData, authState.token);
        setSuccessMessage('Exercício criado com sucesso!');
      }
      fetchExercisesList();
      handleCloseModal();
    } catch (err) {
      setModalError(err.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} exercício.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = (exerciseId, exerciseName) => {
    setExerciseToDelete({ id: exerciseId, name: exerciseName });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!exerciseToDelete) return;
    setDeleteLoading(true);
    setError(''); 
    setSuccessMessage('');
    try {
      await deleteExercise(exerciseToDelete.id, authState.token);
      setSuccessMessage(`Exercício "${exerciseToDelete.name}" eliminado com sucesso.`);
      setShowDeleteModal(false);
      setExerciseToDelete(null);
      fetchExercisesList();
    } catch (err) {
      setError(err.message || 'Erro ao eliminar exercício.');
      setShowDeleteModal(false);
      setExerciseToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading && !showModal) {
    return <PageContainer><LoadingText>A carregar lista de exercícios...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <TopActionsContainer>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackArrow to="/admin/dashboard" />
          <Title>Exercícios</Title>
        </div>
        <CreateButtonStyled onClick={handleOpenCreateModal}>Criar Novo Exercício</CreateButtonStyled>
      </TopActionsContainer>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

      {exercises.length > 0 ? (
        <ExercisesGrid>
          {exercises.map(ex => (
            <ExerciseCard key={ex.id}>
              <CardHeader>
                <CardTitleBlock>
                  <CardTitle title={ex.name || ''}>{ex.name}</CardTitle>
                  <CardSubtitle title={ex.muscleGroup || ''}>{ex.muscleGroup || 'Sem grupo muscular'}</CardSubtitle>
                </CardTitleBlock>
                <Thumb title={ex.imageUrl ? 'Imagem' : 'Sem imagem'}>
                  {ex.imageUrl ? <img src={ex.imageUrl} alt={ex.name} /> : null}
                </Thumb>
              </CardHeader>

              <CardBody>
                <InfoRow>
                  <InfoLabel>ID</InfoLabel>
                  <InfoValue title={String(ex.id)}>{ex.id}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Vídeo</InfoLabel>
                  <InfoValue title={ex.videoUrl ? 'Com vídeo' : 'Sem vídeo'}>{ex.videoUrl ? 'Com vídeo' : 'Sem vídeo'}</InfoValue>
                </InfoRow>
              </CardBody>

              <CardFooter>
                <IconActionButton type="button" onClick={() => handleOpenEditModal(ex)} title="Editar" aria-label="Editar">
                  Editar
                </IconActionButton>
                <IconActionButton type="button" className="danger" onClick={() => handleDeleteClick(ex.id, ex.name)} title="Eliminar" aria-label="Eliminar">
                  Eliminar
                </IconActionButton>
              </CardFooter>
            </ExerciseCard>
          ))}
        </ExercisesGrid>
      ) : (
        <ErrorText>Nenhum exercício encontrado.</ErrorText>
      )}

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}>&times;</CloseButton>
            <ModalTitle>{isEditing ? 'Editar Exercício' : 'Criar Novo Exercício'}</ModalTitle>
            {modalError && <ErrorText style={{marginBottom: '15px'}}>{modalError}</ErrorText>}
            <ModalForm onSubmit={handleFormSubmit}>
              <ModalLabel htmlFor="nameEx">Nome do Exercício*</ModalLabel>
              <ModalInput type="text" name="name" id="nameEx" value={currentExerciseData.name} onChange={handleFormChange} required />

              <ModalLabel htmlFor="descriptionEx">Descrição</ModalLabel>
              <ModalTextarea name="description" id="descriptionEx" value={currentExerciseData.description} onChange={handleFormChange} />

              <ModalLabel htmlFor="imageUrlEx">URL da Imagem</ModalLabel>
              <ModalInput type="url" name="imageUrl" id="imageUrlEx" value={currentExerciseData.imageUrl} onChange={handleFormChange} placeholder="https://exemplo.com/imagem.jpg"/>

              <ModalLabel htmlFor="videoUrlEx">URL do Vídeo (YouTube, Vimeo, etc.)</ModalLabel>
              <ModalInput type="url" name="videoUrl" id="videoUrlEx" value={currentExerciseData.videoUrl} onChange={handleFormChange} placeholder="https://youtube.com/exemplo-supino"/>

              <ModalLabel htmlFor="muscleGroupEx">Grupo Muscular</ModalLabel>
              <ModalInput type="text" name="muscleGroup" id="muscleGroupEx" value={currentExerciseData.muscleGroup} onChange={handleFormChange} placeholder="Ex: Peito, Costas, Pernas"/>

              <ModalActions>
                <ModalButton type="button" onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}>
                  {formLoading ? 'A guardar...' : (isEditing ? 'Guardar Alterações' : 'Criar Exercício')}
                </ModalButton>
              </ModalActions>
            </ModalForm>
          </ModalContent>
        </ModalOverlay>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!deleteLoading) {
            setShowDeleteModal(false);
            setExerciseToDelete(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Exercício"
        message={exerciseToDelete ? `Tem a certeza que deseja eliminar o exercício "${exerciseToDelete.name}" (ID: ${exerciseToDelete.id})? Esta ação não pode ser desfeita.` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger={true}
        loading={deleteLoading}
      />
    </PageContainer>
  );
}

export default AdminManageExercisesPage;