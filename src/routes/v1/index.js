const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const adminRoute = require('./admin.route');
const patientRoute = require('./patient.route');
const doctorRoute = require('./doctor.route');
const hrRoute = require('./hr.route');
const deviceRoute = require('./device.route');
const generalRoute = require('./general.route');


const docsRoute = require('./docs.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/admin',
    route: adminRoute,
  },
  {
    path: '/patient',
    route: patientRoute,
  },
  {
    path: '/hr',
    route: hrRoute,
  },
  {
    path: '/doctor',
    route: doctorRoute,
  },
  {
    path: '/device',
    route: deviceRoute,
  },
  {
    path: '/general',
    route: generalRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
