const express = require('express');
const path = require('path');
const agentRoutes = require('./routes/agent');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../Public')));

// Routes
app.use('/api', agentRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 