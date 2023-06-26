const express = require('express');
const validate = require('../../middlewares/validate');
const deviceValidation = require('../../validations/device.validation');
const deviceController = require('../../controllers/device.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.route('/add').post(auth('devices'), validate(deviceValidation.add),  deviceController.add);
router.route('/add/history').post(auth('devices'), deviceController.addHistory);
router.route('/get/deviceHistory').get(auth('devices'), deviceController.getDeviceHistory);
router.route('/edit/:deviceObjectId').put(auth('devices'), deviceController.update);
router.route('/delete/:deviceObjectId').delete(auth('devices'), deviceController.remove);
router.route('/list/:pagination/:page').get(auth('devices'), deviceController.deviceList);
router.route('/liststock').post(auth('devices'), deviceController.deviceListstock);
router.route('/listcollectUncollect').post(auth('devices'), deviceController.listcollectUncollect);
router.route('/byid/:deviceId').get(auth('devices'), deviceController.getbyId);
router.route('/broken').get(auth('devices'), deviceController.getbybroken);
router.route('/search').post(auth('devices'),deviceController.searchDevice);
router.route('/stats').get(auth('devices'),deviceController.deviceStats);
router.route('/healthDataByDeviceId').get(auth('devices'),deviceController.healthDataByDeviceId);

//Mio devices api's
router.post('/DeviceCert', deviceController.DeviceCert);
router.post('/devicetelemetry/:deviceparam', deviceController.devicetelemetry);
router.post('/forwardtelemetry', deviceController.forwardtelemetry);
router.post('/forwardstatus', deviceController.deviceBatteryStats);
router.get('/getDeviceSignal/:deviceId', deviceController.getDeviceSignal);
router.get('/getAllDevicesSignals', deviceController.getAllDeviceSignals);

module.exports = router;