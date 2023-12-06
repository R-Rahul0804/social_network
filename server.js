const express = require('express');
const connectDB = require('./config/mongoDB');
const app = express();
const path = require('path');
//routes import
const users = require('./routes/api/users');
const auth = require('./routes/api/auth');
const profile = require('./routes/api/profile');
const post = require('./routes/api/post');

//endpoint
app.get('/',(req,res)=>{
    res.send('API Running');
})

//Init MiddleWare to get request.body
app.use(express.json({extended: false}));

//routes access
app.use('/api/users',users);
app.use('/api/auth',auth);
app.use('/api/profile',profile);
app.use('/api/posts',post);

//connection to mongodb
connectDB();

//server static assets for production
if(process.env.NODE_ENV === 'production'){
    app.use(express.static('client/build'));

    app.get('*',(req,res)=>{
        res.sendFile(path.resolve(__dirname,'client','build','index.html'));
    });
}

const PORT = process.env.PORT || 8000;
app.listen(PORT, ()=>{
    console.log(`server running on ${PORT}`);
});