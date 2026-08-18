const mongoose = require('mongoose');

const stockyardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    coalfield: { type: mongoose.Schema.Types.ObjectId, ref: 'Coalfield', required: true },
    location: { type: String, required: true },
    capacityMT: { type: Number, required: true, min: 0 }, // thousand tonnes capacity
    currentStockMT: { type: Number, required: true, min: 0, default: 0 },
    minThresholdMT: { type: Number, required: true, min: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

stockyardSchema.virtual('stockStatus').get(function () {
  if (this.currentStockMT <= this.minThresholdMT) return 'CRITICAL';
  if (this.currentStockMT <= this.minThresholdMT * 1.5) return 'LOW';
  return 'HEALTHY';
});
stockyardSchema.virtual('fillPct').get(function () {
  return this.capacityMT > 0 ? Math.round((this.currentStockMT / this.capacityMT) * 10000) / 100 : 0;
});
stockyardSchema.set('toJSON', { virtuals: true });
stockyardSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Stockyard', stockyardSchema);
