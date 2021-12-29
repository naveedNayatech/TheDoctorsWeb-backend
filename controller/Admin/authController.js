const Admin = require('../../models/admin');
const ErrorHandler = require('../../utils/errorHandler');
const catchAsyncError = require('../../middlewares/catchAsyncErrors');
const sendToken = require('../../utils/jwtToken');

// Register Admin => /api/v1/registeradmin

exports.registerAdmin = catchAsyncError(async(req, res, next) => {
    try {
        const { name, email, password, role } =  req.body;

    const isAdminExist = await Admin.findOne({email: email});
    
    if(isAdminExist){
        // return next(new ErrorHandler('Email Already Exist', 400));
        return res.status(400).json({
            success: false,
            message: 'Email already Exist'
            })
        }

        const admin = await Admin.create({
            name,
            email,
            password,
            role
        })
        
        sendToken(admin, 200, res)

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
            })
    }
})

// Login Admin => /api/v1/adminlogin
exports.loginAdmin = catchAsyncError( async(req, res, next) => {
    try {
        const { email, password, role } = req.body;

        // Check if email and password is entered by user
        if(!email || !password || !role){
            return res.status(400).json({
                success: false,
                message: 'Please enter email, password and role'
                })
        }
    
        // Finding Admin in database
        const admin = await Admin.findOne({ email: email, role: role }).select('+password') //because in user model we select password
    
        if(!admin) {
            return res.status(400).json({
                success: false,
                message: 'Not Found'
                })
        }
    
        // Checks if password is correct or not
        const isPasswordMatched = await admin.comparePassword(password);
    
        if(!isPasswordMatched) {
            return res.status(400).json({
                success: false,
                message: 'Password Not Matched'
                })  
        }
        

        sendToken(admin, 200, res);
        
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
            })      
    } 
 })

 //  Logout Admin => /api/v1/logout
exports.logoutAdmin = catchAsyncError(async (req, res, next) => {
    res.cookie('token', null, { 
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: 'Logged Out'
    })
})

// Update / Change Password => /api/v1/admin/update
exports.updatePassword = catchAsyncError(async (req, res, next) => {

    const user = await Admin.findById(req.body.id).select('+password'); //at login we are storing id of user in session

    // Check old password
    const isMatched = await user.comparePassword(req.body.oldpassword); // comparePassword is a method in user model

    if(!isMatched) {
        res.status(200).json({
            success: true,
            message: 'Password Not Matched'
        })
    }

    user.password = req.body.password;

    console.log('old password is ' + req.body.oldpassword);
    console.log('New password is ' + user.password);

    await user.save(); 

    sendToken(user, 200, res);

})
