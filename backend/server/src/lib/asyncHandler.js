// Wrap async route handlers so thrown/rejected errors reach the Express
// error middleware instead of crashing the process (Express 4 doesn't do this).
export const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
