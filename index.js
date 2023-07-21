
const express = require("express")
const app = express()
const cors = require('cors')
const user_router = require('./routes/user')
const group_router = require('./routes/group')
const message_router = require('./routes/message')
const connect_to_mongoDB = require('./mongoconfig')
const cookieParser = require("cookie-parser")
require('dotenv').config()
const server = require('http').createServer(app)
const add_socket_listiners = require('./socket/socket')

const io = require("socket.io")(server, {
  cors: {
      origin: process.env.FRONTEND_ORIGIN,
      credentials: true
  }
})

add_socket_listiners(io)

connect_to_mongoDB()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true
}))

app.set('io', io)
app.use('/user', user_router)
app.use('/group', group_router)
app.use('/message', message_router)

server.listen(3000)

module.exports = io
