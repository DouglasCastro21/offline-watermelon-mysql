const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const photoRoutes = require('./routes/photo.routes');
const syncRoutes = require('./routes/sync.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/auth', authRoutes);
app.use('/sync', syncRoutes);
app.use('/photos', photoRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Erro interno no servidor.' });
});

const port = Number(process.env.PORT || 3333);
app.listen(port, () => {
  console.log(`API ouvindo em http://localhost:${port}`);
});
