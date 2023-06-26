const mongoose = require('mongoose');

const deviceHistorySchema = mongoose.Schema(
    {
        assigned_patient_id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
          },
          assignedTime:{
              type:String
          },
        deviceID: {
            type: String,
        },
        imei: { 
            type: String,
            required : false,
         },
        modelNumber: { type: String },
        deviceType:{
            type : String,
            required : true,
        },
        unassignDate:{type:String},
        broken: { type: Boolean },
        firmwareVersion: { type: String },
        hardwareVersion: { type: String },
        actionPerformed: {
            type: String,
            enum: ['assigned','unassigned', 'deleted'],
        },
        actionPerformedBy: {
            type: String,
            required: false
        }
      },
    {
        timestamps: true,
    }
    );

    /**
 * @typedef User
 */
const DeviceHistory = mongoose.model('DeviceHistory', deviceHistorySchema);

module.exports = DeviceHistory;
