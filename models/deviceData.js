const mongoose = require('mongoose');

const devicesSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Patient',
    },
    deviceId:{type:String},
    telemetaryData:{},
    comments:{type:String},
    createdAt: {
        type: Date,
        default: Date.now,
    },
});





module.exports = mongoose.model('deviceData', devicesSchema);
