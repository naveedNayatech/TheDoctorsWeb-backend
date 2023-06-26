const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');


const careplanSchema = mongoose.Schema(
  {
    assigned_doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    assigned_hr_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hr',
    },
    assigned_patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    Description: {
      type: String,
      required: false,
      trim: true,
    },
    readingsPerMonth: {
      type: Number,
      required: true,
      default: 16
    },
    readingsInSlot1 : {
      type : Number,
      default: 1
    },
    readingsInSlot2 : {
      type : Number,
      default: 1
    },

    // readingsPerDay: {
    //   type: Number,
    //   required: false,
    //   default: 2
    // },
    // timeOfReading: {
    //   type: Date,
    //   required: false
    // },

    fileName: { type: String }
  },
  {
    timestamps: true,
  }
);

// // add plugin that converts mongoose to json
// careplanSchema.plugin(toJSON);
// careplanSchema.plugin(paginate);



/**
 * @typedef User
 */
const Careplan = mongoose.model('Careplan', careplanSchema);

module.exports = Careplan;
