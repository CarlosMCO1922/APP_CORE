import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';

const ToastsWrap = styled.div`
  position: fixed; top: 20px; right: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 10px;
`;
const leftColor = (theme, type, category) => {
  if (category === 'payment') return '#D4AF37';
  if (category === 'calendar') return theme.colors.primary;
  if (type === 'error') return theme.colors.error;
  if (type === 'success') return theme.colors.success;
  if (type === 'warning') return '#FFA000';
  return theme.colors.primary;
};

const ToastCard = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.textMain};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-left: 4px solid ${({ theme, type, $category }) => leftColor(theme, type, $category)};
  padding: 12px 14px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.25);
  min-width: 240px; max-width: 380px; display: flex; align-items: flex-start; gap: 10px;
`;
const Icon = styled.span`
  font-size: 1.1rem; line-height: 1; margin-top: 2px;
`;

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const remove = useCallback((id) => setToasts(ts => ts.filter(t => t.id !== id)), []);
  const addToast = useCallback((message, { type = 'info', duration = 3000, category = null } = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(ts => [...ts, { id, message, type, category }]);
    if (duration > 0) setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);
  const value = useMemo(() => ({ addToast, remove }), [addToast, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastsWrap>
        {toasts.map(t => {
          const icon = t.category === 'payment' ? '💳' : t.category === 'calendar' ? '📅' : (t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️');
          return (
            <ToastCard key={t.id} type={t.type} $category={t.category} role="status">
              <Icon aria-hidden>{icon}</Icon>
              <span>{t.message}</span>
            </ToastCard>
          );
        })}
      </ToastsWrap>
    </ToastContext.Provider>
  );
};