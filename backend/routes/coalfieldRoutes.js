const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createCoalfield, listCoalfields, getCoalfield, updateCoalfield,
  recordProduction, listProductionForCoalfield, nationalProductionSummary,
} = require('../controllers/coalfieldController');

router.use(protect);

router.get('/production/national-summary', nationalProductionSummary);

router.route('/').get(listCoalfields).post(authorize('admin'), createCoalfield);
router.route('/:id').get(getCoalfield).patch(authorize('admin'), updateCoalfield);
router.route('/:id/production').get(listProductionForCoalfield).post(authorize('admin', 'logistics_manager'), recordProduction);

module.exports = router;
