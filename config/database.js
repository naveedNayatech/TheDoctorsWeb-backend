const mongoose = require('mongoose');

const connectDatabase = () => {
    mongoose.connect(process.env.DB_PUBLIC_URI, { 
        useNewUrlParser: true,
    }).then(con => {
        console.log(`MongoDB Database connected with HOST: ${con.connection.host}`);
    }).catch((err) => console.log(err));
}

module.exports = connectDatabase;