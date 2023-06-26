const mongoose = require('mongoose');

const deviceSignalSchema = mongoose.Schema(
  {
    assigned_patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    deviceId: {
      type: String,
      ref: 'Device',
    },
    signalData: {},
    dateAdded : {type:String},
    time : {type:String},
  },
  {
    timestamps: true,
  }
);


/**
 * @typedef User
 */
const DeviceSignal = mongoose.model('DeviceSignal', deviceSignalSchema);

module.exports = DeviceSignal;
