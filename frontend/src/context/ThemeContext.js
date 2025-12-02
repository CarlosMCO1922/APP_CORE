// src/context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '../theme';

const ThemeContext = createContext();

export const CustomThemeProvider = ({ children }) => {
  // Forçar sempre tema escuro - não permite alteração
  const [theme] = useState('dark');

  // 2. Define o objeto do tema a ser usado - sempre escuro
  const currentTheme = darkTheme;

  // Forçar tema escuro no HTML também
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
    // Remover qualquer classe de tema claro
    document.documentElement.classList.remove('light-theme');
    document.documentElement.classList.add('dark-theme');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {} }}>
      {/* 3. Passa o objeto do tema para o ThemeProvider do styled-components */}
      <StyledThemeProvider theme={currentTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook personalizado para usar o contexto facilmente
export const useTheme = () => useContext(ThemeContext);
