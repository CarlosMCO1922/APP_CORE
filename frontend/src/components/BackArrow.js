// src/components/BackArrow.js
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaArrowLeft } from 'react-icons/fa';

const BackIconLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  transition: color 0.2s;
  display: inline-flex;
  align-items: center;
  &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

export default function BackArrow({ to }) {
  return (
    <BackIconLink to={to} aria-label="Voltar">
      <FaArrowLeft />
    </BackIconLink>
  );
}
