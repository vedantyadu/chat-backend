
const User = require('../models/user')
const Group = require('../models/group')
const Message = require('../models/message')
const io = require('../socket/socket')


const create_message = async (req, res) => {
  const {groupid, message} = req.body
  try {
    const group = await Group.findById(groupid, {members: [req.userid]})
    if (group) {
      const new_message = await Message.create({message: message, group: groupid, author: req.userid})
      io.to(groupid).emit('new-message', {details: {author: req.userid, message, messageid: new_message.id, type: new_message.type}, groupid})
      res.status(200).send({messageid: new_message.id, userid: req.userid, groupid})
    }
    else {
      res.status(401).send({message: 'User not authorized.'})
    }
  }
  catch (err) {
    res.status(500).send({message: 'Server error while creating message.'})
  }
}

const get_messages = async (req, res) => {
  try {
    const groupid = req.params.groupid
    const messages = await Message.find({group: groupid})
    const response = []
    messages.forEach((message) => {
      response.push({
        id: message.id,
        author: message.author,
        message: message.message,
        type: message.type
      })
    })
    res.status(200).send({messages: response})
  }
  catch (err) {
    res.status(500).send({message: 'Server error while getting messages.'})
  }
}

module.exports = {create_message, get_messages}
