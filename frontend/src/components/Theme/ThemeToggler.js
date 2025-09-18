// src/components/Theme/ThemeToggler.js
import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

const ToggleContainer = styled.button`
  background: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 0.5rem;
  justify-content: space-between;
  margin: 0;
  overflow: hidden;
  padding: 0.4rem;
  position: relative;
  width: 4rem;
  height: 2.2rem;
  outline: none;

  svg {
    height: 1.2rem;
    width: 1.2rem;
    transition: all 0.3s linear;
    
    // Estilo para o ícone do sol
    &:first-child {
      transform: ${({ lightTheme }) => lightTheme ? 'translateY(0)' : 'translateY(100px)'};
      color: #f39c12; // Cor do sol
    }
    
    // Estilo para o ícone da lua
    &:nth-child(2) {
      transform: ${({ lightTheme }) => lightTheme ? 'translateY(-100px)' : 'translateY(0)'};
      color: #f1c40f; // Cor da lua
    }
  }
`;

const ThemeToggler = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <ToggleContainer lightTheme={isLight} onClick={toggleTheme}>
      <FaSun />
      <FaMoon />
    </ToggleContainer>
  );
};

export default ThemeToggler;