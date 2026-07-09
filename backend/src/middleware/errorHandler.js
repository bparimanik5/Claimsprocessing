function notFoundHandler(req, res) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err); // eslint-disable-line no-console
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}

module.exports = { notFoundHandler, errorHandler };
