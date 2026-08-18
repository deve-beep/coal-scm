const mongoose = require('mongoose');

const RAKE_STATUSES = ['PLACED', 'LOADING', 'LOADED', 'IN_TRANSIT', 'ARRIVED', 'UNLOADED'];

const rakeEventSchema = new mongoose.Schema(
  {
    status: { type: String, enum: RAKE_STATUSES, required: true },
    location: { type: String, required: true },
    note: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const railRakeSchema = new mongoose.Schema(
  {
    rakeNumber: { type: String, required: true, unique: true }, // e.g. "RK-45231"
    sourceStockyard: { type: mongoose.Schema.Types.ObjectId, ref: 'Stockyard', required: true },
    destination: { type: String, required: true }, // consumer siding / destination station
    wagonCount: { type: Number, required: true, min: 1 },
    loadedQuantityMT: { type: Number, default: 0 },
    status: { type: String, enum: RAKE_STATUSES, default: 'PLACED' },
    placedAt: { type: Date, default: Date.now },
    departedAt: { type: Date },
    arrivedAt: { type: Date },
    events: [rakeEventSchema],
    dispatch: { type: mongoose.Schema.Types.ObjectId, ref: 'Dispatch' },
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

railRakeSchema.index({ status: 1 });

module.exports = mongoose.model('RailRake', railRakeSchema);
module.exports.RAKE_STATUSES = RAKE_STATUSES;
