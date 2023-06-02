
const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  message: {type: String, required: true},
  group: {type: mongoose.Schema.Types.ObjectId, ref: 'Groups'},
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'Users'},
  created_at: {type: Date, default: Date.now}
})

module.exports = mongoose.model('messages', messageSchema)
