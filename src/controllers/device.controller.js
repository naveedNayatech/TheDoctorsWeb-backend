const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const {deviceService } = require('../services');
const { Notification, Log } = require('../models');
const moment = require('moment');

const add = catchAsync(async (req, res) => {
  const deviceAdd = await deviceService.createDevice(req.body);
  await Notification.create({
    noti_type: "device added",
    textAny: "a new device was added to vitals portal",
    admin: true
  })
  await Log.create({
    text:`${req?.user?.name  || req?.user?.firstname +" "+ req?.user?.lastname} added a new device with device id as ${req.body?._id}`,
    ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    type:"device",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.status(httpStatus.CREATED).send( deviceAdd );
});

const addHistory = catchAsync(async (req, res) => {
  const deviceHistoryAdd = await deviceService.createDeviceHistory(req.body);
  
  // await Notification.create({
  //   noti_type: "Device History Created",
  //   textAny: "A device history has been created.",
  //   admin: true
  // })

  res.status(httpStatus.CREATED).send( deviceHistoryAdd );
});

const update = catchAsync(async (req, res) => {
  const deviceUpdate = await deviceService.updateDevice(req.params.deviceObjectId,req.body);

  await Log.create({
    text:`${req?.user?.name  || req?.user?.firstname +" "+ req?.user?.lastname} updated a device with device id as ${req.params.deviceObjectId}`,
    // patient_id: patient?._id,
    ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    type:"device",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })

  res.status(httpStatus.CREATED).send( deviceUpdate );
});

const remove = catchAsync(async (req, res) => {
  const deviceDelete = await deviceService.deleteDevice(req.params.deviceObjectId);
  await Log.create({
    text:`${req?.user?.name  || req?.user?.firstname +" "+ req?.user?.lastname} deleted a device with device id as ${req.params.deviceObjectId}`,
    // patient_id: patient?._id,
    ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    type:"device",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.status(httpStatus.CREATED).send( deviceDelete );
});

const deviceList = catchAsync(async (req, res) => {
  const pagination = req.params.pagination ? parseInt(req.params.pagination) : 5;
  const page = req.params.page ? parseInt(req.params.page) : 1;

  const deviceList = await deviceService.deviceList(page,pagination);
  res.status(httpStatus.CREATED).send( deviceList );
});

const getDeviceHistory = catchAsync(async (req, res) => {
  const deviceList = await deviceService.deviceHistoryList();
  res.status(httpStatus.CREATED).send( deviceList );
});

const deviceListstock = catchAsync(async (req, res) => {
  const deviceListstock = await deviceService.deviceListstock(req.body);
  res.status(httpStatus.CREATED).send( deviceListstock );
});

const getbyId = catchAsync(async (req, res) => {
  const getbyId = await deviceService.getbyId(req.params.deviceId);
  res.status(httpStatus.CREATED).send( getbyId );
});

const getbybroken = catchAsync(async (req, res) => {
  const getbybroken = await deviceService.getbybroken();
  res.status(httpStatus.CREATED).send( getbybroken );
});


const healthDataByDeviceId = catchAsync(async (req, res) => {
  const healthData = await deviceService.getHealthDataByDeviceId(req.body.deviceId);
  res.status(httpStatus.CREATED).send( healthData );
});

const searchDevice = catchAsync(async (req, res) => {
  const searchDevice = await deviceService.searchDevice(req.body);
  res.status(httpStatus.CREATED).send( searchDevice );
});

const deviceStats = catchAsync(async (req, res) => {
  const deviceStats = await deviceService.deviceStats(req.body.search);
  res.status(httpStatus.CREATED).send( deviceStats );
});

const DeviceCert = catchAsync(async (req, res) => {
  const DeviceCert = await deviceService.DeviceCert(req.body);
  res.status(httpStatus.CREATED).send( DeviceCert );
});

const forwardtelemetry = catchAsync(async (req, res) => {
  const forwardtelemetry = await deviceService.forwardtelemetry(req.body);
  res.status(httpStatus.CREATED).send( forwardtelemetry );
});

const deviceBatteryStats = catchAsync(async (req, res) => {
  const batteryStats = await deviceService.getBatteryStats(req.body);
  res.status(httpStatus.CREATED).send( batteryStats );
});

const getDeviceSignal = catchAsync(async (req, res) => {
  const deviceSignal = await deviceService.getSpecificBatterySignal(req.params.deviceId);
  res.status(httpStatus.CREATED).send( deviceSignal );
});

const getAllDeviceSignals = catchAsync(async (req, res) => {
  const devicesSignal = await deviceService.getAllBatterySignal();
  res.status(httpStatus.CREATED).send( devicesSignal );
});

const devicetelemetry = catchAsync(async (req, res) => {
  const devicetelemetry = await deviceService.devicetelemetry(req.params.deviceparam,req.body);
  res.status('200').send( devicetelemetry );
});

const listcollectUncollect = catchAsync(async (req, res) => {
  const listcollectUncollect = await deviceService.listcollectUncollect(req.body);
  res.status(httpStatus.CREATED).send( listcollectUncollect );
});




module.exports = {
  add,
  update,
  remove,
  deviceList,
  deviceListstock,
  getbyId,
  getbybroken,
  searchDevice,
  DeviceCert,
  devicetelemetry,
  forwardtelemetry,
  deviceStats,
  listcollectUncollect,
  healthDataByDeviceId,
  deviceBatteryStats,
  getDeviceSignal,
  getAllDeviceSignals,
  addHistory,
  getDeviceHistory
};
