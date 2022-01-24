const mongoose = require('mongoose');

const devicesSchema = new mongoose.Schema({
    assigned_patient_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
      },
    deviceId: {
        type: String,
        unique: true,
    },
    imei: { type: String },
    modelNumber: { type: String },
    broken: { type: Boolean },
    // lastActive: { type: String },
    // signal: {
    //     type: String,
    //     enum: ['low', 'medium','high'],
    // },
    deviceType: { type: String,
        enum : ["bp","weight","spo2",'glocometer'] 
    },
    // battery:{type:String},
    // modemVersion: { type: String },
    firmwareVersion: { type: String },
    // manufecture: { type: String },
    // connectionStatus: { type: String, enum: ['connected', 'disconnected',], },
    hardwareVersion: { type: String },
    // User:{ type: String},
    // iccid: { type: String },
    // imsi:{ type: String },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});


module.exports = mongoose.model('device', devicesSchema);
