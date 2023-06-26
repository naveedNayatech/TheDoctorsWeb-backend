const express = require('express');
const validate = require('../../middlewares/validate');
const hrValidation = require('../../validations/hr.validation');
const hrController = require('../../controllers/hr.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.route('/signup').post(auth('hrsignup'), validate(hrValidation.signup), hrController.signup);
router.route('/signout').post(auth('hr'), hrController.signout);
router.post('/login', validate(hrValidation.login), hrController.login);
router.route('/changePassword/:hrId').put(auth('hr'), validate(hrValidation.changePassword), hrController.updatePassword);
router.route('/list').get(auth('hr'), hrController.hrList);
router.route('/hrbyid/:hrId').get(auth('hr'), hrController.hrbyid);
router.route('/patientlist/:drId').post( auth('hr'), hrController.patientlist);
router.route('/assigned/patientlist/:hrId').post( auth('hr'), hrController.assignedPatientlist);
router.route('/edit/:hrId').put(auth('hr'), hrController.update);
router.route('/addtimeforpatient/:hrId').post(auth('hr'), hrController.addtimeforpatient);
router.route('/listtargets&totaltime').post(auth('allModes'), hrController.totaltimespend);
router.route('/listtargets&totaltimeofCCMCategory').post(hrController.totaltimespendinCCM);
router.route('/block/:hrId').get(auth('hr'), hrController.blockHr);
router.route('/removeDr').post(auth('hr'), hrController.removeDr);
router.route('/allPatientHealthRecords').post(auth('hr'), hrController.patientshealthdata);
router.route('/hrStats').post(auth('hr'), hrController.hrStats);
router.route('/recentReadings').post(hrController.hrRecentReadings);

// Testing Query
router.route('/listtargets&totaltimeOfDoctor').post(auth('hr'), hrController.totaltimespendByDoctor);


module.exports = router;
