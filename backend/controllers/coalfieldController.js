const Coalfield = require('../models/Coalfield');
const ProductionRecord = require('../models/ProductionRecord');

// @route POST /api/coalfields        (admin)
exports.createCoalfield = async (req, res, next) => {
  try {
    const coalfield = await Coalfield.create(req.body);
    res.status(201).json({ success: true, coalfield });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/coalfields
exports.listCoalfields = async (req, res, next) => {
  try {
    const { company, state, search } = req.query;
    const query = { isActive: true };
    if (company) query.company = company;
    if (state) query.state = state;
    if (search) query.name = new RegExp(search, 'i');
    const coalfields = await Coalfield.find(query).sort('name');
    res.json({ success: true, count: coalfields.length, coalfields });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/coalfields/:id
exports.getCoalfield = async (req, res, next) => {
  try {
    const coalfield = await Coalfield.findById(req.params.id);
    if (!coalfield) return res.status(404).json({ success: false, message: 'Coalfield not found' });
    res.json({ success: true, coalfield });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/coalfields/:id   (admin)
exports.updateCoalfield = async (req, res, next) => {
  try {
    const coalfield = await Coalfield.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coalfield) return res.status(404).json({ success: false, message: 'Coalfield not found' });
    res.json({ success: true, coalfield });
  } catch (err) {
    next(err);
  }
};

// ---- Production Records ----

// @route POST /api/coalfields/:id/production   (admin, logistics_manager)
exports.recordProduction = async (req, res, next) => {
  try {
    const { year, month, targetMT, actualMT, dispatchedMT, notes } = req.body;
    const record = await ProductionRecord.create({
      coalfield: req.params.id, year, month, targetMT, actualMT, dispatchedMT, notes, recordedBy: req.user._id,
    });
    res.status(201).json({ success: true, record });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/coalfields/:id/production
exports.listProductionForCoalfield = async (req, res, next) => {
  try {
    const records = await ProductionRecord.find({ coalfield: req.params.id }).sort('-year -month');
    res.json({ success: true, records });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/production/national-summary — aggregated target vs actual, current year, by month
exports.nationalProductionSummary = async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const summary = await ProductionRecord.aggregate([
      { $match: { year } },
      { $group: { _id: '$month', totalTargetMT: { $sum: '$targetMT' }, totalActualMT: { $sum: '$actualMT' } } },
      { $sort: { _id: 1 } },
    ]);
    const byCompany = await ProductionRecord.aggregate([
      { $match: { year } },
      { $lookup: { from: 'coalfields', localField: 'coalfield', foreignField: '_id', as: 'cf' } },
      { $unwind: '$cf' },
      { $group: { _id: '$cf.company', totalTargetMT: { $sum: '$targetMT' }, totalActualMT: { $sum: '$actualMT' } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, year, monthly: summary, byCompany });
  } catch (err) {
    next(err);
  }
};
