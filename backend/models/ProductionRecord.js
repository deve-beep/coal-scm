const mongoose = require('mongoose');

const productionRecordSchema = new mongoose.Schema(
  {
    coalfield: { type: mongoose.Schema.Types.ObjectId, ref: 'Coalfield', required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    targetMT: { type: Number, required: true, min: 0 }, // monthly target, Million Tonnes
    actualMT: { type: Number, required: true, min: 0 },
    dispatchedMT: { type: Number, default: 0 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

productionRecordSchema.index({ coalfield: 1, year: 1, month: 1 }, { unique: true });

productionRecordSchema.virtual('achievementPct').get(function () {
  return this.targetMT > 0 ? Math.round((this.actualMT / this.targetMT) * 10000) / 100 : 0;
});
productionRecordSchema.set('toJSON', { virtuals: true });
productionRecordSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ProductionRecord', productionRecordSchema);
