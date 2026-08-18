const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// @route POST /api/auth/register — public self-registration, always as 'consumer'.
// Staff (admin/logistics_manager) accounts must be created by an admin via /api/users.
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, companyName, industryType, gstin } = req.body;
    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ success: false, message: 'name, email, password and companyName are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ success: false, message: 'An account with this email already exists' });

    const user = await User.create({ name, email, password, phone, companyName, industryType, gstin, role: 'consumer' });
    const token = signToken(user);
    res.status(201).json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: 'This account has been deactivated' });

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user);
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
};
