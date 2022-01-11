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
    getDeviceData,
    commentDeviceData,
    addDevice,
    updateDevice,
    getDeviceDetails,
    devicesList,
    getdevicedatabwdates,
    assignDevice,
    removeDevice
} = require('../controller/Admin/adminController');
const { loginDoctor, logoutDoctor } = require('../controller/Doctor/authController');
const { registerPatient } = require('../controller/Doctor/doctorController');


router.route('/registeradmin').post(registerAdmin);
router.route('/adminlogin').post(loginAdmin);
router.route('/adminlogout').get(logoutAdmin);
router.route('/admin/registerdoctor').post(registerDoctor);
router.route('/login').post(loginDoctor);
router.route('/stafflogout').get(logoutDoctor);
router.route('/admin/registerpatient').post(isAuthenticatedUser, registerPatient);
router.route('/admin/patientslist').get(patientsList);
router.route('/admin/patient').post(getPatientProfile);
router.route('/admin/patient').put(updatePatient);
router.route('/admin/doctorslist').get(doctorsList);
router.route('/admin/doctor').post(getDoctorProfile)
                             .put(updateDoctor);
router.route('/admin/update').put(updatePassword);
router.post('/admin/assignDeviceToPatient', assignDevice);
router.post('/admin/removeDeviceFromPatient', removeDevice)

router.post('/DeviceCert', DeviceCert);
router.post('/devicetelemetry/:deviceparam', devicetelemetry);
router.post('/forwardtelemetry', forwardtelemetry);
router.post('/devicedata', getDeviceData);

router.post('/admin/commentdevicedata', commentDeviceData);



//devices
router.post('/device/add', addDevice);
router.post('/device/update/:deviceId', updateDevice);
router.post('/device',getDeviceDetails);
router.get('/devices',devicesList);
router.post('/getdevicedataforpatient', getdevicedatabwdates);





module.exports = router;