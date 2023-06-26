const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { patientService, tokenService, generalService } = require('../services');
const moment = require('moment');
const { Log } = require('../models');


const uploadFile = catchAsync(async (req, res) => {

    res.status(httpStatus.CREATED).send({
        message: 'File uploded successfully',
        "filename": req.file.originalname
    });
});


const uploadImage = catchAsync(async (req, res) => {
    res.status(httpStatus.CREATED).send({
        message: 'File uploded successfully',
        "filename": req.file.originalname
    });
});



const initialSetupReport = catchAsync(async (req, res) => {
    const initialSetupReport = await generalService.initialSetupReport(req.body);
    await Log.create({
        text:`${req?.user?.name  || req?.user?.firstname +" "+ req?.user?.lastname} accessed the initial setup report `,
        // patient_id: patient?._id,
        ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
        ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
        ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
        type:"report",
        time: moment(new Date()).format("hh:mm A"),
        date: moment(new Date()).format("YYYY/MM/DD")
      })
    res.status(httpStatus.CREATED).send(initialSetupReport);
});
//nothing

const getNotifications = catchAsync(async (req, res) => {
    const getNotifications = await generalService.getNotifications(req.body);
    res.status(httpStatus.CREATED).send(getNotifications);
});

const resetpasswordanyuser = catchAsync(async (req, res) => {
    const resetpasswordanyuser = await generalService.resetpasswordanyuser(req.body);
    res.status(httpStatus.CREATED).send(resetpasswordanyuser);
});

const requestpatientaddapproval = catchAsync(async (req, res) => {
    const requestpatientaddapproval = await generalService.requestpatientaddapproval(req.body);
    res.status(httpStatus.CREATED).send(requestpatientaddapproval);
});

const assignToMultiplePatients = catchAsync(async (req, res) => {
    const assignToMultiplePatients = await generalService.assignToMultiplePatients(req.body);
    res.status(httpStatus.CREATED).send(assignToMultiplePatients);
});

const minutereadingtotaldrhr = catchAsync(async (req, res) => {
    const minutereadingtotaldrhr = await generalService.minutereadingtotaldrhr(req.body);
    // await Log.create({
    //     text:`${req?.user?.name  || req?.user?.firstname +" "+ req?.user?.lastname} accessed report of total miniute reading by month`,
    //     ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    //     ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    //     ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    //     type:"report",
    //     time: moment(new Date()).format("hh:mm A"),
    //     date: moment(new Date()).format("YYYY/MM/DD")
    //   })
    res.status(httpStatus.CREATED).send(minutereadingtotaldrhr);
});


const billingreport = catchAsync(async (req, res) => {
    const billingreport = await generalService.generateBillingReport(req.body);
    await Log.create({
        text:`${req?.user?.name  || req?.user?.firstname +" "+ req?.user?.lastname} generated a billing report`,
        ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
        ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
        ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
        type:"report",
        time: moment(new Date()).format("hh:mm A"),
        date: moment(new Date()).format("YYYY/MM/DD")
      })
    res.status(httpStatus.CREATED).send(billingreport);
});


const billingreportCCM = catchAsync(async (req, res) => {
    const billingreport = await generalService.generateBillingReportCCM(req.body);
    await Log.create({
        text:`${req?.user?.name  || req?.user?.firstname +" "+ req?.user?.lastname} generated a billing report of CCM`,
        ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
        ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
        ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
        type:"report",
        time: moment(new Date()).format("hh:mm A"),
        date: moment(new Date()).format("YYYY/MM/DD")
      })
    res.status(httpStatus.CREATED).send(billingreport);
});

const minutetotaldrhrCCM = catchAsync(async (req, res) => {
    const minutereadingtotaldrhrCCM = await generalService.minutereadingtotaldrhrCCM(req.body);
    // await Log.create({
    //     text:`${req?.user?.name  || req?.user?.firstname +" "+ req?.user?.lastname} accessed report of total miniute spent in a month in CCM category`,
    //     ...(req?.user?.role === 'admin' && {admin_id:req.user?._id}),
    //     ...(req?.user?.role === 'doctor' && {doctor_id:req.user?._id}),
    //     ...(req?.user?.role === 'HrMedical' && {hr_id:req.user?._id}),
    //     type:"report",
    //     time: moment(new Date()).format("hh:mm A"),
    //     date: moment(new Date()).format("YYYY/MM/DD")
    //   })
    res.status(httpStatus.CREATED).send(minutereadingtotaldrhrCCM);
});

const minutesReadingsCountHistory = catchAsync(async (req, res) => {
    const mins = await generalService.totalMinutesReadingsCountHistory(req.body);
    res.status(httpStatus.CREATED).send(mins);
});

const minutesReadingsCountHistoryOfCCM = catchAsync(async (req, res) => {
    const history = await generalService.totalMinutesReadingsCountHistoryOfCCM(req.body);
    res.status(httpStatus.CREATED).send(history);
});


const createMessage = catchAsync(async (req, res) => {
    const message = await generalService.createMessage(req.body);
    res.status(httpStatus.CREATED).send(message);
});

const getMessage = catchAsync(async (req, res) => {
    const message = await generalService.getMessage(req.body);
    res.status(httpStatus.CREATED).send(message);
});

const doctorNurses = catchAsync(async (req, res) => {
    const nursesList = await generalService.getDoctorNurses(req.body);
    res.status(httpStatus.CREATED).send(nursesList);
});

const generalCCMPtsList = catchAsync(async (req, res) => {
    const pagination = req.params.pagination ? parseInt(req.params.pagination) : 5;
    const page = req.params.page ? parseInt(req.params.page) : 1;
  
    const ccmPatientList = await generalService.getGeneralCCMPatients(req.body, page, pagination);
    res.status(httpStatus.CREATED).send(ccmPatientList);
  });


module.exports = {
    uploadFile,
    uploadImage,
    initialSetupReport,
    getNotifications,
    resetpasswordanyuser,
    requestpatientaddapproval,
    assignToMultiplePatients,
    minutereadingtotaldrhr,
    minutesReadingsCountHistory,
    minutetotaldrhrCCM,
    minutesReadingsCountHistoryOfCCM,
    createMessage,
    getMessage,
    generalCCMPtsList,
    doctorNurses,
    billingreport,
    billingreportCCM
}