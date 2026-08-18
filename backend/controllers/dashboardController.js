const Coalfield = require('../models/Coalfield');
const ProductionRecord = require('../models/ProductionRecord');
const Stockyard = require('../models/Stockyard');
const Auction = require('../models/Auction');
const Dispatch = require('../models/Dispatch');
const RailRake = require('../models/RailRake');
const ShortageAlert = require('../models/ShortageAlert');
const User = require('../models/User');

// @route GET /api/dashboard/summary   (admin, logistics_manager)
exports.dashboardSummary = async (req, res, next) => {
  try {
    const year = new Date().getFullYear();

    const [
      productionAgg, stockyards, liveAuctions, activeDispatches, rakesInTransit, openAlerts, activeConsumers,
    ] = await Promise.all([
      ProductionRecord.aggregate([
        { $match: { year } },
        { $group: { _id: null, totalTargetMT: { $sum: '$targetMT' }, totalActualMT: { $sum: '$actualMT' } } },
      ]),
      Stockyard.find(),
      Auction.countDocuments({ status: 'LIVE' }),
      Dispatch.countDocuments({ status: { $in: ['SCHEDULED', 'IN_TRANSIT'] } }),
      RailRake.countDocuments({ status: 'IN_TRANSIT' }),
      ShortageAlert.countDocuments({ status: { $in: ['OPEN', 'ACKNOWLEDGED'] } }),
      User.countDocuments({ role: 'consumer', isActive: true }),
    ]);

    const totalStockMT = stockyards.reduce((s, y) => s + y.currentStockMT, 0);
    const criticalStockyards = stockyards.filter((s) => s.stockStatus === 'CRITICAL').length;

    res.json({
      success: true,
      summary: {
        totalTargetMT: productionAgg[0]?.totalTargetMT || 0,
        totalActualMT: productionAgg[0]?.totalActualMT || 0,
        totalStockMT,
        criticalStockyards,
        liveAuctions,
        activeDispatches,
        rakesInTransit,
        openAlerts,
        activeConsumers,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/dashboard/auction-status-breakdown
exports.auctionStatusBreakdown = async (req, res, next) => {
  try {
    const breakdown = await Auction.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    res.json({ success: true, breakdown });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/dashboard/dispatch-mode-breakdown
exports.dispatchModeBreakdown = async (req, res, next) => {
  try {
    const breakdown = await Dispatch.aggregate([
      { $group: { _id: '$mode', count: { $sum: 1 }, totalQuantityMT: { $sum: '$quantityMT' } } },
    ]);
    res.json({ success: true, breakdown });
  } catch (err) {
    next(err);
  }
};
