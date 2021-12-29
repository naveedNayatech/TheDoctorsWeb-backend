const express = require('express');
const router = express.Router();

const { isAuthenticatedUser } =  require('../middlewares/auth');

const { registerAdmin, loginAdmin, logoutAdmin, updatePassword } = require('../controller/Admin/authController');
const { registerDoctor, 
    patientsList, 
    getPatientProfile, 
    updatePatient, 
    doctorsList, 
    getDoctorProfile, 
    updateDoctor,
    DeviceCert,
    devicetelemetry,
    forwardtelemetry,
    getDeviceData
} = require('../controller/Admin/adminController');
const { loginDoctor } = require('../controller/Doctor/authController');
const { registerPatient } = require('../controller/Doctor/doctorController');


router.route('/registeradmin').post(registerAdmin);
router.route('/adminlogin').post(loginAdmin);
router.route('/adminlogout').get(logoutAdmin);
router.route('/admin/registerdoctor').post(registerDoctor);
router.route('/login').post(loginDoctor);
router.route('/admin/registerpatient').post(isAuthenticatedUser, registerPatient);
router.route('/admin/patientslist').get(patientsList);
router.route('/admin/patient').post(getPatientProfile);
router.route('/admin/patient').put(updatePatient);
router.route('/admin/doctorslist').get(doctorsList);
router.route('/admin/doctor').post(getDoctorProfile)
                             .put(updateDoctor);
router.route('/admin/update').put(updatePassword);

router.post('/DeviceCert', DeviceCert);
router.post('/devicetelemetry/:deviceparam', devicetelemetry);
router.post('/forwardtelemetry', forwardtelemetry);
router.post('/devicedata', getDeviceData);



module.exports = router;