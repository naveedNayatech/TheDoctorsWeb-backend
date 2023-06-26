const express = require('express');
const validate = require('../../middlewares/validate');
const patientValidation = require('../../validations/patient.validation');
const patientController = require('../../controllers/patient.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

//Crud Patients
router.route('/add').post(auth('patients'), validate(patientValidation.add),  patientController.add);
router.route('/checkduplicates').post(auth('patients'), patientController.checkduplicates);
router.route('/edit/:patientId').put(auth('patients'),validate(patientValidation.add), patientController.update);
router.route('/block/:patientId').post(auth('patients'), patientController.blockPatient);
router.route('/list/:pagination/:page').get(auth('patients'), patientController.patientList);
router.route('/ccm/list/:pagination/:page').get(patientController.ccmPatientList);
router.route('/Inactive').get(patientController.InactivePatients);
router.route('/search').post(auth('patients'),patientController.searchPatient);
router.route('/ccm/search').post(auth('patients'),patientController.searchCCMPatient);
router.route('/search/accountStatus').post(auth('patients'),patientController.filterPatientByAccount);
router.route('/patientprofile/:patientId').get(auth('patients'),patientController.patientProfile);

router.route('/getpatientbydeviceid').post(auth('patients'), patientController.getuserbydeviceid);
router.route('/filterpatienthealthData/:pagination/:page').post(auth('patients'), patientController.filterpatienthistory);
router.route('/getReadingbyId/:readingId').get(auth('patients'), patientController.getHealthReadingbyId);
router.route('/getReadingCount/:patientId').post(auth('patients'), patientController.getHealthReadingCount);
router.route('/commentonreading/:readingId').put(auth('patientsReadingComment'), patientController.commentOnReading);

router.route('/addCarePlan').post(auth('careplan'), patientController.addCarePlan);
router.route('/CarePlan/:patientId').get(auth('careplan'), patientController.getCarePlan);
router.route('/editcareplan/:carePlanId').put(auth('careplan'), patientController.carePlanUpdate);

// CCM Careplan
router.route('/add/CCMCarePlan').post(auth('careplan'), patientController.addCCMCarePlan);
router.route('/get/CCMCarePlan/:patientId').get(auth('careplan'), patientController.getCCMCarePlan);
router.route('/remove/CCMCarePlan/:careplanId').delete(auth('careplan'), patientController.removePatientCCMCareplan);

// Patient Consent
router.route('/add/CCMConsent').post(auth('careplan'), patientController.addCCMConsent);
router.route('/get/CCMConsent/:patientId/:consentType').get(auth('careplan'), patientController.getCCMConsent);
router.route('/delete/CCMConsent/:consentId').delete(auth('careplan'), patientController.removePatientCCMConsent);


router.route('/addremovedevice/:patientId').post(auth('careplan'), patientController.addremovedevice);

router.route('/CarePlanbydrhr').post(auth('careplan'), patientController.CarePlanbydrhr);
router.route('/remove/RPMCarePlan/:careplanId').delete(auth('careplan'), patientController.removePatientRPMCareplan);


router.route('/unsetHrDr').post(auth('unsetHrDr'), patientController.unsetHrDr);


module.exports = router;
