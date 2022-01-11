const mongoose = require('mongoose');
const validator = require('validator');

const patientSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    firstname: {
        type: String,
        required: [true, 'Please enter first name'],
        maxLength:[25, 'First name should not be greater than 25 characters']
    },
    lastname:{
        type: String,
        maxLength:[25, 'First name should not be greater than 25 characters']
    },
    email: {
        type: String,
        required: [true, 'Please enter patient email'],
        maxLength:[25, 'Patient email should not be greater than 30 characters'],
        unique: true,  
        validate: [validator.isEmail, 'Please enter valid email adddress'],
    },
    gender: {
        type: String,
        required: [true, 'Please enter doctor gender'],
    },
    contactno: {
        type: String,
        required: [true, 'Please enter patient contact number'],
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
    address: {
        type: String,
        required: [true, 'Please enter patient address'],
    },
    insurancecompany: [
        {
            companyname: {
                type: String,
            },
            licenseno: {
                type: String,
            }

        }
    ],
    diseases: [
        {
            diseasename: {
                type: String,
            }
        }
    ],
    insurancestatus: {
        type: String
    },
    preferredlanguage: {
        type: String
    },
    pcp: {
        type: String
    },
    practise: {
        type: String
    },
    rpmconsent: {
        type: Boolean,
        default: false
    },
    consentdocid: {
        type: String
    },
    initialsetup: {
        type: String,
    },
    monthinitial: {
        type: Date,
        default: new Date().getMonth()
    },
    readingsperday: {
        type: Number,
        required: true
    },
    doctorid: {
        type: mongoose.Schema.ObjectId,
        ref: 'Doctor',
        default: null
    },
    deviceassigned: [
        {
        deviceid: {
        type: String,
        }
      }
    ]    
})

module.exports = mongoose.model('Patient', patientSchema);