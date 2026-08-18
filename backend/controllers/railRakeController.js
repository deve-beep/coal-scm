const RailRake = require('../models/RailRake');

// @route POST /api/rakes        (admin, logistics_manager) — register a new rake movement
exports.createRake = async (req, res, next) => {
  try {
    const { rakeNumber, sourceStockyard, destination, wagonCount, dispatch } = req.body;
    const rake = await RailRake.create({
      rakeNumber, sourceStockyard, destination, wagonCount, dispatch, loggedBy: req.user._id,
      events: [{ status: 'PLACED', location: destination ? 'Loading point' : 'Loading point', note: 'Rake placed for loading', updatedBy: req.user._id }],
    });
    res.status(201).json({ success: true, rake });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/rakes
exports.listRakes = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const rakes = await RailRake.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('sourceStockyard', 'name location');
    const total = await RailRake.countDocuments(query);

    res.json({ success: true, count: rakes.length, total, page: Number(page), rakes });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/rakes/:id
exports.getRake = async (req, res, next) => {
  try {
    const rake = await RailRake.findById(req.params.id)
      .populate('sourceStockyard', 'name location')
      .populate('events.updatedBy', 'name role');
    if (!rake) return res.status(404).json({ success: false, message: 'Rail rake not found' });
    res.json({ success: true, rake });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/rakes/:id/status   (admin, logistics_manager) — advance the rake through its movement lifecycle
exports.updateRakeStatus = async (req, res, next) => {
  try {
    const { status, location, note, loadedQuantityMT } = req.body;
    const rake = await RailRake.findById(req.params.id);
    if (!rake) return res.status(404).json({ success: false, message: 'Rail rake not found' });

    rake.status = status;
    if (loadedQuantityMT !== undefined) rake.loadedQuantityMT = loadedQuantityMT;
    if (status === 'IN_TRANSIT' && !rake.departedAt) rake.departedAt = new Date();
    if (status === 'ARRIVED' && !rake.arrivedAt) rake.arrivedAt = new Date();
    rake.events.push({ status, location: location || 'En route', note, updatedBy: req.user._id });

    await rake.save();
    res.json({ success: true, rake });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
};
