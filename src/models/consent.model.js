const mongoose = require('mongoose');

const ConsentSchema = mongoose.Schema(
  {
    assigned_patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    assigned_hr_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hr',
      required: true
    },
    description: {
      type: String,
      required: false
    },
    type: {
      type: String,
      enum : ["Written","Verbal"],
      default : 'Written'
    },
    consentType: {
      type: String,
      enum : ["RPM","CCM", 'Both'],
      default : 'CCM'
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
const Consent = mongoose.model('Consent', ConsentSchema);

module.exports = Consent;
