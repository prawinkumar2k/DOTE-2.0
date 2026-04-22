const app = require('./app');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

// Create uploads directories if they don't exist
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads/student'),
  path.join(__dirname, 'uploads/student/photos'),
  path.join(__dirname, 'uploads/student/documents'),
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${dir}`);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
