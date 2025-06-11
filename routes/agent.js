const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { checkAuth } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const { agencyName, year, month } = req.body;
        const dir = path.join(__dirname, '..', 'data', agencyName, year, month);
        try {
            await fs.mkdir(dir, { recursive: true });
            cb(null, dir);
        } catch (error) {
            cb(error);
        }
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Get all agents
router.get('/get-agents', checkAuth, async (req, res) => {
    try {
        if (req.user.type !== 'webowner') {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح به'
            });
        }

        const configPath = path.join(__dirname, '..', 'env', 'config.json');
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);

        const agencies = {};
        for (const [agencyId, agencyData] of Object.entries(config.LOGIN.AGENCIES)) {
            agencies[agencyId] = {
                owner: {
                    email: agencyData.owner.email
                }
            };
            if (agencyData.admin1) {
                agencies[agencyId].admin1 = {
                    email: agencyData.admin1.email
                };
            }
        }

        res.json({
            success: true,
            agencies: agencies
        });
    } catch (error) {
        console.error('Error getting agents:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في النظام'
        });
    }
});

// Delete agent
router.post('/delete-agent', checkAuth, async (req, res) => {
    try {
        if (req.user.type !== 'webowner') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { agencyName } = req.body;
        if (!agencyName) {
            return res.status(400).json({ success: false, message: 'Agency name is required' });
        }

        // Delete from config.json
        const configPath = path.join(__dirname, '..', 'env', 'config.json');
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);

        if (!config.LOGIN.AGENCIES[agencyName]) {
            return res.status(404).json({ success: false, message: 'Agency not found' });
        }

        delete config.LOGIN.AGENCIES[agencyName];
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));

        // Delete agency data folder
        const dataPath = path.join(__dirname, '..', 'data', agencyName);
        try {
            await fs.rm(dataPath, { recursive: true, force: true });
        } catch (error) {
            console.error('Error deleting data folder:', error);
            // Continue even if folder deletion fails
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting agent:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Add new month with files
router.post('/add-month', checkAuth, upload.array('files', 2), async (req, res) => {
    try {
        if (req.user.type !== 'webowner') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { agencyName, year, month } = req.body;
        if (!agencyName || !year || !month) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (!req.files || req.files.length !== 2) {
            return res.status(400).json({ success: false, message: 'Two files are required' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding month:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Add new year
router.post('/add-year', checkAuth, async (req, res) => {
    try {
        if (req.user.type !== 'webowner') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { agencyName, year } = req.body;
        if (!agencyName || !year) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const yearPath = path.join(__dirname, '..', 'data', agencyName, year.toString());
        await fs.mkdir(yearPath, { recursive: true });

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding year:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get available years for an agency
router.get('/get-years', checkAuth, async (req, res) => {
    try {
        if (req.user.type !== 'webowner') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { agencyName } = req.query;
        if (!agencyName) {
            return res.status(400).json({ success: false, message: 'Agency name is required' });
        }

        const agencyPath = path.join(__dirname, '..', 'data', agencyName);
        try {
            const years = await fs.readdir(agencyPath);
            res.json({
                success: true,
                years: years.filter(year => /^\d{4}$/.test(year)).sort()
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.json({ success: true, years: [] });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error getting years:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Change agent password
router.post('/change-password', checkAuth, async (req, res) => {
    try {
        if (req.user.type !== 'webowner') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const { agencyName, newEmail, newPassword } = req.body;
        if (!agencyName || !newEmail || !newPassword) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const configPath = path.join(__dirname, '..', 'env', 'config.json');
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);

        if (!config.LOGIN.AGENCIES[agencyName]) {
            return res.status(404).json({ success: false, message: 'Agency not found' });
        }

        config.LOGIN.AGENCIES[agencyName].owner.email = newEmail;
        config.LOGIN.AGENCIES[agencyName].owner.password = newPassword;

        await fs.writeFile(configPath, JSON.stringify(config, null, 2));

        res.json({ success: true });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router; 