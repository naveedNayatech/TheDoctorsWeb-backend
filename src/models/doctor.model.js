const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const doctorSchema = mongoose.Schema(
  {
    assigned_hr_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hr',
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
    npinumber: {
      type: String,
      required: false,
    },
    licensenumber: {
      type: Number,
      // required: false
    },
    specialization: {
      type: String,
      required: false
    },
    block: {
      type: Boolean,
      default: false
    },

    role: {
      type: String,
      default: 'doctor',
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
// doctorSchema.plugin(toJSON);
// doctorSchema.plugin(paginate);


/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
doctorSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const doctor = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!doctor;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
doctorSchema.methods.isPasswordMatch = async function (password) {
  const doctor = this;
  return bcrypt.compare(password, doctor.password);
};

doctorSchema.pre('save', async function (next) {
  const doctor = this;
  if (doctor.isModified('password')) {
    doctor.password = await bcrypt.hash(doctor.password, 8);
  }
  next();
});

/**
 * @typedef User
 */
const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
