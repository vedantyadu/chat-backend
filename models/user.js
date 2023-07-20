
const mongoose = require('mongoose')
require('dotenv').config()

const userSchema = new mongoose.Schema({
  username: {type:String, required:true, unique: true},
  password: {type:String, required:true},
  email: {type:String, required:true, unique: true},
  groups: [{type: mongoose.Schema.Types.ObjectId, ref: 'groups'}],
  image: {type:String, default: process.env.DEFAULT_PROFILE_IMAGE_URL},
  status: {type: String, default: ''},
  created_at: {type: Date, default: Date.now}
})

module.exports = mongoose.model('users', userSchema)
