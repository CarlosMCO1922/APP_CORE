// src/components/Workout/ExerciseDetailModal.js

import React from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.88);
  display: flex; justify-content: center; align-items: center;
  z-index: 2100; // Um z-index alto para ficar por cima de tudo
  padding: 20px;
`;

const ModalContent = styled.div`
  background-color: #2C2C2C;
  padding: 25px 35px;
  border-radius: 10px;
  width: 100%;
  max-width: 700px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.5);
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
`;

const ModalTitle = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 0; margin-bottom: 20px;
  font-size: 1.8rem;
  text-align: center;
`;

const CloseButton = styled.button`
  position: absolute; top: 15px; right: 15px;
  background: transparent; border: none;
  color: #888; font-size: 1.8rem;
  cursor: pointer; &:hover { color: #fff; }
`;

const ContentBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const MediaContainer = styled.div`
  width: 100%;
  margin-bottom: 15px;
  img, video {
    max-width: 100%;
    border-radius: 8px;
    background-color: #1a1a1a;
  }
`;

const VideoWrapper = styled.div`
  position: relative;
  padding-bottom: 56.25%; /* Proporção 16:9 */
  height: 0;
  overflow: hidden;
  max-width: 100%;
  background: #000;
  border-radius: 8px;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
`;

const Description = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: pre-wrap; // Mantém as quebras de linha da descrição
`;

// Função para extrair o ID de um vídeo do YouTube
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

const ExerciseDetailModal = ({ exercise, onClose }) => {
  if (!exercise) return null;

  const youtubeId = getYouTubeVideoId(exercise.videoUrl);

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}><FaTimes /></CloseButton>
        <ModalTitle>{exercise.name}</ModalTitle>
        <ContentBody>
          {youtubeId && (
            <MediaContainer>
              <VideoWrapper>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                  title={`Vídeo do exercício ${exercise.name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </VideoWrapper>
            </MediaContainer>
          )}
          
          {!youtubeId && exercise.videoUrl && (
             <MediaContainer>
                <video src={exercise.videoUrl} controls autoPlay>O teu navegador não suporta vídeos.</video>
             </MediaContainer>
          )}
          
          {exercise.imageUrl && (
            <MediaContainer>
              <img src={exercise.imageUrl} alt={`Imagem do exercício ${exercise.name}`} />
            </MediaContainer>
          )}

          {exercise.description && (
            <div>
              <h4>Descrição</h4>
              <Description>{exercise.description}</Description>
            </div>
          )}
        </ContentBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ExerciseDetailModal;