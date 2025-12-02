// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; 
import { NotificationProvider } from './context/NotificationContext';


import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CustomThemeProvider } from './context/ThemeContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { ToastProvider } from './components/Toast/ToastProvider';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const GlobalStyle = createGlobalStyle`
  :root {
    --color-primary: 
      ${props => props.theme.colors.primary};
    --color-background: 
      ${props => props.theme.colors.background};
    --color-card-bg: 
      ${props => props.theme.colors.cardBackground};
    --color-card-border: 
      ${props => props.theme.colors.cardBorder};
    --color-text-main: 
      ${props => props.theme.colors.textMain};
    --color-text-muted: 
      ${props => props.theme.colors.textMuted};
    --color-text-dark: 
      ${props => props.theme.colors.textDark};
    --color-button-secondary-bg: 
      ${props => props.theme.colors.buttonSecondaryBg};
    --color-button-secondary-hover-bg: 
      ${props => props.theme.colors.buttonSecondaryHoverBg};
    --color-disabled: 
      ${props => props.theme.colors.disabledColor || '#888'};
  }
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
    <Router>
      <CustomThemeProvider>
        <GlobalStyle />
        <AuthProvider>
          <WorkoutProvider>
            <ToastProvider>
              <NotificationProvider> 
                <Elements stripe={stripePromise}>
                  <App />
                </Elements>
              </NotificationProvider>
            </ToastProvider>
          </WorkoutProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </Router>
  </React.StrictMode>
);


serviceWorkerRegistration.register();

// Regista o SW dedicado a push (independente do da CRA para cache)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration('/notifications-sw.js').then(reg => {
    if (!reg) navigator.serviceWorker.register('/notifications-sw.js');
  });
}

// Prevenir rotação para horizontal
const lockOrientation = () => {
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('portrait').catch(() => {
      // Se não conseguir bloquear, pelo menos tenta prevenir
      console.log('Não foi possível bloquear orientação');
    });
  } else if (screen.lockOrientation) {
    screen.lockOrientation('portrait');
  } else if (screen.mozLockOrientation) {
    screen.mozLockOrientation('portrait');
  } else if (screen.msLockOrientation) {
    screen.msLockOrientation('portrait');
  }
};

// Tentar bloquear orientação quando a página carregar
if (window.addEventListener) {
  window.addEventListener('load', lockOrientation);
  window.addEventListener('orientationchange', () => {
    // Força portrait após mudança de orientação
    setTimeout(lockOrientation, 100);
  });
}

// Prevenir zoom com gestos de pinça
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Prevenir zoom com double tap
let lastTap = 0;
document.addEventListener('touchstart', (event) => {
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTap;
  if (tapLength < 300 && tapLength > 0) {
    event.preventDefault();
  }
  lastTap = currentTime;
});
