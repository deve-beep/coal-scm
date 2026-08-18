const mongoose = require('mongoose');

const GRADES = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10'];
const COMPANIES = ['ECL', 'BCCL', 'CCL', 'NCL', 'WCL', 'SECL', 'MCL', 'NEC', 'SCCL'];

const coalfieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, enum: COMPANIES, required: true },
    state: { type: String, required: true },
    grade: { type: String, enum: GRADES, default: 'G6' },
    annualTargetMT: { type: Number, required: true, min: 0 }, // Million Tonnes
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coalfield', coalfieldSchema);
module.exports.GRADES = GRADES;
module.exports.COMPANIES = COMPANIES;
