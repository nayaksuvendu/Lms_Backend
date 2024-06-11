const bcrypt= require('bcrypt');
const crypto=require('crypto') // for generet random token
const JWT=require('jsonwebtoken');
const dotenv= require('dotenv')
dotenv.config();
const mongoose=require('mongoose');
// const{Schema}=mongoose;

const mySchema= new mongoose.Schema({
    fullname:{
        type:String,
        required:[true,'Name is required'],
        minLength:[5,"Name must be min 5 charecter"],
        maxLength:[20,"Name must be Max 20 char"],
        trim:true,

    },
    email:{
        type:String,
        required:[true,"email must required"],
        unique:true,
        lowercase:true,
         
    },
    password:{
        type:String,
        required:[true,'password must required'],
        minLength:[5,"Name must be min 5 charecter"],
        select:false, // psw to seen to admin
        // match:[/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,
        //         "please enter valid password"]
    },
    avatar:{
        public_id:{
          type: String,
        },
        secure_url:{
           type:String
        }
    },
    role:{
        type:String,
        enum:['USER','ADMIN'],
        default:'USER' // Bydefault treat as normal user
    },
    forgetPasswordToken: String,
    forgetPasswordExpiry: Date,
    subscribtion:{
        id : String,
        status : String
    }
},
{timestamps:true}
);

// Hashes password before saving to the database
mySchema.pre("save",async function(next){
    if(!this.isModified('password')){
        return next()
    }
    this.password= await bcrypt.hash(this.password,10);
});


mySchema.methods={
    // Will generate a JWT token with user id as payload
      generateJWTToken : async function(){
        return await JWT.sign(
          {id:this._id,email:this.email,subscribtion:this.subscribtion,role:this.role},
          process.env.JWT_SECRET,
          {expiresIn:process.env.JWR_EXPIRE}
          )
          },

       // method which will help us compare plain password with hashed password and returns true or false
       comparePassword : async(plainTextPassword)=>{
       return await bcrypt.compare(plainTextPassword,this.password)
       },

       // This will generate a token for password reset
      genforgetPasswordToken : async ()=>{
       const resetToken = crypto.randomBytes(20).toString('hax') // generet random token
       this.forgetPasswordToken=crypto.createHash('sha256').update(resetToken).digest('hex') // update resetToken into new token that store in db securly
       this.forgetPasswordExpiry = Date.now() + 15*60*1000 // 15min
       return resetToken;
     }
    }


  const userSchema=mongoose.model('users',mySchema) // specified collection name 
  
  module.exports=userSchema;

