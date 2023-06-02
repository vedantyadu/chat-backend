
const mongoose = require('mongoose')
require('dotenv').config()

function connect_to_mongoDB() {
  mongoose.connect(process.env.MONGODB_URL, {
    dbName: process.env.MONGODB_DB
  })
}

module.exports = connect_to_mongoDB
