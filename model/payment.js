const mongoose=require('mongoose');

const PaymentSchema=new mongoose.Schema({
    RozerPay_paymentId:{
        type:String,
        required:true
    },
    RzpSubscription_id:{
          type:String,
          required:true
    },
    RozerPay_signature:{
        type:String,
        required:true
    }
},{timestamps:true}
);
module.exports=mongoose.model('payment',PaymentSchema);