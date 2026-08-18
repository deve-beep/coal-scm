const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

const genAuctionId = customAlphabet('0123456789', 8);

const AUCTION_TYPES = ['SPOT', 'LINKAGE', 'FORWARD_E_AUCTION', 'SPECIAL_FORWARD'];
const AUCTION_STATUSES = ['UPCOMING', 'LIVE', 'CLOSED', 'ALLOTTED', 'CANCELLED'];

const bidSchema = new mongoose.Schema(
  {
    bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quantityMT: { type: Number, required: true, min: 1 },
    pricePerTonne: { type: Number, required: true, min: 0 },
    placedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const auctionSchema = new mongoose.Schema(
  {
    auctionCode: { type: String, unique: true, default: () => `EAUC-${genAuctionId()}` },
    type: { type: String, enum: AUCTION_TYPES, required: true },
    coalfield: { type: mongoose.Schema.Types.ObjectId, ref: 'Coalfield', required: true },
    quantityMT: { type: Number, required: true, min: 1 }, // lot size, thousand tonnes
    reservePricePerTonne: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: AUCTION_STATUSES, default: 'UPCOMING' },
    bids: [bidSchema],
    winningBid: { type: mongoose.Schema.Types.ObjectId }, // references a bid subdocument _id
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

auctionSchema.index({ status: 1, type: 1 });

module.exports = mongoose.model('Auction', auctionSchema);
module.exports.AUCTION_TYPES = AUCTION_TYPES;
module.exports.AUCTION_STATUSES = AUCTION_STATUSES;
