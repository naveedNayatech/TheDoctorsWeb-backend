const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const doctorSchema = new mongoose.Schema({
    title: {
       type: String,
       required: true, 
    },
    firstname: {
        type: String,
        required: [true, 'Please enter doctor first name'],
        maxLength:[25, 'First name should not be greater than 25 characters']
    },
    lastname: {
        type: String,
        required: [true, 'Please enter doctor last name'],
        maxLength:[25, 'Last name should not be greater than 25 characters']
    },
    email: {
        type: String,
        required: [true, 'Please enter doctor email'],
        maxLength:[25, 'Doctor email should not be greater than 30 characters'],
        unique: true,  
        validate: [validator.isEmail, 'Please enter valid email adddress'],
    },
    gender: {
        type: String,
        required: [true, 'Please enter doctor gender'],
    },
    password: {
        type: String,
        required: [true, 'Please enter doctor password'],
        minlength: [8, "Password should not be less than 8 characters"],
        select: false 
    },
    contactno: {
        type: String,
        required: [true, 'Please enter doctor contact number'],
        minlength: [8, 'Contact number should not be less than 8 characters']
    },
    phone1: {
        required: false,
        type: String,
        },
    phone2: {
        required:false,
        type: String,
    },
    npinumber: {
        type: String,
        minlength: [10, 'NPI number should not be less than 10 characters']
    },
    licensenumber: {
        type: String,
        minlength: [10, 'License number should not be less than 10 characters']
    },
    role: {
        type: String,
        default: 'Doctor',
    },
    avatar: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        }
    },
    specialization: [
        {
            fieldname: {
                type: String,
                required: true 
            }
        }
    ],
    patients: [
        {
            patientId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Patient',
                default: null
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

doctorSchema.pre('save', async function (next) {
    if(!this.isModified('password')) {
        next()
    }

    this.password = await bcrypt.hash(this.password, 10);
})


// Compare doctor password 
doctorSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

// return JWT token 
doctorSchema.methods.getJwtToken = function () {
    return jwt.sign({
        id: this._id
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });
}


module.exports = mongoose.model('Doctor', doctorSchema);