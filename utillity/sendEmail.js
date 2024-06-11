const nodemailer = require('nodemailer');
require('dotenv').config();

// async..await is not allowed in global scope, must use a wrapper
const sendEmail = async function (email, subject, message) {
  // create reusable transporter object using the default SMTP transport

  let transporter = nodemailer.createTransport({
    service:'gmail',
    host: process.env.SMTP_HOST ,
    port: 465,
    secure: false, // true for 578, false for other ports
    auth: {
      user: process.env.SMTP_USERNAME ,
      pass: process.env.SMTP_PASSWORD,
    }
  });

  // send mail with defined transport object
  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL, // sender address
    to: email, // user email
    subject: subject, // Subject line
    html: message // html body
  });

};

module.exports = sendEmail;