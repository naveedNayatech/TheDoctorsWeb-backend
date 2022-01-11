const Patient = require('../../models/patient');
const ErrorHandler = require('../../utils/errorHandler');
const catchAsyncError = require('../../middlewares/catchAsyncErrors');


exports.registerPatient = catchAsyncError(async(req, res, next) => {
    try {
        const { 
            title, 
            firstname, 
            lastname, 
            email, 
            gender,
            contactno, 
            phone1, 
            phone2,
            address, 
            insurancecompany, 
            insurancestatus, 
            preferredlanguage, 
            pcp,
            practise, 
            npmconsent,
            consentdocid,
            initialsetup,
            readingsperday,
            diseases,
            doctorid,
            deviceassigned 
        } = req.body;

        const isPatientExist = await Patient.findOne({ email: email});

        if(isPatientExist){
            return res.status(400).json({
                success: false,
                message: 'Patient already Exist'
                })
        }

        const patient = await Patient.create({
            title, 
            firstname, 
            lastname, 
            email, 
            gender,
            contactno, 
            phone1, 
            phone2,
            address, 
            insurancecompany, 
            insurancestatus, 
            preferredlanguage, 
            pcp,
            practise, 
            npmconsent,
            consentdocid,
            initialsetup,
            readingsperday,
            diseases,
            doctorid,
            deviceassigned
        })


        res.status(201).json({
            success: true,
            message: 'New Patient Added',
            patient
        })
            
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
            })      
    }
})