const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

const genAlertId = customAlphabet('0123456789', 6);

const ALERT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const ALERT_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'];
const ALERT_SOURCES = ['AUTO_STOCK_THRESHOLD', 'CONSUMER_REPORTED', 'LOGISTICS_MANAGER'];

const alertUpdateSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ALERT_STATUSES, required: true },
    note: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const shortageAlertSchema = new mongoose.Schema(
  {
    alertCode: { type: String, unique: true, default: () => `ALT-${genAlertId()}` },
    source: { type: String, enum: ALERT_SOURCES, required: true },
    stockyard: { type: mongoose.Schema.Types.ObjectId, ref: 'Stockyard' },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ALERT_SEVERITIES, default: 'MEDIUM' },
    status: { type: String, enum: ALERT_STATUSES, default: 'OPEN' },
    updates: [alertUpdateSchema],
  },
  { timestamps: true }
);

shortageAlertSchema.index({ status: 1, severity: 1 });

module.exports = mongoose.model('ShortageAlert', shortageAlertSchema);
module.exports.ALERT_SEVERITIES = ALERT_SEVERITIES;
module.exports.ALERT_STATUSES = ALERT_STATUSES;
module.exports.ALERT_SOURCES = ALERT_SOURCES;
