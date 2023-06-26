const Joi = require('joi');
const { password } = require('./custom.validation');
Joi.objectId = require('joi-objectid')(Joi);

const signup = {
  body: Joi.object().keys({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    DOB: Joi.date(),
    npinumber: Joi.string(),
    licensenumber: Joi.string(),
    specialization: Joi.string(),
    gender : Joi.string(),
    mobileNo : Joi.string(),
    phone1: Joi.string(),
    assigned_doctor_id: Joi.objectId(),

  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

module.exports = {
  signup,
  login
 
};
