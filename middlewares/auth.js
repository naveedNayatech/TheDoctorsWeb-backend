const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");   
const catchAsyncErrors = require('./catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');

// Checks if user is authenticated or not
exports.isAuthenticatedUser = catchAsyncErrors( async (req, res, next) => {

    const { token } = req.cookies;

    if(!token) {
         return res.status(400).json({
            success: false,
            message: 'Login first to access this resouece.'
            })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id) //decoded id cuz we stored id in token

    next();
})