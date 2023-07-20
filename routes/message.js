
const router = require('express').Router()
const {create_message, get_messages} = require('../controllers/message')
const authenticate = require('../middlewares/auth')

router.post('/create', authenticate, create_message)
router.get('/data/:groupid', authenticate, get_messages)

module.exports = router
