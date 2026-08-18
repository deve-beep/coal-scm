const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createDispatch, listDispatches, getDispatch, updateDispatchStatus } = require('../controllers/dispatchController');

router.use(protect);

router.route('/').get(listDispatches).post(authorize('admin', 'logistics_manager'), createDispatch);
router.get('/:id', getDispatch);
router.patch('/:id/status', authorize('admin', 'logistics_manager'), updateDispatchStatus);

module.exports = router;
