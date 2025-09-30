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
  logoUrl: '/logo_core_dark.png',
  logoUrl1: '/logo_core_short_without_back.png',
  colors: {
    primary: '#fcb535ff', // Dourado
    background: '#1A1A1A', // Preto
    cardBackground: '#252525', // Cinza escuro
    cardBorder: '#383838', // Borda cinza
    textMain: '#E0E0E0', // Texto claro
    textMuted: '#a0a0a0', // Texto secundário
    textDark: '#1A1A1A',
    textButton: '#212529', // Texto para fundos claros (botões)
    error: '#D32F2F',
    errorBg: 'rgba(29, 24, 24, 0.1)',
    success: '#66BB6A',
    successBg: 'rgba(102,187,106,0.15)',
    buttonSecondaryBg: '#4A4A4A',
    buttonSecondaryHoverBg: '#5A5A5A',
    textSmall: 'rgba(255, 255, 255, 1)',
    borderShadow: '#252525',
    sliderButton: 'rgb(37 37 37 / 80%)',
    sliderButtonHover: 'rgb(37 37 37 / 40%)',
    backgroundSelect: 'rgb(51, 51, 51)',
    disbaledColor: 'rgb(85, 85, 85)',
    lightGray: '#cccccc',
  },
  boxShadow: '0 4px 12px rgba(252, 181, 53, 1)',
};

// Novo Tema Claro
export const lightTheme = {
  ...common,
  logoUrl: '/logo_core_light.png',
  logoUrl1: '/logo_core_short_without_back.png',
  colors: {
    primary: 'rgba(252, 181, 53, 1)', // Dourado um pouco mais escuro para contraste
    background: '#faf1e0', // Branco suave
    cardBackground: 'rgb(253 246 215)',
    cardBorder: '#DEE2E6', // Borda cinza claro
    textMain: '#212529', // Texto escuro
    textMuted: '#6C757D', // Texto secundário
    textButton: '#ffffffe8',
    textDark: '#FFFFFF', // Texto para fundos escuros (botões)
    error: '#D32F2F',
    errorBg: 'rgba(211, 47, 47, 0.1)',
    success: '#66BB6A',
    successBg: 'rgba(56, 142, 60, 0.1)',
    buttonSecondaryBg: '#E9ECEF',
    buttonSecondaryHoverBg: '#DDE2E7',
    textSmall: 'black',
    borderShadow: 'rgb(253 246 215)',
    sliderButton: 'rgb(252 181 53 / 61%)',
    sliderButtonHover: 'rgb(252 181 53 / 40%)',
    backgroundSelect: 'rgb(250 241 224)',
    disabledColor: '#e6c358d4',
    lightGray: 'rgb(165 165 165)',
  },
  boxShadow: '0 4px 12px rgba(252, 181, 53, 1)',
};