
const ObjectId = require('mongoose').Types.ObjectId
const storage = require('../firebaseconfig')
const { ref, getDownloadURL, uploadBytesResumable } = require('firebase/storage')
const sharp = require('sharp')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Group = require('../models/group')
const online_user = require('../utils/onlineusers')

const is_admin = async (group_id, user_id) => {
  const group = await Group.findOne({'_id': group_id, admins: user_id})
  return group? true: false
}

const create_group = async (req, res) => {
  try {
    const group_data = JSON.parse(req.body.details)
    const userObjectID = new ObjectId(req.userid)

    const new_group = await Group.create({
      name: group_data.groupname,
      admins: [userObjectID],
      members: [userObjectID]
    })
    await User.findByIdAndUpdate(req.userid, {$addToSet: {groups: new_group.id}})

    if (req.file) {
      const buffer = await sharp(req.file.buffer).jpeg().resize({height: 400, width: 400}).toBuffer()
      const storageRef = ref(storage, `group/${new_group.id}.jpeg`)
      const metadata = {contentType: 'jpeg'}
      const snapshot = await uploadBytesResumable(storageRef, buffer, metadata)
      const downloadURL = await getDownloadURL(snapshot.ref)
      await Group.findByIdAndUpdate(new_group.id, {'image': downloadURL})
    }
    
    res.status(200).send({groupid: new_group.id})
  }
  catch (err) {
    console.log(err)
    res.status(500).send()
  }
}

const get_groups = async (req, res) => {
  try {
    const {groups} = await User.findById(req.userid)
    const group_details = {user_online: {}, groups: {}, default_image: process.env.DEFAULT_IMAGE_URL}

    for (let i = 0; i < groups.length; i++) {
      const {name, image, members} = await Group.findById(groups[i])
      const memberdata = await User.find({'_id': members})
      memberdata.map((member) => {
        group_details.user_online[member.id.toString()] = {
          username: member.username,
          online: online_user.has(member.id.toString()),
          image: member.image
        }
      })
      group_details.groups[groups[i]] = {name, image, members, 'isadmin': await is_admin(groups[i], req.userid)}
    }
    res.status(200).send(group_details)
  }
  catch (err) {
    console.log(err)
    res.status(500).send()
  }
}

const edit_image = async (req, res) => {
  try {
    const decoded_jwt = jwt.verify(req.cookies.token, process.env.JWT_PRIVATE_KEY)
    if (is_admin(req.body.group_id, decoded_jwt.id)) {
      const buffer = await sharp(req.file.buffer).jpeg().resize({height: 400, width: 400}).toBuffer()
      const storageRef = ref(storage, `group/${decoded_jwt.id}.jpeg`)
      const metadata = {contentType: 'jpeg'}
      const snapshot = await uploadBytesResumable(storageRef, buffer, metadata)
      const downloadURL = await getDownloadURL(snapshot.ref)
      await Group.findByIdAndUpdate(req.body.group_id, {'image': downloadURL})
    }
    else {
      res.status(401).send()
    }
  }
  catch (err) {
    res.status(500).send()
  }
}

const edit_group = async (req, res) => {
  try {
    const group_data = JSON.parse(req.body.details)
    const userObjectID = new ObjectId(req.userid)

    const group = await Group.findOneAndUpdate({
      '_id': group_data.id,
      admins: [userObjectID]
    }, {name: group_data.groupname})
    console.log(group_data)

    if (req.file && !group.$isEmpty()) {
      const buffer = await sharp(req.file.buffer).jpeg().resize({height: 400, width: 400}).toBuffer()
      const storageRef = ref(storage, `group/${new_group.id}.jpeg`)
      const metadata = {contentType: 'jpeg'}
      const snapshot = await uploadBytesResumable(storageRef, buffer, metadata)
      const downloadURL = await getDownloadURL(snapshot.ref)
      await Group.findByIdAndUpdate(group_data.id, {'image': downloadURL})
    }
    
    res.status(200).send()
  }
  catch (err) {
    console.log(err)
    res.status(500).send()
  }
}

module.exports = {create_group, get_groups, edit_image, edit_group}
