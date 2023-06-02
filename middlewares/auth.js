
const jwt = require('jsonwebtoken')

const authenticate = (req, res, next) => {
  try {
    const decoded_jwt = jwt.verify(req.cookies.token, process.env.JWT_PRIVATE_KEY)
    req.userid = decoded_jwt.id
    next()
  }
  catch (err) {
    res.status(401).send()
  }
}

module.exports = authenticate
