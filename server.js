const app = require('./app.js')
const dbCon = require('./config/dbcon.js')
const cloudinary = require('cloudinary'); 
const {config} = require('dotenv') ;
config();

const port=process.env.PORT || 9099

// Cloudinary configuration
cloudinary.v2.config({  // cloudnary login
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


app.listen(port,async()=>{
    await dbCon();
    console.log(`server placed on ${port} successfully`)
})



