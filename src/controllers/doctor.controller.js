const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const {doctorService, tokenService } = require('../services');
const { Notification, Log } = require('../models');
const moment = require('moment');

const signup = catchAsync(async (req, res) => {
  const doctor = await doctorService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(doctor);

  await Log.create({
    text: `${req?.user?.name !== undefined ? `${req?.user?.name} created a Doctor.` : '' || req?.user?.firstname !== undefined && req?.user?.lastname ? `${req?.user?.firstname !== undefined + " " + req?.user?.lastname} created a Doctor.` : ''}${doctor?.firstname + " " + doctor?.lastname} signed up as Doctor `,
    doctor_id:doctor._id,
    ...(req.user?.role === 'admin' && {admin_id:req.user._id}),
    ...(req.user?.role === 'HrMedical' && {hr_id:req.user._id}),
    type:"accountCreated",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.status(httpStatus.CREATED).send({ doctor, tokens });
});

const signout = catchAsync(async (req, res) => {
  

  await Log.create({
    text: `${req?.user?.firstname + " " + req?.user?.lastname + ' signed out as doctor'} `,
    doctor_id:req?.user?._id,
    type:"logs",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.status(200).send({ message:"signed out" });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const doctor = await doctorService.loginDoctorWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(doctor);

  await Log.create({
    text: `${doctor?.firstname + " " + doctor?.lastname} logged in as doctor `,
    doctor_id:doctor?._id,
    type:"logs",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.send({ doctor, tokens });
});


const doctorList = catchAsync(async (req, res) => {
  const pagination = req.params.pagination ? parseInt(req.params.pagination) : 5;
  const page = req.params.page ? parseInt(req.params.page) : 1;

  const doctorList = await doctorService.doctorList(page,pagination);
  res.status(httpStatus.CREATED).send( doctorList );
});

const doctorbyid = catchAsync(async (req, res) => {
  const doctorbyid = await doctorService.doctorbyid(req.params.doctorId);
  res.status(httpStatus.CREATED).send( doctorbyid );
});

const patientlist = catchAsync(async (req, res) => {
  const patientlist = await doctorService.patientlist(req.params.doctorId,req.body);
  res.status(httpStatus.CREATED).send( patientlist );
})


const doctorPatientlistCCM = catchAsync(async (req, res) => {
  const ccmPatientlist = await doctorService.ccmPatientlistOfDr(req.params.doctorId,req.body);
  res.status(httpStatus.CREATED).send( ccmPatientlist );
})

const update = catchAsync(async (req, res) => {
  const doctorUpdate = await doctorService.updateDoctor(req.params.doctorId,req.body);
  await Log.create({
    text:`${req?.user?.name  || req?.user?.firstname +" "+ req?.user?.lastname} updated a doctor profile with name as ${doctorUpdate?.firstname} ${doctorUpdate?.lastname} `,
    // patient_id: patient?._id,
    ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    type:"update",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.status(httpStatus.CREATED).send( doctorUpdate );
});

const searchDoctor = catchAsync(async (req, res) => {
  const searchDoctor = await doctorService.searchDoctor(req.body);
  res.status(httpStatus.CREATED).send( searchDoctor );
});

const removeHr = catchAsync(async (req, res) => {
  const removeHr = await doctorService.removeHr(req.body);
  res.status(httpStatus.CREATED).send( removeHr );
});

const patientshealthdata = catchAsync(async (req, res) => {
  const patientshealthdata = await doctorService.patientshealthdata(req.body);
  res.status(httpStatus.CREATED).send( patientshealthdata );
});

const doctorStats = catchAsync(async (req, res) => {
  const doctorPatientsStats = await doctorService.doctorStatsData(req.body);
  res.status(httpStatus.CREATED).send( doctorPatientsStats );
});


const getCriticalDataPatientsOfDoctor = catchAsync(async (req, res) => {
  const criticalPatients = await doctorService.DoctorCriticalPatients(req.body);
  res.status(httpStatus.CREATED).send( criticalPatients );
});


module.exports = {
  signup,
  login,
  doctorList,
  doctorbyid,
  patientlist,
  update,
  searchDoctor,
  removeHr,
  patientshealthdata,
  signout,
  doctorStats,
  getCriticalDataPatientsOfDoctor,
  doctorPatientlistCCM
};
