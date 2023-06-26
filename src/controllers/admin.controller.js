const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const {adminService, tokenService } = require('../services');
const moment = require('moment');
const { Log } = require('../models');

const signup = catchAsync(async (req, res) => {
  const admin = await adminService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(admin);

  await Log.create({
    text:`${admin._doc?.name} signed up as admin`,
    admin_id:admin._doc?._id,
 
    type:"accountCreated",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.status(httpStatus.CREATED).send({ admin, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const Admin = await adminService.loginAdminWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(Admin);
 
  await Log.create({
    text:`${Admin._doc?.name} logged in as admin`, 
    ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
 
    type:"logs",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.send({ Admin, tokens });
});


const adminProfile = catchAsync(async (req, res) => {
  const admin = await adminService.getAdminById(req.params.Id);
  res.status(httpStatus.CREATED).send( admin );
})

const update = catchAsync(async (req, res) => {
  const adminUpdate = await adminService.updateAdmin(req.params.adminId,req.body);
  res.status(httpStatus.CREATED).send(adminUpdate);
})

const updateAndAddImage = catchAsync(async (req, res) => {
  const adminUpdate = await adminService.updateAdminAddImage(req.params.adminId,req.body);
  res.status(httpStatus.CREATED).send(adminUpdate);
})


const updateTelemetary = catchAsync(async (req, res) => {
  const telemetaryData = await adminService.updateTelemetaryData(req.params.Id,req.body);
  res.status(httpStatus.CREATED).send(telemetaryData);
})

const stats = catchAsync(async (req, res) => {
  const stats = await adminService.stats();
  res.status(httpStatus.CREATED).send( stats );
});

const deleteAccount = catchAsync(async (req, res) => {
  const adminDelete = await adminService.deleteAdminAccount(req.params.adminId);
  res.status(httpStatus.CREATED).send( adminDelete );
})

const deleteMinutes = catchAsync(async (req, res) => {
  const minutesDelete = await adminService.deleteHRMinutes(req.params.minutesId);
  res.status(httpStatus.CREATED).send( minutesDelete );
})

const getLogs = catchAsync(async (req, res) => {
  const getLogs = await adminService.getLogs(req.body);
  res.status(httpStatus.CREATED).send(getLogs);
});

const getlistofpendingapprovals = catchAsync(async (req, res) => {
  const getlistofpendingapprovals = await adminService.getlistofpendingapprovals();
  res.status(httpStatus.CREATED).send(getlistofpendingapprovals);
});

const adminlist = catchAsync(async (req, res) => {
  const admins = await adminService.getListOfAdmins();
  res.status(httpStatus.CREATED).send(admins);
})


const approvePendingApprovals = catchAsync(async (req, res) => {
  const approvePendingApprovals = await adminService.approvePendingApprovals(req.body);
  res.status(httpStatus.CREATED).send(approvePendingApprovals);
});


const addBill = catchAsync(async (req, res) => {
  const bill = await adminService.createBill(req.body); 
  res.status(httpStatus.CREATED).send({ bill });
});


const getByBillStatus = catchAsync(async (req, res) => {
  const bill = await adminService.getBilledStatusByCond(req.body); 
  res.status(httpStatus.CREATED).send({ bill });
});

const getCriticalData = catchAsync(async (req, res) => {
  const patients = await adminService.getListOfCriticalTelemetaryData();
  res.status(httpStatus.CREATED).send(patients);
})

const getAllTargetedMinutes = catchAsync(async (req, res) => {
  const targets = await adminService.getListOfTargets();
  res.status(httpStatus.CREATED).send(targets);
})

const getRecentReadings = catchAsync(async (req, res) => {
  const readings = await adminService.getListOfRecentReadings();
  res.status(httpStatus.CREATED).send(readings);
})

const getMonthlyData = catchAsync(async (req, res) => {
  const stats = await adminService.getListOfTargetsByMonth(req.body);
  res.status(httpStatus.CREATED).send(stats);
})

module.exports = {
  signup,
  login,
  update,
  stats,
  getLogs,
  adminlist,
  deleteAccount,
  getlistofpendingapprovals,
  approvePendingApprovals,
  updateTelemetary,
  deleteMinutes,
  addBill,
  getByBillStatus,
  getCriticalData,
  getAllTargetedMinutes,
  getRecentReadings,
  updateAndAddImage,
  adminProfile,
  getMonthlyData
};
