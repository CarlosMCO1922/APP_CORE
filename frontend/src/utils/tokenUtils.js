// frontend/src/utils/tokenUtils.js
// Utilitários para validação de tokens JWT

/**
 * Decodifica um token JWT (sem verificar assinatura)
 * Retorna null se o token for inválido
 */
export const decodeToken = (token) => {
  try {
    if (!token || typeof token !== 'string') return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verifica se um token JWT está expirado
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  // exp está em segundos, Date.now() está em milissegundos
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  
  // Considera expirado se faltam menos de 5 minutos (margem de segurança)
  return currentTime >= (expirationTime - 5 * 60 * 1000);
};

/**
 * Verifica se um token é válido (não expirado e tem estrutura correta)
 */
export const isValidToken = (token) => {
  if (!token) return false;
  const decoded = decodeToken(token);
  if (!decoded) return false;
  return !isTokenExpired(token);
};

