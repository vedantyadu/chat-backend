
const router = require('express').Router()
const { create_group, get_groups, edit_image, edit_group } = require('../controllers/group')
const authenticate = require('../middlewares/auth')
const multer = require('multer')

const upload = multer({storage: multer.memoryStorage()})

router.get('/', authenticate, get_groups)
router.post('/create', authenticate, upload.single('file'), create_group)
router.post('/edit', authenticate, upload.single('file'), edit_group)

module.exports = router
