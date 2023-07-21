
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

module.exports = app
