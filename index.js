
const express = require("express")
const app = express()
const cors = require('cors')
const user_router = require('./routes/user')
const group_router = require('./routes/group')
const message_router = require('./routes/message')
const connect_to_mongoDB = require('./mongoconfig')
const cookieParser = require("cookie-parser")
require('dotenv').config()
require('./socket/socket')

const http = require('http');
const server = http.createServer(app)

connect_to_mongoDB()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: 'https://chat-frontend-ccha.onrender.com/',
  credentials: true
}))

app.use('/user', user_router)
app.use('/group', group_router)
app.use('/message', message_router)

app.listen('3000')

module.exports = {server}
