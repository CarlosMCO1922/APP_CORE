// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: localStorage.getItem('userToken') || null,
    user: JSON.parse(localStorage.getItem('userData')) || null,
    isAuthenticated: !!localStorage.getItem('userToken'),
    role: null, 
    isAdminFeatureUser: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
      const parsedUserData = JSON.parse(userData);
      let role = null;
      let isAdminUserField = false;
      if (parsedUserData.role) { 
        role = parsedUserData.role;
      } else { 
        role = 'user';
      }
      isAdminUserField = parsedUserData.isAdmin || false;

      setAuthState({
        token: token,
        user: parsedUserData,
        isAuthenticated: true,
        role: role,
        isAdminFeatureUser: isAdminUserField || (role === 'admin'),
      });
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
        localStorage.setItem('userToken', data.token);
        const userDataToStore = data.user || data.staff;
        localStorage.setItem('userData', JSON.stringify(userDataToStore));
        
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