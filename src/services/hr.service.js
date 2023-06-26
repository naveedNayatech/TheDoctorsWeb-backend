const httpStatus = require('http-status');

const ApiError = require('../utils/ApiError');
const { HR, Patient, Log, Doctor, HealthData, DeviceSignal } = require('../models');
const Target = require('../models/targets.model');
const moment = require('moment');

const getHrByEmail = async (email) => {
  return HR.findOne({ email });
};

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await HR.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return HR.create(userBody);
};


const loginHrWithEmailAndPassword = async (email, password) => {
  const hr = await getHrByEmail(email);
  let attemps = hr?.loginAttemps;

  if(attemps>=3){
    Object.assign(hr, {block:true});
    await hr.save();
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Your account has been blocked by the admin');
  }

  if (!hr || !(await hr.isPasswordMatch(password))) {
    attemps = attemps + 1
    Object.assign(hr, {loginAttemps:attemps});
    await hr.save();
    throw new ApiError(httpStatus[404], 'Incorrect email or password');
  }

  if (hr.block) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Your account has been blocked by the admin');
  }

  return hr;
};

const hrList = async () => {
  const hr = await HR.find().populate('assigned_doctor_id').sort({ createdAt: -1 });
  if (!hr) {
    throw new ApiError(httpStatus.NOT_FOUND, 'hrs not found');
  }
  return hr;
};


const changeNursePassword = async (hrId, updateBody) => {
  const hr = await HR.findById(hrId)
  if (!hr) {
    throw new ApiError(httpStatus.NOT_FOUND, 'nurse not found');
  }
  
  if(updateBody.oldPassword){
    if (!(await hr.isPasswordMatch(updateBody.oldPassword))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Password Not Matched');
    }
  }
     
  Object.assign(hr, updateBody);
  await hr.save();
  return hr;
};



const hrbyid = async (hrId) => {
  const hr = await HR.findById(hrId).populate('assigned_doctor_id')
  if (!hr || hr.block) {
    throw new ApiError(httpStatus.NOT_FOUND, 'hr not found or Hr has been blocked');
  }
  return hr;
};

const patientlist = async (drId, body) => {
  let query
  
  if (body.key && body.value) {
    query = {
      $and: [
        { assigned_doctor_id: drId },
        // {$or: [{patientType: 'RPM'}, {patientType: 'Both'}]},
        { [body.key]: { $regex: body.value, $options: 'mxi' } }
      ]
    }
  }
  else {
    query = {
      $and: [
        { assigned_doctor_id: drId },
        // {$or: [{patientType: 'RPM'}, {patientType: 'Both'}]},
      ]
    }
  }

  const patientlist = await Patient.find(query)
    .populate('assigned_devices.deviceObjectId', ['imei', 'modelNumber', 'deviceType', 'broken', 'block'])
    .populate('assigned_doctor_id')
    .sort({ createdAt: body.createdAt || -1 })
    .lean();

    if (patientlist.length) {
      for (let i = 0; i < patientlist.length; i++) {
        let findHealthData = await HealthData.find({ assigned_patient_id: patientlist[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
        patientlist[i] = { ...patientlist[i], lastReading: findHealthData && findHealthData[0]?.dateAdded}
      }
    }
  
    if (patientlist.length){
      for (let i = 0; i < patientlist.length; i++) {
        let deviceBatteryStatus = await DeviceSignal.find({ assigned_patient_id: patientlist[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
        patientlist[i] = { ...patientlist[i], batterySignals: deviceBatteryStatus && deviceBatteryStatus[0]?.signalData}
      }
    }

  if (!patientlist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'patientlist not found');
  }
  return patientlist;
};

const assignedPatients = async (hrId, body) => {
  let query

  if (body.key && body.value) {
    query = {
      $and: [
        { assigned_hr_id: hrId },
        {$or: [{patientType: 'RPM'}, {patientType: 'Both'}]},
        { [body.key]: { $regex: body.value, $options: 'mxi' } }
      ]
    }
  }
  else {
    query = {
      $and: [
        { assigned_hr_id: hrId },
        {$or: [{patientType: 'RPM'}, {patientType: 'Both'}]},
      ]
    }
  }

  const patientlist = await Patient.find(query)
    .populate('assigned_devices.deviceObjectId', ['imei', 'modelNumber', 'deviceType', 'broken', 'block'])
    .populate('assigned_doctor_id')
    .sort({ createdAt: body.createdAt || -1 })
    .lean();

    if (patientlist.length) {
      for (let i = 0; i < patientlist.length; i++) {
        let findHealthData = await HealthData.find({ assigned_patient_id: patientlist[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
        patientlist[i] = { ...patientlist[i], lastReading: findHealthData && findHealthData[0]?.dateAdded}
      }
    }
  
    if (patientlist.length){
      for (let i = 0; i < patientlist.length; i++) {
        let deviceBatteryStatus = await DeviceSignal.find({ assigned_patient_id: patientlist[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
        patientlist[i] = { ...patientlist[i], batterySignals: deviceBatteryStatus && deviceBatteryStatus[0]?.signalData}
      }
    }

  if (!patientlist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'patientlist not found');
  }
  return patientlist;
};





const updateHr = async (hrId, updateBody) => {
  const hr = await HR.findById(hrId)
  if (!hr) {
    throw new ApiError(httpStatus.NOT_FOUND, 'hr not found');
  }
  Object.assign(hr, updateBody);
  await hr.save();
  return hr;
};

const addtimeforpatient = async (hrId, addBody, user) => {
  const hr = await HR.findById(hrId)
  if (!hr || hr.block) {
    throw new ApiError(httpStatus.NOT_FOUND, 'hr not found or Hr has been blocked');
  }

  let patientId = addBody.assigned_patient_id,
    startDate = addBody.startDate,
    endDate = addBody.endDate,
    startTime = addBody.startTime,
    endTime = addBody.endTime,
    isCCM = addBody.isCCM,
    interactiveMinutes = addBody.interactiveMinutes,
    timeSpent = addBody.timeSpentInMinutes,
    conclusion = addBody.conclusion,
    fileName = addBody.fileName,
    addedtime;

  const patientDetails = await Patient.findById(patientId).lean()


  if (!patientId || !timeSpent || !conclusion) {
    throw new ApiError(httpStatus.NOT_FOUND, 'request body is missing please send patient Id, time Spent in minutes & conclusion ');
  }
  else {
    addedtime = await Target.create({
      assigned_hr_id: hrId,
      assigned_patient_id: patientId,
      startDate: startDate,
      endDate: endDate,
      startTime: startTime,
      endTime: endTime,
      isCCM: isCCM,
      interactiveMinutes: interactiveMinutes,
      timeSpentInMinutes: timeSpent,
      conclusion: conclusion,
      fileName: fileName
    })
  }
  const patient = await Patient.findById(patientId).lean()

  await Log.create({
    text: `${user?.name || user?.firstname + " " + user?.lastname} added time of ${addBody.timeSpentInMinutes}m for patient ${patientDetails?.firstname} ${patientDetails?.lastname}  `,
    patient_id: patient._id,
    ...(user?.role === 'HrMedical' && {hr_id:user._id}),
    ...(user?.role === 'admin' && {admin_id:user._id}),
    ...(user?.role === 'doctor' && {doctor_id:user._id}),
    type:"targets",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })
  return addedtime;
};

const totaltimespend = async (body) => {
  let totalInteractiveMinutes = 0
  let totalNonInteractiveMinutes = 0
  let totalTime = 0,
      startDate = body.startDate,
      endDate = body.endDate;

  if (!startDate && !endDate)
    throw new ApiError(httpStatus.NOT_FOUND, 'please provide start date and end date (Format  yyyy-mm-dd )');

  startDate = new Date(startDate);
  endDate = new Date(endDate);

  let query;

  if (body.hrId && !body.patientId) {
    query = {
      "assigned_hr_id": body.hrId,
      isCCM: null,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
  }


  // if (body.drId) {
  //   let doctorsPatients = await Patient.find({assigned_doctor_id: body.drId}).lean();

  //   if (doctorsPatients.length) {
  //     for(i =0; i < doctorsPatients.length; i++){
  //       query = {
  //         "assigned_patient_id": doctorsPatients[i]?._id,
  //         isCCM: null,
  //         createdAt: {
  //           $gte: new Date(startDate),
  //           $lte: new Date(endDate)
  //         }
  //      }
  //     }
  //   }
  //   else {
  //     throw new ApiError(httpStatus.NOT_FOUND, 'No HR is associated with this Dotor');
  //   }
  // }

  if (body.hrId && body.patientId) {
    query = {
      "assigned_hr_id": body.hrId,
      "assigned_patient_id": body.patientId,
      isCCM: null,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
  }

  if (!body.hrId && !body.drId && body.patientId) {
    query = {
      "assigned_patient_id": body.patientId,
      isCCM: null,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
  }

  const target = await Target.find(query).lean()
    .populate("assigned_hr_id")
    .populate("assigned_patient_id")


  if (!target) {
    throw new ApiError(httpStatus.NOT_FOUND, 'no targets found');
  }

  // if (body.hrId && body.patientId) {
    target.forEach((target) => {
      totalTime = totalTime + target.timeSpentInMinutes;
  
      if(target.interactiveMinutes === true){
        totalInteractiveMinutes = totalInteractiveMinutes + target.timeSpentInMinutes;
      }

      if(target.interactiveMinutes === false){
        totalNonInteractiveMinutes = totalNonInteractiveMinutes + target.timeSpentInMinutes;
      }
    })
  // }

  return ({ targets: target, totalTime, totalInteractiveMinutes, totalNonInteractiveMinutes  });
};


const totaltimespendByDoctorNurses = async (body) => {
  let totalInteractiveMinutes = 0
  let totalNonInteractiveMinutes = 0
  let totalTime = 0,
      startDate = body.startDate,
      endDate = body.endDate;
  let target;

  if (!startDate && !endDate)
    throw new ApiError(httpStatus.NOT_FOUND, 'please provide start date and end date (Format  yyyy-mm-dd )');

  startDate = new Date(startDate);
  endDate = new Date(endDate);
  
  let assignedNurses = await HR.find({ assigned_doctor_id: body.drId });

  let targetedResults=[];

  if(assignedNurses)
  
  for(i=0; i < assignedNurses.length; i++){
    target = await Target.find({
      assigned_hr_id: assignedNurses[i]._id, 
      isCCM: body.isCCM && body.isCCM === true ? true : null,
      startDate: {
        $gte: body.startDate
      },
      endDate: {
        $lte: body.endDate
      }
    }).lean()
    .populate("assigned_hr_id")
    .populate("assigned_patient_id")

    if(target){
      for(j=0;j<target.length;j++){
        targetedResults.push(target[j])
      }

      target.forEach((target) => {
        totalTime = totalTime + target.timeSpentInMinutes;
    
        if(target.interactiveMinutes === true){
          totalInteractiveMinutes = totalInteractiveMinutes + target.timeSpentInMinutes;
        }
  
        if(target.interactiveMinutes === false){
          totalNonInteractiveMinutes = totalNonInteractiveMinutes + target.timeSpentInMinutes;
        }
    })

    }
  }

  return ({ targets: targetedResults, totalTime, totalInteractiveMinutes, totalNonInteractiveMinutes  });
};






const totaltimespendinCCMCategory = async (body) => {
  let totalInteractiveMinutes = 0
  let totalNonInteractiveMinutes = 0
  let totalTime = 0
  startDate = body.startDate,
  endDate = body.endDate;

  if (!startDate && !endDate)
    throw new ApiError(httpStatus.NOT_FOUND, 'please provide start date and end date (Format  yyyy-mm-dd )');

  let query;

  if (body.hrId && !body.patientId) {
    query = {
      "assigned_hr_id": body.hrId,
      isCCM: true,
      startDate: {
        $gte: body.startDate
      },
      endDate: {
        $lte: body.endDate
      }
    }
  }

  // if (body.drId && !body.hrId) {
  //   query = {    
  //     isCCM: true,
  //     startDate: {
  //       $gte: body.startDate
  //     },
  //     endDate: {
  //       $lte: body.endDate
  //     }
  //   }
  // }

  if (body.hrId && body.patientId) {
    query = {
      "assigned_hr_id": body.hrId,
      "assigned_patient_id": body.patientId,
      isCCM: true,
      startDate: {
        $gte: body.startDate
      },
      endDate: {
        $lte: body.endDate
      }
    }
  }

  if (!body.hrId && !body.drId && body.patientId) {
    query = {
      "assigned_patient_id": body.patientId,
      isCCM: true,
      startDate: {
        $gte: body.startDate
      },
      endDate: {
        $lte: body.endDate
      }
    }
  }

  const target = await Target.find(query).lean()
    .populate("assigned_hr_id")
    .populate("assigned_patient_id")


  if (!target) {
    throw new ApiError(httpStatus.NOT_FOUND, 'no targets found');
  }


  target.forEach((target) => {
      totalTime = totalTime + target.timeSpentInMinutes;

      if(target.interactiveMinutes === true){
        totalInteractiveMinutes = totalInteractiveMinutes + target.timeSpentInMinutes;
      }

      if(target.interactiveMinutes === false){
        totalNonInteractiveMinutes = totalNonInteractiveMinutes + target.timeSpentInMinutes;
      }
    })

  return ({ targets: target, totalTime, totalInteractiveMinutes, totalNonInteractiveMinutes });
};



const blockHr = async (hrId, user) => {
  const hr = await HR.findById(hrId);
  if (!hr) {
    throw new ApiError(httpStatus.NOT_FOUND, 'hr not found');
  }
  Object.assign(hr, { block: true });
  await hr.save();
  
  await Log.create({
    text: `${user?.name || user?.firstname + " " + user?.lastname} blocked a hr with name as ${hr?.firstname} ${hr?.lastname}  `,
    // patient_id: patient.assigned_patient_id,
    ...(user?.role === 'HrMedical' && {hr_id:user._id}),
    ...(user?.role === 'admin' && {admin_id:user._id}),
    ...(user?.role === 'doctor' && {doctor_id:user._id}),
    type:"hr",
    time: moment(new Date()).format("hh:mm A"),
    date: moment(new Date()).format("YYYY/MM/DD")
  })

  return `${hr.firstname} ${hr.lastname} has been blocked `;
};

const removeDr = async (body) => {
  let hr = HR.updateOne({ _id: body.hrId }, { $unset: { assigned_doctor_id: 1 } });
  return hr
}

const hrStatsData = async(body) => {
  
  // Calculate total patients
  let totalPatients = await Patient.find({assigned_hr_id: body.hrId});

  // Active Patients
  let activePatients = await Patient.find({
    $and: [{ assigned_hr_id: body.hrId }, {block: false}] 
  })

  //Inactive Patients 
  let InactivePatients = await Patient.find({
    $and: [{ assigned_hr_id: body.hrId }, {block: true}] 
  })

  // Compliant Patients
  let compliantPatients = await Patient.find(
    {
    $and: [{ assigned_hr_id: body.hrId }, {$expr: {$gte: [{$size: "$assigned_devices"}, 1]}}] 
  })

  // Non-compliant Patients
  let nonCompliantPatients = await Patient.find(
    {
    $and: [{ assigned_hr_id: body.hrId }, {assigned_devices: { $size: 0}}] 
  })
  

  return { 
    totalPatients: totalPatients.length,
    activePatients: activePatients.length,
    compliantPatients: compliantPatients.length,
    nonCompliantPatients: nonCompliantPatients.length,
    InactivePatients: InactivePatients.length,
  }
}


const patientshealthdata = async (body) => {
  let startDate = body?.startDate,
    endDate = body?.endDate,
    specificDate = body?.specificDate,
    query;

  if (startDate)
    startDate = new Date(startDate);
  if (endDate)
    endDate = new Date(endDate);

  let patientList = await Patient.find({ assigned_hr_id: body.hrId })

  let DrPatienthealthRecords=[];
  
  if(patientlist)
  for(i=0;i<patientList.length;i++){
    if (startDate && endDate && !specificDate) {
      query = {
        assigned_patient_id: patientList[i]._id, createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    }
    if (!startDate && !endDate && specificDate) {
      query = {
        assigned_patient_id: patientList[i]._id, dateAdded: specificDate
      }
    }
    if (!startDate && !endDate && !specificDate) {
      query = {
        assigned_patient_id: patientList[i]._id
      }
    }

    let healthDataList = await HealthData.find(query)
      .populate('assigned_patient_id', ['firstname', 'lastname', 'gender', 'specialization'])
      .populate('deviceId', ['imei', 'modelNumber', 'deviceType', 'broken', 'block'])
      .sort({ createdAt: body.createdAt || -1 });

      if(healthDataList)
      for(j=0;j<healthDataList.length;j++){
        DrPatienthealthRecords.push(healthDataList[j])
      }
  }


return DrPatienthealthRecords;
}


const getListOfRecentReadings = async (body) => {
  let patientsList
  
  if(body.drId){
    patientsList = await Patient.find({ assigned_doctor_id: body.drId, 
      $or: [
        {patientType: 'RPM'}, {patientType: 'Both'}
      ]
    })
  } 

  let HrPatienthealthRecords=[];

  if(patientsList){
    for (let i = 0; i < patientsList.length; i++) {  
  
    let CriticalDataList = await HealthData.find({
    assigned_patient_id:patientsList[i]._id,
    createdAt: {
      $gte: new Date(new Date() - 3 * 60 * 60 * 24 * 1000)
    } 
  },{notes:0}).populate('assigned_patient_id', ['firstname', 'lastname', 'gender'])

    if(CriticalDataList)
      for(j=0;j<CriticalDataList.length;j++){
        HrPatienthealthRecords.push(CriticalDataList[j])
      }
    }
  }
    
    return HrPatienthealthRecords.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
}


module.exports = {
  createUser,
  loginHrWithEmailAndPassword,
  hrList,
  hrbyid,
  patientlist,
  updateHr,
  addtimeforpatient,
  totaltimespend,
  blockHr,
  removeDr,
  patientshealthdata,
  totaltimespendinCCMCategory,
  hrStatsData,
  totaltimespendByDoctorNurses,
  getListOfRecentReadings,
  assignedPatients,
  changeNursePassword
};
