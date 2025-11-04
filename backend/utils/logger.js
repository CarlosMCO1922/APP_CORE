// backend/utils/logger.js
const isProd = process.env.NODE_ENV === 'production';

const format = (level, args) => {
  const ts = new Date().toISOString();
  return [`[${ts}] [${level.toUpperCase()}]`, ...args];
};

module.exports = {
  info: (...args) => {
    if (!isProd) {
      console.log(...format('info', args));
    }
  },
  warn: (...args) => console.warn(...format('warn', args)),
  error: (...args) => console.error(...format('error', args)),
  debug: (...args) => {
    if (!isProd) {
      console.debug(...format('debug', args));
    }
  },
};
