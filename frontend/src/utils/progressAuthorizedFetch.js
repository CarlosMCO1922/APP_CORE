import { refreshAccessTokenService } from '../services/authService';
import { logger } from './logger';

const REFRESH_TOKEN_KEY = 'refreshToken';

/** Evento para alinhar React AuthContext com o token renovado (evita pedidos seguidos com JWT antigo). */
export const ACCESS_TOKEN_UPDATED_EVENT = 'core-access-token-updated';

async function refreshAccessAndPersist() {
  const rt = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!rt) return null;
  try {
    const data = await refreshAccessTokenService(rt);
    localStorage.setItem('userToken', data.token);
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    window.dispatchEvent(
      new CustomEvent(ACCESS_TOKEN_UPDATED_EVENT, {
        detail: { token: data.token, refreshToken: data.refreshToken },
      })
    );
    return data.token;
  } catch (e) {
    logger.warn('progressAuthorizedFetch: falha ao renovar sessão', e);
    return null;
  }
}

/**
 * fetch com Authorization; em 401 tenta refresh uma vez e repete o pedido.
 * @param {string} url
 * @param {RequestInit} init - sem Authorization (é aplicado aqui)
 * @param {string|null|undefined} token - access token atual
 */
export async function progressAuthorizedFetch(url, init = {}, token) {
  const withBearer = (accessToken) => {
    const headers = new Headers(init.headers || {});
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return fetch(url, { ...init, headers });
  };

  let response = await withBearer(token);
  if (response.status === 401) {
    const newToken = await refreshAccessAndPersist();
    if (newToken) {
      response = await withBearer(newToken);
    }
  }
  return response;
}
