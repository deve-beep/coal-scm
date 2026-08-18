const User = require('../models/User');

// @route POST /api/users        (admin only) — create staff (admin/logistics_manager) accounts
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, employeeId, region, companyName, industryType, gstin } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'name, email, password and role are required' });
    }
    const user = await User.create({ name, email, password, role, phone, employeeId, region, companyName, industryType, gstin });
    res.status(201).json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/users         (admin only)
exports.listUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }, { companyName: new RegExp(search, 'i') }];

    const users = await User.find(query).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, count: users.length, total, page: Number(page), users });
  } catch (err) {
    next(err);
  }
};

// @route PATCH /api/users/:id   (admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/users/:id  (admin only) — deactivate rather than hard-delete
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deactivated', user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/users/consumers  (admin, logistics_manager) — for dispatch/FSA assignment
exports.listConsumers = async (req, res, next) => {
  try {
    const consumers = await User.find({ role: 'consumer', isActive: true }).select('name companyName industryType email phone');
    res.json({ success: true, consumers });
  } catch (err) {
    next(err);
  }
};
