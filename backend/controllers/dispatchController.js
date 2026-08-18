const Dispatch = require('../models/Dispatch');
const Stockyard = require('../models/Stockyard');

// @route POST /api/dispatches        (admin, logistics_manager)
exports.createDispatch = async (req, res, next) => {
  try {
    const { mode, sourceStockyard, consumer, fsa, quantityMT, dispatchDate, expectedDelivery, notes } = req.body;

    const stockyard = await Stockyard.findById(sourceStockyard);
    if (!stockyard) return res.status(404).json({ success: false, message: 'Source stockyard not found' });
    if (quantityMT > stockyard.currentStockMT) {
      return res.status(400).json({ success: false, message: `Insufficient stock — only ${stockyard.currentStockMT} MT available at ${stockyard.name}` });
    }

    const dispatch = await Dispatch.create({
      mode, sourceStockyard, consumer, fsa, quantityMT, dispatchDate, expectedDelivery, notes, loggedBy: req.user._id,
    });

    // Deduct dispatched quantity from stockyard
    stockyard.currentStockMT -= quantityMT;
    stockyard.lastUpdated = new Date();
    await stockyard.save();

    res.status(201).json({ success: true, dispatch });
  } catch (err) {
    err.statusCode = err.statusCode || 400;
    next(err);
  }
};

// @route GET /api/dispatches         — role-aware listing
exports.listDispatches = async (req, res, next) => {
  try {
    const { status, mode, page = 1, limit = 20 } = req.query;
    const query = {};
    if (req.user.role === 'consumer') query.consumer = req.user._id;
    if (status) query.status = status;
    if (mode) query.mode = mode;

    const dispatches = await Dispatch.find(query)
      .sort('-dispatchDate')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('sourceStockyard', 'name location')
      .populate('consumer', 'name companyName')
      .populate('railRake', 'rakeNumber status');
    const total = await Dispatch.countDocuments(query);

    res.json({ success: true, count: dispatches.length, total, page: Number(page), dispatches });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/dispatches/:id
exports.getDispatch = async (req, res, next) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id)
      .populate('sourceStockyard', 'name location')
      .populate('consumer', 'name companyName')
      .populate('railRake');
    if (!dispatch) return res.status(404).json({ success: false, message: 'Dispatch not found' });

    if (req.user.role === 'consumer' && String(dispatch.consumer._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You cannot view this dispatch' });
    }
    res.json({ success: true, dispatch });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/dispatches/:id/status   (admin, logistics_manager)
exports.updateDispatchStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const dispatch = await Dispatch.findById(req.params.id);
    if (!dispatch) return res.status(404).json({ success: false, message: 'Dispatch not found' });

    dispatch.status = status;
    if (status === 'DELIVERED') dispatch.actualDelivery = new Date();
    await dispatch.save();

    res.json({ success: true, dispatch });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
};
