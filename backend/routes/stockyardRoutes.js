const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createStockyard, listStockyards, getStockyard, updateStock, stockSummary,
} = require('../controllers/stockyardController');

router.use(protect);

router.get('/summary/national', stockSummary);
router.route('/').get(listStockyards).post(authorize('admin'), createStockyard);
router.get('/:id', getStockyard);
router.patch('/:id/stock', authorize('admin', 'logistics_manager'), updateStock);

module.exports = router;
