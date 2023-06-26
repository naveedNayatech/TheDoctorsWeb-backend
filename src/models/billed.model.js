const mongoose = require('mongoose');


const billedSchema = mongoose.Schema(
  {
    assigned_patient_id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    isBilled: {
      type: Boolean,
      default: false
    },
    billedMonth: {
      type: String,
      required: true
    },
    billedCategory: {
        type: String,
        required: true
    },
    billedBy: {
      type : String,
      required: false
    }
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
const Billed = mongoose.model('Billed', billedSchema);

module.exports = Billed;
