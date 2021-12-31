const mongoose = require('mongoose');

const devicesSchema = new mongoose.Schema({
    deviceId: {
        type: String
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

    createdAt: {
        type: Date,
        default: Date.now,
    },
});


module.exports = mongoose.model('device', devicesSchema);
