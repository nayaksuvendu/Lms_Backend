const contactDb = require('../model/contact.model')
const AppError = require('../utillity/error');
const sendEmail = require('../utillity/sendEmail');

const conatactUs =  async(req,res,next)=>{
try{
  const{name,email,comment} = req.body

  if( !name || !email || !comment){
    return next(new AppError('all field required!',400)); 
  }
  const getContact = await contactDb.create({name,email,comment})

  if(!getContact){
    return next(new AppError('Something went wrong, please try again.',400));
  }
   await getContact.save();

   // sending email to client
   const subject = 'Contact Us from';
   const textMessage = `<p> Dear ${name},</P> <br/>
   <p1>\tThank you for writing to us!\n
   We have received your query, and our team will reach out to you in 2 business days.</p1>`

   await sendEmail(email,subject,textMessage);

   res.status(201).json(
    {
        success: true,
        message: "Message received successfully Thank you for contacting us!",
        getContact
    });
}
catch( error){
    res.status(400).json(
        {
            success: false,
            message: error.message
        });

}
}

module.exports = conatactUs