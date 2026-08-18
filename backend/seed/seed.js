require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const seedData = require('./seedData');

async function run() {
  await connectDB();
  console.log('Seeding database (force reset)...');
  await seedData({ force: true });

  console.log('---------------------------------------------');
  console.log('Seed complete! Demo login credentials:');
  console.log('  Admin:             admin@coalscm.gov.in       / Admin@123');
  console.log('  Logistics Manager: logistics@coalscm.gov.in   / Logistics@123');
  console.log('  Consumer (Steel):  consumer@steelcorp.com     / Consumer@123');
  console.log('  Consumer (Power):  priya@powergrid-thermal.com / Consumer@123');
  console.log('---------------------------------------------');

  await mongoose.connection.close();
  if (global.__MONGO_MEMORY_SERVER__) await global.__MONGO_MEMORY_SERVER__.stop();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
