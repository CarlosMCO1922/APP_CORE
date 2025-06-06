// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { theme } from './theme'; 
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; 


import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

console.log('CHAVE STRIPE A SER USADA NO INDEX.JS:', process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
console.log('Resultado do loadStripe (index.js):', stripePromise); 

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
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <Elements stripe={stripePromise}>
          <App />
        </Elements>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);


serviceWorkerRegistration.register(); 
