
const {login, signup, logout, auth, get_details, edit_details} = require('../controllers/user')
const authenticate = require('../middlewares/auth')
const router = require('express').Router()

const multer = require('multer')
const upload = multer({storage: multer.memoryStorage()})

router.get('/details', authenticate, get_details)
router.post('/edit', authenticate, upload.single('file'), edit_details)
router.post('/login', login)
router.post('/signup', signup)
router.get('/auth', authenticate, auth)
router.get('/logout', logout)

module.exports = router
