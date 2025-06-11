const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { checkAuth } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const { agencyName, year, month } = req.body;
        const dir = path.join(__dirname, '../../data', agencyName, year, month);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Set specific filenames based on the order
        const fieldname = file.fieldname;
        if (fieldname === 'file1') {
            cb(null, 'salaries.xlsx');
        } else if (fieldname === 'file2') {
            cb(null, 'salaries_target.xlsx');
        }
    }
});

const upload = multer({ storage: storage });

// Helper function to check if file exists
function fileExists(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
    } catch (e) {
        return false;
    }
}

// Get all agents
router.get('/get-agents', checkAuth, (req, res) => {
    try {
        if (req.user.type !== 'webowner') {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح به'
            });
        }

        const configPath = path.join(__dirname, '../../env/config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        res.json({
            success: true,
            agencies: config.LOGIN.AGENCIES
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
router.post('/delete-agent', checkAuth, (req, res) => {
    try {
        if (req.user.type !== 'webowner') {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح به'
            });
        }

        const { agencyName } = req.body;
        if (!agencyName) {
            return res.status(400).json({
                success: false,
                message: 'اسم الوكالة مطلوب'
            });
        }

        const configPath = path.join(__dirname, '../../env/config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        if (!config.LOGIN.AGENCIES[agencyName]) {
            return res.status(404).json({
                success: false,
                message: 'الوكالة غير موجودة'
            });
        }

        // Delete agency from config
        delete config.LOGIN.AGENCIES[agencyName];
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        // Delete agency data directory
        const agencyPath = path.join(__dirname, '../../data', agencyName);
        if (fs.existsSync(agencyPath)) {
            fs.rmSync(agencyPath, { recursive: true, force: true });
        }

        res.json({
            success: true,
            message: 'تم حذف الوكالة بنجاح'
        });
    } catch (error) {
        console.error('Error deleting agent:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في النظام'
        });
    }
});

// Add new month
router.post('/add-month', checkAuth, async (req, res) => {
    try {
        if (req.user.type !== 'webowner') {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح به'
            });
        }

        const { agencyName, year, month } = req.body;
        if (!agencyName || !year || !month || !req.files || !req.files.file1 || !req.files.file2) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة'
            });
        }

        // Create directory path
        const monthPath = path.join(__dirname, '../../data', agencyName, year, month);
        if (!fs.existsSync(monthPath)) {
            fs.mkdirSync(monthPath, { recursive: true });
        }

        // Move uploaded files
        await req.files.file1.mv(path.join(monthPath, 'salaries.xlsx'));
        await req.files.file2.mv(path.join(monthPath, 'salaries_target.xlsx'));

        // Create json-data directory if it doesn't exist
        const jsonDataPath = path.join(__dirname, '../../data', agencyName, 'json-data');
        if (!fs.existsSync(jsonDataPath)) {
            fs.mkdirSync(jsonDataPath, { recursive: true });
        }

        res.json({
            success: true,
            message: 'تم إضافة الشهر بنجاح'
        });
    } catch (error) {
        console.error('Error adding month:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في النظام',
            error: error.message
        });
    }
});

// Add new year
router.post('/add-year', checkAuth, (req, res) => {
    try {
        if (req.user.type !== 'webowner') {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح به'
            });
        }

        const { agencyName, year } = req.body;
        if (!agencyName || !year) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة'
            });
        }

        // Create year directory
        const yearPath = path.join(__dirname, '../../data', agencyName, year);
        if (!fs.existsSync(yearPath)) {
            fs.mkdirSync(yearPath, { recursive: true });
        }

        // Create json-data directory if it doesn't exist
        const jsonDataPath = path.join(__dirname, '../../data', agencyName, 'json-data');
        if (!fs.existsSync(jsonDataPath)) {
            fs.mkdirSync(jsonDataPath, { recursive: true });
        }

        // Create or update years.json
        const yearsPath = path.join(jsonDataPath, 'years.json');
        let years = [];
        if (fileExists(yearsPath)) {
            years = JSON.parse(fs.readFileSync(yearsPath, 'utf8'));
        }
        if (!years.includes(year)) {
            years.push(year);
            years.sort();
            fs.writeFileSync(yearsPath, JSON.stringify(years, null, 2));
        }

        res.json({
            success: true,
            message: 'تم إضافة السنة بنجاح'
        });
    } catch (error) {
        console.error('Error adding year:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في النظام'
        });
    }
});

// Change password
router.post('/change-password', checkAuth, (req, res) => {
    try {
        if (req.user.type !== 'webowner') {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح به'
            });
        }

        const { agencyName, newEmail, newPassword } = req.body;
        if (!agencyName || !newEmail || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة'
            });
        }

        const configPath = path.join(__dirname, '../../env/config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        if (!config.LOGIN.AGENCIES[agencyName]) {
            return res.status(404).json({
                success: false,
                message: 'الوكالة غير موجودة'
            });
        }

        // Update email and password
        config.LOGIN.AGENCIES[agencyName].owner.email = newEmail;
        config.LOGIN.AGENCIES[agencyName].owner.password = newPassword;

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        res.json({
            success: true,
            message: 'تم تحديث البيانات بنجاح'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في النظام'
        });
    }
});

module.exports = router; 