
const { randomUUID } = require('crypto')
const mongoose = require('mongoose')
require('dotenv').config()

const groupSchema = new mongoose.Schema({
  name: {type: String, required: true},
  members: [{type: mongoose.Schema.Types.ObjectId, ref: 'users'}],
  previous_members: [{type: mongoose.Schema.Types.ObjectId, ref: 'users'}],
  admins: [{type: mongoose.Schema.Types.ObjectId, ref: 'users'}],
  image: {type: String, default: process.env.DEFAULT_GROUP_IMAGE_URL},
  invite_code: {type: String, default: randomUUID},
  created_at: {type: Date, default: Date.now},
  description: {type: String, default: ''}
})

module.exports = mongoose.model('groups', groupSchema)
