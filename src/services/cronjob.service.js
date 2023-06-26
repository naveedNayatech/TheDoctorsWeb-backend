const { HealthData, Patient, Notification, Device } = require('../models');
const Careplan = require('../models/careplan.model');
const { sendEmail } = require('./email.service');
const moment = require('moment');



var CronJob = require('cron').CronJob;

// new CronJob('*/50 23 * * *', async function () {
new CronJob('*/59 11 * * *', async function () {
  console.log("cron job started")
  var D = new Date();
  let month = D.getMonth();
  let year = D.getFullYear();
  let dateToday = D.getDate();
  let mailingList = [];

  month++
  if (month < 10)
    month = '0' + month

  if (dateToday < 10)
    dateToday = '0' + dateToday

  let careplanList = await Careplan.find({}).lean();

  if (careplanList)
    careplanList.forEach(async (careplan, index) => {
      if (careplan.readingsInSlot1) {
        let readingPerdaySlot1 = careplan.readingsInSlot1;

        let findIfReadingExists = await HealthData.find({
          assigned_patient_id: careplan.assigned_patient_id,
          dateAdded: `${year}/${month}/${dateToday}`,
          time: { $lte: "11:59" }
        }).lean();

        if (!findIfReadingExists.length || findIfReadingExists.length !== readingPerdaySlot1) {
          let patient = await Patient.findById(careplan.assigned_patient_id)
            .populate("assigned_doctor_id")
            .populate("assigned_hr_id")
            .lean();

          if (patient) {
            await Notification.create({
              doctorId: patient.assigned_doctor_id,
              hrId: patient.assigned_hr_id,
              patientId: patient?._id,
              noti_type: "Reading",
              textAny: patient?.firstname + " " + patient?.lastname + " " + "reading missing for today",
              admin: true
            })

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
                            Readings are missing for today
                            <br />
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

            if (patient?.assigned_doctor_id?.email)
              mailingList.push(patient?.assigned_doctor_id?.email)

            if (patient?.assigned_hr_id?.email)
              mailingList.push(patient?.assigned_hr_id?.email)

            if (patient?.email)
              mailingList.push(patient?.email)

            mailingList.push('admin@thedoctorsweb.com')

            // let sent = await sendEmail(mailingList, "Patient Update", 'simple text', htmlString)
            // console.log(sent)
          }


        }
        else {
          console.log("reading not missing")
        }



      }

    })


}, null, true);

new CronJob('*/59 23 * * *', async function () {
  console.log("cron job started")
  var D = new Date();
  let month = D.getMonth();
  let year = D.getFullYear();
  let dateToday = D.getDate();
  let mailingList = [];

  month++
  if (month < 10)
    month = '0' + month

  if (dateToday < 10)
    dateToday = '0' + dateToday

  let careplanList = await Careplan.find({}).lean();

  if (careplanList)
    careplanList.forEach(async (careplan, index) => {
      if (careplan.readingsInSlot2) {
        let readingPerdaySlot2 = careplan.readingsInSlot2;

        let findIfReadingExists = await HealthData.find({
          assigned_patient_id: careplan.assigned_patient_id,
          dateAdded: `${year}/${month}/${dateToday}`,
          time: {
            $gte: "12:00",
            $lte: "23:59"
          }
        }).lean();

        if (!findIfReadingExists.length || findIfReadingExists.length !== readingPerdaySlot2) {
          let patient = await Patient.findById(careplan.assigned_patient_id)
            .populate("assigned_doctor_id")
            .populate("assigned_hr_id")
            .lean();

          if (patient) {
            await Notification.create({
              doctorId: patient.assigned_doctor_id,
              hrId: patient.assigned_hr_id,
              patientId: patient?._id,
              noti_type: "Reading",
              textAny: patient?.firstname + " " + patient?.lastname + " " + "reading missing for today",
              admin: true
            })

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
                            Readings are missing for today
                            <br />
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

            if (patient?.assigned_doctor_id?.email)
              mailingList.push(patient?.assigned_doctor_id?.email)

            if (patient?.assigned_hr_id?.email)
              mailingList.push(patient?.assigned_hr_id?.email)

            if (patient?.email)
              mailingList.push(patient?.email)

            mailingList.push('admin@thedoctorsweb.com')

            // let sent = await sendEmail(mailingList, "Patient Update", 'simple text', htmlString)
            // console.log(sent)
          }


        }
        else {
          console.log("reading not missing")
        }



      }

    })


}, null, true);

new CronJob('0 07 * * FRI', async function () {
let today = moment(new Date()).format("YYYY/MM/DD");
  let todaysDate = moment(today);
  let devicesList = await Device.find({ shouldCollect: true, isCollected: false }).lean()
  let devicesToCollectWeek = []

  for (i = 0; i < devicesList.length; i++) {
    if (devicesList[i].unassignDate != null || devicesList[i].unassignDate != "") {
      let differenceOfDays = todaysDate.diff(devicesList[i].unassignDate, 'days')
      if (differenceOfDays > 6) {
        devicesToCollectWeek.push(devicesList[i])
      }
    }
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
                  Its been a week since the following devices are pending to be collected <br />
                  the list is as below <br />
                  ${devicesToCollectWeek.map(device => {
                   return device._id + "<br>"
                  })}

                  <br />
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

  // console.log(await sendEmail('admin@thedoctorsweb.com', "devices Update", 'collect devices', htmlString))


}, null, true);