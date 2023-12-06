const express = require('express');
const router = express.Router();
const auth = require('../../middleware/authJwt');
const User = require('../../models/Users');
const {check, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');

//routes => get api/auth, public access
router.get('/' ,auth, async (req,res)=>{
    try{
        const user = await User.findById(req.user.id).select('-password'); //leave the password while displaying the data
        res.json(user);
    }catch(err){
        console.log(err.message);
        res.status(500).send('Server Error');
    }
});

//routes => post api/auth, public access  //login again
//authenticate the user and get token
router.post('/' , [
    check('email','Enter a valid Email').isEmail(),
    check('password','Password is required').exists()
], 
async (req,res)=>{
    //console.log(req.body);
    const errors = validationResult(req);
    if(!errors.isEmpty()){  //400-Bad Request
        return res.status(400).json({errors: errors.array()}); //to display in array
    }
    const {email, password} = req.body;

    try{   
    //see for email
    let user = await User.findOne({email});
    if(!user){
       return res.status(400).json({errors: [{message: 'Invalid Account'}]});
    }
    
    //if matches with password
    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch){
        return res.status(400).json({errors: [{message: 'Invalid Account'}]});
    }

    //return jsonwebtoken
    const payload = {
        user:{
            id:user.id
        }
    }
    jwt.sign(
        payload, 
        config.get('jwtSecret'),
        {expiresIn: 360000},
        (err,token)=>{ //instead of token any name can be given
            if(err) throw err;
            res.json({token});
        });

    }catch(err){
        console.error(err.message);
        res.status(500).send('server error...');
    }
});


module.exports=router;