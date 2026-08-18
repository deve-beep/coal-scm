const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createUser, listUsers, updateUser, deactivateUser, listConsumers } = require('../controllers/userController');

router.use(protect);

router.get('/consumers', authorize('admin', 'logistics_manager'), listConsumers);
router.route('/').get(authorize('admin'), listUsers).post(authorize('admin'), createUser);
router.route('/:id').patch(authorize('admin'), updateUser).delete(authorize('admin'), deactivateUser);

module.exports = router;
