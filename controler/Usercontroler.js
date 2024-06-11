const AppError=require('../utillity/error.js')
const userSchema=require('../model/UserSchema.js')
const cloudinary=require('cloudinary') // for upload image to cloud
const emailvalidator=require('email-validator');
const fs=require('fs/promises');
const sendEmail=require('../utillity/sendEmail.js')
const crypto=require('crypto');
const JWT=require('jsonwebtoken');
const bcrypt=require('bcrypt');
const dotenv=require('dotenv');
dotenv.config();

const cookieOption = {

    maxAge:7*24*60*60*1000, // 7 days
    httpOnly:true, // can't modify by clientSide
    secure:true, // only https url can access this cookie
}

 // Will generate a JWT token with user id as payload
const generateJWTToken = async function(argu){
  return await JWT.sign(
    {id: argu?._id,email:argu?.email,subscribtion:argu?.subscribtion,role:argu?.role},
    process.env.JWT_SECRET,
    {expiresIn: process.env.JWT_EXPIRE}
    )
    };

 // This will generate a token for password reset
 const genforgetPasswordToken = async function (argu){
  const resetToken = crypto.randomBytes(16).toString('hex') // generet random token
  argu.forgetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex') // update resetToken into new token that store in db securly
  argu.forgetPasswordExpiry = Date.now() + 15*60*1000 // 15min
  await argu.save()
  return  resetToken;
 }



//CREATE ACCOUNT    
const register = async(req,res,next)=>{
  try{
   const{fullname,email,password} = req.body;
   if(!fullname || !email || !password){
    return next(new AppError("all field are required",400))
   }
   if(!emailvalidator.validate(email)){
      return next(new AppError('enter valid email',400))
   }
 // Check if the user exists with the provided email
 const userExists = await userSchema.findOne({ email });

 // If user exists send the reponse
 if (userExists) {
   return next(new AppError('Email already exists', 403));
 }

  const newUser =  userSchema.create({
    fullname,
    email,
    password,
    avatar:{
        public_id: email,
        secure_url:'https://res.cloudinary.com/de6c4esfd/image/upload/v1712500531/cld-sample.jpg'
    }
  })
  
  if(!newUser){
    return next(new AppError('user registration failed, plz try after sometime',400))
  }
 
// Fill upload
 if(req.file){
        try {
          const result= await cloudinary.v2.uploader.upload(req.file.path,{
            folder:'lms',
            height:250,
            width:250,
            gravity:'faces', // for focous on face
            crop:'fill' // for image set perfectly
          })
          if(result){  
          (await newUser).avatar.public_id = result.public_id;
          (await newUser).avatar.secure_url = result.secure_url;
           
           // remove file from server after upload to cloudinary
           fs.rm(`uploads/${req.file.filename}`)
          }
        } catch (error){
          return next(new AppError(error || 'file not uploaded ,please try again',500 ))
        }
 }
// save data to server
 (await newUser).save
 newUser.password = undefined;
 const user = await newUser;
 // create token
 const token = await generateJWTToken(user);

 res.cookie('token',token,cookieOption)

 res.status(201).json({
   success:true,
   message:"user registerd sucessfully",
   user
 })
}
catch (error) {
  res.status(500).json({
      success: false,
      message: "Internal server error"
  });
}
};

//LOGIN ACCOUNT
const login = async (req,res,next)=>{
  try {
    const{email,password}=req.body;
    if(!email || !password){
      return next(new AppError('all field need to enter',400))
    }
    const user = await userSchema.findOne({email}).select('+password')
 
    if(!user || ! (bcrypt.compare(password,user.password))){
      return next(new AppError('Email and password does not match',400))
    }

    user.password = undefined;

    const data = await user;
    
    const token = await generateJWTToken(data);
    
    res.cookie('token',token,cookieOption)

    res.status(200).json({
      success:true,
      message:"user login successfully",
      data
    })

  } catch (error) {
    return next(new AppError(error.message,400))
  } 
};

// USER LOGOUT
const logout = (_req,res)=>{
 res.cookie('token',null,{
  secure:true,
  maxAge:0,
  httpOnly:true
 })
 res.status(200).json({
  success:true,
  message:"successfully Logged Out"
 })
};

// USER PROFILE
const getProfile = async(req,res,next)=>{
  try {
    const id = req.user.id;
    const user = await userSchema.findById(id)
    res.status(200).json({
      success:true,
      message:"Successfully loaded user details",
      user
    })
    
  } catch (error) {
    return next(new AppError("failed to fetch profile details",400))
  }
     
};

//Forget passord
const forgotPassword = async(req,res,next)=>{
  const {email} = req.body

  if(!email){
    return next(new AppError('email required',400))
  }
  const user = await userSchema.findOne({email})

  if(!user){
    return next(new AppError('email not exist',400))
  }
  
  const resetToken = await genforgetPasswordToken(user);
    
     const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
     const subject = 'Reset password'
     const message = `you can reset your password by click on <a href=${resetPasswordURL} target="_blank">Reset</a>
      \nIf the above link doesn't work then copy link past on browser`;

     try{
      await sendEmail(email,subject,message);

      res.status(200).json({
      success:true,
      message:`Reset password link send to ${email} successfully`
      });
    }
    catch(e){
      user.forgetPasswordToken = undefined;
      user.forgetPasswordExpiry = undefined;
      await user.save();
      return next(e.message,500)
    }
}

//Reset Password
const resetPassword = async(req,res,next)=>{
   const{resetToken} = req.params;

   const{password} = req.body;

   const forgetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

   const user = await userSchema.findOne({forgetPasswordToken,forgetPasswordExpiry:{$gt:Date.now()}});
   if(!user){
    return next(new AppError("Token is expired or invalid",400))
  }

  user.password = password;
  user.forgetPasswordExpiry = undefined;
  user.forgetPasswordToken = undefined;
    
  await user.save();

  res.status(200).json({
    success:true,
    message:'password updated successfully'
  })
}

//Change password
const changePassword=async(req,res,next)=>{
  const{oldPassword,newPassword}=req.body;
  const {id}=req.user;
  if(!oldPassword || !newPassword ){
    return next(new AppError('please enter the all field',400))
  }
  const user=userSchema.findById(id).select('+password');
  if(!user){
     return next(new AppError('User does not exist',400))
  }
  const IsPswValid= await user.comparePassword(oldPassword);
  if(!IsPswValid){
   return next(new AppError('invalid old password',400))
  }
  user.password=newPassword;
  await user.save();
  user.password=undefined; // for psw not leak
  res.status(200).json({
    success:true,
    message:'password changed successfully!'
  });
}

//UPDATE USER
const updateUser=async(req,res,next)=>{
  //  const{fullname}=req.body;
  //  const {id}=req.user;
   const USER = await userSchema.findByIdAndUpdate(req.user.id,req.body);
   if(!USER){
    return next(new AppError('user not exist',400))
   }

  if(req.file){
    await cloudinary.v2.uploader.destroy(USER.avatar.public_id); //remove old profile photo
    try {
      const result= await cloudinary.v2.uploader.upload(req.file.path,{
        folder:'lms',
        height:250,
        width:250,
        gravity:'faces', // for focous on face
        crop:'fill' // for image set perfectly
      })
      if(result){
      USER.avatar.public_id= result.public_id;
      USER.avatar.secure_url= result.secure_url;
       // remove file from server after upload to cloudinary
       fs.rm(`uploads/${req.file.filename}`)
      }
    } catch (error){
      return next(new AppError(error || 'file not uploaded ,please try again',500 ))
    } 
  } 
  await USER.save();

  res.status(200).json({
    success:true,
    message:'user details updated successfully'
  })

}

module.exports= {register,login,logout,
  getProfile,forgotPassword,resetPassword,
  changePassword,updateUser}
