const AppError = require('../midleware/errorMidleware.js')
const JWT=require('jsonwebtoken');
const dotenv=require('dotenv');
const userSchema = require('../model/UserSchema.js');
dotenv.config();

const isLoggedin = async(req,res,next)=>{
    const {token} = req.cookies;
    if(!token){
        return next(new AppError('unauthenticated, please login again',401))
    }

    const userDetails = await JWT.verify(token, process.env.JWT_SECRET);
    req.user = userDetails;
    // console.log("req.user is",userDetails);
    next(); // control send to next controler
}

const authorizedRole = (...roles)=>async (req,res,next)=>{ 
   
    const CurrentRole = req.user.role
    
    if(!roles.includes(CurrentRole)){
        return next(new AppError('you dont have permission to access this',400))
    }
    next();
}

const authorizeSubscribers = async(req,res,next)=>{

    const USER = await userSchema.findById(req?.user?.id)
    const subStatus = USER?.subscribtion?.status;
    const CurrentRole =  USER?.role;

    if(CurrentRole!=='ADMIN' && subStatus!=='active'){
        return next(new AppError('please subscribe to watch lactures!',400))
    }
    next();
}
module.exports = {isLoggedin,authorizedRole,authorizeSubscribers};