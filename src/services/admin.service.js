const httpStatus = require('http-status');
const excelToJson = require('convert-excel-to-json');
const ApiError = require('../utils/ApiError');
const { Admin, HR, Patient, Doctor, Device, Log, PatientAdd, HealthData, Targets, Billed } = require('../models');



/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await Admin.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return Admin.create(userBody);
};

const createBill = async (billBody) => {
  const billStatus = await Billed.find({ billedMonth: billBody.billedMonth, 
    isBilled: true, 
    assigned_patient_id: billBody.assigned_patient_id,
    billedCategory: billBody.billedCategory 
  })

  if(billStatus.length > 0){
    throw new ApiError(httpStatus.NOT_FOUND, 'Already billed for this month');
  }

  return Billed.create(billBody);
};

const getBilledStatusByCond = async (billBody) => {
  
  let patientList;
  let billedRecords;

  patientList = await Patient.find();
  
  if(patientList){
    billedRecords = Billed.aggregate([{$lookup:
      {
            from: "patients",
            localField: "assigned_patient_id",
            foreignField: "_id",
            as: "assigned_patient_id"
        }
       },
       {
          // $match: { "same": { $ne: [] } }
          $match: {
            isBilled: true,
            billedCategory: billBody.billedCategory,
            billedMonth: billBody.billedMonth
        }
       },{
        $project: {isBilled: 1, billedCategory:1, billedMonth:1, assigned_patient_id: 1}
       }
    ])
  }

  if (!billedRecords) {
    throw new ApiError(httpStatus.NOT_FOUND, 'data not found');
  }
  
  return billedRecords;
};

const updateAdmin = async (adminId, updateBody) => {
  const admin = await Admin.findById(adminId)
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'admin not found');
  }
  
  if(updateBody.oldPassword){
    if (!(await admin.isPasswordMatch(updateBody.oldPassword))) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Password Not Matched');
    }
  }
     
  Object.assign(admin, updateBody);
  await admin.save();
  return admin;
};

const updateAdminAddImage = async (adminId, updateBody) => {
  const admin = await Admin.findById(adminId)
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'admin not found');
  }
  
     
  Object.assign(admin, updateBody);
  await admin.save();
  return admin;
};


const updateTelemetaryData = async (Id, updateBody) => {
  // const findData = await HealthData.findByIdAndUpdate(
  //   Id,
  //   {
  //     $set: { telemetaryData: { sys: updateBody.sys, dia: updateBody.dia, pul: updateBody.pul,
  //      },
  //      dateAdded: updateBody.dateAdded},
  //   },
  //   { new: true }
  // );

  const findHealthData = await HealthData.findById(Id)
  if (!findHealthData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'data not found');
  }
  Object.assign(findHealthData, updateBody);
  await findHealthData.save();
  return findHealthData;
};


/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getAdminByEmail = async (email) => {
  return Admin.findOne({ email });
};


/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginAdminWithEmailAndPassword = async (email, password) => {
  const admin = await getAdminByEmail(email);
  if (!admin || !(await admin.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return admin;
};

const stats = async () => {

  let totalPatients = await Patient.find();
  let totalHrs = await HR.find();
  let totalDrs = await Doctor.find();
  let totalDevices = await Device.find();
  let activePatients = await Patient.find({block: false});
  let blockedPatients = await Patient.find({block: true});
  let malePts = await Patient.find({gender: 'male'});
  let femalePts = await Patient.find({gender: 'female'});
  let rpmPts = await Patient.find({ $or: [ { patientType: 'RPM' }, { patientType: 'Both' } ] });
  let ccmPts = await Patient.find({ $or: [ { patientType: 'CCM' }, { patientType: 'Both' } ] });
  // let compliantPatients = await Patient.find({$where: "this.assigned_devices.length > 0"});


  return { totalPatients: totalPatients.length, 
      totalHrs: totalHrs.length, 
      totalDrs: totalDrs.length, 
      totalDevices: totalDevices.length, 
      activePts: activePatients.length, 
      blockpts: blockedPatients.length, 
      malePts: malePts.length, 
      femalePts: femalePts.length,
      rpmPts: rpmPts.length, 
      ccmPts: ccmPts.length
      // compliantPatients: compliantPatients.length
    }
};

const getAdminById = async (Id) => {
  const admin = await Admin.findById(Id);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }
  return admin;
};

const deleteAdminAccount = async (adminId) => {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'admin not found');
  }
  await admin.remove();
  return admin;
}

const deleteHRMinutes = async (minuteId) => {
  const target = await Targets.findById(minuteId);
  if (!target) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Minutes not found with this ID');
  }
  await target.remove();
  return target;
}


const getLogs = async (body) => {
  const logs = await Log.find({
     ...(body?.type && { type: body.type }),
     ...(body?.admin_id && {admin_id:body?.admin_id}),
     ...(body?.doctor_id && {doctor_id:body?.doctor_id}),
     ...(body?.hr_id && {hr_id:body?.hr_id}),
     ...(body?.patient_id && {patient_id:body?.patient_id}),
     ...(body?.startDate && body?.endDate && {
      createdAt: { $gte: new Date(new Date(`${body?.startDate}`).setHours(0o0, 0o0, 0o0)),
      $lt: new Date(new Date(`${body?.endDate}`).setHours(23, 59, 59)) }
     })

     
    }).sort({ createdAt: -1 }).populate('admin_id').populate('doctor_id').populate('hr_id').populate('patient_id');
    
  return logs
}

const getlistofpendingapprovals = async () => {
  const list = await PatientAdd.find({ approved: false }).sort({ createdAt: -1 });
  return list
}

const getListOfAdmins = async () => {
  const adminList = await Admin.find().sort({ createdAt: -1});
  return adminList;
}

const approvePendingApprovals = async (body) => {
  const doc = await PatientAdd.findById(body.id);

  const result = excelToJson({
    sourceFile: `src/uploads/addPatient.xlsx`,
    columnToKey: {
      B: 'firstname',
      C: 'lastname',
      D: 'email',
      E: 'emrID',
      F: 'phone1',
      G:'mobileNo',
      H: 'address',
      I: 'line2',
      j: 'city',
      K: 'state',
      L: 'DOB',
      M:'gender',
      N: 'zipCode',
      O:'assigned_doctor_id',
      P:'insurancecompany',
      Q:'diseases',
      R:'patientType'
    },
  });
  const nameSheet = result[body.sheetName];

  
  console.log(nameSheet);
  const excelInsert = await Patient.insertMany(nameSheet);
  console.log(excelInsert);



  Object.assign(doc, { approved: true });
  await doc.save();

  return doc
}


const getListOfCriticalTelemetaryData = async () => {

  const findCriticalData = await HealthData.find({
    "$or": [ 
      {"telemetaryData.sys": {$gte: 139}}, 
      {"telemetaryData.sys": {$lte: 110}},
      {"telemetaryData.dia": {$gte: 90}},
      {"telemetaryData.dia": {$lte: 70}},
    ],
    createdAt: {
      $gte: new Date(new Date() - 3 * 60 * 60 * 24 * 1000)
    } 
  }).populate('assigned_patient_id', ['firstname', 'lastname', 'gender'])
    .sort({createdAt: -1})

    if (!findCriticalData) {
      throw new ApiError(httpStatus.NOT_FOUND, 'data not found');
    }
    
    return findCriticalData;
}

const getListOfTargets = async () => {

  const targets = await Targets.find({
    createdAt: {
      $gte: new Date(new Date() - 3 * 60 * 60 * 24 * 1000)
    } 
  }).populate("assigned_hr_id")
  .populate("assigned_patient_id")
  .populate("assigned_assistant_id")
    .sort({createdAt: -1})

    if (!targets) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No targets found');
    }
    
    return targets;
}

const getListOfRecentReadings = async () => {

  const readings = await HealthData.find({
    createdAt: {
      $gte: new Date(new Date() - 3 * 60 * 60 * 24 * 1000)
    } 
  },{notes:0}).populate('assigned_patient_id', ['firstname', 'lastname', 'gender'])
    .sort({createdAt: -1})

    if (!readings) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No readings found');
    }
    
    return readings;
}



const getListOfTargetsByMonth = async (body) => {
 const res =  Targets.aggregate([
      { $match: { isCCM: body.isCCM === true ? true : null } },
      {
      $group: {
        _id: {
          month: {
            $month: "$createdAt"
          },
          year: {
            $year: "$createdAt"
          },
        },
        total: {
          $sum: "$timeSpentInMinutes"
        }
      }
    },
    {$sort:{"_id.year":-1, "_id.month":-1}}
  ])

  return res;

}



module.exports = {
  createUser,
  loginAdminWithEmailAndPassword,
  getAdminByEmail,
  updateAdmin,
  stats,
  getLogs,
  getlistofpendingapprovals,
  approvePendingApprovals,
  getListOfAdmins,
  deleteAdminAccount,
  updateTelemetaryData,
  deleteHRMinutes,
  createBill,
  getBilledStatusByCond,
  getListOfCriticalTelemetaryData,
  getListOfTargets,
  getListOfRecentReadings,
  updateAdminAddImage,
  getAdminById,
  getListOfTargetsByMonth
};
