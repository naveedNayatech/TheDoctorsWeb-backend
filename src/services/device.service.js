const httpStatus = require('http-status');
const moment = require('moment');
const ApiError = require('../utils/ApiError');
const { Device, Patient, HealthData, Notification, Log, DeviceSignal, DeviceHistory } = require('../models');
const { sendEmail } = require('./email.service');


/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createDevice = async (userBody) => {
  if (userBody._id && (await Device.findById(userBody._id)))
    throw new ApiError(httpStatus.UNAUTHORIZED, 'device already exists');

  return Device.create(userBody);
};

const createDeviceHistory = async (userBody) => {
  return DeviceHistory.create(userBody);
};

/**
 * 
 * @param {*} deviceObjectId 
 * @param {*} updateBody 
 * @returns {Promise<device>}
 */
const updateDevice = async (deviceObjectId, updateBody) => {
  const device = await Device.findById(deviceObjectId)
  if (!device) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Device not found');
  }
  if (updateBody.deviceId) {
    delete updateBody['deviceId']
  }

  if (updateBody.isCollected === true) {
    await Notification.create({
      noti_type: "device collected",
      textAny: `a  device with device id ${deviceObjectId} is collected from patient`,
      admin: true
    })
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
                    Device # : ${body.deviceId}
                    device has been collected from patient <br />
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
    await sendEmail("admin@thedoctorsweb.com", "device Update", 'simple text', adminhtmlString)
  }


  Object.assign(device, updateBody);
  await device.save();
  return device;
};

/**
 * 
 * @param {*} deviceObjectId 
 * @returns {Promise<device>}
 */
const deleteDevice = async (deviceObjectId) => {
  let createHistory;

  const device = await Device.findById(deviceObjectId);

  if(device){
   createHistory = DeviceHistory.create({ 
      deviceID: device?._id,
      deviceType: device?.deviceType,
      modelNumber: device?.modelNumber,
      imei: device?.imei,
      firmwareVersion: device?.firmwareVersion,
      actionPerformed: 'unassigned',
      actionPerformedBy: 'Admin',
    });
  }
  
  if (!device) {
    throw new ApiError(httpStatus.NOT_FOUND, 'device not found');
  }

  if(createHistory){
    await device.remove();
    return device;
  }
  
};


const deviceList = async (page, pagination) => {
  const device = await Device.find()
    .populate('assigned_patient_id', ['firstname', 'lastname', 'gender', 'specialization'])
    .skip((page - 1) * pagination)
    .limit(pagination)
    .sort({ createdAt: -1 })
    .lean();

    if (device.length) {
      for (let i = 0; i < device.length; i++) {
        let findBatterySignalStatus = await DeviceSignal.find({ deviceId: device[i]._id }).sort({ createdAt: -1 }).limit(1).lean();
        device[i] = { ...device[i], signal: findBatterySignalStatus && findBatterySignalStatus[0]?.signalData, 
          dateAdded: findBatterySignalStatus && findBatterySignalStatus[0]?.dateAdded,
          time: findBatterySignalStatus && findBatterySignalStatus[0]?.time
         }
      }
    }

  const count = await Device.countDocuments()

  return ({ devices: device, count });
};

const deviceHistoryList = async (page, pagination) => {
  const device = await DeviceHistory.find()
    .populate('assigned_patient_id', ['firstname', 'lastname', 'gender'])
    .sort({ createdAt: -1 })
    .lean();

  const count = await DeviceHistory.countDocuments()

  return ({ devices: device, count });
};



const deviceListstock = async (body) => {
  let device;

  if (body.stock)
    device = await Device.find({ assigned_patient_id: { $eq: null } })
      .populate('assigned_patient_id', ['firstname', 'lastname', 'gender', 'specialization'])
      .sort({ createdAt: -1 })


  if (!body.stock)
    device = await Device.find({ assigned_patient_id: { $ne: null } })
      .populate('assigned_patient_id', ['firstname', 'lastname', 'gender', 'specialization'])
      .sort({ createdAt: -1 })
      .lean();
      
  return device;
};

const getbyId = async (deviceId) => {
  const device = await Device.findById(deviceId)
    .populate('assigned_patient_id');
  return device;
};


const getbybroken = async (deviceId) => {
  const device = await Device.find({ broken: true })
    .populate('assigned_patient_id', ['firstname', 'lastname', 'gender', 'specialization']).sort({ createdAt: -1 });;
  return device;
};

const getHealthDataByDeviceId = async (deviceId) => {
  const device = await HealthData.find({ deviceId: deviceId }).sort({ createdAt: -1 });;
  return device;
};



const searchDevice = async (body) => {

  let query = { [body.key]: { $regex: body.value, $options: 'mxi' } }
  const device = await Device.find(query)
    .populate('assigned_patient_id', ['firstname', 'lastname', 'gender', 'specialization'])
    .sort({ createdAt: body.createdAt || -1 });
  return device;
};

const deviceStats = async (search) => {
  const totalDevices = await Device.find({}).lean()
  const instockDevices = await Device.find({ assigned_patient_id: { $eq: null } }).lean()
  const outstockDevices = await Device.find({ assigned_patient_id: { $ne: null } }).lean()
  const brokenDevices = await Device.find({ broken: true }).lean()
  const cuffDevices = await Device.find({ deviceType: 'bp'}).lean()
  const weightDevices = await Device.find({ deviceType: 'weight'}).lean()
  const spo2Devices = await Device.find({ deviceType: 'spO2'}).lean()



  return {
    totalDevices: totalDevices?.length,
    instockDevices: instockDevices?.length,
    outstockDevices: outstockDevices?.length,
    brokenDevices: brokenDevices?.length,
    cuffDevices: cuffDevices.length,
    weightDevices: weightDevices.length,
    spo2Devices: spo2Devices.length
  };
};

const DeviceCert = async (req, res) => {
  try {
    console.log(req)
    return req;
  }
  catch (err) {
    console.log(err)
  }
};

const devicetelemetry = async (deviceId, body) => {

  let insertIntoDeviceData, device, patient, sent, mailingList = [], status,isbodyEmpty = Object.keys(body).length === 0;

  device = await Device.findById(deviceId).lean()
  if (device)
    patient = await Patient.findOne({ "assigned_devices.deviceObjectId": device._id })
      .populate("assigned_doctor_id")
      .populate("assigned_hr_id")
      .lean()
  else
    throw new ApiError(httpStatus.NOT_FOUND, 'device not found');

  if (patient === null) {
    throw new ApiError(httpStatus.NOT_FOUND, 'patient not found cannot insert data');

  }
  if (!isbodyEmpty) {
    insertIntoDeviceData = await HealthData.create({
      assigned_patient_id: patient._id,
      deviceId: device._id,
      telemetaryData: body,
      dateAdded: moment(new Date()).format("YYYY/MM/DD"),
      time: moment(new Date(), "HH:mm:ss").format("HH:MM")
    })
    

    if (patient?.assigned_doctor_id?.email)
      mailingList.push(patient?.assigned_doctor_id?.email)

    if (patient?.assigned_hr_id?.email)
      mailingList.push(patient?.assigned_hr_id?.email)

    if (patient?.email)
      mailingList.push(patient?.email)



    var textToAddAboutReading = "",
      showReading = "",
      showAdmin = false;
    // ${body.sys && `Systolic : ${body.sys}`  }<br />
    // ${body.dia && `Diastolic : ${body.dia}`  }<br />
    // ${body.pul && `Pulse : ${body.pul}`  }<br />
    // ${body?.wt && `Weight : ${body.wt}`  }<br />
    if (body.sys) {
      var bp = body.sys;
      showReading += `Systolic : ${body.sys} <br /> `
      if (bp <= 70) {
        textToAddAboutReading += "Patient systolic  bp is very low";
        status = "Low";
      }

      if (bp > 70 && bp <= 120) {
        textToAddAboutReading += "Patient systolic  bp is Normal";
        status = "Normal";
      }

      if (bp > 120 && bp <= 140) {
        textToAddAboutReading += "Patient systolic  bp is Elevated";
        status = "Elevated";

      }

      if (bp > 140 && bp <= 160) {
        textToAddAboutReading += "Patient systolic  bp is High";
        status = "High";
        showAdmin = true
      }

      if (bp > 160) {
        textToAddAboutReading += "Patient systolic  bp is very high and might be hypertensive";
        status = "very high";
        showAdmin = true
      }

    }


    if (body.dia) {
      var bp = body.dia;
      showReading += `Diastolic : ${body.dia} <br /> `
      if (bp < 80)
        textToAddAboutReading += ". Patient diastolic  bp is  low";

      if (bp >= 80 && bp < 90)
        textToAddAboutReading += ". Patient diastolic  bp is Normal";

      if (bp >= 90 && bp <= 100)
        textToAddAboutReading += ". Patient diastolic  bp is Elevated";

      if (bp > 100)
        textToAddAboutReading += ". Patient diastolic  bp is High";
    }

    if (body.wt) {
      var wt = body.wt
      showReading += `Weight : ${body.wt} <br /> `

      if (wt >= 40 && wt <= 60) {
        textToAddAboutReading += "Patient is under weight";
        status = "under weight";
      }

      if (wt >= 61 && wt <= 80) {
        textToAddAboutReading += "Patient weight is healthy";
        status = "Healthy";
      }

      if (wt >= 81 && wt <= 100) {
        textToAddAboutReading += "Patient  is obese";
        status = "Obese";
        showAdmin = true
      }

      if (wt > 101) {
        textToAddAboutReading += "Patient is very obese";
        status = "very obese";
        showAdmin = true
      }

    }

    if (body.pul) {
      showReading += `Pulse : ${body.pul} <br /> `
    }

    if (body.wt || body.sys || body.dia) {
      let addNoti;
      addNoti = await Notification.create({
        doctorId: patient?.assigned_doctor_id?._id,
        patientId: patient?._id, hrId: patient?.assigned_hr_id?._id,
        noti_type: body.sys ? "bp" : "wt",
        ref_Id: insertIntoDeviceData._id,
        textAny: patient?.firstname + " " + patient?.lastname + " " + textToAddAboutReading,
        status,
        admin: showAdmin
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
                    Doctor Name : ${patient?.assigned_doctor_id?.firstname} ${patient?.assigned_doctor_id?.lastname}   <br />
                    Patient navigator : ${patient?.assigned_hr_id?.firstname} ${patient?.assigned_hr_id?.lastname}   <br />
                    patient health data :<br />
                    ${showReading}
                    ${`Date and Time  : ${moment().format('MM dd,yyyy h:mm a')}`}

                    <br />
                    <br />
                    <br />
                    Conslusion : ${textToAddAboutReading}
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

    if (body.sys >= 150 || body.dia >= 100)
      mailingList.push('admin@thedoctorsweb.com')

    // if (body.wt || body.sys || body.dia || body.pul)
    //   sent = await sendEmail(mailingList, "Patient Update", 'simple text', htmlString)
    // console.log(sent)

    await Log.create({
      text: `Recieved new health data for patient named as ${patient?.firstname} ${patient?.lastname} for device with device id as ${deviceId} `,
      patient_id: patient?._id,
      // ...(req.user?.role === 'HrMedical' && {hr_id:req.user._id}),
      // ...(req.user?.role === 'admin' && {admin_id:req.user._id}),
      // ...(req.user?.role === 'doctor' && {doctor_id:req.user._id}),
      type: "device",
      time: moment(new Date()).format("hh:mm A"),
      date: moment(new Date()).format("YYYY/MM/DD")
    })
  }

  if (isbodyEmpty) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Telemetry data not found cannot insert data');

  }



  return insertIntoDeviceData;

};

const forwardtelemetry = async (body) => {
  
  let insertIntoDeviceData, device, patient;

  device = await Device.findById(body.deviceId).lean();
  if (device)
    patient = await Patient.findOne({ "assigned_devices.deviceObjectId": device._id })
      .populate("assigned_doctor_id")
      .populate("assigned_hr_id")
      .lean()
  else
    throw new ApiError(httpStatus.NOT_FOUND, 'device not found');

  if (patient === null) {
    throw new ApiError(httpStatus.NOT_FOUND, 'patient not found cannot insert data');

  }

    insertIntoDeviceData = await HealthData.create({
      assigned_patient_id: patient._id,
      deviceId: device._id,
      telemetaryData: body.data,
      dateAdded: moment(new Date()).format("YYYY/MM/DD"),
      time: moment(new Date(), "HH:mm:ss").format("HH:MM")
    })

    return insertIntoDeviceData;
 }

 
 const getBatteryStats = async (body) => {
  let insertIntoDeviceSignal, device, patient;

  device = await Device.findById(body.deviceId).lean();
  if (device)
    patient = await Patient.findOne({ "assigned_devices.deviceObjectId": device._id })
      .populate("assigned_doctor_id")
      .populate("assigned_hr_id")
      .lean()
  else
    throw new ApiError(httpStatus.NOT_FOUND, 'device not found');

  if (patient === null) {
    throw new ApiError(httpStatus.NOT_FOUND, 'patient not found cannot insert data');
  }

    insertIntoDeviceSignal = await DeviceSignal.create({
      assigned_patient_id: patient._id,
      deviceId: device._id,
      signalData: body.status,
      dateAdded: moment(new Date()).format("YYYY/MM/DD"),
      time: moment(new Date(), "HH:mm:ss").format("HH:MM")
    })

    return insertIntoDeviceSignal;
 }

 
 const getSpecificBatterySignal = async (deviceId) => {
    const batterySignal = await DeviceSignal.find({ deviceId: deviceId }).sort({createdAt: -1}).limit(5);
    return batterySignal;
 }

 const getAllBatterySignal = async (deviceId) => {
  const batteriesSignals = await DeviceSignal.find();
  return batteriesSignals;
}

const listcollectUncollect = async (body) => {
  const devices = await Device.find({ shouldCollect: body.shouldCollect, isCollected: body.isCollected })
  return devices;
}

module.exports = {
  createDevice,
  updateDevice,
  deleteDevice,
  deviceList,
  deviceListstock,
  getbyId,
  getbybroken,
  searchDevice,
  DeviceCert,
  devicetelemetry,
  forwardtelemetry,
  deviceStats,
  listcollectUncollect,
  getHealthDataByDeviceId,
  getBatteryStats,
  getSpecificBatterySignal,
  getAllBatterySignal,
  createDeviceHistory,
  deviceHistoryList
};



