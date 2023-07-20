
const {login, signup, logout, auth, get_details, edit_details, get_groups} = require('../controllers/user')
const authenticate = require('../middlewares/auth')
const router = require('express').Router()

const multer = require('multer')
const upload = multer({storage: multer.memoryStorage()})


router.post('/edit', authenticate, upload.single('file'), edit_details)
router.post('/login', login)
router.post('/signup', signup)
router.get('/auth', authenticate, auth)
router.get('/logout', logout)
router.get('/details', authenticate, get_details)
router.get('/groups', authenticate, get_groups)

module.exports = router
