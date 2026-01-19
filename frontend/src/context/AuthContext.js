// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { isValidToken, isTokenExpired, decodeToken } from '../utils/tokenUtils';
import { safeGetItem, safeSetItem, validateUserData } from '../utils/storageUtils';
import { logger } from '../utils/logger';
import { validateAuthService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // SEGURANÇA: Usar JWT como fonte de verdade, não localStorage
  const rawToken = localStorage.getItem('userToken');
  const initialToken = rawToken && isValidToken(rawToken) ? rawToken : null;
  
  // Decodificar JWT para obter role real (não confiar no localStorage)
  let initialRole = null;
  let initialIsAdminFeatureUser = false;
  let initialUser = null;
  
  if (initialToken) {
    const decoded = decodeToken(initialToken);
    if (decoded) {
      // Usar dados do JWT como fonte de verdade
      initialRole = decoded.role || null;
      initialIsAdminFeatureUser = decoded.isAdmin === true || decoded.role === 'admin';
      
      // Carregar userData do localStorage apenas para dados não sensíveis (nome, email)
      const storedUser = safeGetItem('userData', validateUserData);
      if (storedUser && storedUser.id === decoded.id) {
        initialUser = storedUser;
      } else {
        // Se userData não corresponde ao token, limpar
        logger.warn("userData do localStorage não corresponde ao token, limpando");
        localStorage.removeItem('userData');
      }
    } else {
      // Token inválido, limpar tudo
      logger.warn("Token inválido encontrado, limpando dados de autenticação");
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
    }
  }

  const [authState, setAuthState] = useState({
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!initialToken,
    role: initialRole,
    isAdminFeatureUser: initialIsAdminFeatureUser,
    isValidating: false, // Flag para indicar validação em curso
  });

  // Validação com backend ao montar (verifica role real)
  useEffect(() => {
    const validateWithBackend = async () => {
      const token = localStorage.getItem('userToken');
      
      if (!token || !isValidToken(token)) {
        if (token) {
          // Token inválido, limpar
          logger.warn("Token inválido ou expirado detectado, limpando autenticação");
          localStorage.removeItem('userToken');
          localStorage.removeItem('userData');
          setAuthState({ token: null, user: null, isAuthenticated: false, role: null, isAdminFeatureUser: false, isValidating: false });
        }
        return;
      }

      // Decodificar JWT primeiro (fonte de verdade local)
      const decoded = decodeToken(token);
      if (!decoded) {
        logger.warn("Não foi possível decodificar token, limpando autenticação");
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        setAuthState({ token: null, user: null, isAuthenticated: false, role: null, isAdminFeatureUser: false, isValidating: false });
        return;
      }

      // Validar com backend para garantir que role/permissões estão corretas
      setAuthState(prev => ({ ...prev, isValidating: true }));
      
      try {
        const validationResult = await validateAuthService(token);
        
        if (validationResult.valid) {
          // Backend confirmou - usar dados do backend como fonte de verdade
          const validatedUser = validationResult.user;
          const validatedRole = validatedUser.role;
          const validatedIsAdmin = validationResult.permissions.canAccessAdmin;
          
          // Verificar se há discrepância entre JWT e backend
          if (decoded.role !== validatedRole || 
              (decoded.isAdmin !== undefined && decoded.isAdmin !== validatedIsAdmin)) {
            // DISCREPÂNCIA DETETADA - possível tentativa de hack
            logger.error("DISCREPÂNCIA DE SEGURANÇA DETETADA:", {
              jwtRole: decoded.role,
              jwtIsAdmin: decoded.isAdmin,
              backendRole: validatedRole,
              backendIsAdmin: validatedIsAdmin,
            });
            
            // Log de segurança (tentar enviar, mas não bloquear se falhar)
            try {
              await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/logs/security`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  eventType: 'ROLE_MISMATCH',
                  description: `Discrepância entre JWT e backend. JWT: role=${decoded.role}, isAdmin=${decoded.isAdmin}, Backend: role=${validatedRole}, isAdmin=${validatedIsAdmin}`,
                  attemptedRole: decoded.role,
                  actualRole: validatedRole,
                  severity: 'HIGH',
                }),
              }).catch(() => {}); // Ignorar erros de rede
            } catch (e) {
              // Ignorar erros
            }
          }
          
          // Atualizar userData no localStorage com dados validados
          safeSetItem('userData', validatedUser);
          
          setAuthState({
            token: token,
            user: validatedUser,
            isAuthenticated: true,
            role: validatedRole,
            isAdminFeatureUser: validatedIsAdmin,
            isValidating: false,
          });
        } else {
          // Backend rejeitou - limpar tudo
          logger.warn("Backend rejeitou token, limpando autenticação");
          localStorage.removeItem('userToken');
          localStorage.removeItem('userData');
          setAuthState({ token: null, user: null, isAuthenticated: false, role: null, isAdminFeatureUser: false, isValidating: false });
        }
      } catch (error) {
        // Erro na validação - usar JWT como fallback (mas marcar como não validado)
        logger.warn("Erro ao validar com backend, usando JWT como fallback:", error);
        
        const userData = safeGetItem('userData', validateUserData);
        if (userData && userData.id === decoded.id) {
          // Usar JWT decodificado como fonte de verdade
          setAuthState({
            token: token,
            user: userData,
            isAuthenticated: true,
            role: decoded.role || 'user',
            isAdminFeatureUser: decoded.isAdmin === true || decoded.role === 'admin',
            isValidating: false,
          });
        } else {
          // Se não há userData válido, ainda permitir acesso baseado apenas no JWT
          setAuthState({
            token: token,
            user: {
              id: decoded.id,
              email: decoded.email || '',
              firstName: decoded.firstName || '',
            },
            isAuthenticated: true,
            role: decoded.role || 'user',
            isAdminFeatureUser: decoded.isAdmin === true || decoded.role === 'admin',
            isValidating: false,
          });
        }
      }
    };

    validateWithBackend();
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
        
        // SEGURANÇA: Usar JWT como fonte de verdade, não dados do servidor
        const decoded = decodeToken(data.token);
        if (!decoded) {
          throw new Error('Não foi possível decodificar token recebido');
        }
        
        // Usar role e isAdmin do JWT (fonte de verdade)
        const determinedRole = decoded.role || (isStaffLogin ? userDataToStore.role : 'user');
        const determinedIsAdminUserField = isStaffLogin 
          ? (decoded.role === 'admin')
          : (decoded.isAdmin === true);
        
        const newState = {
          token: data.token,
          user: userDataToStore,
          isAuthenticated: true,
          role: determinedRole,
          isAdminFeatureUser: determinedIsAdminUserField,
          isValidating: false,
        };
        setAuthState(newState);
        
        // Validar com backend após login (em background)
        validateAuthService(data.token)
          .then(validationResult => {
            if (validationResult.valid) {
              // Atualizar com dados validados
              const validatedUser = validationResult.user;
              safeSetItem('userData', validatedUser);
              setAuthState(prev => ({
                ...prev,
                user: validatedUser,
                role: validatedUser.role,
                isAdminFeatureUser: validationResult.permissions.canAccessAdmin,
              }));
            }
          })
          .catch(err => {
            logger.warn("Erro ao validar após login (não crítico):", err);
          });
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
    setAuthState({ token: null, user: null, isAuthenticated: false, role: null, isAdminFeatureUser: false, isValidating: false });
  };

  // Função para revalidar autenticação (útil para ProtectedRoute)
  // Memoizada para evitar loops infinitos em useEffect
  const revalidateAuth = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token || !isValidToken(token)) {
      logout();
      return false;
    }

    try {
      setAuthState(prev => ({ ...prev, isValidating: true }));
      
      // Timeout de 10 segundos para evitar esperas infinitas
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na validação de autenticação')), 10000);
      });
      
      const validationResult = await Promise.race([
        validateAuthService(token),
        timeoutPromise
      ]);
      
      if (validationResult.valid) {
        const validatedUser = validationResult.user;
        safeSetItem('userData', validatedUser);
        setAuthState({
          token: token,
          user: validatedUser,
          isAuthenticated: true,
          role: validatedUser.role,
          isAdminFeatureUser: validationResult.permissions.canAccessAdmin,
          isValidating: false,
        });
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      logger.error("Erro ao revalidar autenticação:", error);
      // Em caso de erro (incluindo timeout), usar JWT como fallback
      const decoded = decodeToken(token);
      if (decoded) {
        const userData = safeGetItem('userData', validateUserData);
        if (userData && userData.id === decoded.id) {
          // Permitir acesso baseado no JWT se a validação do backend falhar
          setAuthState({
            token: token,
            user: userData,
            isAuthenticated: true,
            role: decoded.role || 'user',
            isAdminFeatureUser: decoded.isAdmin === true || decoded.role === 'admin',
            isValidating: false,
          });
          return true;
        }
      }
      logout();
      return false;
    }
  }, []); // Dependências vazias - logout é estável

  return (
    <AuthContext.Provider value={{ authState, login, logout, revalidateAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};