
const express = require("express")
const app = express()
const cors = require('cors')
const user_router = require('./routes/user')
const group_router = require('./routes/group')
const connect_to_mongoDB = require('./mongoconfig')
const cookieParser = require("cookie-parser")
require('dotenv').config()
require('./socket/socket')

connect_to_mongoDB()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: 'http://127.0.0.1:5173',
  credentials: true
}))

app.use('/user', user_router)
app.use('/group', group_router)

app.listen('3000')
