const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createRake, listRakes, getRake, updateRakeStatus } = require('../controllers/railRakeController');

router.use(protect);
router.use(authorize('admin', 'logistics_manager'));

router.route('/').get(listRakes).post(createRake);
router.get('/:id', getRake);
router.patch('/:id/status', updateRakeStatus);

module.exports = router;
