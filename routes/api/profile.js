const express = require('express');
const router = express.Router();
const auth = require('../../middleware/authJwt');
const request = require('request');
const config = require('config');
const {check,validationResult} = require('express-validator');
const Profile = require('../../models/Profile');
const User = require('../../models/Users');

//routes => get api/profile/me, private access , just getting user profile
router.get('/me' , auth, async(req,res)=>{
    try{
        const profile = await Profile.findOne({user:req.user.id}).populate('user',['name','avatar']);
        //check if no profile
        if(!profile){
            return res.status(400).json({message:'No profile for this User'});
        }
        res.json(profile);
    }catch(err){
        console.log(err.message);
        res.status(500).send('Server Error');
    }
});

//routes => post api/profile, private access , create or update user profile
router.post('/',[
    auth,
    [
        check('roll_no','roll_no is required').not().isEmpty(),
        check('department','department is required').not().isEmpty(),
        check('batch','batch is required').not().isEmpty(),
        check('status','status is required').not().isEmpty(),
        check('skills','skills is required').not().isEmpty(),
    
    ]],
      async  (req,res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }

        const{
            roll_no,
            batch,
            degree,
            department,
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin}=req.body;

            //build your profile object
            const profileFields ={};
            profileFields.user = req.user.id;
            if(roll_no) profileFields.roll_no = roll_no;
            if(batch) profileFields.batch = batch;
            if(degree) profileFields.degree = degree;
            if(department) profileFields.department = department;
            if(company) profileFields.company = company;
            if(website) profileFields.website = website;
            if(location) profileFields.location = location;
            if(bio) profileFields.bio = bio;
            if(status) profileFields.status = status;
            if(githubusername) profileFields.githubusername = githubusername;
            if(skills){ 
                profileFields.skills= skills.split(',').map(skill=>skill.trim());
         }
         //build social object
         profileFields.social={}
         if(youtube) profileFields.social.youtube = youtube ;
         if(twitter) profileFields.social.twitter = twitter ;
         if(facebook) profileFields.social.facebook = facebook ;
         if(linkedin) profileFields.social.linkedin = linkedin;
         if(instagram) profileFields.social.instagram = instagram;

        try{
            let profile = await Profile.findOne({user:req.user.id});
            //if user present, update the profile
            if(profile){
                profile = await Profile.findOneAndUpdate({user:req.user.id},{$set:profileFields},{new:true});
                return res.json(profile);
            }
            //else, Create a profile
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);
        }catch(err){
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

//routes => GET api/profile, public access , get all profiles
router.get('/', async (req,res)=>{
    try {
        const profiles = await Profile.find().populate('user',['name','avatar']);
        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        res.status(500).json('Server Error');
    }
});

//routes => GET api/profile/user/:user_id, public access , get profiles by user_id
router.get('/user/:user_id', async (req,res)=>{
    try {
        const profiles = await Profile.findOne({user:req.params.user_id}).populate('user',['name','avatar']);
        if(!profiles){
            return res.status(400).json({message:'There is no profile for this user_id'})
        }
        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        if(error.kind == 'ObjectId'){ //objectid is more than inapropriate value
            return res.status(400).json({message : 'There is no profile for this user_id'});
        }
        res.status(500).json('Server Error');
    }
});

//routes => DELETE api/profile, private access , delete profile, user and post
router.delete('/',auth, async (req,res)=>{
    try {
        //delete the profile
        await Profile.findOneAndDelete({user: req.user.id});
        //delete the user
        await User.findOneAndDelete({_id: req.user.id});
        res.json({message: 'User deleted'});
    } catch (error) {
        console.error(error.message);
        res.status(500).json('Server Error');
    }
});

//routes => PUT api/profile/experience, private access , adding profile experience
router.put(
    '/experience',
    [
        auth, 
        [
            check('title','Title is required').not().isEmpty(),
            check('company','Company is required').not().isEmpty(),
            check('from','From date is required').not().isEmpty(),
        ]
    ],
    async(req,res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }

        const {title,company,location,from,to,current,description} = req.body;

        const newExperience = {title,company,location,from,to,current,description};
        try {
            const profile = await Profile.findOne({user:req.user.id});
            //unshift -- pushing from the begining ,rather than end 
            profile.experience.unshift(newExperience);
            await profile.save();
            res.json(profile);
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
});

//routes => DELETE api/profile/experience/:exp_id, private access , delete experience from profile
router.delete('/experience/:exp_id',auth, async(req,res)=>{
    try {
        const profile = await Profile.findOne({user:req.user.id});
        //get experience index
        const deleteIndex = profile.experience.map(item=>item.id).indexOf(req.params.exp_id);
        profile.experience.splice(deleteIndex,1);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
            res.status(500).send('Server Error');
    }
});


//routes => PUT api/profile/education, private access , adding profile education
router.put(
    '/education',
    [
        auth, 
        [
            check('school','school is required').not().isEmpty(),
            check('fieldofstudy','fieldofstudy is required').not().isEmpty(),
            check('from','From date is required').not().isEmpty(),
            check('to','To date is required').not().isEmpty()
        ]
    ],
    async(req,res)=>{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()});
        }

        const {school,location,fieldofstudy,from,to,description} = req.body;

        const newEducation = {school,location,fieldofstudy,from,to,description};
        try {
            const profile = await Profile.findOne({user:req.user.id});
            //unshift -- pushing from the begining ,rather than end 
            profile.education.unshift(newEducation);
            await profile.save();
            res.json(profile);
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
});

//routes => DELETE api/profile/education/:edu_id, private access , delete education from profile
router.delete('/education/:edu_id',auth, async(req,res)=>{
    try {
        const profile = await Profile.findOne({user:req.user.id});
        //get experience index
        const deleteIndex = profile.experience.map(item=>item.id).indexOf(req.params.edu_id);
        profile.education.splice(deleteIndex,1);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

//routes => GET api/profile/github/:username, public access , get user repository from the user

router.get('/github/:username', async(req,res)=>{
    try {
       const options = {
        uri:`https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubClientSecret')}}`,
        method:'GET',
        headers:{'user-agent':'node.js'}
       } ;
       request(options, (error,response,body)=>{
        if(error){
            console.error(error);
        }
        if(response.statusCode !==200){
           return res.status(400).json({message: 'No github profile found'});
        }
        res.json(JSON.parse(body));
       });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


module.exports=router;