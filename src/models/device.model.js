const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const deviceSchema = mongoose.Schema(
    {
        assigned_patient_id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
          },
          assignedTime:{
              type:String
          },
        _id: {
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
            // enum : ["bp","weight","spO2",'glocometer']
        },
        unassignDate:{type:String},
        broken: { type: Boolean },
        firmwareVersion: { type: String },
        hardwareVersion: { type: String },
        block:{type:Boolean},
        shouldCollect:{type:Boolean,default:false},
        isCollected:{type:Boolean,default:false},        
    },
    {
        timestamps: true,
    }

);


/**
 * @typedef User
 */
const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
