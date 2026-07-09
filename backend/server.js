const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const policyRoutes = require('./src/routes/policies');
const claimRoutes = require('./src/routes/claims');
const statsRoutes = require('./src/routes/stats');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'claims-processing-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/stats', statsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Claims Processing API listening on http://localhost:${PORT}`);
});

module.exports = app;
