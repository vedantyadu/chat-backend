
const storage = require('../firebaseconfig')
const { ref, getDownloadURL, uploadBytesResumable } = require('firebase/storage')
const hash = require('../utils/hash')
const jwt = require('jsonwebtoken')
const sharp = require('sharp')
const User = require('../models/user')


const login = async (req, res) => {
  const {username, password} = req.body
  try {
    const result = await User.findOne({
      'username': username,
      'password': hash(password)
    })
    if (result) {
      const token = jwt.sign({'id': result.id}, process.env.JWT_PRIVATE_KEY)
      res.cookie('token', token, {httpOnly: true, secure: false, expires: new Date(Date.now() + 99999999)}).status(200).send()
    }
    else {
      res.status(401).send()
    }
  }
  catch (err) {
    res.status(500).send()
  }
}

const signup = async (req, res) => {
  const {username, password, email} = req.body
  try {
    await User.create({
      'username': username,
      'password': hash(password),
      'email': email
    })
    res.status(200).send()
  }
  catch (err) {
    res.status(500).send()
  }
}

const logout = (req, res) => {
  res.clearCookie('token').send()
}

const auth = async (req, res) => {
  if (req.cookies.token) {
    try {
      const user = await User.findById(req.userid)
      if (user) res.status(200).send()
    }
    catch(err) {
      res.status(500).send()
    }
  }
  res.status(401).send()
}

const get_details = async (req, res) => {
  try {
    const {username, email, image} = await User.findById(req.userid)
    res.status(200).send({image, 'details': {username, email}})
  }
  catch(err) {
    res.status(500).send()
  }
}

const edit_details = async (req, res) => {
  try {
    const {username, email} = JSON.parse(req.body.details)
    await User.findByIdAndUpdate(req.userid, {'username': username, 'email': email})

    if (req.file) {
      const buffer = await sharp(req.file.buffer).jpeg().resize({height: 400, width: 400}).toBuffer()
      const storageRef = ref(storage, `profile/${req.userid}.jpeg`)
      const metadata = {contentType: 'jpeg'}
      const snapshot = await uploadBytesResumable(storageRef, buffer, metadata)
      const downloadURL = await getDownloadURL(snapshot.ref)
      await User.findByIdAndUpdate(req.userid, {'image': downloadURL})
    }
    res.status(200).send()
  }
  catch (err) {
    res.status(500).send()
  }
}

module.exports = {login, signup, logout, auth, get_details, edit_details}
