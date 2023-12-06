const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req,res,next){
    //get the token from header
    const token = req.header('x-auth-token');

    //check whether it is a token
    if(!token){ //unauthorized
        return res.status(401).json({message: 'Authorization Denied'});
    }

    //verify token
    try{
        const decode = jwt.verify(token, config.get('jwtSecret'));
        req.user = decode.user;
        next();
    }catch(err){
        res.status(401).json({message:'Token is not valid'});
    }
}