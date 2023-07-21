
const storage = require('../firebaseconfig')
const { ref, getDownloadURL, uploadBytesResumable } = require('firebase/storage')
const hash = require('../utils/hash')
const jwt = require('jsonwebtoken')
const sharp = require('sharp')
const User = require('../models/user')
const userid_to_socket = require('../utils/useridtosocket')

const login = async (req, res) => {
  try {
    const {username, password} = req.body
    const result = await User.findOne({
      '$or': [{'username': username}, {'email': username}],
      'password': hash(password)
    })
    if (result) {
      const token = jwt.sign({'id': result.id}, process.env.JWT_PRIVATE_KEY)
      res.cookie('token', token, {httpOnly: true, sameSite: 'none', secure: true, expires: new Date(Date.now() + 99999999)}).status(200).send()
    }
    else {
      res.status(401).send({'message': 'Invalid username or password.'})
    }
  }
  catch (err) {
    res.status(500).send({'message': 'Internal server error.'})
  }
}

const signup = async (req, res) => {
  try {
    const {username, password, email} = req.body
    const result = await User.findOne({$or: [{'email': email}, {'username': username}]})
    if (result) {
      if (result.email == email) {
        res.status(409).send({message: 'Email already taken.'})
      }
      else if (result.username == username) {
        res.status(409).send({message: 'Username already taken.'})
      }
    }
    else {
      await User.create({
        'username': username,
        'password': hash(password),
        'email': email
      })
      res.send({message: 'Signup successful.'})
    }
  }
  catch (err) {
    console.log(err)
    res.status(500).send({message: 'Internal server error.'})
  }
}

const logout = (req, res) => {
  res.clearCookie('token').send()
}

const auth = async (req, res) => {
  if (req.cookies.token) {
    try {
      const user = await User.findById(req.userid)
      if (user) {
        res.status(200).send({message: 'Auth successful.'})
      }
      else {
        res.status(401).send({message: 'User unauthorized.'})
      }
    }
    catch(err) {
      res.status(500).send({message: 'Server error while authorizing.'})
    }
  }
  else {
    res.status(401).send({message: 'User unauthorized.'})
  }
}

const edit_details = async (req, res) => {
  try {
    const {username, status} = JSON.parse(req.body.details)
    const existing_user = await User.findOne({username})
    if (existing_user && existing_user.id != req.userid) {
      res.status(409).send({message: 'Username already taken.'})
    }
    else {
      let newimage
      await User.findByIdAndUpdate(req.userid, {'username': username, 'status': status})
  
      if (req.file) {
        const buffer = await sharp(req.file.buffer).jpeg().resize({height: 400, width: 400}).toBuffer()
        const storageRef = ref(storage, `profile/${req.userid}.jpeg`)
        const metadata = {contentType: 'jpeg'}
        const snapshot = await uploadBytesResumable(storageRef, buffer, metadata)
        const downloadURL = await getDownloadURL(snapshot.ref)
        await User.findByIdAndUpdate(req.userid, {'image': downloadURL})
        newimage = downloadURL
      }
      if (userid_to_socket[req.userid]?.groups) {
        userid_to_socket[req.userid].groups.forEach(groupid => {
          io.to(groupid).emit('user-change', {groupid, userid: req.userid, username, status, image: newimage})
        })
      }
      res.status(200).send({newimage})
    }
  }
  catch (err) {
    res.status(500).send({message: 'Server error while updating profile.'})
  }
}

const get_details = async (req, res) => {
  try {
    const {image, status, username} = await User.findById(req.userid)
    res.status(200).send({userid: req.userid, image, status, username})
  }
  catch (err) {
    res.status(500).send({message: 'Internal server error.'})
  }
}

const get_groups = async (req, res) => {
  try {
    const {groups} = await User.findById(req.userid)
    res.status(200).send({groups})
  }
  catch (err) {
    res.status(500).send({message: 'Server error while getting groups.'})
  }
}

module.exports = {login, signup, logout, auth, edit_details, get_details, get_groups}
