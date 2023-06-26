const mongoose = require('mongoose');
const validator = require('validator');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');
const bcrypt = require('bcryptjs');

const adminSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim:true
    },
    profileImg: {
      type: String,
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
      role: {
        type: String,
        enum: ['admin','adminStaff'],
        default:"admin"
      }
     },
    {
      timestamps: true,
    }
);
// // add plugin that converts mongoose to json
// adminSchema.plugin(toJSON);
// adminSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
adminSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const Admin = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!Admin;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
adminSchema.methods.isPasswordMatch = async function (password) {
  const Admin = this;
  return bcrypt.compare(password, Admin.password);
};

adminSchema.pre('save', async function (next) {
  const Admin = this;
  if (Admin.isModified('password')) {
    Admin.password = await bcrypt.hash(Admin.password, 8);
  }
  next();
});

/**
 * @typedef User
 */
const Admin = mongoose.model('admin', adminSchema);

module.exports = Admin;