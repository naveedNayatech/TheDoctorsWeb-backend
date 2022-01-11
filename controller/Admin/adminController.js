const Doctor = require('../../models/doctor');
const Patient = require('../../models/patient');
const deviceData = require('../../models/deviceData');
const ErrorHandler = require('../../utils/errorHandler');
const APIFeatures = require('../../utils/apiFeatures');
const catchAsyncError = require('../../middlewares/catchAsyncErrors');
const sendToken = require('../../utils/jwtToken');
const cloudinary = require('cloudinary');
const sendEmail = require('../../utils/sendEmail');
const device = require('../../models/device');


exports.registerDoctor = catchAsyncError(async (req, res, next) => {
    try {
        const {
            title,
            firstname,
            lastname,
            email,
            gender,
            password,
            contactno,
            phone1,
            phone2,
            npinumber,
            licensenumber,
            role,
            specialization
        } = req.body;

        const isDoctorExist = await Doctor.findOne({ email: email })

        if (isDoctorExist) {
            return res.status(400).json({
                success: false,
                message: 'Email already Exist'
            })
        }


        let result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'Doctors',
            width: '150',
            crop: "scale"
        });

        const doctor = await Doctor.create({
            title,
            firstname,
            lastname,
            email,
            gender,
            password,
            contactno,
            phone1,
            phone2,
            npinumber,
            licensenumber,
            role,
            avatar: {
                public_id: result.public_id,
                url: result.secure_url
            },
            specialization
        })


        const message = `Your account has been successfully created at thedoctorsweb.com, you can now use your account by using the following credentials \n
        Email : ${doctor.email} \n 
        Password: ${req.body.password} \n 
        
        Thankyou for your account creation. If you have any query feel free to ask at admin@thedoctorsweb.com \n 
        Best Regards,
        admin@thedoctorsweb.com `
        try {
            await sendEmail({
                email: doctor.email,
                subject: 'Account Successfully Created.',
                message
            })
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Server error, cannot send email',
                doctor
            })
        }

        res.status(201).json({
            success: true,
            message: 'New Doctor Added',
            doctor
        })

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
})

// Get all patients - ADMIN => /api/v1/admin/patientslist 
exports.patientsList = catchAsyncError(async (req, res, next) => {

    try {
        const patients = await Patient.find();
        const patientCount = await Patient.countDocuments();
        res.status(200).json({
            success: true,
            patientCount,
            patients
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
})

// Get Patient Profile => /api/v1/admin/patient
exports.getPatientProfile = catchAsyncError(async (req, res, next) => {
    const { patientid } = req.body;

    const patient = await Patient.findById(patientid);

    if (!patient) {
        return res.status(400).json({
            success: false,
            message: "Patient Not Found."
        })
    }

    res.status(200).json({
        success: true,
        patient
    })
})

exports.assignDevice = catchAsyncError(async (req, res, next) => {
    const { patientid } = req.body;
    const { deviceid } = req.body;

    const patient = await Patient.findById(patientid);

    if(!patient){
        return res.status(400).json({
            success: false,
            message: "Patient Not Found."
        })
    }

    const isAlreadyAssigned = await patient.deviceassigned.find(o => o.deviceid === deviceid);

    if(isAlreadyAssigned) {
        return res.status(400).json({
            success: false,
            message: "Device Already Assigned."
        })
    }

    const data = {
        deviceid: deviceid
    }
    
    await patient.deviceassigned.push(data);

    await patient.save({ validateBeforeSave: false })

    const newDoctorData = {
        status: true
    }

     await device.findOneAndUpdate(deviceid, newDoctorData, {
        new: true,
        runValidators: true,
        useFindAndModify: true
    })


    res.status(200).json({
        success: true,
        patient
    })
})

exports.removeDevice = catchAsyncError(async (req, res, next) => {
    const { patientid } = req.body;
    const { deviceid } = req.body;

    const patient = await Patient.findById(patientid);

    if(!patient){
        return res.status(400).json({
            success: false,
            message: "Patient Not Found."
        })
    }


    const isAlreadyAssigned = await patient.deviceassigned.find(o => o.deviceid === deviceid);

    if(isAlreadyAssigned){
        const data = {
            deviceid: deviceid
        }
        
        await patient.deviceassigned.pop(data);
    
        await patient.save({ validateBeforeSave: false })
        
        const newDoctorData = {
            status: false
        }
    
         await device.findOneAndUpdate(deviceid, newDoctorData, {
            new: true,
            runValidators: true,
            useFindAndModify: true
        })

        var date = new Date();
        month = date.getMonth();

        await Patient.findOneAndUpdate(patientid, {initialsetup:`${month}`}, {
            new: true,
           
        })

        res.status(200).json({
            success: true,
            patient
        })
        
    } else {
        res.status(200).json({
            success: true,
            message: 'Device Not Found'
        })
    }
})





// Get Doctor Profile => /api/v1/admin/doctor
exports.getDoctorProfile = catchAsyncError(async (req, res, next) => {
    const { doctorId } = req.body;

    const doctor = await Doctor.findById(doctorId);

    const docpatients = await Patient.find({ doctorid: doctorId });

    if (!doctor) {
        return res.status(400).json({
            success: false,
            message: "Doctor Not Found."
        })
    }

    res.status(200).json({
        success: true,
        doctor,
        docpatients
    })
})

// Update Doctor => /api/v1/admin/updateDoctor

exports.updateDoctor = catchAsyncError(async (req, res, next) => {

    const newDoctorData = {
        title: req.body.title,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        gender: req.body.gender,
        contactno: req.body.contactno,
        phone1: req.body.phone1,
        phone2: req.body.phone2,
        npinumber: req.body.npinumber,
        licensenumber: req.body.licensenumber,
        role: req.body.role,
        specialization: req.body.specialization,
        patients: req.body.patients
    }

    const doctor = await Doctor.findByIdAndUpdate(req.body.doctorId, newDoctorData, {
        new: true,
        runValidators: true,
        useFindAndModify: true
    })

    res.status(200).json({
        success: true,
        doctor
    })
})


// update Patient data = > api/v1/admin/patient
exports.updatePatient = catchAsyncError(async (req, res, next) => {
    try {
        const newPatientData = {
            title: req.body.title,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            gender: req.body.gender,
            contactno: req.body.contactno,
            phone1: req.body.phone1,
            phone2: req.body.phone2,
            address: req.body.address,
            insurancecompany: req.body.insurancecompany,
            insurancestatus: req.body.insurancestatus,
            preferredlanguage: req.body.preferredlanguage,
            pcp: req.body.pcp,
            practise: req.body.practise,
            npmconsent: req.body.npmconsent,
            consentdocid: req.body.consentdocid,
            initialsetup: req.body.initialsetup,
            readingsperday: req.body.readingsperday,
            diseases: req.body.diseases,
            doctorid: req.body.doctorId,
            // deviceid: req.body.deviceId
        }

        const patient = await Patient.findByIdAndUpdate(req.body.id, newPatientData, {
            new: true,
            runValidators: true,
            useFindAndModify: true
        })


        res.status(200).json({
            success: true,
            patient
        })


    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }

})

// Get all doctors - ADMIN => /api/v1/admin/doctorslist 
exports.doctorsList = catchAsyncError(async (req, res, next) => {

    try {
        const resPerPage = 5;

        const apiFeatures = new APIFeatures(Doctor.find().sort({_id: -1}), req.query)
                            .search()            
                            .pagination(resPerPage);

        const doctors = await apiFeatures.query;

        const doctorCount = await Doctor.countDocuments();

        res.status(200).json({
            success: true,
            doctorCount,
            resPerPage,
            doctors
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
})

exports.DeviceCert = async (req, res) => {
    try {
        console.log(req.body)
        res.status(200).send("data recieved  " + JSON.stringify(req.body));
    }
    catch (err) {
        console.log(err)
    }
};

exports.devicetelemetry = async (req, res) => {
    try {
        console.log(req.params.deviceparam)
        console.log(req.body);

        let patientId;
        let FindPatient = await Patient.find({deviceassigned: { $elemMatch: {deviceid: req.params.deviceparam}}})
        
        FindPatient.map((patient, index) => {
            patientId = patient._id
        })

        if(patientId === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Cannot Find Patient'
            })
        } else {
            let insertIntoDeviceData = await deviceData.create({ patientId: patientId, deviceId: req.params.deviceparam, telemetaryData: req.body })
            console.log(insertIntoDeviceData);
        }

        

        res.status(200).send("data recieved  " + JSON.stringify(req.body));
    }
    catch (err) {
        console.log(err)
    }
};

exports.forwardtelemetry = async (req, res) => {
    console.log(req.body)
    res.status(200).send("data recieved  " + JSON.stringify(req.body));
};

// Get device data - ADMIN => /api/v1/admin/devicedata 
exports.getDeviceData = catchAsyncError(async (req, res, next) => {
    try {
        const { patientId, sort } = req.body;

        let data;

        
        data = await deviceData.find({
            patientId: patientId
        }).sort({ _id: sort });
        



        // if (!deviceId || !patientId) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Invalid DeviceId or PatientId'
        //     })
        // }

        // const data = await deviceData.find({
        //     deviceId: deviceId,
        //     patientId: patientId
        // }).sort({ _id: -1 });


        res.status(200).json({
            success: true,
            data
        })


    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
})

exports.addDevice = catchAsyncError(async (req, res, next) => {
    try {

        const isDeviceExist = await device.findOne({ deviceId: req.body.deviceId })
        
        if (isDeviceExist) {
            return res.status(400).json({
                success: false,
                message: 'Device already Exist'
            })
        }

        let createDevice = await device.create(req.body);
        
        if(createDevice)
        res.status(200).json({
            success: true,
            createDevice
        })
        else
        return res.status(400).json({
            success: false,
            message: "cannot create device"
        })

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
})

exports.updateDevice = catchAsyncError(async (req, res, next) => {
    try {

        let findDevice = await device.findOne({deviceId:req.params.deviceId});

        if(findDevice){
            Object.assign(findDevice, req.body);
            await findDevice.save();
            res.status(200).json({
                success: true,
                findDevice
            })
        }
       
        else{
            return res.status(400).json({
                success: false,
                message: "cannot find device"
            })
        }
        

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
})

exports.getDeviceDetails = catchAsyncError(async (req, res, next) => {
    try {

        let findDevice = await device.findOne({deviceId:req.body.deviceId});

        if(findDevice){
            
            res.status(200).json({
                success: true,
                findDevice
            })
        }
       
        else{
            return res.status(400).json({
                success: false,
                message: "cannot find device"
            })
        }
        

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
})

// Get all devices - ADMIN => /api/v1/devices 
exports.devicesList = catchAsyncError(async (req, res, next) => {

    try {
        const devices = await device.find().sort({ _id: -1 });

        const deviceCount = await device.countDocuments();
        res.status(200).json({
            success: true,
            deviceCount,
            devices
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
})

/**
 * get device data of a patient for a month or today
 * @param {ObjectId/id} patientId 
 * @param {boolean} todaysData
 * @returns {Promise<PatientDeviceData>}
 */

// exports.getdevicedataforpatient = catchAsyncError(async (req, res, next) => {
//     try {
//         let PatientDeviceData;
    
//         if(!req.body.todaysData){
//         //get the month and month start and end data and covert that to iso format
//         var date = new Date();
//         var month = date.getMonth();
//         month++
//         if(month < 10)
//         month = '0' + month
    
//         var startdated=`2022-${month}-01T00:00:00+05:30`;
//         var startnewdated= new Date(startdated);
//         var startDate= startnewdated.toISOString();
    
//         var enddated=`2022-${month}-30T00:00:00+05:30`;
//         var endnewdated= new Date(enddated);
//         var endDate= endnewdated.toISOString();
    
    
//          PatientDeviceData = await deviceData.find({
//           "patientId": req.body.patientId, createdAt: {
//             $gte: startDate,
//             $lte: endDate
//           }
//         })
//       }
//       else{
       
//           //get the month and month start and end data and covert that to iso format
//           console.log('Helloooo');
//           var date = new Date();
//           var month = date.getMonth();
//           month++
//           if(month < 10)
//           month = '0' + month
    
//           var day = date.getDate();
//           if(day < 10)
//           day = '0' + day
    
      
//           var dated=`2022-${month}-${day}T00:00:00+05:30`;
//           var newdated= new Date(dated);
//           var todaysDate= newdated.toISOString();
      
//             console.log('todaysDate is ' + todaysDate);
//             PatientDeviceData = await deviceData.find({
//             patientId: req.body.patientId, createdAt: '2022-01-03'
//           })
        
//       }
//         res.status(200).json({
//             success: true,
//             PatientDeviceData
//         })

//       } catch (error) {
//         return res.status(400).json({
//             success: false,
//             message: error.message
//         })
//       }
// })

exports.getdevicedatabwdates = catchAsyncError(async (req, res, next) => {
    try {
        var startDate = new Date(req.body.date);
        startDate.setDate(startDate.getDate() - 1)
        console.log(startDate);

        var endDate = new Date(req.body.date);
        endDate.setDate(endDate.getDate() + 1)
        console.log(endDate);

        const data = await deviceData.find({ 
            patientId: req.body.patientid,
            deviceId: req.body.deviceid,

            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            } 
        })    

        res.status(200).json({
            success: true,
            data
        })


      } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
      }
})


