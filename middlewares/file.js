
const multer = require('multer')
const upload = multer({storage: multer.memoryStorage()})

// const check_file = (req, res, next) => {
//   const data = JSON.parse(req.body.details)
//   if (data.file) {
//     return set_file
//   }
//   else {
//     return next()
//   }
// }

const set_file = upload.single('file')

module.exports = {set_file}
