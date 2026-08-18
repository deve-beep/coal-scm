require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const coalfieldRoutes = require('./routes/coalfieldRoutes');
const stockyardRoutes = require('./routes/stockyardRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const railRakeRoutes = require('./routes/railRakeRoutes');
const fsaRoutes = require('./routes/fsaRoutes');
const importRoutes = require('./routes/importRoutes');
const alertRoutes = require('./routes/alertRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Coal SCM Dashboard API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/coalfields', coalfieldRoutes);
app.use('/api/stockyards', stockyardRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/rakes', railRakeRoutes);
app.use('/api/fsa', fsaRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5002;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`⛏️  Coal SCM Dashboard API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

module.exports = app;
