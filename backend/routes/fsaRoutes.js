const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createFsa, listFsa, getFsa, updateFsa } = require('../controllers/fsaController');

router.use(protect);

router.route('/').get(listFsa).post(authorize('admin'), createFsa);
router.route('/:id').get(getFsa).patch(authorize('admin'), updateFsa);

module.exports = router;
