const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sms-db');
    console.log('MongoDB Connected for seeding');

    // Clear existing users
    await User.deleteMany({});

    // Create Admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@sms.com',
      password: hashedPassword,
      role: 'admin',
      phone: '1234567890'
    });

    console.log('Admin user created: admin@sms.com / admin123');
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
