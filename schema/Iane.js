const { default: mongoose, mongo } = require("mongoose");

const ianeschema = new mongoose.Schema({
    mescidname: String,
    amount: Number,
    unvan: String,
    problemAdi: String,
    yigilanmebleg: Number,
    
})

module.exports=mongoose.model