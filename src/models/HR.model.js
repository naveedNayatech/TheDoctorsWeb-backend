const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const HrSchema = mongoose.Schema(
  {
    assigned_doctor_id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    profileImg: {
      type: String
    },
    firstname: {
      type: String,
      required: true,
      trim: true,
    },
    lastname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    DOB: {
      type: Date,
      
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
    block: { 
      type : Boolean,
      default: false
     },

    role: {
      type: String,
      enum: ['HrNonMedical','HrMedical'],
      default:'HrMedical'
    },
    consentRole: {
      type: String,
      enum: ['RPM','CCM', 'Both'],
      default:'RPM'
    },    
    loginAttemps: {
      type: Number,
      default: 0
    }
    
  },
  {
    timestamps: true,
  }
);

// // add plugin that converts mongoose to json
// HrSchema.plugin(toJSON);
// HrSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
HrSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const hr = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!hr;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
HrSchema.methods.isPasswordMatch = async function (password) {
  const hr = this;
  return bcrypt.compare(password, hr.password);
};

HrSchema.pre('save', async function (next) {
  const hr = this;
  if (hr.isModified('password')) {
    hr.password = await bcrypt.hash(hr.password, 8);
  }
  next();
});

/**
 * @typedef User
 */
const Hr = mongoose.model('Hr', HrSchema);

module.exports = Hr;
