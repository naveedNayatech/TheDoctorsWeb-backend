const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { patientService, tokenService } = require('../services');
const { Notification, Log, CCMCareplan } = require('../models');
const moment = require("moment");

const add = catchAsync(async (req, res) => {
  const patient = await patientService.createUser(req.body);
  // await Notification.create({
  //   patientId: patient?._id,
  //   noti_type: "user added",
  //   textAny: patient?.firstname + " " + patient?.lastname + " " + "was added to vitals portal",
  //   admin: true
  // })
  // await Log.create({
  //   text: `${req?.user?.name || req?.user?.firstname + " " + req?.user?.lastname} added a patient with name as ${patient?.firstname} ${patient.lastname} `,
  //   patient_id: patient?._id,
  //   ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
  //   ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
  //   ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
  //   type:"accountCreated",
  //   time: moment(new Date()).format("hh:mm A"),
  //   date: moment(new Date()).format("YYYY/MM/DD")
  // })

  // const tokens = await tokenService.generateAuthTokens(patient);
  res.status(httpStatus.CREATED).send(patient);
});


const update = catchAsync(async (req, res) => {
  const patientUpdate = await patientService.updatePatient(req.params.patientId, req.body, req.user);
 
  await Log.create({
    text: `${req?.user?.name || req?.user?.firstname + " " + req?.user?.lastname} updated a patient with name as ${patientUpdate?.firstname} ${patientUpdate.lastname} `,
    patient_id: patientUpdate?._id,
    ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    type:"update",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.status(httpStatus.CREATED).send(patientUpdate);
});

const blockPatient = catchAsync(async (req, res) => {
  const blockPatient = await patientService.blockPatient(req.params.patientId, req.body.block);
  if (req.body.block === true)
  await Log.create({
    text: `${req?.user?.name || req?.user?.firstname + " " + req?.user?.lastname} blocked a patient with name as ${blockPatient?.firstname} ${blockPatient?.lastname} `,
    patient_id: blockPatient?._id,
    ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    type:"patient",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  else
  await Log.create({
    text: `${req?.user?.name || req?.user?.firstname + " " + req?.user?.lastname} unblocked a patient with name as ${blockPatient?.firstname} ${blockPatient?.lastname} `,
    patient_id: blockPatient?._id,
    ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    type:"patient",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })

  res.status(httpStatus.CREATED).send(blockPatient);
});

const patientList = catchAsync(async (req, res) => {
  const pagination = req.params.pagination ? parseInt(req.params.pagination) : 5;
  const page = req.params.page ? parseInt(req.params.page) : 1;

  const patientList = await patientService.patientList(page, pagination);
  res.status(httpStatus.CREATED).send(patientList);
});


const ccmPatientList = catchAsync(async (req, res) => {
  const pagination = req.params.pagination ? parseInt(req.params.pagination) : 5;
  const page = req.params.page ? parseInt(req.params.page) : 1;

  const ccmPatientList = await patientService.getCCMPatients(page, pagination);
  res.status(httpStatus.CREATED).send(ccmPatientList);
});


const InactivePatients = catchAsync(async (req, res) => {
  const inactive = await patientService.getInactivePatients();
  res.status(httpStatus.CREATED).send(inactive);
});

const getuserbydeviceid = catchAsync(async (req, res) => {
  const getuserbydeviceid = await patientService.getuserbydeviceid(req.body.deviceId);
  res.status(httpStatus.CREATED).send(getuserbydeviceid);
});

const filterpatienthistory = catchAsync(async (req, res) => {
  const pagination = req.params.pagination ? parseInt(req.params.pagination) : 5;
  const page = req.params.page ? parseInt(req.params.page) : 1;

  const filterpatienthistory = await patientService.filterpatienthistory(req.body, page, pagination);
  res.status(httpStatus.CREATED).send(filterpatienthistory);
});

const patientProfile = catchAsync(async (req, res) => {
  const patientProfile = await patientService.patientProfile(req.params.patientId);

  await Log.create({
    text: `${req?.user?.name || req?.user?.firstname + " " + req?.user?.lastname} viewed a patient profile named as ${patientProfile?.firstname} ${patientProfile?.lastname} `,
    patient_id: patientProfile?._id,
    ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    type:"patient",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.status(httpStatus.CREATED).send(patientProfile);
});

const commentOnReading = catchAsync(async (req, res) => {
  const commentOnReading = await patientService.commentOnReading(req.params.readingId, req.body);

  await Log.create({
    text: `${req?.user?.name || req?.user?.firstname + " " + req?.user?.lastname} comment on a patient reading with and comment as : ${req.body?.conclusion}`,
    patient_id: req.body?.assigned_patient_id,
    ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    type:"patient",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.status(httpStatus.CREATED).send(commentOnReading);
});

const addCarePlan = catchAsync(async (req, res) => {
  const addCarePlan = await patientService.addCarePlan(req.body, req.user);
  await Log.create({
    text: `A new care plan was added for patient `,
    patient_id:addCarePlan?.assigned_patient_id,
    ...(req.user?.role === 'HrMedical' && {hr_id:req.user._id}),
    ...(req.user?.role === 'admin' && {admin_id:req.user._id}),
    ...(req.user?.role === 'doctor' && {doctor_id:req.user._id}),
    type:"careplanCreated",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  if(req.body.filename){
    await Log.create({
      text: `A new care plan file was added for patient `,
      patient_id:addCarePlan?.assigned_patient_id,
      ...(req.user?.role === 'HrMedical' && {hr_id:req.user._id}),
      ...(req.user?.role === 'admin' && {admin_id:req.user._id}),
      ...(req.user?.role === 'doctor' && {doctor_id:req.user._id}),
      type:"careplanfile",
      time: moment(new Date()).format("hh:mm A"),
      date: moment(new Date()).format("YYYY/MM/DD")
    })
  }
  res.status(httpStatus.CREATED).send(addCarePlan);
});

const getCarePlan = catchAsync(async (req, res) => {
  const getCarePlan = await patientService.getCarePlan(req.params.patientId);
  
  await Log.create({
    text: `${req?.user?.name || req?.user?.firstname + " " + req?.user?.lastname} accessed a careplan for patient ${getCarePlan?.assigned_patient_id?.firstname} ${getCarePlan?.assigned_patient_id?.lastname} `,
    patient_id: getCarePlan?.assigned_patient_id?._id,
    ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    type:"careplan",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })

  res.status(httpStatus.CREATED).send(getCarePlan);
});

const carePlanUpdate = catchAsync(async (req, res) => {
  const carePlanUpdate = await patientService.carePlanUpdate(req.params.carePlanId, req.body);
  await Log.create({
    text: `${req?.user?.name || req?.user?.firstname + " " + req?.user?.lastname} updated a careplan for patient and update body as ${JSON.stringify(req.body)}`,
    patient_id: carePlanUpdate?.assigned_patient_id?._id,
    ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    type:"careplan",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  if(req.body.filename){
    await Log.create({
      text: `A new care plan file was added for patient `,
      patient_id:carePlanUpdate?.assigned_patient_id,
      ...(req.user?.role === 'HrMedical' && {hr_id:req.user._id}),
      ...(req.user?.role === 'admin' && {admin_id:req.user._id}),
      ...(req.user?.role === 'doctor' && {doctor_id:req.user._id}),
      type:"careplanfile",
      time: moment(new Date()).format("hh:mm A"),
      date: moment(new Date()).format("YYYY/MM/DD")
    })
  }
  res.status(httpStatus.CREATED).send(carePlanUpdate);
});


// CCM Careplan
const addCCMCarePlan = catchAsync(async (req, res) => {
  const addCarePlan = await patientService.uploadCCMCarePlan(req.body, req.user);
  await Log.create({
    text: `CCM careplan added for patient`,
    patient_id:addCarePlan?.assigned_patient_id,
    ...(req.user?.role === 'HrMedical' && {hr_id:req.user._id}),
    ...(req.user?.role === 'admin' && {admin_id:req.user._id}),
    ...(req.user?.role === 'doctor' && {doctor_id:req.user._id}),
    type:"careplanCreated",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })

  if(req.body.filename){
    await Log.create({
      text: `CCM careplan file uploaded for patient`,
      patient_id:addCarePlan?.assigned_patient_id,
      ...(req.user?.role === 'HrMedical' && {hr_id:req.user._id}),
      ...(req.user?.role === 'admin' && {admin_id:req.user._id}),
      ...(req.user?.role === 'doctor' && {doctor_id:req.user._id}),
      type:"careplanfile",
      time: moment(new Date()).format("hh:mm A"),
      date: moment(new Date()).format("YYYY/MM/DD")
    })
  }
  res.status(httpStatus.CREATED).send(addCarePlan);
});

const getCCMCarePlan = catchAsync(async (req, res) => {
  const getCarePlan = await patientService.fetchCCMCarePlan(req.params.patientId);
  res.status(httpStatus.CREATED).send(getCarePlan);
});
 
const removePatientCCMCareplan = async (req, res) => {
  const deleteCarePlan = await patientService.deletePatientCCMCareplan(req.params.careplanId);
  
  await Log.create({
    text: `CCM careplan has been removed by admin.`,
    patient_id:addCarePlan?.assigned_patient_id,
    ...(req.user?.role === 'HrMedical' && {hr_id:req.user._id}),
    ...(req.user?.role === 'admin' && {admin_id:req.user._id}),
    ...(req.user?.role === 'doctor' && {doctor_id:req.user._id}),
    type:"careplanfile",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })

  res.status(httpStatus.CREATED).send(deleteCarePlan);
};


const removePatientRPMCareplan = async (req, res) => {
  const deleteCarePlan = await patientService.deletePatientRPMCareplan(req.params.careplanId);
  res.status(httpStatus.CREATED).send(deleteCarePlan);
};


const removePatientCCMConsent = async (req, res) => {
  const deleteConsent = await patientService.deletePatientCCMConsent(req.params.consentId);
  
  await Log.create({
    text: `CCM consent has been removed by admin.`,
    patient_id:addCarePlan?.assigned_patient_id,
    ...(req.user?.role === 'HrMedical' && {hr_id:req.user._id}),
    ...(req.user?.role === 'admin' && {admin_id:req.user._id}),
    ...(req.user?.role === 'doctor' && {doctor_id:req.user._id}),
    type:"careplanfile",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })

  res.status(httpStatus.CREATED).send(deleteConsent);
};

// CCM Consent
const addCCMConsent = catchAsync(async (req, res) => {
  const addConsent = await patientService.uploadConsent(req.body, req.user);
  await Log.create({
    text: `CCM Consent added for patient`,
    patient_id:addCarePlan?.assigned_patient_id,
    ...(req.user?.role === 'HrMedical' && {hr_id:req.user._id}),
    ...(req.user?.role === 'admin' && {admin_id:req.user._id}),
    ...(req.user?.role === 'doctor' && {doctor_id:req.user._id}),
    type:"careplanCreated",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })

  if(req.body.filename){
    await Log.create({
      text: `CCM consent file uploaded for patient`,
      patient_id:addCarePlan?.assigned_patient_id,
      ...(req.user?.role === 'HrMedical' && {hr_id:req.user._id}),
      ...(req.user?.role === 'admin' && {admin_id:req.user._id}),
      ...(req.user?.role === 'doctor' && {doctor_id:req.user._id}),
      type:"careplanfile",
      time: moment(new Date()).format("hh:mm A"),
      date: moment(new Date()).format("YYYY/MM/DD")
    })
  }
  res.status(httpStatus.CREATED).send(addConsent);
});

const getCCMConsent = catchAsync(async (req, res) => {
  const getConsent = await patientService.getPatientCCMConsent(req.params.patientId, req.params.consentType);
  res.status(httpStatus.CREATED).send(getConsent);
});

const addremovedevice = catchAsync(async (req, res) => {
  const addremovedevice = await patientService.addremovedevice(req.params.patientId, req.body, req.user);
  res.status(httpStatus.CREATED).send(addremovedevice);
});

const searchPatient = catchAsync(async (req, res) => {
  const searchPatient = await patientService.searchPatient(req.body);
  res.status(httpStatus.CREATED).send(searchPatient);
});

const searchCCMPatient = catchAsync(async (req, res) => {
  const ccmPatient = await patientService.ccmSearchPatient(req.body);
  res.status(httpStatus.CREATED).send(ccmPatient);
});

const filterPatientByAccount = catchAsync(async (req, res) => {
  const searchPatient = await patientService.filterPatientByStatus(req.body);
  res.status(httpStatus.CREATED).send(searchPatient);
});


const getHealthReadingbyId = catchAsync(async (req, res) => {
  const getHealthReadingbyId = await patientService.getHealthReadingbyId(req.params.readingId);
  await Log.create({
    text: `${req?.user?.name || req?.user?.firstname + " " + req?.user?.lastname} accessed a health data record with record id as ${req.params.readingId}  `,
    patient_id: getHealthReadingbyId?._doc?.assigned_patient_id._id,
    ...(req.user?.role === 'HrMedical' && {hr_id:req.user._id}),
    ...(req.user?.role === 'admin' && {admin_id:req.user._id}),
    ...(req.user?.role === 'doctor' && {doctor_id:req.user._id}),
    type:"patient",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  res.status(httpStatus.CREATED).send(getHealthReadingbyId);
});

const getHealthReadingCount = catchAsync(async (req, res) => {
  const getHealthReadingCount = await patientService.getHealthReadingCount(req.params.patientId,req.body);
  res.status(httpStatus.CREATED).send(getHealthReadingCount);
});

const CarePlanbydrhr = catchAsync(async (req, res) => {
  const CarePlanbydrhr = await patientService.CarePlanbydrhr(req.body);
  res.status(httpStatus.CREATED).send(CarePlanbydrhr);
});

const checkduplicates = catchAsync(async (req, res) => {
  const checkduplicates = await patientService.checkduplicates(req.body);
  res.status(httpStatus.CREATED).send(checkduplicates);
});

const unsetHrDr = catchAsync(async (req, res) => {
  const unsetHrDr = await patientService.unsetHrDr(req.body);
  res.status(httpStatus.CREATED).send(unsetHrDr);
});

module.exports = {
  add,
  update,
  blockPatient,
  patientList,
  getuserbydeviceid,
  filterpatienthistory,
  patientProfile,
  filterPatientByAccount,
  commentOnReading,
  addCarePlan,
  getCarePlan,
  carePlanUpdate,
  addremovedevice,
  CarePlanbydrhr,
  searchPatient,
  getHealthReadingbyId,
  getHealthReadingCount,
  checkduplicates,
  unsetHrDr,
  addCCMCarePlan,
  getCCMCarePlan,
  removePatientCCMCareplan,
  addCCMConsent,
  getCCMConsent,
  removePatientCCMConsent,
  ccmPatientList,
  searchCCMPatient,
  InactivePatients,
  removePatientRPMCareplan
};
