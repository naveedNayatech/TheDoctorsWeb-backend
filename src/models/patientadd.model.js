const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const patientAddSchema = mongoose.Schema(
    {
        assigned_doctor_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
        },
        assigned_hr_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hr',
        },
        fileName: {
            type: String
        },
        patientCount: {
            type: Number
        },
        approved: {
            type: Boolean,
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
const PatientAdd = mongoose.model('PatientAdd', patientAddSchema);

module.exports = PatientAdd;
