const httpStatus = require('http-status');

const ApiError = require('../utils/ApiError');
const { Patient, Device, HealthData, Notification, Log, DeviceSignal, DeviceHistory, CCMCareplan, Consent } = require('../models');
const Careplan = require('../models/careplan.model');
const Doctor = require('../models/doctor.model');
const Hr = require('../models/HR.model');
const moment = require("moment");
const { sendEmail } = require('./email.service');
const mongoose = require('mongoose');

// await Device.find({_id: { $regex: search,  $options: 'mxi' }})
/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  // if (await Patient.isEmailTaken(userBody.email)) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  // }
  return Patient.create(userBody);
};

/**
 * 
 * @param {*} patientId 
 * @param {*} updateBody 
 * @returns {promise<patient>}
 */
const updatePatient = async (patientId, updateBody, user) => {
  const patient = await Patient.findById(patientId)
  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'patient not found');
  }

  Object.assign(patient, updateBody);
  await patient.save();
  return patient;
};


/**
 * 
 * @param {*} patientId 
 * @param {*} block 
 * @returns {promise<patient>}
 */
const blockPatient = async (patientId, block) => {
  const patient = await Patient.findByIdAndUpdate(patientId, { $set: { "block": block } }, { upsert: true, new: true })
  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'patient not found');
  }

  return patient;
};

/**
 * 
 *
 * @returns {promise<patientslist>}
 */
const patientList = async (page, pagination) => {

  const patient = await Patient.find({ $or: [
                        {patientType: "RPM"},
                        {patientType: "Both"}
                        ]})
    .populate('assigned_doctor_id', ['firstname', 'lastname', 'gender', 'specialization'])
    .populate("assigned_hr_id")
    .populate('assigned_devices.deviceObjectId', ['imei', 'modelNumber', 'deviceType', 'broken', 'block'])
    .skip((page - 1) * pagination)
    .limit(pagination)
    .sort({ createdAt: -1 })
    .lean();

  if (patient.length) {
    for (let i = 0; i < patient.length; i++) {
      let findHealthData = await HealthData.find({ assigned_patient_id: patient[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
      patient[i] = { ...patient[i], lastReading: findHealthData && findHealthData[0]?.dateAdded}
    }
  }

  if (patient.length){
    for (let i = 0; i < patient.length; i++) {
      let deviceBatteryStatus = await DeviceSignal.find({ assigned_patient_id: patient[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
      patient[i] = { ...patient[i], batterySignals: deviceBatteryStatus && deviceBatteryStatus[0]?.signalData}
    }
  }


  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'patients not found');
  }
  return patient;
};


const getCCMPatients = async (page, pagination) => {

  const patient = await Patient.find({ $and: [ {  $or: [
                                        {patientType: "CCM"},
                                        {patientType: "Both"}
                                        ] }, { block: false } ]})
    .populate('assigned_doctor_id', ['firstname', 'lastname', 'gender', 'specialization'])
    .populate("assigned_hr_id")
    .skip((page - 1) * pagination)
    .limit(pagination)
    .sort({ createdAt: -1 })
    .lean();

  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'patients not found');
  }
  return patient;
};


const getInactivePatients = async () => {
  const patient = await Patient.find({ block: true })
    .sort({ createdAt: -1 })
    .lean();

  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'patients not found');
  }
  return patient;
};


const getuserbydeviceid = async (deviceId) => {

  let device, patient;

  device = await Device.findById(deviceId)
  if (device)
    patient = await Patient.findOne({ "assigned_devices.deviceObjectId": device._id })
      .populate('assigned_doctor_id', ['firstname', 'lastname', 'gender', 'specialization'])
      .populate("assigned_hr_id")
      .populate('assigned_devices.deviceObjectId', ['imei', 'modelNumber', 'deviceType', 'broken', 'block'])
  else
    throw new ApiError(httpStatus.NOT_FOUND, 'device not found');

  if (device && !patient)
    throw new ApiError(httpStatus.NOT_FOUND, 'no patient assigned with this device');

  if (device && patient && patient.block)
    throw new ApiError(httpStatus.NOT_FOUND, 'patient is blocked please contact admin');

  return patient

}

const filterpatienthistory = async (body, page, pagination) => {
  let patientId = body.patientId,
    deviceId = body.deviceId,
    startDate = body.startDate,
    endDate = body.endDate,
    specificDate = body.specificDate,
    query;

  // const device = await Device.findById(deviceId)
  // if (!device)
  //   throw new ApiError(httpStatus.NOT_FOUND, 'no data for this device found');

  startDate = new Date(startDate);
  endDate = new Date(endDate);

  if (body.startDate && body.endDate && patientId && deviceId) {
    query = {
      assigned_patient_id: patientId,
      // deviceId: device._id,

      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
  }
  if (!body.startDate && !body.endDate && patientId && !deviceId) {
    query = {
      assigned_patient_id: patientId,
    }
  }

  if (body.startDate && body.endDate && patientId && !deviceId) {
    query = {
      assigned_patient_id: patientId,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
  }

  if (!body.startDate && !body.endDate && !patientId && !deviceId && body.specificDate) {
    let endDate = startDate
    endDate = endDate + 'T23:59:59';
    query = {

      dateAdded: specificDate
    }
  }

  if (!body.startDate && !body.endDate && patientId && !deviceId && body.specificDate) {
    let endDate = startDate
    endDate = endDate + 'T23:59:59';
    query = {
      assigned_patient_id: patientId,
      dateAdded: specificDate
    }
  }


  const healthData = await HealthData.find(query)
    .populate('assigned_patient_id', ['firstname', 'lastname', 'gender', 'specialization'])
    .populate('deviceId', ['imei', 'modelNumber', 'deviceType', 'broken', 'block'])
    .populate('notes.conclusion_hr_id', ['firstname', 'lastname', 'role'])
    .populate('notes.conclusion_doctor_id', ['firstname', 'lastname', 'role'])
    .skip((page - 1) * pagination)
    .limit(pagination)
    .sort({ createdAt: body.createdAt || -1 });

  const totalCount = await HealthData.countDocuments(query);

  if (!healthData)
    throw new ApiError(httpStatus.NOT_FOUND, 'cant find health data of this patient');
  else {
    return ({ healthData, Count: totalCount })
  }

}


const patientProfile = async (patientId) => {
  const patient = await Patient.findById(patientId)
    .populate('assigned_doctor_id', ['firstname', 'lastname', 'gender', 'specialization'])
    .populate("assigned_hr_id")
    .populate("assigned_ccm_nurse_id")
    .populate('assigned_devices.deviceObjectId', ['imei', 'modelNumber', 'deviceType', 'assignedTime', 'broken', 'block'])
  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'patients not found');
  }
  return patient;
};

const commentOnReading = async (readingId, body) => {
  const reading = await HealthData.findById(readingId)
  if (!reading) {
    throw new ApiError(httpStatus.NOT_FOUND, 'cannot find reading');
  }
  reading.notes.push(body)
  Object.assign(reading, reading);
  await reading.save();
  return reading;
};

const addCarePlan = async (body) => {
  if ((!body.assigned_doctor_id || !body.assigned_hr_id) && !body.assigned_patient_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Request body missing include one  doctor or hr id and one patient id  ');
  }
  let findPatient = await Careplan.findOne({ assigned_patient_id: body.assigned_patient_id })
  if (findPatient) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Careplan already exists for this patient');
  }

  return Careplan.create(body);
};

// CCM Careplan
const uploadCCMCarePlan = async (body) => {
  if ((!body.assigned_doctor_id || !body.assigned_hr_id) && !body.assigned_patient_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Doctor or Nurse ID missing');
  }
  let findPatient = await CCMCareplan.findOne({ assigned_patient_id: body.assigned_patient_id })
  if (findPatient) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Careplan already exists for this patient');
  }

  return CCMCareplan.create(body);
};

const getCarePlan = async (patientId) => {
  let carePlan = await Careplan.findOne({ assigned_patient_id: patientId }).lean()
    .populate("assigned_doctor_id")
    .populate("assigned_hr_id")
    .populate("assigned_patient_id")

  if (!carePlan) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No careplan for this patient');
  }

  return carePlan;
};

const fetchCCMCarePlan = async (patientId) => {
  let carePlan = await CCMCareplan.findOne({ assigned_patient_id: patientId }).lean()
    .populate("assigned_patient_id")

  if (!carePlan) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Careplan not found');
  }

  return carePlan;
};

// CCM Consent
const uploadConsent = async (body) => {
  if (!body.assigned_patient_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Patient ID is missing');
  }
  
  let findPatient = await Consent.findOne({ 
    assigned_patient_id: body.assigned_patient_id,
    consentType: body.consentType
  })
  
  if (findPatient) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Consent already exists for this patient');
  }

  return Consent.create(body);
};

const deletePatientCCMConsent = async (consentId) => {

  const ccmconsent = await Consent.findById(consentId);
  if (!ccmconsent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CCM Consent not found');
  }
  await ccmconsent.remove();
  return ccmconsent;  
}


const deletePatientCCMCareplan = async (careplanId) => {
  const ccmcareplan = await CCMCareplan.findById(careplanId);
  if (!ccmcareplan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CCM Careplan not found');
  }
  await ccmcareplan.remove();
  return ccmcareplan;  
}


const deletePatientRPMCareplan = async (careplanId) => {
  const rpmcareplan = await Careplan.findById(careplanId);
  if (!rpmcareplan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'RPM Careplan not found');
  }
  await rpmcareplan.remove();
  return rpmcareplan;  
}


const carePlanUpdate = async (carePlanId, updateBody) => {
  const careplan = await Careplan.findById(carePlanId)
  if (!careplan) {
    throw new ApiError(httpStatus.NOT_FOUND, 'careplan not found');
  }

  Object.assign(careplan, updateBody);
  await careplan.save();
  return careplan;
};

const getPatientCCMConsent = async (patientId, consentType) => {
  let consent = await Consent.findOne({ 
    assigned_patient_id: patientId,
    consentType: consentType
  }).lean()
    .populate("assigned_patient_id")
    .populate('assigned_hr_id', ['_id', 'firstname', 'lastname', 'gender']);

  if (!consent) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Consent not found');
  }

  return consent;
};


const addremovedevice = async (patientId, body, user) => {
  let patient, isDeviceAlreadyAssigned, unassign;
  patient = await Patient.findById(patientId)
  var D = new Date();
  let device;
  let month = D.getMonth();
  let year = D.getFullYear();
  var monthArray = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  if (body.assignDevice) {
    if (!patient) {
      throw new ApiError(httpStatus.NOT_FOUND, 'patient not found');
    }
    else {
      isDeviceAlreadyAssigned = await Patient.findOne({ "assigned_devices.deviceObjectId": body.deviceId })
      if (!isDeviceAlreadyAssigned) {
        if (!patient.initialsetup) {
          patient.initialsetup = monthArray[month] + "/" + year
          await Log.create({
            text: `${user?.name || user?.firstname + " " + user?.lastname} has initiated initial setup for patient  ${patient?.firstname} ${" "} ${patient?.lastname} `,
            patient_id: patient?._id,
            ...(user?.role === 'HrMedical' && { hr_id: user._id }),
            ...(user?.role === 'admin' && { admin_id: user._id }),
            ...(user?.role === 'doctor' && { doctor_id: user._id }),
            type: "patient",
            time: moment(new Date()).format("hh:mm A"),
            date: moment(new Date()).format("YYYY/MM/DD")
          })
        }
        patient.assigned_devices.push({ deviceObjectId: body.deviceId })
        Object.assign(patient, patient);
        await patient.save();

        device = await Device.updateOne({ _id: body.deviceId }, { $set: { shouldCollect: false, isCollected: false, unassignDate: "" } })

        await Notification.create({
          noti_type: "device assigned",
          textAny: `A device ${body?.deviceId} is assigned to patient ${patient?.firstname} ${" "} ${patient?.lastname} by admin.`,
          admin: true
        })

        // creating history before assigning a device
        let assignDeviceDetails = await Device.findById(body.deviceId);
      
        if(assignDeviceDetails){
        await DeviceHistory.create({ 
            assigned_patient_id: patient?._id,
            deviceID: assignDeviceDetails?._id,
            deviceType: assignDeviceDetails?.deviceType,
            modelNumber: assignDeviceDetails?.modelNumber,
            imei: assignDeviceDetails?.imei,
            firmwareVersion: assignDeviceDetails?.firmwareVersion,
            actionPerformed: 'assigned',
            actionPerformedBy: 'Admin',
          });
        }    
  

        await Log.create({
          text: `A device ${body?.deviceId} is assigned to patient ${patient?.firstname} ${" "} ${patient?.lastname} by admin.`,
          patient_id: patient?._id,
          ...(user?.role === 'HrMedical' && { hr_id: user._id }),
          ...(user?.role === 'admin' && { admin_id: user._id }),
          ...(user?.role === 'doctor' && { doctor_id: user._id }),
          type: "patient",
          time: moment(new Date()).format("hh:mm A"),
          date: moment(new Date()).format("YYYY/MM/DD")
        })
      }
      else {
        throw new ApiError(httpStatus.FORBIDDEN, 'device is already assigned to someone');
      }
    }
  }
  if (!body.assignDevice) {
    // create history of assigned device before unassigning

      unassign = await Patient.updateOne({ _id: patientId }, { $pull: { "assigned_devices": { "_id": body.device_id } } }, { new: true })
      device = await Device.updateOne({ _id: body.deviceId }, { $set: { shouldCollect: true, isCollected: false, unassignDate: moment(new Date()).format("YYYY/MM/DD") } })
     

    if (!unassign)
      throw new ApiError(httpStatus.NOT_FOUND, 'problem unassigning device');

    if (unassign) {
    let device = await Device.findById(body.deviceId);
      
    if(device){
    await DeviceHistory.create({ 
        assigned_patient_id: patient?._id,
         deviceID: device?._id,
         deviceType: device?.deviceType,
         modelNumber: device?.modelNumber,
         imei: device?.imei,
         firmwareVersion: device?.firmwareVersion,
         actionPerformed: 'unassigned',
         actionPerformedBy: 'Admin',
       });
     }

      await Log.create({
        text: `A device ${body.deviceId} is removed from Pt. ${patient?.firstname} ${" "} ${patient?.lastname}.`,
        patient_id: patientId,
        ...(user?.role === 'HrMedical' && { hr_id: user._id }),
        ...(user?.role === 'admin' && { admin_id: user._id }),
        ...(user?.role === 'doctor' && { doctor_id: user._id }),
        type: "patient",
        time: moment(new Date()).format("hh:mm A"),
        date: moment(new Date()).format("YYYY/MM/DD")
      })

      await Notification.create({
        noti_type: "device unassigned",
        textAny: `A device ${body?.deviceId} was removed from patient ${patient?.firstname} ${" "} ${patient?.lastname} by admin. Please collect the device from patient`,
        admin: true
      })
    }

    var htmlString = `<!DOCTYPE html>
    <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta name="x-apple-disable-message-reformatting">
      <title></title>
    
      <style>
        table, td, div, h1, p {
          font-family: Arial, sans-serif;
        }
        @media screen and (max-width: 530px) {
          .unsub {
            display: block;
            padding: 8px;
            margin-top: 14px;
            border-radius: 6px;
            background-color: #555555;
            text-decoration: none !important;
            font-weight: bold;
          }
          .col-lge {
            max-width: 100% !important;
          }
        }
        @media screen and (min-width: 531px) {
          .col-sml {
            max-width: 27% !important;
          }
          .col-lge {
            max-width: 73% !important;
          }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;word-spacing:normal;background-color:#939297;">
      <div role="article" aria-roledescription="email" lang="en" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background-color:#939297;">
        <table role="presentation" style="width:100%;border:none;border-spacing:0;">
          <tr>
            <td align="center" style="padding:0;">
      
              <table role="presentation" style="width:94%;max-width:600px;border:none;border-spacing:0;text-align:left;font-family:Arial,sans-serif;font-size:16px;line-height:22px;color:#363636;">
                <tr>
                  <td style="padding:40px 30px 30px 30px;text-align:center;font-size:24px;font-weight:bold;">
                    <a href="https://vitalsportal.com/" style="text-decoration:none;"><img src="https://vitalsportal.com/v1/images/doctorsweblogo.jpeg" width="165" alt="Logo" style="width:165px;max-width:80%;height:auto;border:none;text-decoration:none;color:#ffffff;"></a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;background-color:#ffffff;">
                    <h1 style="margin-top:0;margin-bottom:16px;font-size:26px;line-height:32px;font-weight:bold;letter-spacing:-0.02em;">Patient Readings Update</h1>
                    <p style="margin:0;">
                    Patient Name : ${patient?.firstname} ${patient?.lastname}   <br />
                    Device # : ${body.deviceId}
                    you have been unAssigned this device <br />
                    ${`Date and Time  : ${moment().format('MM dd,yyyy h:mm a')}`}

                    <br />
                   
                    </p>
                  </td>
                </tr>
               
                  <td style="padding:30px;text-align:center;font-size:12px;background-color:#404040;color:#cccccc;">
                    <p style="margin:0 0 8px 0;"><a href="http://www.facebook.com/" style="text-decoration:none;"><img src="https://assets.codepen.io/210284/facebook_1.png" width="40" height="40" alt="f" style="display:inline-block;color:#cccccc;"></a> <a href="http://www.twitter.com/" style="text-decoration:none;"><img src="https://assets.codepen.io/210284/twitter_1.png" width="40" height="40" alt="t" style="display:inline-block;color:#cccccc;"></a></p>
                    <p style="margin:0;font-size:14px;line-height:20px;">&reg; Doctors web, florida USA 2022<br></p>
                  </td>
                </tr>
              </table>
         
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>`
    if (patient?.email)
      // await sendEmail(patient.email, "device Update", 'simple text', htmlString)

    var adminhtmlString = `<!DOCTYPE html>
    <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta name="x-apple-disable-message-reformatting">
      <title></title>
    
      <style>
        table, td, div, h1, p {
          font-family: Arial, sans-serif;
        }
        @media screen and (max-width: 530px) {
          .unsub {
            display: block;
            padding: 8px;
            margin-top: 14px;
            border-radius: 6px;
            background-color: #555555;
            text-decoration: none !important;
            font-weight: bold;
          }
          .col-lge {
            max-width: 100% !important;
          }
        }
        @media screen and (min-width: 531px) {
          .col-sml {
            max-width: 27% !important;
          }
          .col-lge {
            max-width: 73% !important;
          }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;word-spacing:normal;background-color:#939297;">
      <div role="article" aria-roledescription="email" lang="en" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background-color:#939297;">
        <table role="presentation" style="width:100%;border:none;border-spacing:0;">
          <tr>
            <td align="center" style="padding:0;">
      
              <table role="presentation" style="width:94%;max-width:600px;border:none;border-spacing:0;text-align:left;font-family:Arial,sans-serif;font-size:16px;line-height:22px;color:#363636;">
                <tr>
                  <td style="padding:40px 30px 30px 30px;text-align:center;font-size:24px;font-weight:bold;">
                    <a href="https://vitalsportal.com/" style="text-decoration:none;"><img src="https://vitalsportal.com/v1/images/doctorsweblogo.jpeg" width="165" alt="Logo" style="width:165px;max-width:80%;height:auto;border:none;text-decoration:none;color:#ffffff;"></a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;background-color:#ffffff;">
                    <h1 style="margin-top:0;margin-bottom:16px;font-size:26px;line-height:32px;font-weight:bold;letter-spacing:-0.02em;">Patient Readings Update</h1>
                    <p style="margin:0;">
                    Patient Name : ${patient?.firstname} ${patient?.lastname}   <br />
                    Device # : ${body.deviceId}
                    Above patient has been unassigned the following device. Please collect the device from the patient. <br />
                    ${`Date and Time  : ${moment().format('MM dd,yyyy h:mm a')}`}

                    <br />
                   
                    </p>
                  </td>
                </tr>
               
                  <td style="padding:30px;text-align:center;font-size:12px;background-color:#404040;color:#cccccc;">
                    <p style="margin:0 0 8px 0;"><a href="http://www.facebook.com/" style="text-decoration:none;"><img src="https://assets.codepen.io/210284/facebook_1.png" width="40" height="40" alt="f" style="display:inline-block;color:#cccccc;"></a> <a href="http://www.twitter.com/" style="text-decoration:none;"><img src="https://assets.codepen.io/210284/twitter_1.png" width="40" height="40" alt="t" style="display:inline-block;color:#cccccc;"></a></p>
                    <p style="margin:0;font-size:14px;line-height:20px;">&reg; Doctors web, florida USA 2022<br></p>
                  </td>
                </tr>
              </table>
         
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>`
    // await sendEmail("admin@thedoctorsweb.com", "device Update", 'simple text', adminhtmlString)

  }

  return patient;
};

const searchPatient = async (body) => {
  const patient = await Patient.find({ $and: [ {  $or: [
                          {patientType: "RPM"},
                          {patientType: "Both"}
                          ] } ],
                      [body.key]: { $regex: body.value, $options: 'mxi' } })
    .populate('assigned_doctor_id', ['firstname', 'lastname', 'gender', 'specialization'])
    .populate("assigned_hr_id")
    .populate('assigned_devices.deviceObjectId', ['imei', 'modelNumber', 'deviceType', 'broken', 'block'])
    .sort({ createdAt: body.createdAt || -1 })
    .lean();

    if (patient.length) {
      for (let i = 0; i < patient.length; i++) {
        let findHealthData = await HealthData.find({ assigned_patient_id: patient[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
        patient[i] = { ...patient[i], lastReading: findHealthData && findHealthData[0]?.dateAdded}
      }
    }
  
    if (patient.length){
      for (let i = 0; i < patient.length; i++) {
        let deviceBatteryStatus = await DeviceSignal.find({ assigned_patient_id: patient[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
        patient[i] = { ...patient[i], batterySignals: deviceBatteryStatus && deviceBatteryStatus[0]?.signalData}
      }
    }

  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'results not found');
  }
  return patient;
};

const ccmSearchPatient = async (body) => {
  let patient;

  if(body.drId) {
    console.log('Finding here');

    patient = await Patient.find({ 
      assigned_doctor_id: body.drId,
      $and: [ 
        {  $or: [
          {patientType: "CCM"},
          {patientType: "Both"}
        ], } ],
        [body.key]: { $regex: body.value, $options: 'mxi' } })
      .populate('assigned_doctor_id', ['firstname', 'lastname', 'gender', 'specialization'])
      .populate("assigned_hr_id")
      .sort({ createdAt: body.createdAt || -1 })
      .lean();

      if (!patient) {
      throw new ApiError(httpStatus.NOT_FOUND, 'results not found');
      }
  } else {
    patient = await Patient.find({ $and: [ {  $or: [
      {patientType: "CCM"},
      {patientType: "Both"}
      ] } ],
        [body.key]: { $regex: body.value, $options: 'mxi' } })
      .populate('assigned_doctor_id', ['firstname', 'lastname', 'gender', 'specialization'])
      .populate("assigned_hr_id")
      .sort({ createdAt: body.createdAt || -1 })
      .lean();

      if (!patient) {
      throw new ApiError(httpStatus.NOT_FOUND, 'results not found');
      }
  }
  
  return patient;
};

const filterPatientByStatus = async (body) => {
  let patient;

  if(body.key === 'activated'){
    patient = await Patient.find({ block: false })
    .populate('assigned_doctor_id', ['firstname', 'lastname', 'gender', 'specialization'])
    .populate("assigned_hr_id")
    .populate('assigned_devices.deviceObjectId', ['imei', 'modelNumber', 'deviceType', 'broken', 'block'])
    .sort({ createdAt: body.createdAt || -1 })
    .lean();

    if (patient.length) {
      for (let i = 0; i < patient.length; i++) {
        let findHealthData = await HealthData.find({ assigned_patient_id: patient[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
        patient[i] = { ...patient[i], lastReading: findHealthData && findHealthData[0]?.dateAdded}
      }
    }
  
    if (patient.length){
      for (let i = 0; i < patient.length; i++) {
        let deviceBatteryStatus = await DeviceSignal.find({ assigned_patient_id: patient[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
        patient[i] = { ...patient[i], batterySignals: deviceBatteryStatus && deviceBatteryStatus[0]?.signalData}
      }
    }

  } else if(body.key === 'Inactivated'){
    patient = await Patient.find({ block: true })
    .populate('assigned_doctor_id', ['firstname', 'lastname', 'gender', 'specialization'])
    .populate("assigned_hr_id")
    .populate('assigned_devices.deviceObjectId', ['imei', 'modelNumber', 'deviceType', 'broken', 'block'])
    .sort({ createdAt: body.createdAt || -1 })
    .lean();

    if (patient.length) {
      for (let i = 0; i < patient.length; i++) {
        let findHealthData = await HealthData.find({ assigned_patient_id: patient[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
        patient[i] = { ...patient[i], lastReading: findHealthData && findHealthData[0]?.dateAdded}
      }
    }
  
    if (patient.length){
      for (let i = 0; i < patient.length; i++) {
        let deviceBatteryStatus = await DeviceSignal.find({ assigned_patient_id: patient[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
        patient[i] = { ...patient[i], batterySignals: deviceBatteryStatus && deviceBatteryStatus[0]?.signalData}
      }
    }

  } else if(body.key === 'nonCompliant'){
    patient = await Patient.find({ $where: "this.assigned_devices.length < 1" })
    .populate('assigned_doctor_id', ['firstname', 'lastname', 'gender', 'specialization'])
    .populate("assigned_hr_id")
    .populate('assigned_devices.deviceObjectId', ['imei', 'modelNumber', 'deviceType', 'broken', 'block'])
    .sort({ createdAt: body.createdAt || -1 })
    .lean();

    if (patient.length) {
      for (let i = 0; i < patient.length; i++) {
        let findHealthData = await HealthData.find({ assigned_patient_id: patient[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
        patient[i] = { ...patient[i], lastReading: findHealthData && findHealthData[0]?.dateAdded}
      }
    }
  
    if (patient.length){
      for (let i = 0; i < patient.length; i++) {
        let deviceBatteryStatus = await DeviceSignal.find({ assigned_patient_id: patient[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
        patient[i] = { ...patient[i], batterySignals: deviceBatteryStatus && deviceBatteryStatus[0]?.signalData}
      }
    }
  }

  if (!patient) {
    throw new ApiError(httpStatus.NOT_FOUND, 'results not found');
  }
  return patient;
};

const getHealthReadingbyId = async (readingId) => {

  let readingDetails = await HealthData.findById(readingId)
    .populate('assigned_patient_id', ['firstname', 'lastname', 'gender', 'specialization'])
    .populate('deviceId', ['imei', 'modelNumber', 'deviceType', 'broken', 'block'])
    .populate('notes.conclusion_doctor_id')
    .populate('notes.conclusion_hr_id')

  return readingDetails

}

const getHealthReadingCount = async (patientId,body) => {
  var D = new Date();
  let month = D.getMonth();
  let year = D.getFullYear();
  month++
  if (month < 10)
    month = '0' + month


  let startDate = body?.startDate;
  let endDate = body?.endDate;

  if(!startDate || !endDate)
  throw new ApiError(httpStatus.NOT_FOUND, 'start or end date missing');

  let findPatientInHealthData = await HealthData.find({assigned_patient_id: patientId});

  if(findPatientInHealthData){
  let readingCount = await HealthData.aggregate([
    {
      $match: {
        assigned_patient_id: mongoose.Types.ObjectId(patientId), dateAdded: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },

    {
      $group: {
        _id: { dateAdded: "$dateAdded" },
        //  count: { $sum: { } } 
      }
    }

  ])
  return { Readings: readingCount?.length || 0 }
  } else {
    // console.log('Patient not found having healthData');
    return {Readings: 0}
  }
}

const CarePlanbydrhr = async (body) => {
  var query, hr_Id, dr_Id;

  if (body.doctorId) {
    let Dr = await Doctor.findById(body.doctorId).lean()

    if (Dr && Dr.assigned_hr_id) {
      hr_Id = Dr.assigned_hr_id;
      query = { $or: [{ assigned_doctor_id: body.doctorId }, { assigned_hr_id: hr_Id }] }
    }
    else
      query = { assigned_doctor_id: body.doctorId }
  }
  // query = { assigned_doctor_id: body.doctorId }
  if (body.hrId) {
    let HR = await Hr.findById(body.hrId).lean()
    if (HR && HR.assigned_doctor_id) {
      dr_Id = HR.assigned_doctor_id;
      query = { $or: [{ assigned_hr_id: body.hrId }, { assigned_doctor_id: dr_Id }] }
    }
    else
      query = { assigned_hr_id: body.hrId }
  }


  let carePlan = await Careplan.find(query).lean()
    .populate("assigned_doctor_id")
    .populate("assigned_hr_id")
    .populate("assigned_patient_id")
    .sort({ createdAt: -1 });

  if (carePlan.length <= 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No careplan for this Hr/Doctor');
  }

  return carePlan;
};


const checkduplicates = async (body) => {

  let query;
  if (body.email)
    query = { email: body.email }

  if (body.mobileNo)
    query = { mobileNo: body.mobileNo }

  if (body.phone1)
    query = { phone1: body.phone1 }

  if (body.ssn)
    query = { ssn: body.ssn }

  if (body.firstname && body.lastname)
    query = { firstname: body.firstname, lastname: body.lastname }

  if (query === undefined) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Body of api is not accordingly');
  }

  let patient = await Patient.find(query)

  let sendMessage;

  if (patient.length > 0) {
    sendMessage = " duplicates Exists"
  }

  return { meesgae: sendMessage || "no duplicates" }

}

const unsetHrDr = async (body) => {
 
  let query;
  if (body.hrId) {
    query = { $unset: { assigned_hr_id: 1 } }
  }
  if(body.ccmId){
    query = { $unset : { assigned_ccm_nurse_id: 1}}
  }
  if (body.drId) {
    query = { $unset: { assigned_doctor_id: 1 } }
  }
  
  let patient = await Patient.updateOne({ _id: body.patientId }, query);

  return patient
}



module.exports = {
  createUser,
  updatePatient,
  blockPatient,
  patientList,
  getuserbydeviceid,
  filterpatienthistory,
  patientProfile,
  commentOnReading,
  addCarePlan,
  getCarePlan,
  carePlanUpdate,
  addremovedevice,
  searchPatient,
  getHealthReadingbyId,
  CarePlanbydrhr,
  getHealthReadingCount,
  checkduplicates,
  unsetHrDr,
  filterPatientByStatus,
  uploadCCMCarePlan,
  fetchCCMCarePlan,
  deletePatientCCMCareplan,
  uploadConsent,
  getPatientCCMConsent,
  deletePatientCCMConsent,
  getCCMPatients,
  ccmSearchPatient,
  getInactivePatients,
  deletePatientRPMCareplan
};
