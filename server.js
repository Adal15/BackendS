require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));

// Basic Route
app.get('/', (req, res) => {
    res.send('JTS SEO Analyzer API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
