const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');


const taskSchema = mongoose.Schema(
  {
    
    assignedBy:{
     id:{
         type:mongoose.Schema.Types.ObjectId
     },
     role:{
         enum:[ 'HrMedical','HrNonMedical','doctor'],
         type:String
     },
     name:{type:String}
    },
    assignedTo:{
        id:{
            type:mongoose.Schema.Types.ObjectId
        },
        role:{
            enum:[ 'HrMedical','HrNonMedical','doctor'],
            type:String
        },
        name:{type:String}
       },

    deviceId:{
        type: String,
        ref: 'Device',
    },
 
    description: {
      type: String,
      required: true,
      
    },
    wasCompleted:{
        type:Boolean,
        default:false
    }
    
  },
  {
    timestamps: true,
  }
);

// // add plugin that converts mongoose to json
// taskSchema.plugin(toJSON);
// taskSchema.plugin(paginate);



/**
 * @typedef User
 */
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
