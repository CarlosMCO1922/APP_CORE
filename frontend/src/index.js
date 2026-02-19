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

// Só carregar Stripe se a chave publicável estiver definida (evita "reading 'match' of undefined" em local)
const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey && typeof stripeKey === 'string' && stripeKey.startsWith('pk_')
  ? loadStripe(stripeKey)
  : Promise.resolve(null);

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


// Registrar Service Worker principal (apenas em produção)
serviceWorkerRegistration.register();

// Regista o SW dedicado a push (independente do da CRA para cache)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration('/notifications-sw.js').then(reg => {
    if (!reg) {
      navigator.serviceWorker.register('/notifications-sw.js').catch((error) => {
        // Erro silencioso - comum em produção com redirects
        if (process.env.NODE_ENV === 'development') {
          console.warn('Notifications SW registration failed:', error.message);
        }
      });
    }
  }).catch(() => {
    // Ignorar erros silenciosamente
  });
}

// Prevenir rotação para horizontal
const lockOrientation = () => {
  // Tentar múltiplas APIs de bloqueio de orientação
  if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
    window.screen.orientation.lock('portrait').catch(() => {
      // Se não conseguir bloquear, pelo menos tenta prevenir
      console.log('Não foi possível bloquear orientação via screen.orientation.lock');
    });
  } else if (window.screen && window.screen.lockOrientation) {
    try {
      window.screen.lockOrientation('portrait');
    } catch (e) {
      console.log('Não foi possível bloquear orientação via lockOrientation');
    }
  } else if (window.screen && window.screen.mozLockOrientation) {
    try {
      window.screen.mozLockOrientation('portrait');
    } catch (e) {
      console.log('Não foi possível bloquear orientação via mozLockOrientation');
    }
  } else if (window.screen && window.screen.msLockOrientation) {
    try {
      window.screen.msLockOrientation('portrait');
    } catch (e) {
      console.log('Não foi possível bloquear orientação via msLockOrientation');
    }
  }
  
  // Tentar também via document.documentElement
  if (document.documentElement && document.documentElement.requestFullscreen) {
    // Alguns navegadores permitem bloquear orientação em fullscreen
    // Mas não vamos forçar fullscreen, apenas tentar se já estiver
  }
};

// Forçar orientação portrait
const forcePortrait = () => {
  // Tentar bloquear via API
  lockOrientation();
  
  // Se detectar landscape, tentar forçar portrait novamente
  if (window.orientation !== undefined) {
    const isLandscape = Math.abs(window.orientation) === 90 || Math.abs(window.orientation) === -90;
    if (isLandscape) {
      // Tentar bloquear novamente
      setTimeout(lockOrientation, 50);
    }
  }
};

// Tentar bloquear orientação quando a página carregar
if (window.addEventListener) {
  // Bloquear imediatamente
  lockOrientation();
  
  // Bloquear quando a página carregar
  window.addEventListener('load', forcePortrait);
  
  // Bloquear quando a orientação mudar
  window.addEventListener('orientationchange', () => {
    setTimeout(forcePortrait, 100);
  });
  
  // Também escutar mudanças de tamanho (pode indicar rotação)
  window.addEventListener('resize', () => {
    setTimeout(forcePortrait, 100);
  });
  
  // Para iOS, também escutar o evento específico
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', () => {
      setTimeout(forcePortrait, 100);
    });
  }
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
