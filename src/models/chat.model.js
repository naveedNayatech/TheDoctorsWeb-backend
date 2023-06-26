const mongoose = require('mongoose');


const chatSchema = mongoose.Schema(
  {
    patient_id:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    nurse_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hr',
    },
    message: {
      type: String,
      required: true,
    },
    messageStatus: {
      type: String,
      enum: ['message','reply'],
      default:'message'
    },
    readStatus: {
      type : Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef User
 */
const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
