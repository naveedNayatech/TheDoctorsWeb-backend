const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const healthDataSchema = mongoose.Schema(
  {

    assigned_patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    deviceId: {
      type: String,
      ref: 'Device',
    },
    telemetaryData: {},
    dateAdded : {type:String},
    time : {type:String},
    notes: [{
      conclusion_doctor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
      },
      conclusion_hr_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hr',
      },
      conclusion: {
        type: String,
        required: false,
      },
      dateTime: {
        type: Date,
        default: Date.now()
      }
    }]

  },
  {
    timestamps: true,
  }
);

// // add plugin that converts mongoose to json
// healthDataSchema.plugin(toJSON);
// healthDataSchema.plugin(paginate);



/**
 * @typedef User
 */
const HealthData = mongoose.model('HealthData', healthDataSchema);

module.exports = HealthData;
