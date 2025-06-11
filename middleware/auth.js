// Authentication middleware
const checkAuth = (req, res, next) => {
    if (!req.session || !req.session.userType || !req.session.userEmail) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح به'
        });
    }

    // Add user info to request object
    req.user = {
        type: req.session.userType,
        email: req.session.userEmail,
        agencyId: req.session.agencyId
    };

    next();
};

module.exports = {
    checkAuth
}; 