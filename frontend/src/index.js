// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// import reportWebVitals from './reportWebVitals'; // Podes descomentar se o ficheiro existir e quiseres usar
import { AuthProvider } from './context/AuthContext';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Se quiseres usar reportWebVitals, certifica-te que o ficheiro src/reportWebVitals.js existe
// reportWebVitals();