const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const add = {
  body: Joi.object().keys({
    assigned_patient_id: Joi.objectId(),
    _id: Joi.string().required(),
    imei: Joi.string(),
    modelNumber : Joi.string(),
    deviceType : Joi.string().required(),
    broken : Joi.boolean(),
    firmwareVersion : Joi.string(),
    hardwareVersion : Joi.string(),

  }),
};



module.exports = {
  add,
 
};
