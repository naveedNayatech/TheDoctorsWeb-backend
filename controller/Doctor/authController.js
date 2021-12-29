const Doctor = require('../../models/doctor');
const ErrorHandler = require('../../utils/errorHandler');
const catchAsyncError = require('../../middlewares/catchAsyncErrors');
// const sendToken = require('../../utils/jwtToken');


// Login Doctor => /api/v1/login
exports.loginDoctor = catchAsyncError( async(req, res, next) => {
    try {
        const { email, password, role } = req.body;

        // Check if email and password is entered by user
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: 'Please enter email and password'
                })
        }
    
        // Finding Admin in database
        const doctor = await Doctor.findOne({ email: email, role: role }).select('+password') //because in user model we select password
    
        if(!doctor) {
            return res.status(400).json({
                success: false,
                message: 'Doctor Not Found'
                })
        }
    
        // Checks if password is correct or not
        const isPasswordMatched = await doctor.comparePassword(password);
    
        if(!isPasswordMatched) {
            return res.status(400).json({
                success: false,
                message: 'Password Not Matched'
                })  
        }
    
        sendToken(doctor, 200, res)
        
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
            })      
    }
    
 })

 const sendToken = (doctor, statusCode, res) => {

    // Create Jwt token
    const token = doctor.getJwtToken(); 

    // Options for cookie
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000  //expire cookie after mentioned days
        ),
        httpOnly: true  //http cookies cannot be accessed using javascript statusCode
    }

    res.status(statusCode).cookie('token', token, options).json({ 
        success: true,
        token,
        doctor
     });
}