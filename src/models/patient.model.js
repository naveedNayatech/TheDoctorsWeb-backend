  const mongoose = require('mongoose');
const validator = require('validator');
// const bcrypt = require('bcryptjs');
// const { toJSON, paginate } = require('./plugins');
// const { roles } = require('../config/roles');

const patientSchema = mongoose.Schema(
  {
    assigned_doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    assigned_hr_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hr',
    },
    assigned_ccm_nurse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hr',
    },
    assigned_devices: [{
      deviceObjectId: {
        type: String,
        ref: 'Device',
      }
    }],
    emrId: {
      type: String,
      required: false,
      trim: true,
    },
    firstname: {
      type: String,
      required: false,
      trim: true,
    },
    lastname: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      // unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    DOB: {
      type: Date,
      required: false
    },
    gender: {
      type: String,
      required: false,
      trim: true,
    },
    mobileNo: {
      type: String,
      required: false,
    },
    phone1: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
      trim: true,
    },
    insuranceId:
    {
      type: String,
      required: false,
      trim: true
    },
    insurancecompany:
    {
      type: String,
      required: false,
      trim: true,
    },
    diseases:
    {
      type: String,
      required: false,
      trim: true
    },
    rpmconsent: {
      type: Boolean,
      default: false
    },
    consentdoc: {
      type: Boolean,
      required: false,
    },
    initialsetup: {
      type: String,
      required: false,
    },
    monthinitial: {
      type: Date,
      default: new Date().getMonth()
    },
    block: {
      type: Boolean,
      default: false
    },
    isCCM: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      default: 'patient',
    },
    patientType:{
      type : String,
      required : true,
      enum : ["RPM","CCM","Both"],
      default : 'RPM'
  },
    ssn: {
      type: String
    },
    zipCode: {
      type: String
    },
    state: {
      type: String
    },
    city: {
      type: String
    },
    line2: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

// // add plugin that converts mongoose to json
// patientSchema.plugin(toJSON);
// patientSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
// patientSchema.statics.isEmailTaken = async function (email, excludeUserId) {
//   const patient = await this.findOne({ email, _id: { $ne: excludeUserId } });
//   return !!patient;
// };

patientSchema.statics.isPatientBlocked = async function (_id) {
  const patient = await this.findbyId({ _id });
  if (patient && patient.block)
    return true;
  else
    return false
};

/**
 * @typedef User
 */
const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
