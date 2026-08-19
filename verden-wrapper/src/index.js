// src/index.js
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const { CONFIG } = require('./config');

const app = express();
app.use(bodyParser.json());

// Token forwarding middleware – ensures Authorization header is present
app.use((req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  // store token for downstream use
  req.token = auth.split(' ')[1];
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', routes);

// Global error handler – ensures JSON error format
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
});

const PORT = CONFIG.PORT;
app.listen(PORT, () => {
  console.log(`Verden wrapper listening on port ${PORT}`);
});

module.exports = app;
