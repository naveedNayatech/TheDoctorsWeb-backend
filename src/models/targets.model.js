const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');


const targetSchema = mongoose.Schema(
  {
    
    assigned_hr_id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hr',
    },
    assigned_patient_id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    startDate: {
      type: String,
    },
    endDate: {
      type: String,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    isCCM: {
      type: Boolean,
      dafault: false
    },
    interactiveMinutes: {
      type: Boolean,
      default: false
    },
    timeSpentInMinutes: {
      type: Number,
      required: true,
      trim: true,
    },
    conclusion: {
      type: String,
      required: true,
    },
    fileName: { type: String }
  },
  {
    timestamps: true,
  }
);


/**
 * @typedef User
 */
const Target = mongoose.model('Target', targetSchema);

module.exports = Target;
