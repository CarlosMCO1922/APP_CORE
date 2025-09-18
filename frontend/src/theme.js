// src/theme.js

// Propriedades comuns a ambos os temas
const common = {
  fonts: {
    main: "'Inter', sans-serif",
  },
  borderRadius: '8px',
};

// Tema Escuro (o seu tema original)
export const darkTheme = {
  ...common,
  colors: {
    primary: '#D4AF37', // Dourado
    background: '#1A1A1A', // Preto
    cardBackground: '#252525', // Cinza escuro
    cardBorder: '#383838', // Borda cinza
    textMain: '#E0E0E0', // Texto claro
    textMuted: '#a0a0a0', // Texto secundário
    textDark: '#1A1A1A', // Texto para fundos claros (botões)
    error: '#FF6B6B',
    errorBg: 'rgba(255,107,107,0.1)',
    success: '#66BB6A',
    successBg: 'rgba(102,187,106,0.15)',
    buttonSecondaryBg: '#4A4A4A',
    buttonSecondaryHoverBg: '#5A5A5A',
  },
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
};

// Novo Tema Claro
export const lightTheme = {
  ...common,
  colors: {
    primary: '#C7A32C', // Dourado um pouco mais escuro para contraste
    background: '#F4F7FC', // Branco suave
    cardBackground: '#FFFFFF', // Branco puro
    cardBorder: '#DEE2E6', // Borda cinza claro
    textMain: '#212529', // Texto escuro
    textMuted: '#6C757D', // Texto secundário
    textDark: '#FFFFFF', // Texto para fundos escuros (botões)
    error: '#D32F2F',
    errorBg: 'rgba(211, 47, 47, 0.1)',
    success: '#388E3C',
    successBg: 'rgba(56, 142, 60, 0.1)',
    buttonSecondaryBg: '#E9ECEF',
    buttonSecondaryHoverBg: '#DDE2E7',
  },
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
};