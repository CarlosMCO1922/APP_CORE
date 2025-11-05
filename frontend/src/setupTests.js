// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Provide window.matchMedia for components that query it (e.g., ThemeContext)
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
    media: ''
  });
}

// Mock Stripe Elements provider to avoid requiring a real Stripe instance in tests
jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => children,
  useStripe: () => ({})
}));

// Lightweight mock for styled-components to avoid Node ESM/CJS resolution issues in tests
jest.mock('styled-components', () => {
  const React = require('react');
  const defaultTheme = {
    colors: {
      primary: '#000',
      background: '#fff',
      cardBackground: '#fff',
      cardBorder: '#ddd',
      textMain: '#111',
      textMuted: '#666',
      textDark: '#000',
      buttonSecondaryBg: '#f3f3f3',
      buttonSecondaryHoverBg: '#eee',
      error: '#f00',
      errorBg: '#fee'
    },
    fonts: { main: 'sans-serif' },
    logoUrl: ''
  };
  const ThemeContext = React.createContext(defaultTheme);
  const ThemeProvider = ({ theme, children }) => (
    React.createElement(ThemeContext.Provider, { value: theme || defaultTheme }, children)
  );
  const useTheme = () => React.useContext(ThemeContext) || defaultTheme;
  const shouldOmitProp = (k) => k.startsWith('$') || k === 'lightTheme' || k === 'isOpen' || k === 'isRead';
  const styledFactory = (Tag) => (strings, ...exprs) => React.forwardRef((props, ref) => {
    const filtered = Object.fromEntries(Object.entries(props).filter(([k]) => !shouldOmitProp(k)));
    return React.createElement(Tag, { ...filtered, ref }, props.children);
  });
  const styled = new Proxy(styledFactory, {
    get: (target, prop) => target(prop)
  });
  const css = (...args) => (Array.isArray(args[0]) ? args[0].join('') : String(args[0] || ''));
  const keyframes = css;
  return { __esModule: true, default: styled, ThemeProvider, useTheme, css, keyframes };
});

// Mock common ESM-only date-fns entrypoints used by calendar pages
jest.mock('date-fns/format', () => ({ __esModule: true, default: () => 'date' }));
jest.mock('date-fns/parse', () => ({ __esModule: true, default: () => new Date() }));
jest.mock('date-fns/startOfWeek', () => ({ __esModule: true, default: () => new Date() }));
jest.mock('date-fns/getDay', () => ({ __esModule: true, default: () => 0 }));

// Mock react-big-calendar to keep tests light
jest.mock('react-big-calendar', () => ({
  Calendar: ({ children, ...props }) => {
    return require('react').createElement('div', { 'data-testid': 'big-calendar', ...props }, children);
  },
  dateFnsLocalizer: () => ({}),
  Views: { MONTH: 'month', WEEK: 'week', DAY: 'day', AGENDA: 'agenda' }
}), { virtual: true });

// Mock react-calendar
jest.mock('react-calendar', () => {
  const React = require('react');
  // A very small mock that renders buttons to change date
  return function MockCalendar({ onChange, value }) {
    return React.createElement('div', { 'data-testid': 'calendar' },
      React.createElement('button', { onClick: () => onChange?.(new Date(value || Date.now())) }, 'pick')
    );
  };
}, { virtual: true });
