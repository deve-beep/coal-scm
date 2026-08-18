const FuelSupplyAgreement = require('../models/FuelSupplyAgreement');

// @route POST /api/fsa        (admin)
exports.createFsa = async (req, res, next) => {
  try {
    const fsa = await FuelSupplyAgreement.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, fsa });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/fsa         — role-aware listing
exports.listFsa = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (req.user.role === 'consumer') query.consumer = req.user._id;
    if (status) query.status = status;

    const agreements = await FuelSupplyAgreement.find(query)
      .sort('-createdAt')
      .populate('consumer', 'name companyName industryType')
      .populate('coalfield', 'name company state');
    res.json({ success: true, count: agreements.length, agreements });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/fsa/:id
exports.getFsa = async (req, res, next) => {
  try {
    const fsa = await FuelSupplyAgreement.findById(req.params.id)
      .populate('consumer', 'name companyName industryType')
      .populate('coalfield', 'name company state');
    if (!fsa) return res.status(404).json({ success: false, message: 'Agreement not found' });
    res.json({ success: true, fsa });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/fsa/:id   (admin) — update status or supplied-to-date quantity
exports.updateFsa = async (req, res, next) => {
  try {
    const fsa = await FuelSupplyAgreement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!fsa) return res.status(404).json({ success: false, message: 'Agreement not found' });
    res.json({ success: true, fsa });
  } catch (err) {
    next(err);
  }
};
