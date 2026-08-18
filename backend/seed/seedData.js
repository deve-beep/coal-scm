const User = require('../models/User');
const Coalfield = require('../models/Coalfield');
const ProductionRecord = require('../models/ProductionRecord');
const Stockyard = require('../models/Stockyard');
const Auction = require('../models/Auction');
const Dispatch = require('../models/Dispatch');
const RailRake = require('../models/RailRake');
const FuelSupplyAgreement = require('../models/FuelSupplyAgreement');
const CokingCoalImport = require('../models/CokingCoalImport');
const ShortageAlert = require('../models/ShortageAlert');

async function seedData({ force = false } = {}) {
  if (force) {
    await Promise.all([
      User.deleteMany({}), Coalfield.deleteMany({}), ProductionRecord.deleteMany({}), Stockyard.deleteMany({}),
      Auction.deleteMany({}), Dispatch.deleteMany({}), RailRake.deleteMany({}), FuelSupplyAgreement.deleteMany({}),
      CokingCoalImport.deleteMany({}), ShortageAlert.deleteMany({}),
    ]);
  } else {
    const existing = await User.countDocuments();
    if (existing > 0) return { seeded: false };
  }

  const admin = await User.create({
    name: 'Rajesh Menon', email: 'admin@coalscm.gov.in', password: 'Admin@123',
    role: 'admin', employeeId: 'MIN-0001', region: 'Headquarters', phone: '9990001111',
  });

  const logistics1 = await User.create({
    name: 'Suresh Patil', email: 'logistics@coalscm.gov.in', password: 'Logistics@123',
    role: 'logistics_manager', employeeId: 'LOG-0001', region: 'Eastern Region', phone: '9990002222',
  });

  const consumer1 = await User.create({
    name: 'Anand Krishnan', email: 'consumer@steelcorp.com', password: 'Consumer@123',
    role: 'consumer', companyName: 'National Steel Corp', industryType: 'STEEL', gstin: '27AAAPL1234C1Z5', phone: '9990003333',
  });

  const consumer2 = await User.create({
    name: 'Priya Nair', email: 'priya@powergrid-thermal.com', password: 'Consumer@123',
    role: 'consumer', companyName: 'Powergrid Thermal Ltd', industryType: 'POWER', gstin: '19AAAPL5678D2Z6', phone: '9990004444',
  });

  // Coalfields across major subsidiaries
  const cfNames = [
    { name: 'Jharia Coalfield', company: 'BCCL', state: 'Jharkhand', grade: 'G6', annualTargetMT: 32 },
    { name: 'Talcher Coalfield', company: 'MCL', state: 'Odisha', grade: 'G8', annualTargetMT: 180 },
    { name: 'Korba Coalfield', company: 'SECL', state: 'Chhattisgarh', grade: 'G7', annualTargetMT: 165 },
    { name: 'Singrauli Coalfield', company: 'NCL', state: 'Madhya Pradesh', grade: 'G7', annualTargetMT: 130 },
    { name: 'Raniganj Coalfield', company: 'ECL', state: 'West Bengal', grade: 'G9', annualTargetMT: 45 },
  ];
  const coalfields = await Coalfield.insertMany(cfNames);

  // Production records for current year, months 1-7 (through "now")
  const currentYear = new Date().getFullYear();
  for (const cf of coalfields) {
    const monthlyTarget = Math.round((cf.annualTargetMT / 12) * 100) / 100;
    for (let month = 1; month <= 7; month++) {
      const variance = 0.85 + Math.random() * 0.3; // 85%-115% of target
      await ProductionRecord.create({
        coalfield: cf._id, year: currentYear, month,
        targetMT: monthlyTarget, actualMT: Math.round(monthlyTarget * variance * 100) / 100,
        dispatchedMT: Math.round(monthlyTarget * variance * 0.9 * 100) / 100,
        recordedBy: logistics1._id,
      });
    }
  }

  // Stockyards, one or two per coalfield
  const stockyards = [];
  for (const cf of coalfields) {
    const sy = await Stockyard.create({
      name: `${cf.name} Central Depot`, coalfield: cf._id, location: `${cf.state} Rail Terminal`,
      capacityMT: 500, currentStockMT: Math.round(80 + Math.random() * 350), minThresholdMT: 100,
    });
    stockyards.push(sy);
  }
  // Force one stockyard critically low to demonstrate the alert system
  stockyards[0].currentStockMT = 42;
  await stockyards[0].save();
  await ShortageAlert.create({
    source: 'AUTO_STOCK_THRESHOLD', stockyard: stockyards[0]._id,
    title: `Stock below threshold at ${stockyards[0].name}`,
    description: `Current stock (42 MT) has fallen below the minimum threshold (100 MT).`,
    severity: 'CRITICAL', updates: [{ status: 'OPEN', note: 'Auto-generated from stock threshold breach' }],
  });

  // Auctions — a mix of statuses
  const now = Date.now();
  await Auction.create({
    type: 'SPOT', coalfield: coalfields[1]._id, quantityMT: 25, reservePricePerTonne: 2100,
    startDate: new Date(now - 5 * 86400000), endDate: new Date(now - 2 * 86400000), status: 'ALLOTTED',
    createdBy: admin._id,
    bids: [
      { bidder: consumer1._id, quantityMT: 20, pricePerTonne: 2250, placedAt: new Date(now - 4 * 86400000) },
      { bidder: consumer2._id, quantityMT: 25, pricePerTonne: 2180, placedAt: new Date(now - 3 * 86400000) },
    ],
  });
  const liveAuction = await Auction.create({
    type: 'LINKAGE', coalfield: coalfields[2]._id, quantityMT: 40, reservePricePerTonne: 1950,
    startDate: new Date(now - 86400000), endDate: new Date(now + 3 * 86400000), status: 'LIVE', createdBy: admin._id,
    bids: [{ bidder: consumer1._id, quantityMT: 30, pricePerTonne: 2020, placedAt: new Date(now - 43200000) }],
  });
  await Auction.create({
    type: 'FORWARD_E_AUCTION', coalfield: coalfields[3]._id, quantityMT: 60, reservePricePerTonne: 2250,
    startDate: new Date(now + 2 * 86400000), endDate: new Date(now + 6 * 86400000), status: 'UPCOMING', createdBy: admin._id,
  });

  // Dispatches
  const dispatch1 = await Dispatch.create({
    mode: 'RAIL', sourceStockyard: stockyards[1]._id, consumer: consumer2._id, quantityMT: 12,
    dispatchDate: new Date(now - 2 * 86400000), expectedDelivery: new Date(now + 86400000), status: 'IN_TRANSIT', loggedBy: logistics1._id,
  });
  await Dispatch.create({
    mode: 'ROAD', sourceStockyard: stockyards[2]._id, consumer: consumer1._id, quantityMT: 4,
    dispatchDate: new Date(now - 5 * 86400000), expectedDelivery: new Date(now - 3 * 86400000), actualDelivery: new Date(now - 3 * 86400000),
    status: 'DELIVERED', loggedBy: logistics1._id,
  });

  // Rail rake movement
  const rake = await RailRake.create({
    rakeNumber: 'RK-58231', sourceStockyard: stockyards[1]._id, destination: 'Powergrid Thermal Siding, Vizag',
    wagonCount: 58, loadedQuantityMT: 12, status: 'IN_TRANSIT', dispatch: dispatch1._id, loggedBy: logistics1._id,
    departedAt: new Date(now - 2 * 86400000),
    events: [
      { status: 'PLACED', location: 'Talcher Coalfield Central Depot', note: 'Rake placed for loading', updatedBy: logistics1._id, timestamp: new Date(now - 3 * 86400000) },
      { status: 'LOADED', location: 'Talcher Coalfield Central Depot', note: 'Loading completed', updatedBy: logistics1._id, timestamp: new Date(now - 2.5 * 86400000) },
      { status: 'IN_TRANSIT', location: 'Waltair Junction', note: 'Departed toward destination', updatedBy: logistics1._id, timestamp: new Date(now - 2 * 86400000) },
    ],
  });
  dispatch1.railRake = rake._id;
  await dispatch1.save();

  // Fuel Supply Agreements
  await FuelSupplyAgreement.create({
    consumer: consumer2._id, coalfield: coalfields[1]._id, annualContractedQuantityMT: 150,
    suppliedToDateMT: 62, pricePerTonne: 1980, validFrom: new Date(`${currentYear}-01-01`), validTo: new Date(`${currentYear}-12-31`),
    status: 'ACTIVE', createdBy: admin._id,
  });
  await FuelSupplyAgreement.create({
    consumer: consumer1._id, coalfield: coalfields[2]._id, annualContractedQuantityMT: 30,
    suppliedToDateMT: 11, pricePerTonne: 2100, validFrom: new Date(`${currentYear}-01-01`), validTo: new Date(`${currentYear}-12-31`),
    status: 'ACTIVE', createdBy: admin._id,
  });

  // Coking coal imports (steel plants depend on imported coking coal)
  await CokingCoalImport.create({
    consumer: consumer1._id, sourceCountry: 'Australia', supplier: 'BHP Billiton',
    quantityMT: 8.5, pricePerTonneUSD: 245, portOfEntry: 'Paradip Port', contractDate: new Date(now - 20 * 86400000),
    expectedArrival: new Date(now + 5 * 86400000), status: 'IN_TRANSIT', loggedBy: logistics1._id,
  });
  await CokingCoalImport.create({
    consumer: consumer1._id, sourceCountry: 'Russia', supplier: 'Siberian Coal Energy Co.',
    quantityMT: 5.2, pricePerTonneUSD: 210, portOfEntry: 'Visakhapatnam Port', contractDate: new Date(now - 45 * 86400000),
    expectedArrival: new Date(now - 5 * 86400000), actualArrival: new Date(now - 4 * 86400000), status: 'DELIVERED', loggedBy: logistics1._id,
  });

  return { seeded: true, admin, logistics1, consumer1, consumer2 };
}

module.exports = seedData;
