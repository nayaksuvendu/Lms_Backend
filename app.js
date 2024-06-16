const dotenv =require('dotenv');
const Express =require('express');
const cookieParse =require('cookie-parser')
const cors = require('cors');
const morgan=require('morgan')
const UserRouter=require('./router/Userrouter.js');
const CourseRouter=require('./router/CourseRouter.js')
const errorMidleware = require('./midleware/errorMidleware.js');
const paymentRout=require('./router/paymentRout.js')
const ContactUs=require('./router/ContactusRouter.js')
const AdminRoute=require('./router/AdminRoute.js')

dotenv.config();

const app=Express();
app.use(Express.json());
app.use(Express.urlencoded({extended:true})); // parsing encoded url

app.use(cors({ // it allow this frontend_url only to access the server and connect frontend and server
    origin:[process.env.FRONTEND_URL,'https://nayaktutorial.vercel.app'],
    credentials:true,
}))

app.use(cookieParse()); // parsing cookies comes from header to req.cookies

app.use(morgan('dev')); // it show wrong url on terminal that user entered

app.use('/ping',function(req,res){
    res.send("/pong")
})
app.use('/api/v1/user',UserRouter);
app.use('/api/v1/courses',CourseRouter);
app.use('/api/v1/payment',paymentRout);
app.use('/api/v1/contact',ContactUs);
app.use('/api/v1/admin',AdminRoute);

app.all('*',function(req,res){ //"*" mean the router that not mentioned 
    res.status(404).send("404 erroe!! page not found")
})
app.use(errorMidleware); // for sending error to user

module.exports = app
