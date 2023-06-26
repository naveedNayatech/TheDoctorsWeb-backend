const mongoose = require('mongoose');


const LogSchema = mongoose.Schema(
  {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'admin'
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    hr_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hr',
    },
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    text: { type: String },
    type: {
      type: String,
      enum: ['accountCreated','targets','hr','doctor','careplan','careplanCreated','careplanfile','docUpload','logs','device','update','report','patient']
    },
    date: { type: String },
    time: { type: String },

  },
  {
    timestamps: true,
  }
);


const Log = mongoose.model('Log', LogSchema);

module.exports = Log;
