// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { isValidToken, isTokenExpired } from '../utils/tokenUtils';
import { safeGetItem, safeSetItem, validateUserData } from '../utils/storageUtils';
import { logger } from '../utils/logger';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Hydrate de forma síncrona para evitar flicker e redireções erradas
  // Valida token antes de usar
  const rawToken = localStorage.getItem('userToken');
  const initialToken = rawToken && isValidToken(rawToken) ? rawToken : null;
  const initialUser = safeGetItem('userData', validateUserData);
  const initialRole = initialUser ? (initialUser.role ? initialUser.role : 'user') : null;
  const initialIsAdminFeatureUser = initialUser ? (initialUser.isAdmin || initialRole === 'admin') : false;
  
  // Se token estava inválido, limpa dados
  if (rawToken && !initialToken) {
    logger.warn("Token expirado ou inválido encontrado, limpando dados de autenticação");
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
  }

  const [authState, setAuthState] = useState({
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!initialToken,
    role: initialRole,
    isAdminFeatureUser: initialIsAdminFeatureUser,
  });

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userData = safeGetItem('userData', validateUserData);
    
    // Valida token antes de usar
    if (token && isValidToken(token) && userData) {
      const role = userData.role ? userData.role : 'user';
      const isAdminUserField = userData.isAdmin || false;

      setAuthState({
        token: token,
        user: userData,
        isAuthenticated: true,
        role: role,
        isAdminFeatureUser: isAdminUserField || (role === 'admin'),
      });
    } else if (token) {
      // Token inválido ou expirado, limpa dados
      logger.warn("Token inválido ou expirado detectado, limpando autenticação");
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      setAuthState({ token: null, user: null, isAuthenticated: false, role: null, isAdminFeatureUser: false });
    }
  }, []);

  const login = async (email, password, isStaffLogin = false) => {
    try {
      const endpoint = isStaffLogin ? '/auth/staff/login' : '/auth/login';
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro no login');
      }

      if (data.token) {
        // Valida token antes de guardar
        if (!isValidToken(data.token)) {
          throw new Error('Token inválido recebido do servidor');
        }
        
        localStorage.setItem('userToken', data.token);
        const userDataToStore = data.user || data.staff;
        safeSetItem('userData', userDataToStore);
        
        let determinedRole = null;
        let determinedIsAdminUserField = false;

        if (isStaffLogin) {
          determinedRole = userDataToStore.role;
          determinedIsAdminUserField = (userDataToStore.role === 'admin');
        } else { 
          determinedRole = 'user';
          determinedIsAdminUserField = userDataToStore.isAdmin || false;
        }
        
        const newState = {
          token: data.token,
          user: userDataToStore,
          isAuthenticated: true,
          role: determinedRole,
          isAdminFeatureUser: determinedIsAdminUserField,
        };
        setAuthState(newState);
      }
      return data;

    } catch (error) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      setAuthState({ token: null, user: null, isAuthenticated: false, role: null, isAdminFeatureUser: false });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    setAuthState({ token: null, user: null, isAuthenticated: false, role: null, isAdminFeatureUser: false });
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};