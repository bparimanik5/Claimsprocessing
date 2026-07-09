// Simple token-based auth middleware.
// Tokens are opaque base64 strings minted at login (NOT a real JWT) - sufficient for this sample app.

const { users } = require('../data/seed');

const activeTokens = new Map(); // token -> userId

function mintToken(user) {
  const token = Buffer.from(`${user.id}:${Date.now()}:${Math.random()}`).toString('base64');
  activeTokens.set(token, user.id);
  return token;
}

function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  const userId = activeTokens.get(token);
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
}

module.exports = { mintToken, requireAuth, requireRole, activeTokens };
