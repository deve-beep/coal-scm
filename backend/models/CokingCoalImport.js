const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

const genImportId = customAlphabet('0123456789', 7);

const IMPORT_STATUSES = ['CONTRACTED', 'SHIPPED', 'IN_TRANSIT', 'CUSTOMS_CLEARANCE', 'DELIVERED', 'CANCELLED'];
const SOURCE_COUNTRIES = ['Australia', 'Russia', 'USA', 'Indonesia', 'Canada', 'Mozambique', 'South Africa'];

const cokingCoalImportSchema = new mongoose.Schema(
  {
    contractNumber: { type: String, unique: true, default: () => `IMP-${genImportId()}` },
    consumer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // typically a steel plant
    sourceCountry: { type: String, enum: SOURCE_COUNTRIES, required: true },
    supplier: { type: String, required: true },
    quantityMT: { type: Number, required: true, min: 0.001 }, // thousand tonnes
    pricePerTonneUSD: { type: Number, required: true, min: 0 },
    portOfEntry: { type: String, required: true },
    contractDate: { type: Date, required: true, default: Date.now },
    expectedArrival: { type: Date },
    actualArrival: { type: Date },
    status: { type: String, enum: IMPORT_STATUSES, default: 'CONTRACTED' },
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CokingCoalImport', cokingCoalImportSchema);
module.exports.IMPORT_STATUSES = IMPORT_STATUSES;
module.exports.SOURCE_COUNTRIES = SOURCE_COUNTRIES;
