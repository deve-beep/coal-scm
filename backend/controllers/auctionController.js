const Auction = require('../models/Auction');

// @route POST /api/auctions        (admin)
exports.createAuction = async (req, res, next) => {
  try {
    const { type, coalfield, quantityMT, reservePricePerTonne, startDate, endDate } = req.body;
    const auction = await Auction.create({
      type, coalfield, quantityMT, reservePricePerTonne, startDate, endDate, createdBy: req.user._id,
    });
    res.status(201).json({ success: true, auction });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auctions
exports.listAuctions = async (req, res, next) => {
  try {
    const { status, type, coalfield } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (coalfield) query.coalfield = coalfield;

    const auctions = await Auction.find(query)
      .sort('-startDate')
      .populate('coalfield', 'name company state grade')
      .populate('createdBy', 'name');
    res.json({ success: true, count: auctions.length, auctions });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auctions/:id
exports.getAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('coalfield', 'name company state grade')
      .populate('bids.bidder', 'name companyName industryType');
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found' });
    res.json({ success: true, auction });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/auctions/:id/status  (admin) — move auction through its lifecycle (e.g. UPCOMING -> LIVE -> CLOSED)
exports.updateAuctionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found' });
    auction.status = status;
    await auction.save();
    res.json({ success: true, auction });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
};

// @route POST /api/auctions/:id/bid   (consumer) — place a bid on a LIVE auction
exports.placeBid = async (req, res, next) => {
  try {
    const { quantityMT, pricePerTonne } = req.body;
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found' });

    if (auction.status !== 'LIVE') {
      return res.status(400).json({ success: false, message: `Bidding is not open — auction status is ${auction.status}` });
    }
    if (Number(pricePerTonne) < auction.reservePricePerTonne) {
      return res.status(400).json({ success: false, message: `Bid price must be at or above the reserve price of ₹${auction.reservePricePerTonne}/tonne` });
    }
    if (Number(quantityMT) > auction.quantityMT) {
      return res.status(400).json({ success: false, message: `Bid quantity cannot exceed the lot size of ${auction.quantityMT} MT` });
    }

    auction.bids.push({ bidder: req.user._id, quantityMT, pricePerTonne });
    await auction.save();

    res.status(201).json({ success: true, auction });
  } catch (err) {
    err.statusCode = 400;
    next(err);
  }
};

// @route POST /api/auctions/:id/allot   (admin) — close bidding and allot to the highest bidder
// Winner-selection rule: highest price per tonne wins; ties broken by earliest bid placed.
exports.allotAuction = async (req, res, next) => {
  try {
    const auction = await Auction.findById(req.params.id).populate('bids.bidder', 'name companyName');
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found' });

    if (auction.bids.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot allot an auction with no bids' });
    }

    const sorted = [...auction.bids].sort((a, b) => {
      if (b.pricePerTonne !== a.pricePerTonne) return b.pricePerTonne - a.pricePerTonne;
      return new Date(a.placedAt) - new Date(b.placedAt);
    });
    const winner = sorted[0];

    auction.winningBid = winner._id;
    auction.status = 'ALLOTTED';
    await auction.save();

    res.json({ success: true, auction, winner });
  } catch (err) {
    next(err);
  }
};
