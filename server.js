const express = require('express');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const xlsx = require('xlsx');
const cors = require('cors');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const agentRoutes = require('./server/routes/agent');
const branchRoutes = require('./server/routes/branch');
const app = express();
const PORT = process.env.PORT || 3000;

// Add at the very top of the file, after imports
console.log('=== Server Starting ===');
console.log('Current working directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV || 'development');

// Add after imports and before routes
console.log('\n=== Server Configuration ===');
console.log('Setting up middleware...');

// Path sanitization middleware
const sanitizePath = (req, res, next) => {
    if (req.query.path) {
        // Remove any attempts to navigate up the directory tree
        req.query.path = path.normalize(req.query.path).replace(/^(\.\.[\/\\])+/, '');
        
        // Ensure the path starts within the data directory
        if (!req.query.path.startsWith(path.join(__dirname, 'data'))) {
            req.query.path = path.join('data', req.query.path);
        }
    }
    next();
};

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'حدث خطأ في النظام',
        error: err.message
    });
});

// CORS configuration
app.use((req, res, next) => {
    console.log(`\n=== Incoming ${req.method} Request ===`);
    console.log('Path:', req.path);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Session:', req.session);
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        console.log('Handling OPTIONS preflight request');
        return res.status(200).end();
    }
    
    next();
});

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware
app.use(session({
    secret: 'code-artfortopbasdkskgdhfsfghjsfo[jklfjpbasdkskgdhfsfghjsfo[jklfjiopkmdfjipkdgfdlghidfjklpdthkjopkdgnldkgjipdgjp[dfhkjiopdpbasdkskgdhfsfghjsfo[jklfjiopkmdfjipkdgfdlghidfjklpdthkjopkdgnldkgjipdgjp[dfhkjiopdpbasdkskgdhfsfghjsfo[jklfjiopkmdfjipkdgfdlghidfjklpdthkjopkdgnldkgjipdgjp[dfhkjiopdpbasdkskgdhfsfghjsfo[jklfjiopkmdfjipkdgfdlghidfjklpdthkjopkdgnldkgjipdgjp[dfhkjiopdpbasdkskgdhfsfghjsfo[jklfjiopkmdfjipkdgfdlghidfjklpdthkjopkdgnldkgjipdgjp[dfhkjiopdpbasdkskgdhfsfghjsfo[jklfjiopkmdfjipkdgfdlghidfjklpdthkjopkdgnldkgjipdgjp[dfhkjiopdpbasdkskgdhfsfghjsfo[jklfjiopkmdfjipkdgfdlghidfjklpdthkjopkdgnldkgjipdgjp[dfhkjiopdpbasdkskgdhfsfghjsfo[jklfjiopkmdfjipkdgfdlghidfjklpdthkjopkdgnldkgjipdgjp[dfhkjiopdiopkmdfjipkdgfdlghidfjklpdthkjopkdgnldkgjipdgjp[dfhkjiopdsfhsfgkhkpsfgsgfhghkASju9ghyfgkjiyuoifUIHEIfjioji2@kjuaii8$kioDfg@#ipjfijOUJoimdsfkpjSUODFhjsui9dfhodfAGijad foyiu8gadfioughaoiydghaziusdf fhg97SDBFtycFATYBUDFtgyb7uiABUITGASBIGYN&DfbgyuiSDfgybinouSDNfjhlsfkhiosfhfghkfokjoikdfkjkdfghkjpkgdjkpdgjdkpfghjkmdfhj,dlpgjhkn,dghndgkphjmosethkjsdfgohiusftpuoishdf-9fgjnmshijosdguiosndgfihbdvsfkpbcvbzpoDFgiuaRKGadkpghsdfghsfjlhpgjkdgi08k9dglj;dgkpioniyuz9vSEKFm_SUhfDFKVnadpfgohksfjhosfgmhjhmfkghsjkfugdhkn',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// File Upload middleware
app.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 50 * 1024 * 1024, // 50MB max file size
        files: 2 // Allow up to 2 files
    },
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: '/tmp/',
    debug: true
}));

// Log all requests
app.use((req, res, next) => {
    console.log(`\n=== ${req.method} ${req.path} ===`);
    console.log('Time:', new Date().toISOString());
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Session:', {
        id: req.session?.id,
        userType: req.session?.userType,
        userEmail: req.session?.userEmail,
        agencyId: req.session?.agencyId
    });
    next();
});

// Authentication middleware for protected pages
const authMiddleware = (req, res, next) => {
    // Debug logging
    console.log('=== Auth Middleware ===');
    console.log('Path:', req.path);
    console.log('Session:', {
        exists: !!req.session,
        userType: req.session?.userType,
        userEmail: req.session?.userEmail,
        agencyId: req.session?.agencyId
    });

    // Allow access to public endpoints and assets
    if (req.path === '/' || 
        req.path === '/index.html' || 
        req.path === '/api/login' ||
        req.path === '/api/check-auth' ||
        req.path === '/api/logout' ||
        req.path.startsWith('/css/') || 
        req.path.startsWith('/js/') || 
        req.path.startsWith('/images/')) {
        console.log('Public path - access granted');
        return next();
    }

    // Check if user is authenticated
    if (!req.session || !req.session.userType || !req.session.userEmail) {
        console.log('Authentication failed - redirecting to login');
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ 
                success: false, 
                message: 'غير مصرح به'
            });
        }
        return res.redirect('/index.html');
    }

    // Get user type from session
    const userType = req.session.userType;
    console.log('User type:', userType);

    // Define page access rules
    const pageAccess = {
        '/webowner.html': ['webowner'],
        '/edit-agents.html': ['webowner'],
        '/dashboard.html': ['owner'],
        '/query.html': ['owner', 'admin1', 'admin2', 'admin3']
    };

    // Check if user has access to the requested page
    const requestedPage = req.path;
    const allowedTypes = pageAccess[requestedPage];

    if (allowedTypes) {
        const hasAccess = allowedTypes.includes(userType) || 
                         (allowedTypes.includes('admin') && userType.startsWith('admin'));
        
        if (!hasAccess) {
            console.log('Access denied to page:', requestedPage);
            return res.redirect('/index.html');
        }
    }

    console.log('Access granted to:', requestedPage);
    next();
};

// Apply authentication middleware
app.use(authMiddleware);

// Serve static files from the Public directory
app.use(express.static(path.join(__dirname, 'Public')));

// Add agent routes
app.use('/api', agentRoutes);
app.use('/api', branchRoutes);
// Add check-auth endpoint
app.get('/api/check-auth', (req, res) => {
    console.log('=== Check Auth ===');
    console.log('Session:', req.session);
    console.log('Session ID:', req.sessionID);
    
    if (!req.session || !req.session.userType || !req.session.userEmail) {
        console.log('No valid session found');
        return res.status(401).json({
            success: false,
            message: 'غير مصرح به'
        });
    }

    res.json({
        success: true,
        userType: req.session.userType,
        userEmail: req.session.userEmail,
        agencyId: req.session.agencyId
    });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    console.log('=== Login Attempt ===');
    const { email, password } = req.body;
    
    if (!email || !password) {
        console.log('Missing credentials');
        return res.status(400).json({
            success: false,
            message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
        });
    }

    try {
        console.log('Reading config file...');
        const configPath = path.join(__dirname, 'env', 'config.json');
        const configData = await fsPromises.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);

        // Check webowner login
        const webowner = config.LOGIN.webowner;
        if (webowner && webowner.email === email && webowner.password === password) {
            console.log('Webowner login successful');
            req.session.userType = 'webowner';
            req.session.userEmail = email;
            return res.json({
                success: true,
                userType: 'webowner',
                userEmail: email,
                redirect: '/webowner.html'
            });
        }

        // Check agency owners
        const agencies = config.LOGIN.AGENCIES;
        for (const agencyId in agencies) {
            const agency = agencies[agencyId];
            if (agency.owner.email === email && agency.owner.password === password) {
                console.log('Agency owner login successful');
                req.session.userType = 'owner';
                req.session.userEmail = email;
                req.session.agencyId = agencyId;
                return res.json({
                    success: true,
                    userType: 'owner',
                    userEmail: email,
                    agencyId: agencyId,
                    redirect: '/dashboard.html'
                });
            }

            // Check agency admins
            for (const adminKey in agency) {
                if (adminKey.startsWith('admin') && agency[adminKey].email === email && agency[adminKey].password === password) {
                    console.log('Agency admin login successful');
                    req.session.userType = adminKey;
                    req.session.userEmail = email;
                    req.session.agencyId = agencyId;
                    return res.json({
                        success: true,
                        userType: adminKey,
                        userEmail: email,
                        agencyId: agencyId,
                        redirect: '/query.html'
                    });
                }
            }
        }

        console.log('Login failed - invalid credentials');
        return res.status(401).json({
            success: false,
            message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في النظام',
            error: error.message
        });
    }
});

// Get admins list for an agency
app.get('/api/admins/:agencyId', (req, res) => {
    try {
        const { agencyId } = req.params;
        const configPath = path.join(__dirname, 'env', 'config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        if (!config.LOGIN.AGENCIES[agencyId]) {
            return res.status(404).json({
                success: false,
                message: 'الوكالة غير موجودة'
            });
        }

        const agency = config.LOGIN.AGENCIES[agencyId];
        const admins = [];
        
        // Get all admins for this agency
        ['admin1', 'admin2', 'admin3'].forEach(adminKey => {
            if (agency[adminKey]) {
                admins.push({ 
                    email: agency[adminKey].email,
                    position: adminKey
                });
            }
        });

        res.json({
            success: true,
            admins: admins
        });
    } catch (error) {
        console.error('Error getting admins:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب بيانات المشرفين'
        });
    }
});

// Add admin endpoint
app.post('/api/add-admin', (req, res) => {
    try {
        const { agencyId, adminEmail, adminPassword } = req.body;
        const configPath = path.join(__dirname, 'env', 'config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Check if agency exists
        if (!config.LOGIN.AGENCIES[agencyId]) {
            return res.status(404).json({
                success: false,
                message: 'الوكالة غير موجودة'
            });
        }

        const agency = config.LOGIN.AGENCIES[agencyId];
        
        // Find next available admin position
        let adminPosition = null;
        for (let i = 1; i <= 3; i++) {
            const key = `admin${i}`;
            if (!agency[key]) {
                adminPosition = key;
                break;
            }
        }

        if (!adminPosition) {
            return res.status(400).json({
                success: false,
                message: 'تم الوصول للحد الأقصى من المشرفين (3)'
            });
        }

        // Add new admin
        config.LOGIN.AGENCIES[agencyId][adminPosition] = {
            email: adminEmail,
            password: adminPassword
        };
        
        // Save updated config
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        res.json({
            success: true,
            message: 'تم إضافة المشرف بنجاح',
            position: adminPosition
        });
    } catch (error) {
        console.error('Error adding admin:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إضافة المشرف'
        });
    }
});

// Remove admin endpoint
app.post('/api/remove-admin', (req, res) => {
    try {
        const { agencyId, adminEmail } = req.body;
        const configPath = path.join(__dirname, 'env', 'config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Check if agency exists
        if (!config.LOGIN.AGENCIES[agencyId]) {
            return res.status(404).json({
                success: false,
                message: 'الوكالة غير موجودة'
            });
        }

        const agency = config.LOGIN.AGENCIES[agencyId];
        let adminFound = false;

        // Find and remove the admin
        ['admin1', 'admin2', 'admin3'].forEach(adminKey => {
            if (agency[adminKey] && agency[adminKey].email === adminEmail) {
                delete config.LOGIN.AGENCIES[agencyId][adminKey];
                adminFound = true;
            }
        });

        if (!adminFound) {
            return res.status(404).json({
                success: false,
                message: 'المشرف غير موجود'
            });
        }

        // Save updated config
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        res.json({
            success: true,
            message: 'تم حذف المشرف بنجاح'
        });
    } catch (error) {
        console.error('Error removing admin:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في حذف المشرف'
        });
    }
});

// Get available years for an agency
app.get('/api/years/:agencyId', (req, res) => {
    try {
        const { agencyId } = req.params;
        console.log('Fetching years for agency:', agencyId);
        
        const agencyPath = path.join(__dirname, 'data', agencyId);
        console.log('Agency path:', agencyPath);
        
        if (!fs.existsSync(agencyPath)) {
            console.error('Agency directory not found:', agencyPath);
            return res.json({
                success: false,
                message: 'Agency directory not found',
                error: 'AGENCY_NOT_FOUND'
            });
        }

        const years = fs.readdirSync(agencyPath)
            .filter(item => {
                const itemPath = path.join(agencyPath, item);
                const isValid = fs.statSync(itemPath).isDirectory() && /^\d{4}$/.test(item);
                console.log('Checking item:', item, 'isValid:', isValid);
                return isValid;
            })
            .sort((a, b) => b - a);

        console.log('Found years:', years);
        
        res.json({
            success: true,
            years: years
        });
    } catch (error) {
        console.error('Error getting years:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting available years',
            error: error.message
        });
    }
});

// Get available months for a specific year and agency
app.get('/api/months/:agencyId/:year', (req, res) => {
    try {
        const { agencyId, year } = req.params;
        console.log('Fetching months for agency:', agencyId, 'year:', year);
        
        const yearPath = path.join(__dirname, 'data', agencyId, year);
        console.log('Year path:', yearPath);
        
        if (!fs.existsSync(yearPath)) {
            console.error('Year directory not found:', yearPath);
            return res.json({
                success: false,
                message: 'Year directory not found',
                error: 'YEAR_NOT_FOUND'
            });
        }

        const months = fs.readdirSync(yearPath)
            .filter(item => {
                const itemPath = path.join(yearPath, item);
                const isValid = fs.statSync(itemPath).isDirectory();
                console.log('Checking month:', item, 'isValid:', isValid);
                return isValid;
            })
            .sort((a, b) => a.localeCompare(b));

        console.log('Found months:', months);
        
        res.json({
            success: true,
            months: months
        });
    } catch (error) {
        console.error('Error getting months:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting available months',
            error: error.message
        });
    }
});

// Modify the search endpoint to include year and month
app.get('/api/search', (req, res) => {
    const { employeeId, agencyId, year, month } = req.query;
    
    if (!employeeId || !agencyId || !year || !month) {
        return res.status(400).json({
            success: false,
            message: 'يرجى إدخال جميع البيانات المطلوبة'
        });
    }

    try {
        let employee = null;
        let fileType = '';
        let foundInFile = '';

        // Check both files in the specified year and month directory
        const files = ['salaries.xlsx', 'salaries_target.xlsx'];
        const monthPath = path.join(__dirname, 'data', agencyId, year, month);

        for (const file of files) {
            const dataPath = path.join(monthPath, file);
            console.log('Checking file:', dataPath);
            
            if (fs.existsSync(dataPath)) {
                console.log('File exists:', file);
                const workbook = xlsx.readFile(dataPath);
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const data = xlsx.utils.sheet_to_json(sheet);

                console.log('Searching for employee ID:', employeeId);
                const foundEmployee = data.find(row => {
                    console.log('Comparing with:', row.ID);
                    return row.ID && row.ID.toString() === employeeId.toString();
                });

                if (foundEmployee) {
                    console.log('Employee found in:', file);
                    employee = foundEmployee;
                    fileType = file === 'salaries.xlsx' ? 'ساعات' : 'تارجت';
                    foundInFile = file;
                    break;
                }
            } else {
                console.log('File not found:', file);
            }
        }

        // Create search log
        const logEntry = {
            employeeId: employeeId,
            timestamp: new Date().toISOString(),
            status: employee ? 'found' : 'not_found',
            fileType: fileType,
            foundInFile: foundInFile,
            year: year,
            month: month,
            ip: req.ip || req.connection.remoteAddress
        };

        const logPath = path.join(__dirname, 'data', agencyId, 'json-data', 'log.json');
        let logs = [];
        
        if (fs.existsSync(logPath)) {
            try {
                const fileContent = fs.readFileSync(logPath, 'utf8');
                if (fileContent && fileContent.trim()) {
                    logs = JSON.parse(fileContent);
                }
            } catch (readError) {
                console.error('Error reading log file:', readError);
            }
        }

        logs.push(logEntry);

        try {
            fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
            console.log('Search log saved successfully');
        } catch (writeError) {
            console.error('Error saving search log:', writeError);
        }

        if (!employee) {
            console.log('Employee not found');
            return res.status(404).json({
                success: false,
                message: 'لم يتم العثور على بيانات الموظف'
            });
        }

        // Return employee data
        const response = {
            success: true,
            targetDate: employee['مضيف التارجت'] || employee['مضيف لمدة ساعتين'],
            gemsCount: employee['عدد الماسات المجمعة'],
            salary: employee['الراتب'],
            fileType: fileType,
            foundInFile: foundInFile,
            year: year,
            month: month
        };

        console.log('Sending response:', response);
        res.json(response);

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء البحث',
            error: error.message
        });
    }
});

// Initialize data directories
function initializeDataDirectories() {
    const dataDir = path.join(__dirname, 'data');
    
    // Read all directories in data folder to get agencies
    const agencies = fs.readdirSync(dataDir)
        .filter(item => fs.statSync(path.join(dataDir, item)).isDirectory());

    // Initialize each agency's data directory
    agencies.forEach(agencyId => {
        const agencyDataDir = path.join(dataDir, agencyId, 'json-data');
        if (!fs.existsSync(agencyDataDir)) {
            fs.mkdirSync(agencyDataDir, { recursive: true });
            // Initialize empty hosts.json if it doesn't exist
            const hostsFile = path.join(agencyDataDir, 'hosts.json');
            if (!fs.existsSync(hostsFile)) {
                fs.writeFileSync(hostsFile, JSON.stringify([], null, 2));
            }
        }
    });

    return agencies;
}

// Get list of available agencies
app.get('/api/agencies', (req, res) => {
    try {
        const agencies = initializeDataDirectories();
        res.json({
            success: true,
            agencies: agencies
        });
    } catch (error) {
        console.error('Error getting agencies:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting agencies list',
            error: error.message
        });
    }
});

// Validate agency access middleware
const validateAgencyAccess = (req, res, next) => {
    const agencyId = req.body.agencyId || req.query.agencyId;
    const userAgencyId = req.session?.agencyId;

    if (!agencyId) {
        return res.status(400).json({
            success: false,
            message: 'Missing agency ID'
        });
    }

    // Get list of valid agencies
    const validAgencies = initializeDataDirectories();

    // Check if agency exists
    if (!validAgencies.includes(agencyId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid agency ID'
        });
    }

    // Check if user has access to this agency
    if (userAgencyId && userAgencyId !== agencyId) {
        return res.status(403).json({
            success: false,
            message: 'Access denied to this agency'
        });
    }

    next();
};
app.use('/api/store-host', validateAgencyAccess);
app.use('/api/get-hosts', validateAgencyAccess);

const hostDataManager = {
    getHostsFilePath: (agencyId) => {
        return path.join(__dirname, 'data', agencyId, 'json-data', 'hosts.json');
    },

    // Validate host data
    validateHostData: (hostData) => {
        const errors = [];
        
        // Required fields
        if (!hostData.id) errors.push('رقم الواتساب مطلوب');
        if (!hostData.name) errors.push('اسم المضيف مطلوب');
        if (!hostData.type) errors.push('نوع المضيف مطلوب');
        if (!hostData.country) errors.push('الدولة مطلوبة');

        // Format validation
        if (hostData.id && !/^[0-9]{10,15}$/.test(hostData.id)) {
            errors.push('رقم الواتساب غير صحيح');
        }
        if (hostData.type && !['male', 'female'].includes(hostData.type)) {
            errors.push('نوع المضيف غير صحيح');
        }
        if (hostData.country && !['SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'EG', 'IQ', 'SY', 'LB', 'JO', 'PS', 'YE', 'SD', 'LY', 'TN', 'DZ', 'MA', 'MR'].includes(hostData.country)) {
            errors.push('الدولة غير صحيحة');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // Read hosts data
    readHosts: async (agencyId) => {
        try {
            const hostsFile = hostDataManager.getHostsFilePath(agencyId);
            
            // Create directory and file if they don't exist
            const dirPath = path.dirname(hostsFile);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            if (!fs.existsSync(hostsFile)) {
                await fs.promises.writeFile(hostsFile, '[]', 'utf8');
            }

            const data = await fs.promises.readFile(hostsFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ Error reading hosts:', error);
            throw error;
        }
    },

    // Write hosts data
    writeHosts: async (agencyId, hosts) => {
        try {
            const hostsFile = hostDataManager.getHostsFilePath(agencyId);
            
            // Write new data
            await fs.promises.writeFile(
                hostsFile,
                JSON.stringify(hosts, null, 2),
                'utf8'
            );
            
            console.log(`✅ Hosts data written successfully for agency: ${agencyId}`);
            return true;
        } catch (error) {
            console.error('❌ Error writing hosts:', error);
            throw error;
        }
    },

    // Add new host
    addHost: async (agencyId, hostData) => {
        try {
            // Validate host data
            const validation = hostDataManager.validateHostData(hostData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            // Read current hosts
            const hosts = await hostDataManager.readHosts(agencyId);

            // Check for duplicate host ID
            if (hosts.some(host => host.id === hostData.id)) {
                throw new Error('رقم الواتساب مسجل مسبقاً');
            }

            // Add new host with metadata
            const newHost = {
                ...hostData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'active',
                lastModifiedBy: req.session?.userEmail || 'system'
            };

            hosts.push(newHost);
            console.log('📝 Adding new host:', JSON.stringify(newHost, null, 2));

            // Write updated hosts
            console.log('📝 Writing hosts to file...');
            await fs.promises.writeFile(
                hostsFilePath,
                JSON.stringify(hosts, null, 2),
                'utf8'
            );

            console.log('✅ Host added successfully');
            return newHost;
        } catch (error) {
            console.error('❌ Error adding host:', error);
            throw error;
        }
    }
};

// Update the store-host endpoint to use the new host data manager
app.post('/api/store-host', validateAgencyAccess, async (req, res) => {
    console.log('\n=== Store Host POST Request ===');
    console.log('Time:', new Date().toISOString());
    console.log('Request URL:', req.originalUrl);
    console.log('Request Method:', req.method);
    console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('Session:', {
        id: req.session?.id,
        userType: req.session?.userType,
        userEmail: req.session?.userEmail,
        agencyId: req.session?.agencyId,
        cookie: req.session?.cookie
    });

    try {
        const { agencyId, hostData } = req.body;

        if (!agencyId || !hostData) {
            console.error('❌ Missing required data:', { agencyId, hostData });
            return res.status(400).json({
                success: false,
                message: 'Missing required data'
            });
        }

        console.log('📝 Validating host data for agency:', agencyId);
        console.log('Host data:', JSON.stringify(hostData, null, 2));

        // Validate host data
        const validation = hostDataManager.validateHostData(hostData);
        if (!validation.isValid) {
            console.error('❌ Host data validation failed:', validation.errors);
            return res.status(400).json({
                success: false,
                message: validation.errors.join(', ')
            });
        }

        // Get hosts file path
        const hostsFilePath = hostDataManager.getHostsFilePath(agencyId);
        console.log('📁 Hosts file path:', hostsFilePath);

        // Check if directory exists
        const dirPath = path.dirname(hostsFilePath);
        if (!fs.existsSync(dirPath)) {
            console.log('📁 Creating directory:', dirPath);
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Check if file exists
        const fileExists = fs.existsSync(hostsFilePath);
        console.log('📄 Hosts file exists:', fileExists);

        // Read current hosts
        let hosts = [];
        if (fileExists) {
            try {
                const fileContent = await fs.promises.readFile(hostsFilePath, 'utf8');
                hosts = JSON.parse(fileContent);
                console.log('📖 Current hosts count:', hosts.length);
            } catch (readError) {
                console.error('❌ Error reading hosts file:', readError);
                hosts = [];
            }
        }

        // Check for duplicate host ID
        if (hosts.some(host => host.id === hostData.id)) {
            console.error('❌ Duplicate host ID:', hostData.id);
            return res.status(400).json({
                success: false,
                message: 'رقم الواتساب مسجل مسبقاً'
            });
        }

        // Add new host with metadata
        const newHost = {
            ...hostData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            lastModifiedBy: req.session?.userEmail || 'system'
        };

        hosts.push(newHost);
        console.log('📝 Adding new host:', JSON.stringify(newHost, null, 2));

        // Write updated hosts
        console.log('📝 Writing hosts to file...');
        await fs.promises.writeFile(
            hostsFilePath,
            JSON.stringify(hosts, null, 2),
            'utf8'
        );

        console.log('✅ Host added successfully');
        return res.json({
            success: true,
            message: 'تم إضافة المضيف بنجاح',
            host: newHost
        });

    } catch (error) {
        console.error('❌ Error in store-host endpoint:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            success: false,
            message: error.message || 'حدث خطأ في حفظ البيانات'
        });
    }
});

// Get hosts with pagination
app.get('/api/get-hosts', (req, res) => {
    const { agencyId, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (!agencyId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing agency ID' 
        });
    }

    const hostsFile = path.join(__dirname, 'data', agencyId, 'json-data', 'hosts.json');

    try {
        let hosts = [];
        
        // Check if file exists and has content
        if (fs.existsSync(hostsFile)) {
            try {
                const fileContent = fs.readFileSync(hostsFile, 'utf8');
                if (fileContent && fileContent.trim()) {
                    hosts = JSON.parse(fileContent);
                }
            } catch (readError) {
                console.error('Error reading hosts file:', readError);
                hosts = [];
            }
        }

        // Ensure hosts is an array
        if (!Array.isArray(hosts)) {
            hosts = [];
        }

        // Calculate pagination
        const total = hosts.length;
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedHosts = hosts.slice(startIndex, endIndex);

        res.json({
            success: true,
            hosts: paginatedHosts,
            total,
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        console.error('Error getting hosts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error getting hosts',
            error: error.message 
        });
    }
});

// GET /api/files - Get files and directories in a path
app.get('/api/files', sanitizePath, async (req, res) => {
    try {
        console.log('Received request for files');
        const requestedPath = req.query.path || '';
        const fullPath = path.join(__dirname, 'data', requestedPath);
        console.log('Requested path:', fullPath);

        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, 'data');
        try {
            await fsPromises.access(dataDir);
            console.log('Data directory exists');
        } catch {
            console.log('Creating data directory');
            await fsPromises.mkdir(dataDir);
            
            // Create a sample JSON file
            const samplePath = path.join(dataDir, 'sample.json');
            const sampleData = {
                message: "مرحباً بك في محرر البيانات",
                description: "يمكنك تعديل هذا الملف أو إنشاء ملفات جديدة"
            };
            await fsPromises.writeFile(samplePath, JSON.stringify(sampleData, null, 2), 'utf-8');
            console.log('Created sample file');
        }

        // Check if requested path exists
        try {
            await fsPromises.access(fullPath);
        } catch {
            console.log('Creating requested directory:', fullPath);
            await fsPromises.mkdir(fullPath, { recursive: true });
        }

        // Read directory contents
        const items = await fsPromises.readdir(fullPath, { withFileTypes: true });
        console.log('Found items:', items.length);

        // Format items for response
        const formattedItems = items.map(item => ({
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file'
        }));

        res.json(formattedItems);
    } catch (error) {
        console.error('Error in /api/files:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء قراءة المجلد' });
    }
});

// GET /api/file - Get file contents
app.get('/api/file', sanitizePath, async (req, res) => {
    try {
        console.log('Received request for file');
        const filePath = req.query.path;
        if (!filePath) {
            return res.status(400).json({ error: 'مسار الملف مطلوب' });
        }

        const fullPath = path.join(__dirname, 'data', filePath);
        console.log('Reading file:', fullPath);

        // Ensure the directory exists
        const dirPath = path.dirname(fullPath);
        try {
            await fsPromises.access(dirPath);
        } catch {
            await fsPromises.mkdir(dirPath, { recursive: true });
        }

        // Try to read the file
        try {
            const content = await fsPromises.readFile(fullPath, 'utf-8');
            console.log('File read successfully');

            if (filePath.endsWith('.json')) {
                try {
                    const jsonContent = JSON.parse(content);
                    return res.json(jsonContent);
                } catch (error) {
                    console.error('Invalid JSON:', error);
                    return res.status(400).json({ error: 'ملف JSON غير صالح' });
                }
            }

            res.json({ content });
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Create a new file with default content
                const defaultContent = filePath.endsWith('.json') ? 
                    JSON.stringify({ message: 'ملف جديد' }, null, 2) : 
                    '';
                await fsPromises.writeFile(fullPath, defaultContent, 'utf-8');
                return res.json(filePath.endsWith('.json') ? { message: 'ملف جديد' } : { content: '' });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error in /api/file:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء قراءة الملف' });
    }
});

// POST /api/file - Save file contents
app.post('/api/file', async (req, res) => {
    try {
        console.log('Received save request');
        const filePath = req.query.path;
        if (!filePath) {
            return res.status(400).json({ error: 'مسار الملف مطلوب' });
        }

        const fullPath = path.join(__dirname, 'data', filePath);
        console.log('Saving to:', fullPath);

        // Ensure the directory exists
        const dirPath = path.dirname(fullPath);
        try {
            await fsPromises.access(dirPath);
        } catch {
            await fsPromises.mkdir(dirPath, { recursive: true });
        }

        let content = req.body;
        if (filePath.endsWith('.json')) {
            content = JSON.stringify(content, null, 2);
        }

        await fsPromises.writeFile(fullPath, content, 'utf-8');
        console.log('File saved successfully');

        res.json({ message: 'تم حفظ الملف بنجاح' });
    } catch (error) {
        console.error('Error in POST /api/file:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء حفظ الملف' });
    }
});

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Create new agency endpoint
app.post('/api/create-agent', async (req, res) => {
    try {
        const { agentName, email, password, year, month } = req.body;
        const file1 = req.files?.file1;
        const file2 = req.files?.file2;

        // Validate required fields
        if (!agentName || !email || !password || !year || !month || !file1 || !file2) {
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال جميع البيانات المطلوبة'
            });
        }

        // Validate agent name format (only letters and numbers)
        if (!/^[a-zA-Z0-9]+$/.test(agentName)) {
            return res.status(400).json({
                success: false,
                message: 'اسم الوكيلة يجب أن يحتوي على أحرف وأرقام فقط'
            });
        }

        // Check if agency already exists
        const configPath = path.join(__dirname, 'env', 'config.json');
        const config = JSON.parse(await fsPromises.readFile(configPath, 'utf8'));

        if (config.LOGIN.AGENCIES[agentName]) {
            return res.status(400).json({
                success: false,
                message: 'اسم الوكيلة موجود مسبقاً'
            });
        }

        // Create agency directory structure
        const agencyPath = path.join(__dirname, 'data', agentName);
        const yearPath = path.join(agencyPath, year);
        const monthPath = path.join(yearPath, month);
        const jsonDataPath = path.join(agencyPath, 'json-data');

        // Create directories
        await fsPromises.mkdir(agencyPath, { recursive: true });
        await fsPromises.mkdir(yearPath, { recursive: true });
        await fsPromises.mkdir(monthPath, { recursive: true });
        await fsPromises.mkdir(jsonDataPath, { recursive: true });

        // Save uploaded files
        await file1.mv(path.join(monthPath, 'salaries.xlsx'));
        await file2.mv(path.join(monthPath, 'salaries_target.xlsx'));

        // Add agency to config
        config.LOGIN.AGENCIES[agentName] = {
            owner: {
                email: email,
                password: password
            }
        };

        // Save updated config
        await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2));

        res.json({
            success: true,
            message: 'تم إنشاء الوكيلة بنجاح'
        });

    } catch (error) {
        console.error('Error creating agency:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء إنشاء الوكيلة',
            error: error.message
        });
    }
});

// Edit host endpoint
app.put('/api/edit-host', validateAgencyAccess, async (req, res) => {
    try {
        const { agencyId, hostId, hostData } = req.body;

        if (!agencyId || !hostId || !hostData) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير مكتملة'
            });
        }

        // Validate host data
        const validation = hostDataManager.validateHostData(hostData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.errors.join(', ')
            });
        }

        const hostsFile = path.join(__dirname, 'data', agencyId, 'json-data', 'hosts.json');
        let hosts = [];

        // Read current hosts
        if (fs.existsSync(hostsFile)) {
            const fileContent = fs.readFileSync(hostsFile, 'utf8');
            if (fileContent && fileContent.trim()) {
                hosts = JSON.parse(fileContent);
            }
        }

        // Find host index
        const hostIndex = hosts.findIndex(host => host.id === hostId);
        if (hostIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'المضيف غير موجود'
            });
        }

        // Update host data
        const updatedHost = {
            ...hosts[hostIndex],
            ...hostData,
            updatedAt: new Date().toISOString(),
            lastModifiedBy: req.session?.userEmail || 'system'
        };

        hosts[hostIndex] = updatedHost;

        // Write updated hosts
        await fs.promises.writeFile(hostsFile, JSON.stringify(hosts, null, 2), 'utf8');

        res.json({
            success: true,
            message: 'تم تحديث بيانات المضيف بنجاح',
            host: updatedHost
        });

    } catch (error) {
        console.error('Error editing host:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في تحديث البيانات',
            error: error.message
        });
    }
});

// Delete host endpoint
app.delete('/api/delete-host', validateAgencyAccess, async (req, res) => {
    try {
        const { agencyId, hostId } = req.body;

        if (!agencyId || !hostId) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير مكتملة'
            });
        }

        const hostsFile = path.join(__dirname, 'data', agencyId, 'json-data', 'hosts.json');
        let hosts = [];

        // Read current hosts
        if (fs.existsSync(hostsFile)) {
            const fileContent = fs.readFileSync(hostsFile, 'utf8');
            if (fileContent && fileContent.trim()) {
                hosts = JSON.parse(fileContent);
            }
        }

        // Find host index
        const hostIndex = hosts.findIndex(host => host.id === hostId);
        if (hostIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'المضيف غير موجود'
            });
        }

        // Remove host
        hosts.splice(hostIndex, 1);

        // Save updated hosts
        await fs.promises.writeFile(hostsFile, JSON.stringify(hosts, null, 2), 'utf8');

        res.json({
            success: true,
            message: 'تم حذف المضيف بنجاح'
        });

    } catch (error) {
        console.error('Error deleting host:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في حذف المضيف',
            error: error.message
        });
    }
});

// Add file-data endpoint for analysis
app.get('/api/file-data/:agencyId/:year/:month/:file', async (req, res) => {
    try {
        const { agencyId, year, month, file } = req.params;
        const filePath = path.join(__dirname, 'data', agencyId, year, month, file);

        if (!fs.existsSync(filePath)) {
            return res.json({
                success: false,
                message: 'الملف غير موجود'
            });
        }

        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet);

        res.json({
            success: true,
            rows: rows
        });
    } catch (error) {
        console.error('Error reading file data:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في قراءة البيانات',
            error: error.message
        });
    }
});

// Start the server with error handling
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/edit-data.html to start`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
}); 