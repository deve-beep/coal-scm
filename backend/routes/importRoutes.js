const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createImport, listImports, importSummary, updateImport } = require('../controllers/importController');

router.use(protect);

router.get('/summary', authorize('admin', 'logistics_manager'), importSummary);
router.route('/').get(listImports).post(authorize('admin', 'logistics_manager'), createImport);
router.patch('/:id', authorize('admin', 'logistics_manager'), updateImport);

module.exports = router;
