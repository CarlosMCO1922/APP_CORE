// frontend/src/components/OfflineIndicator.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';
import { isOnline, setupOnlineListener } from '../utils/networkUtils';

const OfflineBanner = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.error};
  color: white;
  padding: 10px 20px;
  text-align: center;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transform: ${props => props.show ? 'translateY(0)' : 'translateY(-100%)'};
  transition: transform 0.3s ease-in-out;
`;

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!isOnline());

  useEffect(() => {
    const cleanup = setupOnlineListener(
      () => setIsOffline(false), // online
      () => setIsOffline(true)   // offline
    );
    return cleanup;
  }, []);

  if (!isOffline) return null;

  return (
    <OfflineBanner show={isOffline}>
      <FaExclamationTriangle />
      <span>Sem conexão à internet. Algumas funcionalidades podem não estar disponíveis.</span>
    </OfflineBanner>
  );
};

export default OfflineIndicator;

