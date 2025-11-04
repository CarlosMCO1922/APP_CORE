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
    primaryHover: '#e6c358',
    primaryFocusRing: 'rgba(252, 181, 53, 0.2)',
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
    inputBg: '#383838',
    inputBorder: '#555555',
    inputText: '#E0E0E0',
    disabledColor: 'rgb(85, 85, 85)',
    disabledBg: '#404040',
    disabledText: '#777777',
    lightGray: '#cccccc',
    hoverUnselected: '#fcb535ff',
    overlayBg: 'rgba(0,0,0,0.8)',
    tableHeaderBg: '#303030',
    hoverRowBg: '#2a2a2a',
    scrollbarTrackBg: '#252525',
    scrollbarThumbBg: '#555555',
    // Adicionais
    warning: '#FFA000',
    info: '#17a2b8',
    mediaButtonBg: '#6c757d',
    mediaButtonHoverBg: '#5a6268',
    cardBackgroundDarker: '#2C2C2C',
    successDark: '#388E3C',
  },
  boxShadow: 'none',
};

// Novo Tema Claro
export const lightTheme = {
  ...common,
  logoUrl: '/logo_core_dark.png',
  logoUrl1: '/logo_core_short_without_back.png',
  colors: {
    primary: 'rgba(252, 181, 53, 1)', // Dourado um pouco mais escuro para contraste
    primaryHover: '#e6c358',
    primaryFocusRing: 'rgba(252, 181, 53, 0.2)',
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
    inputBg: '#FFFFFF',
    inputBorder: '#DEE2E6',
    inputText: '#212529',
    disabledColor: '#e6c358d4',
    disabledBg: '#F1F3F5',
    disabledText: '#ADB5BD',
    lightGray: 'rgb(165 165 165)',
    hoverUnselected: '#fcb535ff',
    overlayBg: 'rgba(0,0,0,0.4)',
    tableHeaderBg: '#F1F3F5',
    hoverRowBg: '#f5ebcc',
    scrollbarTrackBg: '#F1F3F5',
    scrollbarThumbBg: '#C1C1C1',
    // Adicionais
    warning: '#FFA000',
    info: '#17a2b8',
    mediaButtonBg: '#6c757d',
    mediaButtonHoverBg: '#5a6268',
    cardBackgroundDarker: '#f5ebcc',
    successDark: '#2e7d32',
  },
  boxShadow: 'none',
};
