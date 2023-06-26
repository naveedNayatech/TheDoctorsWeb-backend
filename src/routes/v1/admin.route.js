const express = require('express');
const validate = require('../../middlewares/validate');
const adminValidation = require('../../validations/admin.validation');
const adminController = require('../../controllers/admin.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.post('/signup', auth('deleteadmin'),validate(adminValidation.signup), adminController.signup);
router.post('/login', validate(adminValidation.login),adminController.login);
router.post('/profile/:Id', adminController.adminProfile);
router.put('/edit/:adminId', auth('deleteadmin'), validate(adminValidation.update), adminController.update);
router.put('/edit/profileImg/:adminId', validate(adminValidation.update), adminController.updateAndAddImage);
router.get('/stats',auth('adminslist'),adminController.stats);
router.delete('/delete/:adminId', auth('deleteadmin'),adminController.deleteAccount);
router.get('/adminlist', auth('adminslist'), adminController.adminlist);
router.post('/logs',auth('logs'), adminController.getLogs);
router.get('/getlistofpendingapprovals',auth('patientApproval'), adminController.getlistofpendingapprovals);
router.post('/approvepatientlist',auth('patientApproval'), adminController.approvePendingApprovals);
router.put('/telemetaryData/:Id', adminController.updateTelemetary);
router.delete('/delete/hrMinutes/:minutesId', auth('deleteminute'),adminController.deleteMinutes);

router.post('/addBill', auth('patientApproval'), adminController.addBill);
router.post('/getByBillStatus', auth('patientApproval'), adminController.getByBillStatus);

// Critical Telemetary Data
router.route('/getCriticalData', auth('criticalTelemetaryData')).get(adminController.getCriticalData);
router.route('/getRecentReadings').get(adminController.getRecentReadings);
router.get('/targets', auth('patientApproval'), adminController.getAllTargetedMinutes);

// stats
router.post('/minutesMonthlyStats', auth('patientApproval'), adminController.getMonthlyData);


module.exports = router;
