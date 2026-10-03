const fs = require('fs');
const path = require('path');
const write = (filePath, content) => {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content);
};

write('config/db.js', \const mongoose = require('mongoose');
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully: ' + conn.connection.host);
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB: ' + error.message);
    return false;
  }
};
module.exports = connectDB;\);

write('server.js', \const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

let isDbConnected = false;
connectDB().then((connected) => { isDbConnected = connected; });

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student Management System API is running',
    dbConnected: isDbConnected,
    dbState: mongoose.connection.readyState
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));

app.use(require('./middleware/errorHandler').errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server running in ' + process.env.NODE_ENV + ' mode on port ' + PORT);
});\);
console.log('Done');

