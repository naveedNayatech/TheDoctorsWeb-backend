const mongoose = require('mongoose');

const devicesSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        unique: true,
    },
    imei: { type: String },
    modelNumber: { type: String },
    status: { type: Boolean },
    lastActive: { type: String },
    signal: {
        type: String,
        enum: ['low', 'medium','high'],
    },
    battery:{type:String},
    modemVersion: { type: String },
    firmwareVersion: { type: String },
    manufecture: { type: String },
    connectionStatus: { type: String, enum: ['connected', 'disconnected',], },
    hardwareVersion: { type: String },
    User:{ type: String},
    iccid: { type: String },
    imsi:{ type: String },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});


module.exports = mongoose.model('device', devicesSchema);
