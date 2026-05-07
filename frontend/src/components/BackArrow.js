// src/components/BackArrow.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaArrowLeft } from 'react-icons/fa';

const BackBase = styled.div`
  display: inline-flex;

  & > a,
  & > button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
    background-color: ${({ theme }) => theme.colors.cardBackground};
    box-shadow: ${({ theme }) => theme.boxShadow};
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 1.35rem;
    transition: color 0.2s, border-color 0.2s, transform 0.15s, background-color 0.2s;
    text-decoration: none;
    cursor: pointer;
  }

  & > a:hover,
  & > button:hover {
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-1px);
  }

  & > button {
    border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  }
`;

const BackIconLink = styled(Link)``;
const BackIconButton = styled.button`
  background: transparent;
`;

export default function BackArrow({ to, onClick }) {
  if (onClick) {
    return (
      <BackBase>
        <BackIconButton onClick={onClick} aria-label="Voltar" type="button">
          <FaArrowLeft />
        </BackIconButton>
      </BackBase>
    );
  }
  
  return (
    <BackBase>
      <BackIconLink to={to || '#'} aria-label="Voltar">
        <FaArrowLeft />
      </BackIconLink>
    </BackBase>
  );
}
