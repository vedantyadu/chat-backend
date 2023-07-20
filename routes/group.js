
const router = require('express').Router()
const { create_group, get_group_data, add_user, remove_user, edit_group, delete_group, default_image, leave_group, get_member_data } = require('../controllers/group')
const authenticate = require('../middlewares/auth')
const { set_file } = require('../middlewares/file')

router.get('/data/:groupid', authenticate, get_group_data)
router.get('/members/:groupid', authenticate, get_member_data)
router.post('/create', authenticate, set_file, create_group)
router.post('/edit', authenticate, set_file, edit_group)
router.post('/delete', authenticate, delete_group)
router.post('/adduser', authenticate, add_user)
router.post('/removeuser', authenticate, remove_user)
router.get('/defaultimage', default_image)
router.post('/leave', authenticate, leave_group)

module.exports = router
