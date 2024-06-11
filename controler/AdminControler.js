const userSchema = require('../model/UserSchema');

 const userStats = async(req,res,next)=>{
    try{
    const totalUser = await userSchema.countDocuments();
     
    const totalSubscriber = await userSchema.find({'subscribtion.status':'active'}).count();
    console.log(totalSubscriber)

    res.status(200).json({
        success: true,
        message: 'All registered users count',
        totalUser,
        totalSubscriber,
      });

    }
    catch(error){
        res.status(400).json({
            success: false,
            message: error.message
          });

    }
}

module.exports = userStats;