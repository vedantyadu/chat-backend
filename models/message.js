
const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  message: {type: String},
  group: {type: mongoose.Schema.Types.ObjectId, ref: 'Groups', required: true},
  type: {type: String, enum: ['message', 'create', 'leave', 'join'], default: 'message'},
  author: {type: mongoose.Schema.Types.ObjectId, ref: 'Users'},
  created_at: {type: Date, default: Date.now}
})

module.exports = mongoose.model('messages', messageSchema)
