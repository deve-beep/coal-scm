const Stockyard = require('../models/Stockyard');
const ShortageAlert = require('../models/ShortageAlert');

// @route POST /api/stockyards        (admin)
exports.createStockyard = async (req, res, next) => {
  try {
    const stockyard = await Stockyard.create(req.body);
    res.status(201).json({ success: true, stockyard });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/stockyards
exports.listStockyards = async (req, res, next) => {
  try {
    const { coalfield, status } = req.query;
    const query = {};
    if (coalfield) query.coalfield = coalfield;
    let stockyards = await Stockyard.find(query).sort('name').populate('coalfield', 'name company state');
    if (status) stockyards = stockyards.filter((s) => s.stockStatus === status);
    res.json({ success: true, count: stockyards.length, stockyards });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/stockyards/:id
exports.getStockyard = async (req, res, next) => {
  try {
    const stockyard = await Stockyard.findById(req.params.id).populate('coalfield', 'name company state');
    if (!stockyard) return res.status(404).json({ success: false, message: 'Stockyard not found' });
    res.json({ success: true, stockyard });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/stockyards/:id/stock   (admin, logistics_manager) — update current stock level
// Auto-raises a shortage alert if the new level is at/below the minimum threshold.
exports.updateStock = async (req, res, next) => {
  try {
    const { currentStockMT, note } = req.body;
    const stockyard = await Stockyard.findById(req.params.id);
    if (!stockyard) return res.status(404).json({ success: false, message: 'Stockyard not found' });

    stockyard.currentStockMT = currentStockMT;
    stockyard.lastUpdated = new Date();
    await stockyard.save();

    let alert = null;
    if (stockyard.currentStockMT <= stockyard.minThresholdMT) {
      const existingOpen = await ShortageAlert.findOne({ stockyard: stockyard._id, status: { $in: ['OPEN', 'ACKNOWLEDGED'] } });
      if (!existingOpen) {
        alert = await ShortageAlert.create({
          source: 'AUTO_STOCK_THRESHOLD',
          stockyard: stockyard._id,
          title: `Stock below threshold at ${stockyard.name}`,
          description: note || `Current stock (${stockyard.currentStockMT} MT) has fallen to or below the minimum threshold (${stockyard.minThresholdMT} MT).`,
          severity: stockyard.currentStockMT <= stockyard.minThresholdMT * 0.5 ? 'CRITICAL' : 'HIGH',
          updates: [{ status: 'OPEN', note: 'Auto-generated from stock threshold breach' }],
        });
      }
    }

    res.json({ success: true, stockyard, alertRaised: alert });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
};

// @route GET /api/stockyards/summary/national — total stock, capacity, and breakdown by status
exports.stockSummary = async (req, res, next) => {
  try {
    const stockyards = await Stockyard.find();
    const totalStockMT = stockyards.reduce((s, y) => s + y.currentStockMT, 0);
    const totalCapacityMT = stockyards.reduce((s, y) => s + y.capacityMT, 0);
    const byStatus = { HEALTHY: 0, LOW: 0, CRITICAL: 0 };
    stockyards.forEach((s) => { byStatus[s.stockStatus] = (byStatus[s.stockStatus] || 0) + 1; });

    res.json({ success: true, summary: { totalStockMT, totalCapacityMT, count: stockyards.length, byStatus } });
  } catch (err) {
    next(err);
  }
};
