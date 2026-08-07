/**
 * LOW-01 Fix: Production-safe logger utility
 * 
 * In development mode (npm run dev), logs are printed to the browser console as normal.
 * In production mode (npm run build), all console output is suppressed to prevent
 * leaking internal database column names, table structures, error messages,
 * or stack traces to end users via browser DevTools.
 */

const IS_DEV = import.meta.env.DEV;

const logger = {
  error: (...args) => { if (IS_DEV) console.error(...args); },
  warn:  (...args) => { if (IS_DEV) console.warn(...args); },
  info:  (...args) => { if (IS_DEV) console.info(...args); },
  log:   (...args) => { if (IS_DEV) console.log(...args); },
};

export default logger;
