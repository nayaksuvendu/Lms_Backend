
const USER = require('../model/UserSchema.js');
const payment = require('../model/payment.js');
const AppError = require('../utillity/error.js');
const crypto=require('crypto');
const Razorpay = require('razorpay') ;
const { config } = require('dotenv');
const sendEmail = require('../utillity/sendEmail.js');
config();

// Razorpay instance create with config
const razorpay = new Razorpay({
   key_id : process.env.RAZORPAY_KEY_ID,
   key_secret : process.env.RAZORPAY_SECRET,
 });

const buySubscription = async (req,res,next)=>{
   try{      
      const id = req.user.id;
      const userInfo = await USER.findById(id);

       if(!userInfo){
         return next(new AppError('Unauthorized,please login',400))
     }
     if(userInfo.role==='ADMIN'){
        return next(new AppError('Admin cannot purchase a subscription',400))
     }
     // Creating a subscription using razorpay that we imported from the server
     const getSubscription = await razorpay.subscriptions.create({
       plan_id : process.env.RAZORPAY_PLAN_ID, // The unique plan ID
       customer_notify: 1, //  1 means custom notification and 0 means not notify
       total_count : 12, // 12 means it will charge every month for a 1-year sub.
       quantity :1,
       addons : [
         {
             item : {
                 name: "Delivery charges",
                 amount: 300,
                 currency: "INR"
             }
         }
     ],
     notes: {
      key1: "value3",
      key2: "value2"
    }
    });
     
     // Adding the ID and the status to the user account
     userInfo.subscribtion.id = getSubscription.id;
     userInfo.subscribtion.status = getSubscription.status;
     
     await userInfo.save();

     res.status(200).json({
      success:true,
      message :'subscription successfully',
      subscription_id : getSubscription.id,
     })
   }
   catch(e){
      return next(new AppError(e.message,400));
   }
}


const verifySubscription = async(req,res,next)=>{
   try{
   const id = req.user.id;
   const{RozerPay_paymentId,RzpSubscription_id,RozerPay_signature}=req.body;
   const userInfo = await USER.findById(id);
   if(!userInfo){
     return next(new AppError('Unauthorized,please login',400))
 }
 const subscribtionId = userInfo.subscribtion.id;

  // "Generating a signature" with SHA256 for verification purposes
  // Here the subscriptionId should be the one which we saved in the DB
  // razorpay_payment_id is from the frontend and there should be a '|' character between this and subscriptionId
  // At the end convert it to Hex value
   const generatedSigneture=crypto.createHmac('sha256',process.env.RAZORPAY_SECRET)
   .update(`${RozerPay_paymentId}|${subscribtionId}`)
   .digest('hex');

// Check if generated signature and signature received from the frontend is the same or not   
if(generatedSigneture!==RozerPay_signature){
   return next(new AppError('Payment not verified, please try again.', 400));
}
 // If they match create payment and store it in the PaymentDB
 const PAYMENT = await payment.create({
   RozerPay_paymentId,
   RzpSubscription_id,
   RozerPay_signature
});
  await PAYMENT.save()
// Update the user subscription status to active (This will be created before this)
userInfo.subscribtion.status='active';

await userInfo.save();

//Send confm. email to client
const subject = 'Subscription Done';
const textMessage = `<p>Dear ${userInfo.fullname},</p> <br/>
<p1>We are delighted to confirm your successful subscription to NAYAK EduTech! Welcome to our community, and thank you for choosing us.</p1>`
await sendEmail(userInfo.email,subject,textMessage);

res.status(200).json({
   success: true,
   message: 'Payment verified successfully',
   userInfo
 })
}
 catch(e){
   return next(new AppError(e.message,400));
}
}

//GET RZP_ID
const getRazorpayApiKey= async (_req,res,next)=>{
   try {
      const razorpay_Key = process.env.RAZORPAY_KEY_ID ;
      res.status(200).json({
         success:true,
         message:'Razerpay API key',
         razorpayKey: razorpay_Key
      })    
   } catch (e) {
      return next(new AppError(e.message,400)); 
   }
 
}

// GET PAYMENTS
const allPayments = async(req,res,next)=>{
   try {
      //count-> no. of record required and skip->no of skips
      const{count,skip} = req.query;
      // Find all subscriptions from razorpay
      const paymentRecord = await razorpay.subscriptions.all({
       count: count || 10, // If count is sent then use that else default to 10
       skip: skip ? skip :0 //If skip is sent then use that else default to 0
      }) 
    const monthNames = [ 'January','February','March','April','May','June',
    'July','August','September','October','November','December',]  
    const finalMonth = {
      January: 0,
      February: 0,
      March: 0,
      April: 0,
      May: 0,
      June: 0,
      July: 0,
      August: 0,
      September: 0,
      October: 0,
      November: 0,
      December: 0,
    };
    const monthWisePayment = await paymentRecord.items.map((pay)=>{
       // We are using payment.start_at which is in unique time, 
       //so we are converting it to Human readable format using Date()
      const monthsInNumbers = new Date(pay.start_at * 1000);
      return monthNames[monthsInNumbers.getMonth()];
    })

   await monthWisePayment.map((month) => {
      Object.keys(finalMonth).forEach((objMonth) => {
        if (month === objMonth) {
          finalMonth[month] += 1;
        }
      });
    });

    const monthlySalesRecord = [];

    Object.keys(finalMonth).forEach((monthName) => {
      monthlySalesRecord.push(finalMonth[monthName]);
    });
    
    res.status(200).json({
      success: true,
      message: 'Successfully loaded all payments',
      paymentRecord,
      finalMonth,
      monthlySalesRecord,
    });
   } catch (error) {
      return next(new AppError(error.message,400))
   }
}

//UN-SUBSCRIBE
const cancelSubscription = async(req,res,next)=>{
   try{
   const{id}=req.user;
   const userInfo = await USER.findById(id);
    if(!userInfo){
      return next(new AppError('Unauthorized,please login',400))
  }
  if(userInfo.role==='ADMIN'){
     return next(new AppError('Admin cannot purchase a subscription',400))
  }
  const subscribtionId = userInfo.subscribtion.id;

  if(subscribtionId === null){
   return next(new AppError("user don't have any subscription",400))
  }

  const unsubscribe = await razorpay.subscriptions.cancel(subscribtionId);
  console.log("unsubscribe.status",unsubscribe.status)
  userInfo.subscribtion.status = unsubscribe.status;

  await userInfo.save();
  
  // Finding the payment using the subscription ID
  const PAYMENT = await payment.findOne({
   RzpSubscription_id: subscribtionId,
  })
// Getting the time from the date of successful payment (in milliseconds)
  const timeSinceSubscribed = Date.now() - PAYMENT.createdAt;
  // refund period which in our case is 7 days
  const refundPeriod = 7*24*60*60*1000;
   // Check if refund period has expired or not
  if(refundPeriod <= timeSinceSubscribed){
   return next(
      new AppError(
        'Refund period is over, so there will not be any refunds provided.',
        400
      ))
  }
  else{
    // If refund period is valid then refund the full amount that the user has paid
  await razorpay.payments.refund(PAYMENT.RzpSubscription_id,{
   amount:4,
   speed:'optimum' // speed of refund(required)
  })
  }

  userInfo.subscribtion.id = undefined;// Remove the subscription ID from user DB
  userInfo.subscribtion.status = undefined;//// Change the subscription Status in user DB
  await userInfo.save()

  await PAYMENT.deleteOne();

  console.log(userInfo);

  res.status(200).json({
   success: true,
   message: 'Subscription canceled successfully',
 });
}
 catch(e){
   return next(new AppError(e.message,400));
}
}

module.exports = {cancelSubscription,allPayments,
   buySubscription,verifySubscription,getRazorpayApiKey};