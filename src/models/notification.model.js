const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const notiSchema = mongoose.Schema(
  { 
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    hrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hr',
    },
    patientId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    noti_type : {
        type:String,
        enum : ["bp","wt","user added","device added","device assigned","Reading","device unassigned","device collected"]
    },
    ref_Id : {
        type: String
    },
    textAny :{
        type : String
    },
    status:{type:String},
    admin:{type:Boolean}

    
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef User
 */
const notification = mongoose.model('Notification', notiSchema);

module.exports = notification;
