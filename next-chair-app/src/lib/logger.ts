// src/lib/logger.ts
export const logger = {
  info: (...args: any[]) => console.log('INFO:', ...args),
  warn: (...args: any[]) => console.warn('WARN:', ...args),
  error: (...args: any[]) => console.error('ERROR:', ...args),
  // Add more logging levels as needed
};