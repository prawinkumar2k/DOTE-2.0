const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./config/db.config');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const collegeRoutes = require('./routes/college.routes');
const studentRoutes = require('./routes/student.routes');
const masterRoutes = require('./routes/master.routes');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Allow any localhost port in dev (Vite can run on 5173, 5174, etc.)
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests from any localhost port (Vite may pick different ports)
    if (!origin || origin.match(/^http:\/\/localhost:\d+$/)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Static file serving for student uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/college', collegeRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/master', masterRoutes);



app.get('/', (req, res) => res.send('DOTE Admission Portal API is running...'));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong' });
});

module.exports = app;
