const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter admin name'],
        maxLength:[25, 'Admin name should not be greater than 25 characters']
    },
    email: {
        type: String,
        required: [true, 'Please enter admin email'],
        maxlength:[30, 'Admin email should not be greater than 30 characters'],
        unique: true,  
        validate: [validator.isEmail, 'Please enter valid email adddress'],
    },
    password: {
        type: String,
        required: [true, 'Please enter admin password'],
        minlength: [8, "Password should not be less than 8 characters"],
        select: false 
    },
    role: {
        type: String,
        default: 'Patient',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

adminSchema.pre('save', async function (next) {
    if(!this.isModified('password')) {
        next()
    }

    this.password = await bcrypt.hash(this.password, 10);
})

// return JWT token 
adminSchema.methods.getJwtToken = function () {
    return jwt.sign({
        id: this._id
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });
}

// Compare admin password 
adminSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}


module.exports = mongoose.model('Admin', adminSchema);
