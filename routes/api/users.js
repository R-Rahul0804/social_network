const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
//importing models for users
const User = require('../../models/Users');

//routes => post api/users, public access
//this route for register user
router.post('/' , [
    check('name','Name is Required').not().isEmpty(),
    check('email','Enter a valid Email').isEmail(),
    check('password','Enter a password with minimum 6 character').isLength({min:6})
], 
async (req,res)=>{
    //console.log(req.body);
    const errors = validationResult(req);
    if(!errors.isEmpty()){  //400-Bad Request
        return res.status(400).json({errors: errors.array()}); //to display in array
    }
    const {name, email, password} = req.body;

    try{   
    //see if user exists
    let user = await User.findOne({email});
    if(user){
       return res.status(400).json({errors: [{message: 'User already exits'}]});
    }
    //get users gravatar
    const avatar = gravatar.url(email,{
        s:'200', //default size
        r: 'pg', //reading
        d: 'mm' //default image
    })
    //encrypt password
    user = new User({
        name,
        email,
        password,
        avatar   
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
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