# Configuração do Sentry (Opcional)

O Sentry é uma plataforma de monitorização de erros que permite rastrear e analisar erros em tempo real.

## Instalação

```bash
cd backend
npm install @sentry/node
```

## Configuração

1. Cria uma conta no [Sentry](https://sentry.io)
2. Cria um novo projeto (Node.js)
3. Copia o DSN fornecido
4. Adiciona ao `.env`:

```env
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_TRACES_SAMPLE_RATE=0.1  # Opcional: taxa de amostragem para traces (0.0 a 1.0)
NODE_ENV=production  # ou development
```

## Funcionalidades

- **Erros Críticos**: Erros com severidade CRITICAL são automaticamente enviados para o Sentry
- **Eventos de Segurança**: Eventos de segurança críticos são também enviados
- **Contexto Rico**: Cada erro inclui contexto adicional (userId, URL, deviceInfo, etc.)

## Ver Erros no Sentry

1. Acede ao dashboard do Sentry
2. Vê erros em tempo real
3. Recebe notificações por email/Slack quando novos erros ocorrem
4. Analisa stack traces, contexto e frequência de erros

## Nota

Se o Sentry não estiver configurado, o sistema continua a funcionar normalmente. Os erros são apenas registados localmente e enviados por email (se configurado).
