// Authentication middleware
const checkAuth = (req, res, next) => {
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
    if (req.path === '/api/login' ||
        req.path === '/api/check-auth' ||
        req.path === '/api/logout' ||
        req.path === '/api/get-agents' ||
        req.path.startsWith('/css/') || 
        req.path.startsWith('/js/') || 
        req.path.startsWith('/images/')) {
        console.log('Public path - access granted');
        return next();
    }

    // Check if user is authenticated
    if (!req.session || !req.session.userType || !req.session.userEmail) {
        console.log('Authentication failed');
        return res.status(401).json({
            success: false,
            message: 'غير مصرح به'
        });
    }

    // Set user object for routes
    req.user = {
        type: req.session.userType,
        email: req.session.userEmail,
        agencyId: req.session.agencyId || null,
        webownerId: req.session.webownerId || null
    };

    // Validate user type
    const validUserTypes = ['webowner', 'owner', 'admin1', 'admin2', 'admin3'];
    if (!validUserTypes.includes(req.user.type)) {
        console.log('Authentication failed - invalid user type:', req.user.type);
        return res.status(401).json({
            success: false,
            message: 'نوع المستخدم غير صالح',
            userType: req.user.type
        });
    }

    console.log('User type:', req.user.type);
    console.log('Access granted to:', req.path);
    next();
};

module.exports = {
    checkAuth
};