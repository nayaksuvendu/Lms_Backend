const mongoose=require('mongoose');
const dotenv= require('dotenv')
dotenv.config()
mongoose.set('strictQuery',false);
const dbCon=async ()=>{
      await mongoose.connect(process.env.MONGO_CONN || "mongodb://localhost:27017/student" )
            .then((conn)=>{console.log(`connected to Mongodb on ${conn.connection.host}`)})
            .catch((err)=>{
                console.log(err)
                process.exit(4);
            })
}
module.exports=dbCon