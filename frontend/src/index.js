// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Teu CSS global base
import App from './App';
import { AuthProvider } from './context/AuthContext';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ThemeProvider, createGlobalStyle } from 'styled-components'; // Importar ThemeProvider e createGlobalStyle
import { theme } from './theme'; // Importar o teu tema

// Opcional: Mover GlobalStyle para theme.js ou mantê-lo aqui
const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.textMain};
    font-family: ${props => props.theme.fonts.main};
    margin: 0;
    padding: 0;
    line-height: 1.5;
  }
  * {
    box-sizing: border-box;
  }
`;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}> {/* Envolver AuthProvider e App */}
      <GlobalStyle /> {/* Aplicar estilos globais que dependem do tema */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);