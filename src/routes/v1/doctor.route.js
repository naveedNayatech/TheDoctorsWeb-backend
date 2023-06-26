const express = require('express');
const validate = require('../../middlewares/validate');
const doctorValidation = require('../../validations/doctor.validation');
const doctorController = require('../../controllers/doctor.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.route('/signup').post(auth('drsignup'), validate(doctorValidation.signup), doctorController.signup);
router.route('/signout').post(auth('doctors'),doctorController.signout);
router.post('/login', validate(doctorValidation.login), doctorController.login);
router.route('/list/:pagination/:page').get(auth('doctors'), doctorController.doctorList);
router.route('/search').post(auth('doctors'),doctorController.searchDoctor);
router.route('/doctorbyid/:doctorId').get(auth('doctors'), doctorController.doctorbyid);
router.route('/patientlist/:doctorId').post(auth('doctorsAndAdmin'), doctorController.patientlist);
router.route('/patientlist/ccm/:doctorId').post(auth('doctorsAndAdmin'), doctorController.doctorPatientlistCCM);
router.route('/edit/:doctorId').put(auth('doctorsAndAdmin'), doctorController.update);
router.route('/removeHr').post(auth('doctors'), doctorController.removeHr);
router.route('/allPatientHealthRecords').post(auth('doctors'), doctorController.patientshealthdata);
router.route('/doctorStats').post(auth('doctors'), doctorController.doctorStats);
router.route('/getCriticalDoctorPatientsOfDrHr').post(doctorController.getCriticalDataPatientsOfDoctor);









module.exports = router;
