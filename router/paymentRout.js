const express = require('express')
const router = express.Router();
const{isLoggedin,authorizedRole,authorizeSubscribers}=require('../midleware/auth.midleware')
const{buySubscription,verifySubscription,
  getRazorpayApiKey,allPayments,cancelSubscription}=require('../controler/paymentControl')
  
router.route('/subscribe').post(isLoggedin, buySubscription);
router.route('/verify').post(isLoggedin, verifySubscription);
router
  .route('/unsubscribe')
  .post(isLoggedin, authorizeSubscribers, cancelSubscription);
router.route('/razorpay-key').get(isLoggedin, getRazorpayApiKey);
router.route('/').get(isLoggedin, authorizedRole('ADMIN'), allPayments);
 
module.exports = router ;