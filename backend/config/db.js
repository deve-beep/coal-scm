const mongoose = require('mongoose');

async function connectDB() {
  let uri = process.env.MONGO_URI;

  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mem = await MongoMemoryServer.create({ instance: { dbName: 'coal_scm_db' } });
    uri = mem.getUri();
    global.__MONGO_MEMORY_SERVER__ = mem;
    console.log('⚠️  No MONGO_URI found in .env — using an in-memory MongoDB instance.');
    console.log('   Data will NOT persist across restarts. Set MONGO_URI in .env for real persistence.');
  }

  await mongoose.connect(uri, { autoIndex: true });
  console.log(`✅ MongoDB connected: ${mongoose.connection.host || 'in-memory instance'}`);

  if (!process.env.MONGO_URI) {
    const seedData = require('../seed/seedData');
    const result = await seedData();
    if (result.seeded) console.log('🌱 In-memory database auto-seeded with demo accounts and sample data.');
  }

  return mongoose.connection;
}

module.exports = connectDB;
