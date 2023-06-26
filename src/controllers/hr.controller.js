const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const {hrService, tokenService } = require('../services');
const { Notification, Log } = require('../models');
const moment = require('moment');

const signup = catchAsync(async (req, res) => {
  const hr = await hrService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(hr);

  await Notification.create({
    hrId: hr?._id,
    noti_type: "user added",
    textAny: hr?.firstname + " " + hr?.lastname + " " + "was added/signed up to vitals portal",
    admin: true
  })

  await Log.create({
    text: `${req?.user?.name !== undefined ? `${req?.user?.name} created a hr.` : '' || req?.user?.firstname !== undefined && req?.user?.lastname ? `${req?.user?.firstname !== undefined + " " + req?.user?.lastname} created a hr.` : ''}${hr?.firstname + " " + hr?.lastname} signed up as hr `,
    hr_id:hr._id,
    ...(req.user?.role === 'admin' && {admin_id:req.user._id}),
    ...(req.user?.role === 'doctor' && {doctor_id:req.user._id}),
    type:"accountCreated",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.status(httpStatus.CREATED).send({ hr, tokens });
});

const signout = catchAsync(async (req, res) => {
  
  await Log.create({
    text: `${req?.user?.firstname + " " + req?.user?.lastname + ' signed out as Hr'} `,
    hr_id:req?.user?._id,
    type:"logs",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.status(200).send({ message:"signed out" });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const hr = await hrService.loginHrWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(hr);
  
  await Log.create({
    text:`${hr?.firstname + " " + hr?.lastname} logged in  as hr  `,
    hr_id:hr._id,
    ...(req.user?.role === 'admin' && {admin_id:req.user._id}),
    ...(req.user?.role === 'doctor' && {doctor_id:req.user._id}),
    type:"logs",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.send({ hr, tokens });
});


const updatePassword = catchAsync(async (req, res) => {
  const hrUpdate = await hrService.changeNursePassword(req.params.hrId,req.body);
  res.status(httpStatus.CREATED).send(hrUpdate);
})

const hrList = catchAsync(async (req, res) => {
  const hrList = await hrService.hrList();
  res.status(httpStatus.CREATED).send( hrList );
});

const hrbyid = catchAsync(async (req, res) => {
  const hrbyid = await hrService.hrbyid(req.params.hrId);
  res.status(httpStatus.CREATED).send( hrbyid );
});

const patientlist = catchAsync(async (req, res) => {
  const patientlist = await hrService.patientlist(req.params.drId,req.body);
  res.status(httpStatus.CREATED).send( patientlist );
})

const assignedPatientlist = catchAsync(async (req, res) => {
  const patientlist = await hrService.assignedPatients(req.params.hrId,req.body);
  res.status(httpStatus.CREATED).send( patientlist );
})


const update = catchAsync(async (req, res) => {
  const hrUpdate = await hrService.updateHr(req.params.hrId,req.body);
 
  await Log.create({
    text:`${req?.user?.name  || req?.user?.firstname +" "+ req?.user?.lastname} updated hr name as ${hrUpdate?.firstname} ${hrUpdate?.lastname}  `,
    // patient_id: patient?._id,
    ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    type:"update",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.status(httpStatus.CREATED).send( hrUpdate );
});

const addtimeforpatient = catchAsync(async (req, res) => {
  const addtimeforpatient = await hrService.addtimeforpatient(req.params.hrId,req.body,req.user);
  
  res.status(httpStatus.CREATED).send( addtimeforpatient );
});

const totaltimespend = catchAsync(async (req, res) => {
  const totaltimespend = await hrService.totaltimespend(req.body);
  await Log.create({
    text:`${req?.user?.name  || req?.user?.firstname +" "+ req?.user?.lastname} accessed total time spent`,
    ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    type:"report",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.status(httpStatus.CREATED).send( totaltimespend );
});

// 
const totaltimespendByDoctor = catchAsync(async (req, res) => {
  const totaltimespend = await hrService.totaltimespendByDoctorNurses(req.body);
  res.status(httpStatus.CREATED).send( totaltimespend );
});


const totaltimespendinCCM = catchAsync(async (req, res) => {
  const totaltimespendCCM = await hrService.totaltimespendinCCMCategory(req.body);
  res.status(httpStatus.CREATED).send( totaltimespendCCM );
});


const blockHr = catchAsync(async (req, res) => {
  const blockHr = await hrService.blockHr(req.params.hrId,req.user);
  res.status(httpStatus.CREATED).send( blockHr );
});

const removeDr = catchAsync(async (req, res) => {
  const removeDr = await hrService.removeDr(req.body);
  res.status(httpStatus.CREATED).send( removeDr );
});

const patientshealthdata = catchAsync(async (req, res) => {
  const patientshealthdata = await hrService.patientshealthdata(req.body);
  res.status(httpStatus.CREATED).send( patientshealthdata );
});

const hrStats = catchAsync(async (req, res) => {
  const hrPatientsStats = await hrService.hrStatsData(req.body);
  res.status(httpStatus.CREATED).send( hrPatientsStats );
});

const hrRecentReadings = catchAsync(async (req, res) => {
  const readings = await hrService.getListOfRecentReadings(req.body);
  res.status(httpStatus.CREATED).send(readings);
})


module.exports = {
  signup,
  login,
  hrList,
  hrbyid,
  patientlist,
  update,
  addtimeforpatient,
  totaltimespend,
  totaltimespendinCCM,
  blockHr,
  removeDr,
  patientshealthdata,
  hrStats,
  signout,
  totaltimespendByDoctor,
  hrRecentReadings,
  assignedPatientlist,
  updatePassword
};
