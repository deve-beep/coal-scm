const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

const genDispatchId = customAlphabet('0123456789', 8);

const DISPATCH_MODES = ['RAIL', 'ROAD', 'MGR', 'ROPEWAY', 'MERRY_GO_ROUND'];
const DISPATCH_STATUSES = ['SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'CANCELLED'];

const dispatchSchema = new mongoose.Schema(
  {
    dispatchId: { type: String, unique: true, default: () => `DSP-${genDispatchId()}` },
    mode: { type: String, enum: DISPATCH_MODES, required: true },
    sourceStockyard: { type: mongoose.Schema.Types.ObjectId, ref: 'Stockyard', required: true },
    consumer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fsa: { type: mongoose.Schema.Types.ObjectId, ref: 'FuelSupplyAgreement' },
    quantityMT: { type: Number, required: true, min: 0.001 }, // thousand tonnes
    dispatchDate: { type: Date, required: true, default: Date.now },
    expectedDelivery: { type: Date },
    actualDelivery: { type: Date },
    status: { type: String, enum: DISPATCH_STATUSES, default: 'SCHEDULED' },
    railRake: { type: mongoose.Schema.Types.ObjectId, ref: 'RailRake' },
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

dispatchSchema.index({ status: 1, mode: 1 });

module.exports = mongoose.model('Dispatch', dispatchSchema);
module.exports.DISPATCH_MODES = DISPATCH_MODES;
module.exports.DISPATCH_STATUSES = DISPATCH_STATUSES;
