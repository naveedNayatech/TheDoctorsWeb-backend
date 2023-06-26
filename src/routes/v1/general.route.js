

const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const { generalController } = require('../../controllers');
const router = express.Router();

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/uploads');
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// 

router.route('/uploadfile').post(upload.single('file'), generalController.uploadFile);
router.route('/images').post(upload.single('image'), generalController.uploadImage);

//reports
router.route('/report/initialsetup').post(auth('reports'), generalController.initialSetupReport);

//notification
router.route('/notifications').post(auth('notifications'), generalController.getNotifications);

// reset password for all
router.route('/resetpasswordanyuser').post(auth('adminPasswordReset'), generalController.resetpasswordanyuser);

//send admin file for patient add approval
router.route('/requestpatientaddapproval').post(generalController.requestpatientaddapproval);

//Assign or Unassign dr/hr to multiple patients
router.route('/assignToMultiplePatients').post(auth('assignMultiple'),generalController.assignToMultiplePatients);

//total minutes total reading of all patient of a doctor/hr
router.route('/minutereadingtotaldrhr').post(auth('reporttotaltimereading'),generalController.minutereadingtotaldrhr);
router.route('/totalMinutesSpentdrhrInCCM').post(auth('reporttotaltimereading'), generalController.minutetotaldrhrCCM);
router.route('/billingReport').post(auth('reporttotaltimereading'),generalController.billingreport);
router.route('/billingReport/ccm').post(auth('reporttotaltimereading'),generalController.billingreportCCM);


//total minutes total reading of all patient of a doctor/hr
router.route('/totalMinutesReadingsCountHistory').post(auth('reporttotaltimereading'),generalController.minutesReadingsCountHistory);
router.route('/totalMinutesReadingsCountHistoryOfCCM').post(auth('reporttotaltimereading'),generalController.minutesReadingsCountHistoryOfCCM);

//Chat app
router.route('/sendMessage').post(generalController.createMessage);
router.route('/getMessages').post(generalController.getMessage);

// Dr CCM Patients that nurses and doctors both can see.
router.route('/ccmpatients/list/:pagination/:page').post(auth('ccmPts'), generalController.generalCCMPtsList);
router.route('/getDoctorNurses').post(auth('doctorNurses'), generalController.doctorNurses);




module.exports = router;


