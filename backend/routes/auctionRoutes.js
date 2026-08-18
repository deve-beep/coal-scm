const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createAuction, listAuctions, getAuction, updateAuctionStatus, placeBid, allotAuction,
} = require('../controllers/auctionController');

router.use(protect);

router.route('/').get(listAuctions).post(authorize('admin'), createAuction);
router.get('/:id', getAuction);
router.patch('/:id/status', authorize('admin'), updateAuctionStatus);
router.post('/:id/bid', authorize('consumer'), placeBid);
router.post('/:id/allot', authorize('admin'), allotAuction);

module.exports = router;
