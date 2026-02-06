// frontend/src/components/ErrorBoundary.js
import React from 'react';
import styled from 'styled-components';
import { logErrorService } from '../services/logService';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
`;

const ErrorTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.error};
`;

const ErrorMessage = styled.p`
  font-size: 1.1rem;
  margin-bottom: 30px;
  text-align: center;
  max-width: 600px;
`;

const ErrorDetails = styled.details`
  margin-top: 20px;
  max-width: 800px;
  width: 100%;
  
  summary {
    cursor: pointer;
    padding: 10px;
    background-color: ${({ theme }) => theme.colors.cardBackground};
    border-radius: ${({ theme }) => theme.borderRadius};
    margin-bottom: 10px;
  }
  
  pre {
    background-color: ${({ theme }) => theme.colors.cardBackground};
    padding: 15px;
    border-radius: ${({ theme }) => theme.borderRadius};
    overflow-x: auto;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const ReloadButton = styled.button`
  padding: 12px 24px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log do erro
    this.setState({
      error,
      errorInfo,
    });

    // Enviar erro para o backend
    logErrorService({
      errorType: 'REACT_ERROR_BOUNDARY',
      message: error.message || 'Erro não capturado no React',
      stackTrace: error.stack || errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      deviceInfo: {
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: window.screen?.width || 0,
        screenHeight: window.screen?.height || 0,
        userAgent: navigator.userAgent,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      },
      severity: 'HIGH',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorName: error.name,
      },
    }).catch(err => {
      console.error('Erro ao enviar log de erro:', err);
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  isChunkLoadError() {
    const msg = this.state.error?.message || '';
    return msg.includes('Loading chunk') || msg.includes('ChunkLoadError');
  }

  render() {
    if (this.state.hasError) {
      const isChunkError = this.isChunkLoadError();
      return (
        <ErrorContainer>
          <ErrorTitle>Algo correu mal</ErrorTitle>
          <ErrorMessage>
            {isChunkError
              ? 'A aplicação foi atualizada ou houve um problema ao carregar. Recarrega a página para obteres a versão mais recente.'
              : 'Ocorreu um erro inesperado na aplicação. O erro foi registado e será analisado.'}
          </ErrorMessage>
          <ReloadButton onClick={this.handleReload}>Recarregar Página</ReloadButton>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <ErrorDetails>
              <summary>Detalhes do Erro (apenas em desenvolvimento)</summary>
              <pre>
                {this.state.error.toString()}
                {this.state.errorInfo && '\n\n' + this.state.errorInfo.componentStack}
              </pre>
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
