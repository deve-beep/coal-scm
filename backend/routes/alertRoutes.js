const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { raiseAlert, listAlerts, getAlert, updateAlertStatus } = require('../controllers/alertController');

router.use(protect);

router.route('/').get(listAlerts).post(raiseAlert);
router.get('/:id', getAlert);
router.patch('/:id/status', authorize('admin', 'logistics_manager'), updateAlertStatus);

module.exports = router;
