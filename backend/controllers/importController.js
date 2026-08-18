const CokingCoalImport = require('../models/CokingCoalImport');

// @route POST /api/imports        (admin, logistics_manager)
exports.createImport = async (req, res, next) => {
  try {
    const record = await CokingCoalImport.create({ ...req.body, loggedBy: req.user._id });
    res.status(201).json({ success: true, record });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/imports         — role-aware listing
exports.listImports = async (req, res, next) => {
  try {
    const { status, sourceCountry } = req.query;
    const query = {};
    if (req.user.role === 'consumer') query.consumer = req.user._id;
    if (status) query.status = status;
    if (sourceCountry) query.sourceCountry = sourceCountry;

    const records = await CokingCoalImport.find(query).sort('-contractDate').populate('consumer', 'name companyName industryType');
    res.json({ success: true, count: records.length, records });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/imports/summary — total import volume & spend by source country
exports.importSummary = async (req, res, next) => {
  try {
    const summary = await CokingCoalImport.aggregate([
      { $group: { _id: '$sourceCountry', totalQuantityMT: { $sum: '$quantityMT' }, totalValueUSD: { $sum: { $multiply: ['$quantityMT', '$pricePerTonneUSD', 1000] } }, contractCount: { $sum: 1 } } },
      { $sort: { totalQuantityMT: -1 } },
    ]);
    res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/imports/:id   (admin, logistics_manager)
exports.updateImport = async (req, res, next) => {
  try {
    const record = await CokingCoalImport.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ success: false, message: 'Import record not found' });
    res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
};
