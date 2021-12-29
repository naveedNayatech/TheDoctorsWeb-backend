const express = require('express');
const app = express();
var cors = require('cors');
const fileUpload = require('express-fileupload');

const bodyParser = require('body-parser');
const cloudinary = require('cloudinary');

app.use(express.json());

// import all routes
const admin = require('./routes/admin');

const errorMiddleware = require('./middlewares/errors');

const cookieParser = require('cookie-parser');

app.use(express.json());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(fileUpload({useTempFiles: true}))
app.use(cors());


// Setting up cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})


app.use('/api/v1', admin);

// Middleware to handle errors
app.use(errorMiddleware);


module.exports = app