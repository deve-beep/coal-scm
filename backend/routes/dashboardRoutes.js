const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { dashboardSummary, auctionStatusBreakdown, dispatchModeBreakdown } = require('../controllers/dashboardController');

router.use(protect);
router.use(authorize('admin', 'logistics_manager'));

router.get('/summary', dashboardSummary);
router.get('/auction-status-breakdown', auctionStatusBreakdown);
router.get('/dispatch-mode-breakdown', dispatchModeBreakdown);

module.exports = router;
