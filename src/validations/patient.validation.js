const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const add = {
  body: Joi.object().keys({
    emrId: Joi.string(),
    firstname: Joi.string(),
    lastname: Joi.string(),
    email: Joi.string().email(),
    // password: Joi.string().custom(password),
    DOB: Joi.date(),
    gender : Joi.string(),
    mobileNo : Joi.string(),
    phone1: Joi.string(),
    address: Joi.string(),
    insurancecompany : Joi.string(),
    insuranceId : Joi.string(),
    diseases : Joi.string(),
    rpmconsent: Joi.boolean(),
    consentdoc: Joi.boolean(),
    initialsetup: Joi.string(),
    patientType: Joi.string(),
    monthinitial: Joi.date(),
    assigned_doctor_id: Joi.objectId(),
    assigned_hr_id: Joi.objectId(),
    assigned_ccm_nurse_id: Joi.objectId(),
    assigned_devices: Joi.array(),
    ssn: Joi.string(),
    zipCode:Joi.string(),
    state:Joi.string(),
    city: Joi.string(),
    line2:Joi.string(),
    isCCM: Joi.boolean()
  }),
};



module.exports = {
  add,
 
};
