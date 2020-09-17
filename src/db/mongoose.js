const mongoose = require('mongoose');
const validator = require('validator');

//C:\Users\cynex\mongodb\bin\mongod.exe --dbpath=C:\Users\cynex\mongodb_data
mongoose.connect(process.env.MONGODB_URL,
    {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    });