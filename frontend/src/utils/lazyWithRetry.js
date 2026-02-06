/**
 * Wrapper para React.lazy que retenta o carregamento de chunks em caso de falha.
 * Útil para erros "Loading chunk X failed" que ocorrem após deploys (cache desatualizado)
 * ou instabilidade de rede (ex.: Render free tier a fazer spin-up).
 *
 * @param {() => Promise<{default: React.ComponentType}>} componentImport - Função que retorna o import dinâmico
 * @param {number} retries - Número de tentativas (default: 3)
 * @param {number} delay - Atraso entre tentativas em ms (default: 1500)
 * @returns {React.LazyExoticComponent}
 */
import React, { lazy } from 'react';

function isChunkLoadError(error) {
  if (!error) return false;
  const msg = error.message || '';
  const name = error.name || '';
  return (
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('ChunkLoadError') ||
    name === 'ChunkLoadError' ||
    (msg.includes('Failed to fetch') && msg.includes('chunk'))
  );
}

export function lazyWithRetry(componentImport, retries = 3, delay = 1500) {
  return lazy(async () => {
    let lastError;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await componentImport();
      } catch (error) {
        lastError = error;
        if (isChunkLoadError(error) && attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, delay));
        } else if (isChunkLoadError(error) && attempt === retries - 1) {
          // Última tentativa falhou - recarregar a página para obter chunks atualizados
          window.location.reload();
          return new Promise(() => {}); // Nunca resolve; a página vai recarregar
        } else {
          throw error;
        }
      }
    }
    throw lastError;
  });
}
