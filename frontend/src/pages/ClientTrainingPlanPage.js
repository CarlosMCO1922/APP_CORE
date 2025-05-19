// src/pages/ClientTrainingPlanPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getWorkoutPlansByTrainingId } from '../services/workoutPlanService'; // Reutiliza o serviço
import { getAllTrainings } from '../services/trainingService'; // Para obter o nome do treino

// --- Styled Components (Reutilizar/Adaptar) ---
const PageContainer = styled.div` /* ... (copiar de AdminManageWorkoutPlansPage ou definir globalmente) ... */ `;
const MainTitle = styled.h1` /* ... */ `;
const TrainingInfo = styled.p` /* ... */ `;
const LoadingText = styled.p` /* ... */ `;
const ErrorText = styled.p` /* ... */ `;
const PlanSection = styled.div` /* ... */ `;
const PlanHeader = styled.div`
  h2 { color: #D4AF37; font-size: 1.5rem; margin: 0; }
  /* Remover botões de admin daqui */
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #383838;
`;
const ActionButton = styled.button` /* ... (Manter se usar para Ver Imagem/Vídeo) ... */ `;
const ExerciseList = styled.ul` /* ... */ `;
const ExerciseItem = styled.li` /* ... (Ajustar .exercise-actions se não houver ações de admin) ... */
  .exercise-media-buttons {
    margin-top: 8px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .exercise-info {
    flex-grow: 1;
    p { margin: 4px 0; font-size: 0.9rem; line-height: 1.4;}
    strong { color: #E0E0E0; font-weight: 600; }
    em { color: #a0a0a0; font-size: 0.85rem; display: block; margin-top: 3px;}
  }
`;

const ModalOverlay = styled.div` /* ... */ `;
const ModalContent = styled.div` /* ... */ `;
// ModalTitle, ModalForm, etc., não são necessários aqui se for só visualização
const CloseButton = styled.button` /* ... */ `;
const NoItemsText = styled.p` /* ... */ `;

// Copiar a função auxiliar getYouTubeVideoId
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};


// Reutilizar styled-components de AdminManageWorkoutPlansPage
PageContainer.defaultProps = { /* ... */ }; // Exemplo se precisar de props default
MainTitle.defaultProps = { /* ... */ };
// ... (Copiar e colar definições completas dos styled-components relevantes de AdminManageWorkoutPlansPage.js)
// Ou, idealmente, mover os styled-components comuns para um ficheiro partilhado e importá-los.
// Para este exemplo, vou assumir que copiaste os necessários.


function ClientTrainingPlanPage() {
  const { trainingId } = useParams();
  const { authState } = useAuth();

  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trainingName, setTrainingName] = useState('');

  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaModalContent, setMediaModalContent] = useState({ type: '', src: '', alt: '' });

  const fetchTrainingDetailsAndPlans = useCallback(async () => {
    if (authState.token && trainingId) {
      try {
        setLoading(true);
        setError('');

        // Buscar nome do treino
        const allTrainingsData = await getAllTrainings(authState.token);
        const currentTraining = allTrainingsData.find(t => t.id === parseInt(trainingId));
        if (currentTraining) {
          setTrainingName(currentTraining.name);
        } else {
          setError('Treino não encontrado.');
          setTrainingName(`ID ${trainingId}`); // Fallback
        }

        // Buscar planos do treino
        const plans = await getWorkoutPlansByTrainingId(trainingId, authState.token);
        // A API já deve retornar os planos apenas se o user tiver permissão (inscrito) ou for admin.
        // Se for cliente, a lógica de permissão no backend controller getWorkoutPlansForTraining é crucial.
        setWorkoutPlans(plans || []);

      } catch (err) {
        setError(err.message || 'Erro ao carregar o plano de treino.');
        setWorkoutPlans([]);
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token, trainingId]);

  useEffect(() => {
    fetchTrainingDetailsAndPlans();
  }, [fetchTrainingDetailsAndPlans]);

  const handleOpenMediaModal = (type, src, altText = 'Visualização do exercício') => {
    if (!src) return;
    setMediaModalContent({ type, src, alt: altText });
    setShowMediaModal(true);
  };

  const handleCloseMediaModal = () => {
    setShowMediaModal(false);
    if (mediaModalContent.type === 'video' || mediaModalContent.type === 'youtube_video') {
      const videoElement = document.getElementById('media-modal-video-iframe') || document.getElementById('media-modal-video');
      if (videoElement && videoElement.tagName === 'VIDEO') {
        videoElement.pause();
      }
    }
    setMediaModalContent({ type: '', src: '', alt: '' });
  };

  if (loading) return <PageContainer><LoadingText>A carregar plano de treino...</LoadingText></PageContainer>;
  if (error) return <PageContainer><ErrorText>{error}</ErrorText><Link to="/dashboard">Voltar ao Painel</Link></PageContainer>;

  return (
    <PageContainer>
      <MainTitle>Plano de Treino</MainTitle>
      <TrainingInfo>{trainingName || `Treino ID: ${trainingId}`}</TrainingInfo>
      <Link to={authState.role === 'user' ? "/dashboard" : "/admin/dashboard"} style={{ color: '#D4AF37', marginBottom: '20px', display: 'inline-block', textDecoration: 'none' }}>
        ‹ Voltar ao Painel
      </Link>

      {workoutPlans.length > 0 ? workoutPlans.sort((a,b) => a.order - b.order).map(plan => (
        <PlanSection key={plan.id}>
          <PlanHeader>
            <h2>{plan.name} (Ordem: {plan.order})</h2>
            {/* Sem botões de admin aqui */}
          </PlanHeader>
          {plan.notes && <p style={{ color: '#a0a0a0', fontStyle: 'italic', marginBottom: '15px' }}>Notas do plano: {plan.notes}</p>}

          <ExerciseList>
            {plan.planExercises && plan.planExercises.length > 0 ? plan.planExercises.sort((a, b) => a.order - b.order).map(item => (
              <ExerciseItem key={item.id}>
                <div className="exercise-info">
                  <p><strong>{item.exerciseDetails?.name || 'Exercício Desconhecido'}</strong> (Ordem: {item.order})</p>
                  <div className="exercise-media-buttons">
                    {item.exerciseDetails?.imageUrl && (
                      <ActionButton
                        small
                        secondary
                        onClick={() => handleOpenMediaModal('image', item.exerciseDetails.imageUrl, item.exerciseDetails.name)}
                      >
                        Ver Imagem
                      </ActionButton>
                    )}
                    {item.exerciseDetails?.videoUrl && (
                      <ActionButton
                        small
                        secondary
                        onClick={() => handleOpenMediaModal('video', item.exerciseDetails.videoUrl, item.exerciseDetails.name)}
                      >
                        Ver Vídeo
                      </ActionButton>
                    )}
                  </div>
                  {item.sets !== null && item.sets !== undefined && <p><span>Séries:</span> {item.sets}</p>}
                  {item.reps && <p><span>Reps:</span> {item.reps}</p>}
                  {item.durationSeconds !== null && item.durationSeconds !== undefined ? <p><span>Duração:</span> {item.durationSeconds}s</p> : null}
                  {item.restSeconds !== null && item.restSeconds >= 0 ? <p><span>Descanso:</span> {item.restSeconds}s</p> : null}
                  {item.notes && <p><em>Notas: {item.notes}</em></p>}
                </div>
                {/* Sem .exercise-actions de admin aqui */}
              </ExerciseItem>
            )) : <NoItemsText>Nenhum exercício neste plano.</NoItemsText>}
          </ExerciseList>
        </PlanSection>
      )) : (
        <NoItemsText>Este treino ainda não tem um plano definido.</NoItemsText>
      )}

      {/* Modal para Visualizar Imagem/Vídeo (código idêntico ao de AdminManageWorkoutPlansPage) */}
      {showMediaModal && mediaModalContent.src && (
        <ModalOverlay onClick={handleCloseMediaModal} style={{ zIndex: 1060 }}>
          <ModalContent
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: mediaModalContent.type === 'image' ? '80vw' : '700px',
              width: mediaModalContent.type === 'video' ? '80vw' : 'auto',
              maxHeight: '90vh',
              padding: mediaModalContent.type === 'video' ? '20px' : '5px',
              backgroundColor: '#181818',
              display: 'flex', flexDirection: 'column', justifyContent: 'center'
            }}
          >
            <CloseButton
              onClick={handleCloseMediaModal}
              style={{ top: '10px', right: '10px', color: 'white', fontSize: '1.5rem', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '35px', height: '35px', lineHeight: '35px', textAlign: 'center', zIndex: 1061 }}
            >
              &times;
            </CloseButton>

            {mediaModalContent.type === 'image' && (
              <img
                src={mediaModalContent.src}
                alt={mediaModalContent.alt}
                style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(90vh - 40px)', margin: 'auto', borderRadius: '4px' }}
              />
            )}
            {(mediaModalContent.type === 'video') && (() => {
              const youtubeVideoId = getYouTubeVideoId(mediaModalContent.src);
              if (youtubeVideoId) {
                return (
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', background: '#000' }}>
                    <iframe
                      id="media-modal-video-iframe"
                      src={`https://www.youtube.com/watch?v=tXflBB70v-s${youtubeVideoId}?autoplay=1`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    ></iframe>
                  </div>
                );
              } else {
                return (
                  <video
                    id="media-modal-video"
                    src={mediaModalContent.src}
                    controls
                    autoPlay
                    style={{ display: 'block', width: '100%', maxHeight: 'calc(90vh - 70px)', borderRadius: '4px' }}
                    onError={(e) => {
                      console.error("Erro ao carregar vídeo direto:", mediaModalContent.src, e);
                      setMediaModalContent(prev => ({ ...prev, type: 'video_error', originalType: 'video' }));
                    }}
                  >
                    O teu navegador não suporta o elemento de vídeo. Podes tentar descarregar <a href={mediaModalContent.src} download style={{color: '#D4AF37'}}>aqui</a>.
                  </video>
                );
              }
            })()}
            {mediaModalContent.type === 'video_error' && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
                <p style={{ color: '#FF6B6B' }}>Não foi possível carregar o vídeo.</p>
                <p>URL: <a href={mediaModalContent.src} target="_blank" rel="noopener noreferrer" style={{ color: '#D4AF37' }}>{mediaModalContent.src}</a></p>
                 {mediaModalContent.originalType === 'video' && <p>(Verifica se o URL é um link direto para um ficheiro de vídeo como .mp4 ou um link válido do YouTube)</p>}
              </div>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
}

export default ClientTrainingPlanPage;