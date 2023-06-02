
const socketio = require('socket.io')
const online_user = require('../utils/onlineusers')
const jwt = require('jsonwebtoken')
const parse_cookie = require('../utils/parsecookie')
const User = require('../models/user')

const io = new socketio.Server(5000, {
  cors: {
    origin: 'http://127.0.0.1:5173',
    credentials: true
  }
})

const auth = async (socket) => {
  try {
    const cookie = parse_cookie(socket.handshake.headers.cookie)
    const decoded_jwt = jwt.verify(cookie.token, process.env.JWT_PRIVATE_KEY)

    if (decoded_jwt.id) {

      socket.userid = decoded_jwt.id
      socket.groups = []
      online_user.add(socket.userid)
      
      const {groups} = await User.findById(socket.userid) || []

      groups.map((group) => {
        const groupid = group.toString()
        socket.join(groupid)
        socket.to(groupid).emit('user-online', {userid: socket.userid})
        socket.groups.push(groupid)
      })
    }
  }
  catch (err) {
    console.log(err)
  }
}

io.on('connection', async (socket) => {

  await auth(socket)

  socket.on('disconnect', () => {
    socket.groups.map((group) => {
      socket.to(group).emit('user-offline', {userid: socket.userid})
      online_user.delete(socket.userid)
    })
  })
})
