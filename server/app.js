const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import DB (triggers connection with retry)
require('./config/db.config');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const collegeRoutes = require('./routes/college.routes');
const studentRoutes = require('./routes/student.routes');
const masterRoutes = require('./routes/master.routes');

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Let Nginx handle CSP in production
}));

// ─── Request Logging ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ─── Body Parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── CORS ───────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // In production behind Nginx, origin may be undefined (same-origin)
    if (!origin) return callback(null, true);
    // Allow listed origins
    if (allowedOrigins.length && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Dev: allow any localhost port
    if (process.env.NODE_ENV !== 'production' && origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Static Files ───────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health Check (for Docker healthcheck & monitoring) ─────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/college', collegeRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/master', masterRoutes);

// ─── Root ───────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.send('DOTE Admission Portal API is running...'));

// ─── 404 catch-all ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message || 'Something went wrong',
  });
});

module.exports = app;
