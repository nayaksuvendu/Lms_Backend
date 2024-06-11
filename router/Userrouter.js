const {Router} = require('express');
const router =  Router();
const upload = require('../midleware/multer.midleware.js')
const{register,login,logout,getProfile,forgotPassword,resetPassword,changePassword,updateUser}=require('../controler/Usercontroler.js');
const {isLoggedin} = require('../midleware/auth.midleware.js');
 
router.post('/register',upload.single('avatar'),register)// for single file to be upload with name "avatar"
router.post('/login',login)
router.post('/logout',logout)
router.post('/me',isLoggedin,getProfile)
router.post('/forget',forgotPassword)
router.post('/reset/:resetToken',resetPassword)
router.post('/change-password',isLoggedin,changePassword)
router.put('/update/:id',isLoggedin,upload.single('avatar'),updateUser)

 module.exports=router;