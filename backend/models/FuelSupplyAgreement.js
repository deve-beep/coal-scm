const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

const genFsaId = customAlphabet('0123456789', 6);

const FSA_STATUSES = ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'TERMINATED'];

const fsaSchema = new mongoose.Schema(
  {
    agreementNumber: { type: String, unique: true, default: () => `FSA-${genFsaId()}` },
    consumer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coalfield: { type: mongoose.Schema.Types.ObjectId, ref: 'Coalfield', required: true },
    annualContractedQuantityMT: { type: Number, required: true, min: 0 },
    suppliedToDateMT: { type: Number, default: 0 },
    pricePerTonne: { type: Number, required: true, min: 0 },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    status: { type: String, enum: FSA_STATUSES, default: 'ACTIVE' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

fsaSchema.virtual('fulfillmentPct').get(function () {
  return this.annualContractedQuantityMT > 0
    ? Math.round((this.suppliedToDateMT / this.annualContractedQuantityMT) * 10000) / 100
    : 0;
});
fsaSchema.set('toJSON', { virtuals: true });
fsaSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FuelSupplyAgreement', fsaSchema);
module.exports.FSA_STATUSES = FSA_STATUSES;
