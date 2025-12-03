// src/hooks/useConfirmation.js
import { useState, useCallback } from 'react';

export const useConfirmation = () => {
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    danger: false,
  });

  const confirm = useCallback(({ title, message, onConfirm, danger = false }) => {
    return new Promise((resolve) => {
      setConfirmationState({
        isOpen: true,
        title,
        message,
        danger,
        onConfirm: () => {
          if (onConfirm) {
            onConfirm();
          }
          resolve(true);
          setConfirmationState({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: null,
            danger: false,
          });
        },
      });
    });
  }, []);

  const close = useCallback(() => {
    setConfirmationState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      danger: false,
    });
  }, []);

  return {
    confirmationState,
    confirm,
    close,
  };
};

