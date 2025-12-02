// src/context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '../theme';

const ThemeContext = createContext();

export const CustomThemeProvider = ({ children }) => {
  // Verifica localStorage ou usa 'dark' como padrão
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark'; // Default é dark
  };

  const [theme, setTheme] = useState(getInitialTheme);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Atualizar HTML quando o tema muda
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(`${theme}-theme`);
  }, [theme]);

  // 2. Define o objeto do tema a ser usado
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
