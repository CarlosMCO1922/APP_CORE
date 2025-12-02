// src/components/BackArrow.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaArrowLeft } from 'react-icons/fa';

const BackIconLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  transition: color 0.2s;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  cursor: pointer;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

const BackIconButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  transition: color 0.2s;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 0;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

export default function BackArrow({ to, onClick }) {
  if (onClick) {
    return (
      <BackIconButton onClick={onClick} aria-label="Voltar">
        <FaArrowLeft />
      </BackIconButton>
    );
  }
  
  return (
    <BackIconLink to={to || '#'} aria-label="Voltar">
      <FaArrowLeft />
    </BackIconLink>
  );
}
