// src/context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '../theme';

const ThemeContext = createContext();

export const CustomThemeProvider = ({ children }) => {
  // 1. Verifica o localStorage ou a preferência do sistema para o tema inicial
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Opcional: define o tema com base na preferência do sistema do utilizador
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'dark'; // O nosso default é 'dark'
  };

  const [theme, setTheme] = useState(getInitialTheme);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // 2. Define o objeto do tema a ser usado com base no estado
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {/* 3. Passa o objeto do tema para o ThemeProvider do styled-components */}
      <StyledThemeProvider theme={currentTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook personalizado para usar o contexto facilmente
export const useTheme = () => useContext(ThemeContext);
