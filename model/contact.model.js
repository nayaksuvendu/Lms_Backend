const mongoose = require('mongoose')

 const contactSchema= new mongoose.Schema({
    name : String,
    email : String,
    comment : String
},
{timestamps:true}
)

 const contactDb = mongoose.model('ContactUs',contactSchema);
 module.exports = contactDb
