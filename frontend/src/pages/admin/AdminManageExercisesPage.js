// src/pages/admin/AdminManageExercisesPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import {
    getAllExercises,
    createExercise,
    updateExercise,
    deleteExercise
} from '../../services/exerciseService';

const PageContainer = styled.div` background-color: #1A1A1A; color: #E0E0E0; min-height: 100vh; padding: 20px 40px; font-family: 'Inter', sans-serif; `;
const Title = styled.h1` font-size: 2.2rem; color: #D4AF37; margin-bottom: 25px; `;
const Table = styled.table` width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #252525; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5); th, td { border-bottom: 1px solid #383838; padding: 10px 12px; text-align: left; font-size: 0.9rem; } th { background-color: #303030; color: #D4AF37; font-weight: 600; } tr:last-child td { border-bottom: none; } tr:hover { background-color: #2c2c2c; } img { max-width: 60px; max-height: 60px; object-fit: cover; border-radius: 4px; } `;
const ActionButton = styled.button` margin-right: 8px; padding: 6px 10px; font-size: 0.85rem; border-radius: 5px; cursor: pointer; border: none; transition: background-color 0.2s ease; background-color: ${props => props.danger ? '#D32F2F' : (props.secondary ? '#555' : '#D4AF37')}; color: ${props => props.danger ? 'white' : (props.secondary ? '#E0E0E0' : '#1A1A1A')}; &:hover { background-color: ${props => props.danger ? '#C62828' : (props.secondary ? '#666' : '#e6c358')}; } &:disabled { background-color: #404040; color: #777; cursor: not-allowed; }`;
const TopActionsContainer = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; `;
const CreateButtonStyled = styled.button` background-color: #D4AF37; color: #1A1A1A; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; border: none; cursor: pointer; transition: background-color 0.2s ease; &:hover { background-color: #e6c358; } `;
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
        ex.name.trim().toLowerCase() === exerciseName.toLowerCase() &&
        ex.id !== currentExerciseId 
    );

    if (isDuplicate) {
      setModalError('Já existe um exercício com este nome.');
      return; // Para a execução da função
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

  const handleDelete = async (exerciseId, exerciseName) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar o exercício "${exerciseName}" (ID: ${exerciseId})?`)) {
      return;
    }
    setError(''); setSuccessMessage('');
    try {
      await deleteExercise(exerciseId, authState.token);
      setSuccessMessage(`Exercício "${exerciseName}" eliminado com sucesso.`);
      fetchExercisesList();
    } catch (err) {
      setError(err.message || 'Erro ao eliminar exercício.');
    }
  };

  if (loading && !showModal) {
    return <PageContainer><LoadingText>A carregar lista de exercícios...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <TopActionsContainer>
        <Title>Gerir Exercícios Base</Title>
        <CreateButtonStyled onClick={handleOpenCreateModal}>Criar Novo Exercício</CreateButtonStyled>
      </TopActionsContainer>
      <Link to="/admin/dashboard" style={{color: '#D4AF37', marginBottom: '20px', display: 'inline-block', textDecoration:'none'}}>
        ‹ Voltar ao Painel Admin
      </Link>

      {error && <ErrorText>{error}</ErrorText>}
      {successMessage && <MessageText>{successMessage}</MessageText>}

      <Table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Grupo Muscular</th>
            <th>Imagem</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {exercises.length > 0 ? exercises.map(ex => (
            <tr key={ex.id}>
              <td>{ex.id}</td>
              <td>{ex.name}</td>
              <td>{ex.muscleGroup || 'N/A'}</td>
              <td>{ex.imageUrl ? <img src={ex.imageUrl} alt={ex.name} /> : 'Sem imagem'}</td>
              <td>
                <ActionButton secondary onClick={() => handleOpenEditModal(ex)}>
                  Editar
                </ActionButton>
                <ActionButton danger onClick={() => handleDelete(ex.id, ex.name)}>
                  Eliminar
                </ActionButton>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Nenhum exercício base encontrado.</td>
            </tr>
          )}
        </tbody>
      </Table>

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
    </PageContainer>
  );
}

export default AdminManageExercisesPage;