const app = require('./app');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

// ─── Create upload directories if they don't exist ──────────────────────────────
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads/student'),
  path.join(__dirname, 'uploads/student/photos'),
  path.join(__dirname, 'uploads/student/documents'),
  path.join(__dirname, 'uploads/home'),
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
});

// ─── Start Server ───────────────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// ─── Graceful Shutdown ──────────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
  // Force close after 10s
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  // In production, log and stay alive; don't crash on transient errors
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  // Critical — shutdown gracefully
  gracefulShutdown('uncaughtException');
});
