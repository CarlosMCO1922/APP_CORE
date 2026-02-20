// frontend/src/components/HomeLink.js
// Botão "casinha" no canto superior esquerdo para voltar à página principal (EntryPage).
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaHome } from 'react-icons/fa';

const HomeLinkStyled = styled(Link)`
  position: absolute;
  top: 25px;
  left: 25px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  color: ${({ theme }) => theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  text-decoration: none;
  transition: background-color 0.2s, color 0.2s;
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}20;
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
  }
`;

function HomeLink() {
  return (
    <HomeLinkStyled to="/" aria-label="Voltar à página principal">
      <FaHome size={20} />
    </HomeLinkStyled>
  );
}

export default HomeLink;
