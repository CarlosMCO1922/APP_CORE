// src/pages/ClientTrainingPlanPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled, { keyframes, createGlobalStyle } from 'styled-components'; 
import { useAuth } from '../context/AuthContext';
import { getWorkoutPlansByTrainingId } from '../services/workoutPlanService';
import { getAllTrainings } from '../services/trainingService';
import { FaImage, FaVideo, FaTimes, FaArrowLeft } from 'react-icons/fa';

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textMain};
  min-height: 100vh;
  padding: 30px clamp(20px, 5vw, 60px);
  font-family: ${props => props.theme.fonts.main};
`;

const HeaderContainer = styled.div`
  margin-bottom: 30px;
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 1px solid ${props => props.theme.colors.cardBorder};
`;

const MainTitle = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  color: ${props => props.theme.colors.primary};
  margin-bottom: 8px;
  font-weight: 700;
  letter-spacing: -0.5px;
`;

const TrainingInfo = styled.p`
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  color: ${props => props.theme.colors.textMuted};
  margin-bottom: 25px;
`;

const BackLink = styled(Link)`
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 25px;
  padding: 8px 15px;
  border-radius: ${props => props.theme.borderRadius};
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.cardBackground};
    color: #fff; // Ajustar se necessário
  }
  svg {
    margin-right: 5px;
  }
`;

const MessageBase = styled.p`
  text-align: center;
  padding: 15px 20px;
  margin: 20px auto;
  border-radius: ${props => props.theme.borderRadius};
  border-width: 1px;
  border-style: solid;
  max-width: 700px;
  font-size: 0.95rem;
`;

const LoadingText = styled(MessageBase)` color: ${props => props.theme.colors.primary}; border-color: transparent; font-weight: 500;`;
const ErrorText = styled(MessageBase)` color: ${props => props.theme.colors.error}; background-color: ${props => props.theme.colors.errorBg}; border-color: ${props => props.theme.colors.error};`;
const NoItemsText = styled(MessageBase)` color: ${props => props.theme.colors.textMuted}; font-style: italic; border-color: transparent;`;


const PlanSection = styled.section`
  background-color: ${props => props.theme.colors.cardBackground};
  padding: clamp(20px, 4vw, 30px);
  border-radius: 12px;
  margin-bottom: 40px;
  box-shadow: ${props => props.theme.boxShadow};
  border: 1px solid ${props => props.theme.colors.cardBorder};
`;

const PlanHeader = styled.div`
  padding-bottom: 15px;
  margin-bottom: 20px;
  border-bottom: 1px solid ${props => props.theme.colors.cardBorder};
  display: flex;
  justify-content: space-between;
  align-items: baseline;

  h2 {
    color: ${props => props.theme.colors.primary};
    font-size: clamp(1.4rem, 3vw, 1.8rem);
    margin: 0;
    font-weight: 600;
  }
  .plan-order {
    color: ${props => props.theme.colors.textMuted};
    font-size: 0.9rem;
  }
`;

const PlanNotes = styled.p`
  color: ${props => props.theme.colors.textMuted};
  font-style: italic;
  margin-bottom: 25px;
  padding: 12px 15px;
  background-color: rgba(0,0,0,0.15);
  border-left: 4px solid ${props => props.theme.colors.primary};
  border-radius: 0 6px 6px 0;
  font-size: 0.9rem;
  line-height: 1.6;
`;

const ExerciseList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ExerciseItem = styled.li`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px;
  border-radius: ${props => props.theme.borderRadius};
  margin-bottom: 20px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  box-shadow: ${({ theme }) => theme.boxShadow};
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.3);
  }

  .exercise-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .exercise-name {
    color: ${props => props.theme.colors.textMain};
    font-size: 1.3rem;
    font-weight: 600;
  }

  .exercise-order {
    font-size: 0.8rem;
    color: ${props => props.theme.colors.primary};
    background-color: rgba(212, 175, 55, 0.1);
    padding: 4px 10px;
    border-radius: 15px;
    font-weight: 500;
  }

  .exercise-details p {
    margin: 5px 0 10px;
    font-size: 0.95rem;
    color: ${props => props.theme.colors.textMuted};
    line-height: 1.6;
    span {
      font-weight: 500;
      color: ${props => props.theme.colors.textMain};
    }
  }

  .exercise-notes {
    font-style: italic;
    font-size: 0.9rem;
    color: #888;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed ${props => props.theme.colors.cardBorder};
  }

  .exercise-media-buttons {
    margin-top: 15px;
    display: flex;
    gap: 12px;
  }
`;

const MediaButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: ${props => props.theme.colors.buttonSecondaryBg};
  color: ${props => props.theme.colors.textMain};
  padding: 9px 16px;
  border: 1px solid ${props => props.theme.colors.cardBorder};
  border-radius: ${props => props.theme.borderRadius};
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s ease, transform 0.1s ease, border-color 0.2s ease;

  &:hover {
    background-color: ${props => props.theme.colors.buttonSecondaryHoverBg};
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-1px);
  }
  svg {
    font-size: 1.1em;
    color: ${props => props.theme.colors.primary};
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: ${({ theme }) => theme.colors.overlayBg};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  padding: 20px;
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker};
  padding: 0;
  border-radius: 10px;
  width: auto;
  max-width: 90vw;
  max-height: 90vh;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  position: relative;
  animation: ${fadeIn} 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  img, video, iframe {
    display: block;
    max-width: 100%;
    max-height: calc(85vh - 50px);
    border-radius: 6px;
    margin: auto;
  }

  iframe {
    aspect-ratio: 16 / 9;
    width: 100%;
    min-width: 300px;
    max-width: 800px;
    border: none;
  }

  .video-link-container {
    padding: 10px 20px;
    text-align: center;
    font-size: 0.85rem;
    color: ${props => props.theme.colors.textMuted};
    background-color: ${({ theme }) => theme.colors.cardBackground};
    border-top: 1px solid ${props => props.theme.colors.cardBorder};
    width: 100%;
    a {
      color: ${props => props.theme.colors.primary}; // Corrigido para usar props.theme
      text-decoration: underline;
      &:hover {
        color: #fff;
      }
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: -15px;
  right: -15px;
  background: ${props => props.theme.colors.primary}; // Corrigido para usar props.theme
  border: 2px solid ${props => props.theme.colors.background}; // Corrigido para usar props.theme
  color: ${props => props.theme.colors.textDark}; // Corrigido para usar props.theme
  font-size: 1.2rem;
  cursor: pointer;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1061;
  transition: transform 0.2s, background-color 0.2s;
  box-shadow: 0 2px 10px rgba(0,0,0,0.4);
  &:hover {
    transform: scale(1.1);
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

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

        const allTrainingsData = await getAllTrainings(authState.token);
        const currentTraining = allTrainingsData.find(t => t.id === parseInt(trainingId));
        if (currentTraining) {
          setTrainingName(currentTraining.name);
        } else {
          setError('Treino não encontrado ou não tens permissão para o ver.');
          setTrainingName(`ID ${trainingId}`);
        }

        if(currentTraining) {
          const plans = await getWorkoutPlansByTrainingId(trainingId, authState.token);
          setWorkoutPlans(plans || []);
        } else {
          setWorkoutPlans([]);
        }

      } catch (err) {
        setError(err.message || 'Erro ao carregar o plano de treino.');
        setWorkoutPlans([]);
      } finally {
        setLoading(false);
      }
    } else if (!authState.token) {
        setError("Sessão não autenticada. Por favor, faz login.");
        setLoading(false);
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
      const iframe = document.getElementById('media-modal-video-iframe');
      if (iframe && iframe.contentWindow) {
        iframe.src = iframe.src.replace("&autoplay=1", "");
      }
      const videoElement = document.getElementById('media-modal-video');
      if (videoElement && videoElement.tagName === 'VIDEO') {
        videoElement.pause();
      }
    }
    setMediaModalContent({ type: '', src: '', alt: '' });
  };
  return (
    <>
      <PageContainer>
        <HeaderContainer>
          <MainTitle>Plano de Treino</MainTitle>
          <TrainingInfo>{trainingName || `Treino ID: ${trainingId}`}</TrainingInfo>
        </HeaderContainer>
        <BackLink to={authState.role === 'user' ? "/dashboard" : "/admin/dashboard"}>
          ←
        </BackLink>

        {loading && <LoadingText>A carregar plano de treino...</LoadingText>}
        {error && <ErrorText>{error}</ErrorText>}
        {!loading && !error && workoutPlans.length === 0 && <NoItemsText>Este treino ainda não tem um plano definido ou não tens acesso.</NoItemsText>}

        {!loading && !error && workoutPlans.length > 0 && workoutPlans.sort((a,b) => a.order - b.order).map(plan => (
          <PlanSection key={plan.id}>
            <PlanHeader>
              <h2>{plan.name}</h2>
              <p className="plan-order">Bloco: {plan.order + 1}</p>
            </PlanHeader>
            {plan.notes && <PlanNotes>{plan.notes}</PlanNotes>}

            <ExerciseList>
              {plan.planExercises && plan.planExercises.length > 0 ? plan.planExercises.sort((a, b) => a.order - b.order).map(item => (
                <ExerciseItem key={item.id}>
                  <div className="exercise-info">
                    <div className="exercise-header">
                      <span className="exercise-name">{item.exerciseDetails?.name || 'Exercício Desconhecido'}</span>
                      <span className="exercise-order">Exercício: {item.order + 1}</span>
                    </div>
                    <div className="exercise-details">
                      {item.sets !== null && item.sets !== undefined && <p><span>Séries:</span> {item.sets}</p>}
                      {item.reps && <p><span>Repetições:</span> {item.reps}</p>}
                      {item.durationSeconds !== null && item.durationSeconds !== undefined ? <p><span>Duração:</span> {item.durationSeconds}s</p> : null}
                      {item.restSeconds !== null && item.restSeconds >= 0 ? <p><span>Descanso:</span> {item.restSeconds}s</p> : null}
                    </div>
                    {item.notes && <p className="exercise-notes"><em>Notas: {item.notes}</em></p>}

                    <div className="exercise-media-buttons">
                      {item.exerciseDetails?.imageUrl && (
                        <MediaButton
                          onClick={() => handleOpenMediaModal('image', item.exerciseDetails.imageUrl, item.exerciseDetails.name)}
                        >
                          <FaImage /> Ver Imagem
                        </MediaButton>
                      )}
                      {item.exerciseDetails?.videoUrl && (
                        <MediaButton
                          onClick={() => handleOpenMediaModal('video', item.exerciseDetails.videoUrl, item.exerciseDetails.name)}
                        >
                          <FaVideo /> Ver Vídeo
                        </MediaButton>
                      )}
                    </div>
                  </div>
                </ExerciseItem>
              )) : <NoItemsText>Nenhum exercício neste plano.</NoItemsText>}
            </ExerciseList>
          </PlanSection>
        ))}

        {showMediaModal && mediaModalContent.src && (
          <ModalOverlay onClick={handleCloseMediaModal}>
              <ModalContent onClick={e => e.stopPropagation()} >
                  <CloseButton onClick={handleCloseMediaModal}><FaTimes /></CloseButton>
                  {mediaModalContent.type === 'image' && (
                  <img
                      src={mediaModalContent.src}
                      alt={mediaModalContent.alt}
                  />
                  )}
                  {(mediaModalContent.type === 'video') && (() => {
                  const youtubeVideoId = getYouTubeVideoId(mediaModalContent.src);
                  if (youtubeVideoId) {
                      return (
                      <>
                        <iframe
                            id="media-modal-video-iframe"
                            src={`https://www.youtube.com/watch?v=tXflBB70v-s${youtubeVideoId}?autoplay=1&rel=0&modestbranding=1`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                        <div className="video-link-container">
                            Se o vídeo não carregar: <a href={mediaModalContent.src} target="_blank" rel="noopener noreferrer">Abrir no YouTube</a>
                        </div>
                      </>
                      );
                  } else {
                      return (
                        <>
                          <video
                              id="media-modal-video"
                              src={mediaModalContent.src}
                              controls
                              autoPlay
                              onError={(e) => {
                              console.error("Erro ao carregar vídeo direto:", mediaModalContent.src, e);
                              setMediaModalContent(prev => ({ ...prev, type: 'video_error', originalType: 'video' }));
                              }}
                          >
                              O teu navegador não suporta o elemento de vídeo.
                          </video>
                          <div className="video-link-container">
                            Link direto: <a href={mediaModalContent.src} target="_blank" rel="noopener noreferrer" download>Descarregar vídeo</a>
                          </div>
                        </>
                      );
                  }
                  })()}
                  {mediaModalContent.type === 'video_error' && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
                      <p style={{ color: (props) => props.theme ? props.theme.colors.error : '#FF6B6B', fontSize: '1.1rem' }}>Não foi possível carregar o vídeo.</p>
                      <p style={{fontSize: '0.9rem'}}>URL: <a href={mediaModalContent.src} target="_blank" rel="noopener noreferrer" style={{ color: (props) => props.theme ? props.theme.colors.primary : '#D4AF37' }}>{mediaModalContent.src}</a></p>
                      {mediaModalContent.originalType === 'video' && <p style={{fontSize: '0.9rem'}}>(Verifica se o URL é um link direto para um ficheiro de vídeo como .mp4 ou um link válido do YouTube)</p>}
                  </div>
                  )}
              </ModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    </>
  );
}

export default ClientTrainingPlanPage;