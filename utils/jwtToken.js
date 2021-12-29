// Create and send token and save in the cookie

const sendToken = (admin, statusCode, res) => {

    // Create Jwt token
    const token = admin.getJwtToken(); 

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
        admin
     });
}

module.exports = sendToken;