
const express = require("express")
const app = express()
const cors = require('cors')
const user_router = require('./routes/user')
const group_router = require('./routes/group')
const message_router = require('./routes/message')
const connect_to_mongoDB = require('./mongoconfig')
const cookieParser = require("cookie-parser")
require('dotenv').config()

const online_user = require('./utils/onlineusers')
const jwt = require('jsonwebtoken')
const parse_cookie = require('./utils/parsecookie')
const User = require('./models/user')
const userid_to_socket = require('./utils/useridtosocket')

const server = require('http').Server(app)
const io = require("socket.io")(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN,
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
      userid_to_socket[decoded_jwt.id] = socket
      online_user.add(socket.userid)
      
      const {groups} = await User.findById(socket.userid) || []

      groups.map((group) => {
        const groupid = group.toString()
        socket.join(groupid)
        socket.groups.push(groupid)
        io.to(groupid).emit('user-online', {userid: socket.userid, groupid: groupid})
      })
    }
  }
  catch (err) {

  }
}

io.on('connection', async (socket) => {

  await auth(socket)

  socket.on('disconnect', () => {
    if (socket?.groups) {
      socket?.groups.map((group) => {
        io.to(group).emit('user-offline', {userid: socket.userid, groupid: group})
      })
      online_user.delete(socket.userid)
      delete userid_to_socket[socket.userid]
    }
  })

})


connect_to_mongoDB()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true
}))

app.use('/user', user_router)
app.use('/group', group_router)
app.use('/message', message_router)

app.listen(3000)

module.exports = io
