const ShortageAlert = require('../models/ShortageAlert');

// @route POST /api/alerts        (consumer reports a shortage; logistics_manager can also raise one)
exports.raiseAlert = async (req, res, next) => {
  try {
    const { stockyard, title, description, severity } = req.body;
    const alert = await ShortageAlert.create({
      source: req.user.role === 'consumer' ? 'CONSUMER_REPORTED' : 'LOGISTICS_MANAGER',
      stockyard, title, description, severity, raisedBy: req.user._id,
      updates: [{ status: 'OPEN', note: 'Alert raised', updatedBy: req.user._id }],
    });
    res.status(201).json({ success: true, alert });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/alerts
exports.listAlerts = async (req, res, next) => {
  try {
    const { status, severity } = req.query;
    const query = {};
    if (req.user.role === 'consumer') query.raisedBy = req.user._id;
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const alerts = await ShortageAlert.find(query)
      .sort('-createdAt')
      .populate('stockyard', 'name location')
      .populate('raisedBy', 'name companyName role');
    res.json({ success: true, count: alerts.length, alerts });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/alerts/:id
exports.getAlert = async (req, res, next) => {
  try {
    const alert = await ShortageAlert.findById(req.params.id)
      .populate('stockyard', 'name location currentStockMT minThresholdMT')
      .populate('raisedBy', 'name companyName role')
      .populate('updates.updatedBy', 'name role');
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, alert });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/alerts/:id/status   (admin, logistics_manager)
exports.updateAlertStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const alert = await ShortageAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    alert.status = status;
    alert.updates.push({ status, note, updatedBy: req.user._id });
    await alert.save();

    res.json({ success: true, alert });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
};
