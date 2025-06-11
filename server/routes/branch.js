const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const MAX_BRANCHES = 10;

// Helper function to create branch JSON file
async function createBranchJsonFile(agencyId, branchName) {
    try {
        // Create the path to the agency's json-data directory
        const jsonDataPath = path.join(__dirname, '../../data', agencyId, 'json-data');
        
        // Create json-data directory if it doesn't exist
        try {
            await fs.access(jsonDataPath);
        } catch {
            await fs.mkdir(jsonDataPath, { recursive: true });
            console.log('Created json-data directory for agency:', agencyId);
        }

        // Create the branch JSON file path
        const branchFilePath = path.join(jsonDataPath, `${branchName}.json`);
        
        // Check if file already exists
        try {
            await fs.access(branchFilePath);
            console.log('Branch file already exists:', branchFilePath);
            return true;
        } catch {
            // File doesn't exist, create it with initial structure
            const initialData = {
                branchName: branchName,
                createdAt: new Date().toISOString(),
                data: []
            };
            
            await fs.writeFile(branchFilePath, JSON.stringify(initialData, null, 2));
            console.log('Created branch JSON file:', branchFilePath);
            return true;
        }
    } catch (error) {
        console.error('Error creating branch JSON file:', error);
        throw new Error('Failed to create branch data file');
    }
}

// Helper function to delete branch JSON file
async function deleteBranchJsonFile(agencyId, branchName) {
    try {
        const branchFilePath = path.join(__dirname, '../../data', agencyId, 'json-data', `${branchName}.json`);
        
        // Check if file exists before trying to delete
        try {
            await fs.access(branchFilePath);
            await fs.unlink(branchFilePath);
            console.log('Deleted branch JSON file:', branchFilePath);
            return true;
        } catch {
            console.log('Branch file does not exist:', branchFilePath);
            return true; // Return true even if file doesn't exist
        }
    } catch (error) {
        console.error('Error deleting branch JSON file:', error);
        throw new Error('Failed to delete branch data file');
    }
}

// Helper function to read and validate config
async function readConfig() {
    const configPath = path.join(__dirname, '../../env/config.json');
    try {
        const configContent = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        // Validate config structure
        if (!config.LOGIN || !config.LOGIN.AGENCIES) {
            throw new Error('Invalid config structure');
        }
        
        return config;
    } catch (error) {
        console.error('Error reading config:', error);
        throw new Error('Failed to read config file');
    }
}

// Helper function to save config
async function saveConfig(config) {
    const configPath = path.join(__dirname, '../../env/config.json');
    try {
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error saving config:', error);
        throw new Error('Failed to save config file');
    }
}

// Get branches for an agency
router.get('/branches/:agencyId', async (req, res) => {
    try {
        const { agencyId } = req.params;
        console.log('Getting branches for agency:', agencyId);

        const config = await readConfig();
        
        if (!config.LOGIN.AGENCIES[agencyId]) {
            console.log('Agency not found:', agencyId);
            return res.status(404).json({
                success: false,
                message: 'الوكالة غير موجودة'
            });
        }

        const agency = config.LOGIN.AGENCIES[agencyId];
        const branches = agency.branches || [];

        console.log('Found branches:', branches);
        res.json({
            success: true,
            branches: branches,
            maxBranches: MAX_BRANCHES,
            remainingBranches: MAX_BRANCHES - branches.length
        });
    } catch (error) {
        console.error('Error getting branches:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب بيانات الفروع',
            error: error.message
        });
    }
});

// Add new branch
router.post('/add-branch', async (req, res) => {
    try {
        console.log('Received add-branch request:', req.body);
        const { agencyId, branchName } = req.body;

        // Validate input
        if (!agencyId || !branchName) {
            console.log('Missing required fields:', { agencyId, branchName });
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال جميع البيانات المطلوبة',
                details: {
                    agencyId: !agencyId ? 'مطلوب' : 'موجود',
                    branchName: !branchName ? 'مطلوب' : 'موجود'
                }
            });
        }

        // Validate branch name format
        if (branchName.length < 3 || branchName.length > 50) {
            console.log('Invalid branch name length:', branchName.length);
            return res.status(400).json({
                success: false,
                message: 'اسم الفرع يجب أن يكون بين 3 و 50 حرفاً',
                details: {
                    length: branchName.length,
                    min: 3,
                    max: 50
                }
            });
        }

        // Validate branch name for file system safety
        const safeBranchName = branchName.replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '');
        if (safeBranchName !== branchName) {
            return res.status(400).json({
                success: false,
                message: 'اسم الفرع يحتوي على رموز غير مسموح بها',
                details: {
                    allowedChars: 'الحروف العربية والإنجليزية والأرقام والمسافات والشرطة'
                }
            });
        }

        const config = await readConfig();
        
        // Check if agency exists
        if (!config.LOGIN.AGENCIES[agencyId]) {
            console.log('Agency not found:', agencyId);
            return res.status(404).json({
                success: false,
                message: 'الوكالة غير موجودة',
                details: {
                    agencyId,
                    availableAgencies: Object.keys(config.LOGIN.AGENCIES)
                }
            });
        }

        const agency = config.LOGIN.AGENCIES[agencyId];
        console.log('Current agency data:', agency);
        
        // Initialize branches array if it doesn't exist
        if (!agency.branches) {
            console.log('Initializing branches array');
            agency.branches = [];
        }

        // Check maximum branches limit
        if (agency.branches.length >= MAX_BRANCHES) {
            console.log('Branch limit reached:', agency.branches.length);
            return res.status(400).json({
                success: false,
                message: `تم الوصول للحد الأقصى من الفروع (${MAX_BRANCHES})`,
                details: {
                    currentBranches: agency.branches.length,
                    maxBranches: MAX_BRANCHES
                }
            });
        }

        // Check if branch name already exists
        if (agency.branches.includes(branchName)) {
            console.log('Branch name already exists:', branchName);
            return res.status(400).json({
                success: false,
                message: 'اسم الفرع موجود مسبقاً',
                details: {
                    branchName,
                    existingBranches: agency.branches
                }
            });
        }

        // Create branch JSON file
        try {
            await createBranchJsonFile(agencyId, branchName);
        } catch (error) {
            console.error('Failed to create branch file:', error);
            return res.status(500).json({
                success: false,
                message: 'فشل في إنشاء ملف بيانات الفرع',
                error: error.message
            });
        }

        // Add new branch to config
        console.log('Adding new branch:', branchName);
        agency.branches.push(branchName);
        
        // Save updated config
        await saveConfig(config);
        console.log('Config saved successfully');
        
        res.json({
            success: true,
            message: 'تم إضافة الفرع بنجاح',
            details: {
                branchName,
                totalBranches: agency.branches.length,
                remainingBranches: MAX_BRANCHES - agency.branches.length
            }
        });
    } catch (error) {
        console.error('Error adding branch:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إضافة الفرع',
            error: error.message
        });
    }
});

// Remove branch
router.post('/remove-branch', async (req, res) => {
    try {
        console.log('Received remove-branch request:', req.body);
        const { agencyId, branchName } = req.body;

        // Validate input
        if (!agencyId || !branchName) {
            console.log('Missing required fields:', { agencyId, branchName });
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال جميع البيانات المطلوبة'
            });
        }

        const config = await readConfig();
        
        // Check if agency exists
        if (!config.LOGIN.AGENCIES[agencyId]) {
            console.log('Agency not found:', agencyId);
            return res.status(404).json({
                success: false,
                message: 'الوكالة غير موجودة'
            });
        }

        const agency = config.LOGIN.AGENCIES[agencyId];
        
        // Check if branches array exists
        if (!agency.branches || agency.branches.length === 0) {
            console.log('No branches found for agency:', agencyId);
            return res.status(404).json({
                success: false,
                message: 'لا توجد فروع مسجلة'
            });
        }

        // Find and remove the branch
        const branchIndex = agency.branches.indexOf(branchName);
        if (branchIndex === -1) {
            console.log('Branch not found:', branchName);
            return res.status(404).json({
                success: false,
                message: 'الفرع غير موجود'
            });
        }

        // Delete branch JSON file
        try {
            await deleteBranchJsonFile(agencyId, branchName);
        } catch (error) {
            console.error('Failed to delete branch file:', error);
            return res.status(500).json({
                success: false,
                message: 'فشل في حذف ملف بيانات الفرع',
                error: error.message
            });
        }

        console.log('Removing branch:', branchName);
        agency.branches.splice(branchIndex, 1);

        // Save updated config
        await saveConfig(config);
        console.log('Config saved successfully');
        
        res.json({
            success: true,
            message: 'تم حذف الفرع بنجاح',
            details: {
                branchName,
                remainingBranches: MAX_BRANCHES - agency.branches.length
            }
        });
    } catch (error) {
        console.error('Error removing branch:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في حذف الفرع',
            error: error.message
        });
    }
});

// Get branch IDs
router.get('/branch-ids/:agencyId/:branchName', async (req, res) => {
    try {
        const { agencyId, branchName } = req.params;
        const branchFilePath = path.join(__dirname, '../../data', agencyId, 'json-data', `${branchName}.json`);

        try {
            const fileContent = await fs.readFile(branchFilePath, 'utf8');
            const branchData = JSON.parse(fileContent);
            res.json({
                success: true,
                ids: branchData.data || []
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.json({
                    success: true,
                    ids: []
                });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error getting branch IDs:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب معرفات الفرع',
            error: error.message
        });
    }
});

// Add branch ID
router.post('/add-branch-id', async (req, res) => {
    try {
        const { agencyId, branchName, id } = req.body;

        // Validate input
        if (!agencyId || !branchName || !id) {
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال جميع البيانات المطلوبة'
            });
        }

        // Validate ID format - any number between 5 and 12 digits
        if (!/^[0-9]{5,12}$/.test(id)) {
            return res.status(400).json({
                success: false,
                message: 'يجب أن يكون المعرف رقماً بين 5 و 12 خانة'
            });
        }

        const branchFilePath = path.join(__dirname, '../../data', agencyId, 'json-data', `${branchName}.json`);

        try {
            // Read existing data
            const fileContent = await fs.readFile(branchFilePath, 'utf8');
            const branchData = JSON.parse(fileContent);

            // Check if ID already exists
            if (branchData.data.includes(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'المعرف موجود مسبقاً'
                });
            }

            // Add new ID
            branchData.data.push(id);

            // Save updated data
            await fs.writeFile(branchFilePath, JSON.stringify(branchData, null, 2));

            res.json({
                success: true,
                message: 'تم إضافة المعرف بنجاح'
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Create new branch file if it doesn't exist
                const initialData = {
                    branchName: branchName,
                    createdAt: new Date().toISOString(),
                    data: [id]
                };
                await fs.writeFile(branchFilePath, JSON.stringify(initialData, null, 2));
                res.json({
                    success: true,
                    message: 'تم إضافة المعرف بنجاح'
                });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error adding branch ID:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إضافة المعرف',
            error: error.message
        });
    }
});

// Update branch ID
router.put('/update-branch-id', async (req, res) => {
    try {
        const { agencyId, branchName, oldId, newId } = req.body;

        // Validate input
        if (!agencyId || !branchName || !oldId || !newId) {
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال جميع البيانات المطلوبة'
            });
        }

        // Validate ID format - any number between 5 and 12 digits
        if (!/^[0-9]{5,12}$/.test(newId)) {
            return res.status(400).json({
                success: false,
                message: 'يجب أن يكون المعرف رقماً بين 5 و 12 خانة'
            });
        }

        const branchFilePath = path.join(__dirname, '../../data', agencyId, 'json-data', `${branchName}.json`);

        try {
            // Read existing data
            const fileContent = await fs.readFile(branchFilePath, 'utf8');
            const branchData = JSON.parse(fileContent);

            // Check if old ID exists
            const oldIdIndex = branchData.data.indexOf(oldId);
            if (oldIdIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'المعرف القديم غير موجود'
                });
            }

            // Check if new ID already exists
            if (branchData.data.includes(newId)) {
                return res.status(400).json({
                    success: false,
                    message: 'المعرف الجديد موجود مسبقاً'
                });
            }

            // Update ID
            branchData.data[oldIdIndex] = newId;

            // Save updated data
            await fs.writeFile(branchFilePath, JSON.stringify(branchData, null, 2));

            res.json({
                success: true,
                message: 'تم تحديث المعرف بنجاح'
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({
                    success: false,
                    message: 'الفرع غير موجود'
                });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error updating branch ID:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في تحديث المعرف',
            error: error.message
        });
    }
});

// Delete branch ID
router.delete('/delete-branch-id', async (req, res) => {
    try {
        const { agencyId, branchName, id } = req.body;

        // Validate input
        if (!agencyId || !branchName || !id) {
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال جميع البيانات المطلوبة'
            });
        }

        const branchFilePath = path.join(__dirname, '../../data', agencyId, 'json-data', `${branchName}.json`);

        try {
            // Read existing data
            const fileContent = await fs.readFile(branchFilePath, 'utf8');
            const branchData = JSON.parse(fileContent);

            // Check if ID exists
            const idIndex = branchData.data.indexOf(id);
            if (idIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'المعرف غير موجود'
                });
            }

            // Remove ID
            branchData.data.splice(idIndex, 1);

            // Save updated data
            await fs.writeFile(branchFilePath, JSON.stringify(branchData, null, 2));

            res.json({
                success: true,
                message: 'تم حذف المعرف بنجاح'
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({
                    success: false,
                    message: 'الفرع غير موجود'
                });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error deleting branch ID:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في حذف المعرف',
            error: error.message
        });
    }
});

// Get branch data
router.get('/branch-data/:agencyId/:branchName', async (req, res) => {
    try {
        const { agencyId, branchName } = req.params;
        const branchFilePath = path.join(__dirname, '../../data', agencyId, 'json-data', `${branchName}.json`);

        try {
            const fileContent = await fs.readFile(branchFilePath, 'utf8');
            const branchData = JSON.parse(fileContent);
            res.json({
                success: true,
                branchName: branchData.branchName,
                createdAt: branchData.createdAt,
                data: branchData.data || []
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({
                    success: false,
                    message: 'الفرع غير موجود'
                });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error getting branch data:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب بيانات الفرع',
            error: error.message
        });
    }
});

module.exports = router; 