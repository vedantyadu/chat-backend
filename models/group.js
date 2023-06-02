
const mongoose = require('mongoose')
require('dotenv').config()

const groupSchema = new mongoose.Schema({
  name: {type: String, required: true},
  members: [{type: mongoose.Schema.Types.ObjectId, ref: 'users'}],
  admins: [{type: mongoose.Schema.Types.ObjectId, ref: 'users'}],
  image: {type: String, default: process.env.DEFAULT_IMAGE_URL},
  created_at: {type: Date, default: Date.now}
})

module.exports = mongoose.model('groups', groupSchema)
