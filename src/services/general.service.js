const httpStatus = require('http-status');

const ApiError = require('../utils/ApiError');
const { Patient, Device, HealthData, HR, Admin, Doctor, PatientAdd, Billed, Chat } = require('../models');
const notification = require('../models/notification.model');
const Target = require('../models/targets.model');

const getUserByEmail = async (id) => {

    let user = await HR.findById(id);
    if (!user) {
        user = await Admin.findById(id);
        if (!user) {
            user = await Doctor.findById(id);
            if (!user) {
                throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
            }
        }
    }
    return user
};

const initialSetupReport = async (body) => {
    let query;
    if (body.month && !body.doctorId && !body.hrId) {
        query = { "initialsetup": body.month }
    }
    else if (body.month && body.doctorId) {
        query = { "initialsetup": body.month, "assigned_doctor_id": body.doctorId }
    }
    else {
        query = { "assigned_devices.deviceObjectId": { $exists: true } }
    }
    const listReport = await Patient.find(query)
        .populate('assigned_doctor_id', ['firstname', 'lastname', 'gender', 'specialization'])
        .populate("assigned_hr_id")
        .populate('assigned_devices.deviceObjectId', ['imei', 'modelNumber', 'deviceType', 'broken', 'block', 'assignedTime'])
        .sort({ createdAt: -1 });

    if (!listReport)
        throw new ApiError(httpStatus.NO_CONTENT, 'No patients in this initial month');


    return listReport;
};

const getNotifications = async (body) => {
    let query;
    console.log(body)
    if (body.doctorId) {
        query = { doctorId: body.doctorId }
    }

    if (body.hrId) {
        query = { hrId: body.hrId }
    }

    if (body.patientId) {
        query = { patientId: body.patientId }
    }
    if (body.admin) {
        query = { admin: body.admin }
    }

    if (!body.doctorId && !body.hrId && !body.patientId && !body.admin) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'body need either doctorId,patientId or hrId');
    }

    let noti = notification.find(query).sort({ createdAt: -1 });

    return noti
}

const resetpasswordanyuser = async (body) => {
    const user = await getUserByEmail(body.id);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    //   if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    //     throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    //   }
    Object.assign(user, { password: body.password });
    await user.save();
    return user;
}

const requestpatientaddapproval = async (body) => {
    const patientApproval = await PatientAdd.create(body);
    if (!patientApproval) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Bad Request');
    }
    return patientApproval;
}

const assignToMultiplePatients = async (body) => {
    let res = []
    if (body.assign) {
        if (body.hrId) {
            if (body.patientList?.length) {
                for (i = 0; i < body.patientList.length; i++) {
                    let result = await Patient.updateOne({ _id: body.patientList[i].id }, { $set: { assigned_hr_id: body.hrId } }, { upsert: true })
                    res.push(result)
                }
            }
        }
        if (body.drId) {
            if (body.patientList?.length) {
                for (i = 0; i < body.patientList.length; i++) {
                    let result = await Patient.updateOne({ _id: body.patientList[i].id }, { $set: { assigned_doctor_id: body.drId } }, { upsert: true })
                    res.push(result)

                }
            }
        }
    }
    if (!body.assign) {
        if (body.hrId) {
            if (body.patientList?.length) {
                for (i = 0; i < body.patientList.length; i++) {
                    let result = await Patient.updateOne({ _id: body.patientList[i].id }, { $unset: { assigned_hr_id: 1 } })
                    res.push(result)

                }
            }
        }
        if (body.drId) {
            if (body.patientList?.length) {
                for (i = 0; i < body.patientList.length; i++) {
                    let result = await Patient.updateOne({ _id: body.patientList[i].id }, { $unset: { assigned_doctor_id: 1 } })
                    res.push(result)

                }
            }
        }
    }

    return res
}

const minutereadingtotaldrhr = async (body) => {
    if ((body.drId || body.hrId) && body.month && body.year) {
        let listtosend = [], patientList;
        let billedPatients;

        const monthArray = ["January", "February", "March", "April", "May", "June", "July",
            "August", "September", "October", "November", "December"];

        // if (body.drId)
            patientList = await Patient.find(Patient.find({ $or: [ { patientType: 'RPM' }, { patientType: 'Both' } ], 
            assigned_doctor_id: body.drId, block: false }).lean());

        // if (body.hrId)
            patientList = await Patient.find(Patient.find({ $or: [ { patientType: 'RPM' }, { patientType: 'Both' } ], 
            assigned_doctor_id: body.drId, block: false }).lean());

        if (patientList) {
            for (let i = 0; i < patientList.length; i++) {
                let thisPatientTotalMin = 0;
                let thisPatientTotalMinWithNurse = 0;

                let patientReadingCount = await HealthData.aggregate(
                    [
                        {
                            $match: {
                                assigned_patient_id: patientList[i]._id,
                                dateAdded: { $regex: `${body.year}/${body.month}`, $options: 'mxi' },

                            }
                        }, {
                            $group: {
                                _id: { dateAdded: "$dateAdded" },
                                // count: { $sum: {} }
                            }
                        }
                    ]);

                let listofTargets = await Target.find(
                    {
                        assigned_patient_id: patientList[i]._id,
                        isCCM: null,
                        startDate: {
                            $gte: `${body.year}-${body.month}-01`,
                        },
                        endDate: {
                            $lte: `${body.year}-${body.month}-31`
                        }
                    }
                ).lean()

                if (listofTargets.length > 0)
                // listofTargets.forEach((target,index)=>{
                    for (let j = 0; j < listofTargets.length; j++) {
                        thisPatientTotalMin = thisPatientTotalMin + listofTargets[j].timeSpentInMinutes
                }

                // Nurse Contribution
                let nurseContribution = await Target.find(
                    {
                        assigned_patient_id: patientList[i]._id,
                        assigned_hr_id: body?.hrId,
                        isCCM: null,
                        startDate: {
                            $gte: `${body.year}-${body.month}-01`,
                        },
                        endDate: {
                            $lte: `${body.year}-${body.month}-31`
                        }
                    }
                ).lean()

                if (nurseContribution.length > 0)
                // listofTargets.forEach((target,index)=>{
                    for (let j = 0; j < nurseContribution.length; j++) {
                        thisPatientTotalMinWithNurse = thisPatientTotalMinWithNurse + nurseContribution[j].timeSpentInMinutes
                }

                billedPatients = await Billed.find(
                    {
                        assigned_patient_id: patientList[i]._id,
                        isBilled: true,
                        billedCategory: 'RPM',
                        billedMonth: body.month
                    }
                )

                listtosend.push({
                    patientId: patientList[i]?._id,
                    emrId: patientList[i]?.emrId,
                    patientName: patientList[i]?.lastname + " , " + patientList[i]?.firstname,
                    DOB: patientList[i]?.DOB,
                    totalReadings: patientReadingCount?.length,
                    totalMinutes: thisPatientTotalMin,
                    nurseContributed: thisPatientTotalMinWithNurse,
                    category: body.category,
                    billedStatus: billedPatients[0]?.isBilled,
                    Month: monthArray[Number(body.month) - 1]
                })
            }
        }
        return listtosend
    }
    else {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please fill out all fields');

    }
}


const generateBillingReport = async (body) => {
    if ((body.drId || body.hrId) && body.month && body.year) {
        let listtosend = [], patientList;

        const monthArray = ["January", "February", "March", "April", "May", "June", "July",
            "August", "September", "October", "November", "December"];

        // if (body.drId)
            patientList = await Patient.find(Patient.find({ $or: [ { patientType: 'RPM' }, { patientType: 'Both' } ], 
            assigned_doctor_id: body.drId, block: false }).lean());

        if (patientList) {
            for (let i = 0; i < patientList.length; i++) {
                let thisPatientTotalMin = 0;
                let thisPatientLastActivity;

                let patientReadingCount = await HealthData.aggregate(
                    [
                        {
                            $match: {
                                assigned_patient_id: patientList[i]._id,
                                dateAdded: { $regex: `${body.year}/${body.month}`, $options: 'mxi' },

                            }
                        }, {
                            $group: {
                                _id: { dateAdded: "$dateAdded" },
                                // count: { $sum: {} }
                            }
                        }
                    ]);

                let listofTargets = await Target.find(
                    {
                        assigned_patient_id: patientList[i]._id,
                        isCCM: null,
                        startDate: {
                            $gte: `${body.year}-${body.month}-01`,
                        },
                        endDate: {
                            $lte: `${body.year}-${body.month}-31`
                        }
                    }
                ).lean()

                if (listofTargets.length > 0)
                // listofTargets.forEach((target,index)=>{
                    for (let j = 0; j < listofTargets.length; j++) {
                        thisPatientTotalMin = thisPatientTotalMin + listofTargets[j].timeSpentInMinutes

                        thisPatientLastActivity = listofTargets[0].createdAt
                }
                  
                listtosend.push({
                    patientId: patientList[i]?._id,
                    emrId: patientList[i]?.emrId,
                    patientName: patientList[i]?.lastname + " , " + patientList[i]?.firstname,
                    initialSetup: patientList[i]?.initialsetup,
                    DOB: patientList[i]?.DOB,
                    totalReadings: patientReadingCount?.length,
                    totalMinutes: thisPatientTotalMin,
                    lastActivity: thisPatientLastActivity,
                    category: body.category,
                    Month: monthArray[Number(body.month) - 1]
                })
            }
        }
        return listtosend
    }
    else {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please fill out all fields');
    }
}


const generateBillingReportCCM = async (body) => {
    if ((body.drId || body.hrId) && body.month && body.year) {
        let listtosend = [], patientList;

        const monthArray = ["January", "February", "March", "April", "May", "June", "July",
            "August", "September", "October", "November", "December"];

        // if (body.drId)
            patientList = await Patient.find(Patient.find({ $or: [ { patientType: 'CCM' }, { patientType: 'Both' } ], 
            assigned_doctor_id: body.drId, block: false }).lean());

        if (patientList) {
            for (let i = 0; i < patientList.length; i++) {
                let thisPatientTotalMin = 0;
                let thisPatientLastActivity;

                let listofTargets = await Target.find(
                    {
                        assigned_patient_id: patientList[i]._id,
                        isCCM: true,
                        startDate: {
                            $gte: `${body.year}-${body.month}-01`,
                        },
                        endDate: {
                            $lte: `${body.year}-${body.month}-31`
                        }
                    }
                ).lean()

                if (listofTargets.length > 0)
                // listofTargets.forEach((target,index)=>{
                    for (let j = 0; j < listofTargets.length; j++) {
                        thisPatientTotalMin = thisPatientTotalMin + listofTargets[j].timeSpentInMinutes

                        thisPatientLastActivity = listofTargets[0].createdAt
                }
                  
                listtosend.push({
                    patientId: patientList[i]?._id,
                    emrId: patientList[i]?.emrId,
                    patientName: patientList[i]?.lastname + " , " + patientList[i]?.firstname,
                    DOB: patientList[i]?.DOB,
                    totalMinutes: thisPatientTotalMin,
                    lastActivity: thisPatientLastActivity,
                    category: body.category,
                    Month: monthArray[Number(body.month) - 1]
                })
            }
        }
        return listtosend
    }
    else {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please fill out all fields');
    }
}

const minutereadingtotaldrhrCCM = async (body) => {
    if (body.reportBy === 'doctor' && body.month && body.year) {
        let listtosend = [], patientList;
        let listofTargets 
        let billedPatients


        const monthArray = ["January", "February", "March", "April", "May", "June", "July",
            "August", "September", "October", "November", "December"];

        
            patientList = await Patient.find(
                { 
                    assigned_doctor_id: body.drId,
                    $or: [ { patientType: 'CCM' }, { patientType: 'Both' } ], 
            }).lean();
        

            if (patientList) {
                for (let i = 0; i < patientList.length; i++) {
                    let thisPatientTotalMin = 0;
    
                        listofTargets = await Target.find(
                            {
                                assigned_patient_id: patientList[i]._id,
                                isCCM: true,
                                startDate: {
                                    $gte: `${body.year}-${body.month}-01`,
                                },
                                endDate: {
                                    $lte: `${body.year}-${body.month}-31`
                                }
                            }
                        ).lean()
                    
                    if (listofTargets.length > 0)
                        for (let j = 0; j < listofTargets.length; j++) {
                            thisPatientTotalMin = thisPatientTotalMin + listofTargets[j].timeSpentInMinutes
                    }
                                        
                        billedPatients = await Billed.find(
                            {
                                assigned_patient_id: patientList[i]._id,
                                isBilled: true,
                                billedCategory: 'CCM',
                                billedMonth: body.month
                            }
                        )
    
                    listtosend.push({
                        patientId: patientList[i]?._id,
                        emrId: patientList[i]?.emrId,
                        patientName: patientList[i]?.lastname + " , " + patientList[i]?.firstname,
                        DOB: patientList[i]?.DOB,
                        totalMinutes: thisPatientTotalMin,
                        billedStatus: billedPatients[0]?.isBilled,
                        Month: monthArray[Number(body.month) - 1]
                    })
                }
            }
        
        return listtosend

    } else if(body.reportBy === 'hr' && body.month && body.year){
        {
            let listtosend = [], patientList;
            let listofTargets 
            let billedPatients
    
    
            const monthArray = ["January", "February", "March", "April", "May", "June", "July",
                "August", "September", "October", "November", "December"];
    
                patientList = await Patient.find(
                    { 
                        assigned_doctor_id: body.drId,
                        $or: [ { patientType: 'CCM' }, { patientType: 'Both' } ], 
                }).lean();
            
    
                if (patientList) {
                    for (let i = 0; i < patientList.length; i++) {
                        let thisPatientTotalMin = 0;
                        let thisPatientTotalMinWithNurse = 0;
                        
        
                            listofTargets = await Target.find(
                                {
                                    assigned_patient_id: patientList[i]._id,
                                    // assigned_hr_id: body.hrId,
                                    isCCM: true,
                                    startDate: {
                                        $gte: `${body.year}-${body.month}-01`,
                                    },
                                    endDate: {
                                        $lte: `${body.year}-${body.month}-31`
                                    }
                                }
                            ).lean()
                        
                        if (listofTargets.length > 0)
                            for (let j = 0; j < listofTargets.length; j++) {
                                thisPatientTotalMin = thisPatientTotalMin + listofTargets[j].timeSpentInMinutes
                        }

                            // Nurse Contribution
                let nurseContribution = await Target.find(
                    {
                        assigned_patient_id: patientList[i]._id,
                        assigned_hr_id: body?.hrId,
                        isCCM: true,
                        startDate: {
                            $gte: `${body.year}-${body.month}-01`,
                        },
                        endDate: {
                            $lte: `${body.year}-${body.month}-31`
                        }
                    }
                ).lean()

                if (nurseContribution.length > 0)
                // listofTargets.forEach((target,index)=>{
                    for (let j = 0; j < nurseContribution.length; j++) {
                        thisPatientTotalMinWithNurse = thisPatientTotalMinWithNurse + nurseContribution[j].timeSpentInMinutes
                }
                                
                            billedPatients = await Billed.find(
                                {
                                    assigned_patient_id: patientList[i]._id,
                                    isBilled: true,
                                    billedCategory: 'CCM',
                                    billedMonth: body.month
                                }
                            )
        
                        listtosend.push({
                            patientId: patientList[i]?._id,
                            patientName: patientList[i]?.firstname + " " + patientList[i]?.lastname,
                            DOB: patientList[i]?.DOB,
                            totalMinutes: thisPatientTotalMin,
                            nurseContributed: thisPatientTotalMinWithNurse,
                            billedStatus: billedPatients[0]?.isBilled,
                            Month: monthArray[Number(body.month) - 1]
                        })
                    }
                }
            
            return listtosend
        }
    }
    
    
    else {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Body is missing');
    }
}




const totalMinutesReadingsCountHistory = async (body) => {
    if ((body.drId || body.hrId) && body.month && body.year) {
        let listtosend = [], patientList;
        const monthArray = ["January", "February", "March", "April", "May", "June", "July",
            "August", "September", "October", "November", "December"];

        if (body.hrId)
            patientList = await Target.find({
                assigned_hr_id: body.hrId,
                createdAt: {
                    '$gte': new Date(new Date(`${body.year}-${body.month}-01`).setHours(0o0, 0o0, 0o0)),
                    '$lte': new Date(new Date(`${body.year}-${body.month}-31`).setHours(23, 59, 59))
                }}).populate('assigned_hr_id', ['firstname', 'lastname', 'gender', 'specialization'])
               .populate('assigned_patient_id', ['firstname', 'lastname'])


            if (patientList) {
                for (let i = 0; i < patientList.length; i++) {
                    let thisPatientTotalMin = 0;
    
                    let patientReadingCount = await HealthData.aggregate(
                        [
                            {
                                $match: {
                                    assigned_patient_id: patientList[i].assigned_patient_id?._id,
                                    dateAdded: { $regex: `${body.year}/${body.month}`, $options: 'mxi' },
    
                                }
                            }, {
                                $group: {
                                    _id: { dateAdded: "$dateAdded" },
                                    // count: { $sum: {} }
                                }
                            }
                        ])
                        
                        let listofTargets = await Target.find(
                            {
                                assigned_patient_id: patientList[i].assigned_patient_id,
                                isCCM: body.category,
                                startDate: {
                                    $gte: `${body.year}-${body.month}-01`,
                                },
                                endDate: {
                                    $lte: `${body.year}-${body.month}-31`
                                }
                            }
                        ).lean()
        
                        if (listofTargets.length > 0)
                            // listofTargets.forEach((target,index)=>{
                            for (let j = 0; j < listofTargets.length; j++) {
                                thisPatientTotalMin = thisPatientTotalMin + listofTargets[j].timeSpentInMinutes
                            }

                        listtosend.push({
                            patientId: patientList[i]?.assigned_patient_id,
                            totalReadings: patientReadingCount?.length,
                            totalMinutes: thisPatientTotalMin,
                            // category: body.category,
                            Month: monthArray[Number(body.month) - 1]
                        })
                    }
                }
        
        return listtosend;
    }
    else {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Body is missing');
    }
}

const totalMinutesReadingsCountHistoryOfCCM = async (body) => {
    if ((body.drId || body.hrId) && body.month && body.year) {
        let listtosend = [], patientList;
        const monthArray = ["January", "February", "March", "April", "May", "June", "July",
            "August", "September", "October", "November", "December"];

        if (body.hrId)
            patientList = await Target.find({
                assigned_hr_id: body.hrId,
                isCCM: true,
                startDate: {
                    $gte: `${body.year}-${body.month}-01`,
                },
                endDate: {
                    $lte: `${body.year}-${body.month}-31`
                }}).populate('assigned_hr_id', ['firstname', 'lastname', 'gender', 'specialization'])
               .populate('assigned_patient_id', ['firstname', 'lastname'])


            if (patientList) {
                for (let i = 0; i < patientList.length; i++) {
                    let thisPatientTotalMin = 0;
                        
                        let listofTargets = await Target.find(
                            {
                                assigned_patient_id: patientList[i].assigned_patient_id,
                                isCCM: true,
                                startDate: {
                                    $gte: `${body.year}-${body.month}-01`,
                                },
                                endDate: {
                                    $lte: `${body.year}-${body.month}-31`
                                }
                            }
                        ).lean()
        
                        if (listofTargets.length > 0)
                            // listofTargets.forEach((target,index)=>{
                            for (let j = 0; j < listofTargets.length; j++) {
                                thisPatientTotalMin = thisPatientTotalMin + listofTargets[j].timeSpentInMinutes
                            }

                        listtosend.push({
                            patientId: patientList[i]?.assigned_patient_id,
                            totalMinutes: thisPatientTotalMin,
                            Month: monthArray[Number(body.month) - 1]
                        })
                    }
                }
        
        return listtosend;
    }
    else {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Body is missing');
    }
}


const createMessage = async (messageBody) => {
    return Chat.create(messageBody);
};

const getMessage = async (messageBody) => {
    const message = await Chat.find({ patient_id: messageBody.patientId, nurse_id: messageBody.nurseId })
    .populate('patient_id', ['firstname', 'lastname', 'gender'])
    .populate('nurse_id', ['firstname', 'lastname', 'gender'])
    .lean();

  if (!message) {
    throw new ApiError(httpStatus.NOT_FOUND, 'chat not found');
  }
  return message;
}

const getDoctorNurses = async (body) => {
    const nursesList = await HR.find({ assigned_doctor_id: body.drId })
    .lean();

  if (!nursesList) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No Nurse is associated with this doctor');
  }
  return nursesList;
}



const getGeneralCCMPatients = async (body, page, pagination) => {
    let patient;

    if(body.drId){
        patient = await Patient.find({ 
            $and: [ 
                {  $or: [
                  {patientType: "CCM"},
                  {patientType: "Both"}
                  ] 
                }, 
            {assigned_doctor_id: body.drId}, 
                  { block: false } ]})
            .populate('assigned_doctor_id', ['firstname', 'lastname', 'gender'])
            .populate("assigned_hr_id")
            .skip((page - 1) * pagination)
            .limit(pagination)
            .sort({ createdAt: -1 })
            .lean();

            if (!patient) {
                throw new ApiError(httpStatus.NOT_FOUND, 'patients not found');
            }
            return patient;
    }  

    return patient;
  };


module.exports = {
    initialSetupReport,
    getNotifications,
    resetpasswordanyuser,
    getUserByEmail,
    requestpatientaddapproval,
    assignToMultiplePatients,
    minutereadingtotaldrhr,
    totalMinutesReadingsCountHistory,
    minutereadingtotaldrhrCCM,
    totalMinutesReadingsCountHistoryOfCCM,
    createMessage,
    getMessage,
    getDoctorNurses,
    getGeneralCCMPatients,
    generateBillingReport,
    generateBillingReportCCM
}
