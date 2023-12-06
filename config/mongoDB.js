const mongoose = require('mongoose');
const config = require('config');
//get the database connection value from the config json file
const db = config.get('mongoDBURI');

const connectDB = async () =>{
    try{
       await mongoose.connect(db);
       console.log('MongoDb Connection is Successfull...');
    }catch(err){
        console.log(err.message);
        //exit the process with failure
        process.exit(1);
    }
}

module.exports = connectDB;