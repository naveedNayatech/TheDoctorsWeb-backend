const mongoose = require('mongoose');

const ccmCareplanSchema = mongoose.Schema(
  {
    assigned_patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    fileName: { type: String },
    addedBy: {
        type: String,
        required: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef User
 */
const CCMCareplan = mongoose.model('CCMCareplan', ccmCareplanSchema);

module.exports = CCMCareplan;
