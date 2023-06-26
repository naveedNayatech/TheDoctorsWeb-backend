const httpStatus = require('http-status');

const ApiError = require('../utils/ApiError');
const { Doctor, Patient, HealthData } = require('../models');

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getDoctorByEmail = async (email) => {
  return Doctor.findOne({ email });
};

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await Doctor.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return Doctor.create(userBody);
};


/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginDoctorWithEmailAndPassword = async (email, password) => {
  const doctor = await getDoctorByEmail(email);
  // let attemps = doctor?.loginAttemps;

  // if (attemps >= 3) {
  //   Object.assign(doctor, { block: true });
  //   await doctor.save();
  //   throw new ApiError(httpStatus.UNAUTHORIZED, 'Your account has been blocked by the admin');
  // }


  if (!doctor || !(await doctor.isPasswordMatch(password))) {
    // attemps = attemps + 1
    // Object.assign(doctor, { loginAttemps: attemps });
    // await doctor.save();
    throw new ApiError(httpStatus[404], 'Incorrect email or password');
  }

  if (doctor.block) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Your account has been blocked by the admin');
  }

  return doctor;
};

const doctorList = async (page, pagination) => {
  const doctor = await Doctor.find()
    .populate('assigned_hr_id', ['firstname', 'lastname', 'gender', 'email'])
    .skip((page - 1) * pagination)
    .limit(pagination)
    .sort({ createdAt: -1 });
  if (!doctor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'doctors not found');
  }
  return doctor;
};

const doctorbyid = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId).populate('assigned_hr_id');
  if (!doctor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'doctor not found');
  }
  return doctor;
};

const patientlist = async (doctorId, body) => {
  let query
  if (body.key && body.value) {
    query = {
      $and: [
        { assigned_doctor_id: doctorId },
        {$or: [{patientType: 'RPM'}, {patientType: 'Both'}]},
        { [body.key]: { $regex: body.value, $options: 'mxi' } }
      ]
    }
  }
  else {
    query = {
      $and: [
        { assigned_doctor_id: doctorId },
        {$or: [{patientType: 'RPM'}, {patientType: 'Both'}]},
      ]
    }
  }

  const patientlist = await Patient.find(query)
    .populate('assigned_devices.deviceObjectId', ['imei', 'modelNumber', 'deviceType', 'broken', 'block'])
    .populate('assigned_doctor_id')
    .populate('assigned_hr_id')
    .sort({ createdAt: body.createdAt || -1 })
    .lean();

    if (patientlist.length) {
      for (let i = 0; i < patientlist.length; i++) {
        let findHealthData = await HealthData.find({ assigned_patient_id: patientlist[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
        patientlist[i] = { ...patientlist[i], lastReading: findHealthData && findHealthData[0]?.dateAdded}
      }
    }    

  if (!patientlist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'patientlist not found');
  }
  return patientlist;
};

const ccmPatientlistOfDr = async (doctorId, body) => {
  let query
  if (body.key && body.value) {
    query = {
      $and: [
        { assigned_doctor_id: doctorId },
        {$or: [{patientType: 'CCM'}, {patientType: 'Both'}]},
        { [body.key]: { $regex: body.value, $options: 'mxi' } }
      ]
    }
  }
  else {
    query = {
      $and: [
        { assigned_doctor_id: doctorId },
        {$or: [{patientType: 'CCM'}, {patientType: 'Both'}]},
      ]
    }
  }
const patientlist = await Patient.find(query)
.populate('assigned_doctor_id')
.populate('assigned_hr_id')
.sort({ createdAt: body.createdAt || -1 })
.lean();    

if (!patientlist) {
throw new ApiError(httpStatus.NOT_FOUND, 'patientlist not found');
}
return patientlist;
};


const updateDoctor = async (doctorId, updateBody) => {
  const doctor = await Doctor.findById(doctorId)
  if (!doctor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'doctor not found');
  }
  Object.assign(doctor, updateBody);
  await doctor.save();
  return doctor;
};

const searchDoctor = async (body) => {
  const doctor = await Doctor.find({ [body.key]: { $regex: body.value, $options: 'mxi' } }
  )
    .populate('assigned_hr_id', ['firstname', 'lastname', 'gender', 'email'])
    .sort({ createdAt: body.createdAt || -1 });

  if (!doctor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'results not found');
  }
  return doctor;
};

const removeHr = async (body) => {
  let doctor = Doctor.updateOne({ _id: body.drId }, { $unset: { assigned_hr_id: 1 } });
  return doctor
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

  let patientList = await Patient.find({ assigned_doctor_id: body.drId })

  let DrPatienthealthRecords = [];

  if (patientlist)
    for (i = 0; i < patientList.length; i++) {
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

      if (healthDataList)
        for (j = 0; j < healthDataList.length; j++) {
          DrPatienthealthRecords.push(healthDataList[j])
        }
    }
  return DrPatienthealthRecords;
}

const doctorStatsData = async(body) => {
  
  // Calculate total patients
  let totalPatients = await Patient.find({assigned_doctor_id: body.doctorId});

  // Active Patients
  let rpmPatients = await Patient.find({
    $and: [{ assigned_doctor_id: body.doctorId },
    {$or: [{patientType: 'RPM'}, {patientType: 'Both'}]},   
    {block: false}] 
  })

  // Active Patients
  let ccmPatients = await Patient.find({
    $and: [{ assigned_doctor_id: body.doctorId },
    {$or: [{patientType: 'CCM'}, {patientType: 'Both'}]},   
    {block: false}] 
  })
  

  return { 
    totalPatients: totalPatients.length,
    RpmPatients: rpmPatients.length,
    CcmPatients: ccmPatients.length
  }
}

const DoctorCriticalPatients = async (body) => {
  let patientsList
  
  if(body.hrId){
    patientsList = await Patient.find({ assigned_doctor_id: body.doctorId, 
      $or: [
        {patientType: 'RPM'}, {patientType: 'Both'}
      ]
    })
  } else if(body.doctorId){
    patientsList = await Patient.find({ assigned_doctor_id: body.doctorId, 
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
    "$or": [ 
      {"telemetaryData.sys": {$gte: 139}}, 
      {"telemetaryData.sys": {$lte: 110}},
      {"telemetaryData.dia": {$gte: 90}},
      {"telemetaryData.dia": {$lte: 70}},
    ],
    createdAt: {
      $gte: new Date(new Date() - 3 * 60 * 60 * 24 * 1000)
    } 
  })
  .populate('assigned_patient_id', ['firstname', 'lastname', 'gender'])

    if(CriticalDataList)
      for(j=0;j<CriticalDataList.length;j++){
        HrPatienthealthRecords.push(CriticalDataList[j])
      }
    }
  }

  // HrPatienthealthRecords.sort({createdAt: -1});
    
  return HrPatienthealthRecords.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
}




module.exports = {
  createUser,
  loginDoctorWithEmailAndPassword,
  doctorList,
  doctorbyid,
  patientlist,
  updateDoctor,
  searchDoctor,
  removeHr,
  patientshealthdata,
  doctorStatsData,
  DoctorCriticalPatients,
  ccmPatientlistOfDr,
};
