
const ObjectId = require('mongoose').Types.ObjectId
const storage = require('../firebaseconfig')
const { ref, getDownloadURL, uploadBytesResumable, deleteObject } = require('firebase/storage')
const sharp = require('sharp')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Group = require('../models/group')
const Message = require('../models/message')
const online_user = require('../utils/onlineusers')
const userid_to_socket = require('../utils/useridtosocket')
const io = require('../socket/socket')


const is_admin = async (group_id, user_id) => {
  const group = await Group.findOne({'_id': group_id, admins: [user_id]})
  return group? true: false
}

const create_group = async (req, res) => {
  try {
    const group_data = JSON.parse(req.body.details)
    const userObjectID = new ObjectId(req.userid)
    let group_image = process.env.DEFAULT_GROUP_IMAGE_URL

    const new_group = await Group.create({
      name: group_data.groupname,
      admins: [userObjectID],
      members: [userObjectID],
      description: group_data.description
    })

    await User.findByIdAndUpdate(req.userid, {$addToSet: {groups: new_group.id}})
    
    if (req.file) {
      const buffer = await sharp(req.file.buffer).jpeg().resize({height: 400, width: 400}).toBuffer()
      const storageRef = ref(storage, `group/${new_group.id}.jpeg`)
      const metadata = {contentType: 'jpeg'}
      const snapshot = await uploadBytesResumable(storageRef, buffer, metadata)
      const downloadURL = await getDownloadURL(snapshot.ref)
      await Group.findByIdAndUpdate(new_group.id, {'image': downloadURL})
      group_image = downloadURL
    }

    const response_object = {groupid: new_group.id, details: {name: new_group.name, image: group_image, description: new_group.description, admin: true}}
    await Message.create({message: '', group: new_group.id, type: 'create', author: req.userid})

    userid_to_socket[req.userid].join(new_group.id)
    userid_to_socket[req.userid].groups.push(new_group.id)
    io.to(userid_to_socket[req.userid].id).emit('new-group', response_object)

    res.status(200).send(response_object)
  }
  catch (err) {
    console.log(err)
    res.status(500).send({message: 'Internal server error.'})
  }
}

const get_group_data = async (req, res) => {
  try {
    const groupid = req.params.groupid
    const {name, image, description} = await Group.findOne({'_id': groupid, members: req.userid})
    const admin_data = await is_admin(groupid, req.userid)

    const group_details = {
      name,
      image,
      description,
      admin: admin_data
    }

    res.status(200).send(group_details)
  }
  catch (err) {
    res.status(500).send({message: 'Internal server error.'})
  }
}

const get_member_data = async (req, res) => {
  try {
    const groupid = req.params.groupid
    const {members, previous_members} = await Group.findOne({'_id': groupid, members: req.userid})
    const current_member_data = await User.find({'_id': members})
    const previous_member_data = await User.find({'_id': previous_members})
    const reponse_object = {}
    current_member_data.map((member) => {
      reponse_object[member.id] = {
        username: member.username,
        online: online_user.has(member.id),
        image: member.image,
        status: member.status,
        current_member: true
      }
    })
    previous_member_data.map((member) => {
      reponse_object[member.id] = {
        username: member.username,
        online: online_user.has(member.id),
        image: member.image,
        status: member.status,
        current_member: false
      }
    })
    res.status(200).send(reponse_object)
  }
  catch (err) {
    res.status(500).send({message: 'Internal server error.'})
  }
}

const delete_group = async (req, res) => {
  if (is_admin(req.body.id, req.userid)) {
    try {
      const {members} = await Group.findById(req.body.id)
      await Group.findByIdAndUpdate(req.body.id, {members: [], previous_members: members})
      for (let i = 0; i < members.length; i++) {
        await User.findByIdAndUpdate(members[i], {$pull: {groups: req.body.id}})
      }
      try {
        const storageRef = ref(storage, `group/${req.body.id}.jpeg`)
        await getDownloadURL(storageRef)
        deleteObject(storageRef)
      }catch (err) {}
      userid_to_socket[req.userid].leave(req.body.id)
      userid_to_socket[req.userid].groups = userid_to_socket[req.userid].groups.filter(id => id != req.id)
      io.to(req.body.id).emit('group-delete', {groupid: req.body.id})

      res.status(200).send({message: 'Group deleted.'})
    }
    catch (err) {
      res.status(500).send({message: 'Error while deleting group.'})
    }
  }
  else {
    res.status(401).send({message: 'User not authorized.'})
  }
}

const edit_group = async (req, res) => {
  const group_data = JSON.parse(req.body.details)
  if (is_admin(group_data.id, req.userid)) {
    try {
      let newimage
      const group_data = JSON.parse(req.body.details)
  
      const group = await Group.findByIdAndUpdate(group_data.id, {name: group_data.groupname, description: group_data.description})
  
      if (req.file && group) {
        const buffer = await sharp(req.file.buffer).jpeg().resize({height: 400, width: 400}).toBuffer()
        const storageRef = ref(storage, `group/${group_data.id}.jpeg`)
        const metadata = {contentType: 'jpeg'}
        const snapshot = await uploadBytesResumable(storageRef, buffer, metadata)
        const downloadURL = await getDownloadURL(snapshot.ref)
        await Group.findByIdAndUpdate(group_data.id, {'image': downloadURL})
        newimage = downloadURL
      }

      io.to(group.id).emit('group-change', {groupid: group.id, description: group_data.description, name: group_data.groupname, image: newimage})

      res.status(200).send({newimage})
    }
    catch (err) {
      res.status(500).send({message: 'Serve error while saving changes.'})
    }
  }
  else {
    res.status(401).send({message: 'User not authorized.'})
  }
}

const add_user = async (req, res) => {
  const {groupid, username} = req.body
  if (is_admin(groupid, req.userid)) {
    try {
      const user = await User.findOneAndUpdate({'username': username}, {$addToSet: {'groups': groupid}})
      if (user) {
        const {name, image, description} = await Group.findByIdAndUpdate(groupid, {$addToSet: {members: user.id}, $pull: {previous_members: user.id}})
        io.to(groupid).emit('member-added', {
          groupid,
          userid: user.id,
          details: {username: user.username, image: user.image, online: online_user.has(user.id.toString()), status: user.status, current_member: true},
        })

        const new_message = await Message.create({message: '', author: user.id, type: 'join', group: groupid})
        
        io.to(groupid).emit('new-message', {details: {author: user.id, message: '', type: new_message.type, messageid: new_message.id}, groupid})
        
        if (online_user.has(user.id)) {
          userid_to_socket[user.id].join(groupid)
          userid_to_socket[user.id].groups.push(groupid)
          to(userid_to_socket[user.id].id).emit('group-invite', {
            groupid: groupid,
            details: {name, image, description, admin: false}
          })
        }
        res.status(200).send({message: 'User added to group.'})
      }
      else {
        res.status(401).send({message: 'Invalid username.'})
      }
    }
    catch (err) {
      res.status(500).send({message: 'Server error while adding user.'})
    }
  }
  else {
    res.status(401).send({message: 'User not authorized.'})
  }
}

const remove_user = async (req, res) => {
  const {groupid, userid} = req.body
  if (is_admin(groupid, req.userid)) {
    try {
      await User.findByIdAndUpdate(userid, {$pull: {groups: groupid}})
      await Group.findByIdAndUpdate(groupid, {$pull: {members: userid}, $addToSet: {previous_members: userid}})

      if (online_user.has(userid)) {
        io.to(userid_to_socket[userid].id).emit('group-remove', {groupid})
      }
      io.to(groupid).emit('member-removed', {groupid, userid})

      const new_message = await Message.create({message: '', author: userid, type: 'leave', group: groupid}) 
      io.to(groupid).emit('new-message', {details: {author: userid, message: '', type: new_message.type, messageid: new_message.id}, groupid})
      
      res.status(200).send({message: 'User removed successfully.'})
    }
    catch (err) {
      res.status(500).send({message: 'Server error while removing user.'})
    }
  }
}

const default_image = (req, res) => {
  try {
    res.status(200).send({URL: process.env.DEFAULT_GROUP_IMAGE_URL})
  }
  catch (err) {
    res.status(500).send({message: 'Server error while getting default group image.'})
  }
}

const leave_group = async (req, res) => {
  if (!is_admin(req.body.id, req.userid)) {
    try {
      await User.findByIdAndUpdate(req.userid, {$pull: {groups: req.body.id}})
      await Group.findByIdAndUpdate(req.body.id, {$pull: {members: req.userid}, $addToSet: {previous_members: req.userid}})
      userid_to_socket[req.userid].groups = userid_to_socket[req.userid].groups.filter(id => id != req.id)
      userid_to_socket[req.userid].leave(req.id)
      io.to(req.body.id).emit('user-left', {userid: req.userid, groupid: req.body.id})
      const new_message = await Message.create({message: '', author: req.userid, type: 'leave', group: req.body.id}) 
      io.to(req.body.id).emit('new-message', {details: {author: req.userid, message: '', type: new_message.type, messageid: new_message.id}, groupid: req.body.id})
      res.status(200).send({message: 'User left the group successfully.'})
    }
    catch (err) {
      res.status(500).send({message: 'Server error while leaving group.'})
    }
  }
  else {
    try {
      await User.findByIdAndUpdate(req.userid, {$pull: {groups: req.body.id}})
      await Group.findByIdAndUpdate(req.body.id, {$pull: {members: req.userid, admins: req.userid}, $addToSet: {previous_members: req.userid}})
      const {members, admins} = await Group.findById(req.body.id)

      if (members.length > 0) {
        if (admins.length < 1) {
          await Group.findByIdAndUpdate(req.body.id, {$addToSet: {admins: members[0]}})
          if (userid_to_socket[members[0]]) {
            userid_to_socket[members[0]].emit('new-admin', {groupid: req.body.id})
          }
        }
        userid_to_socket[req.userid].groups = userid_to_socket[req.userid].groups.filter(id => id != req.id)
        userid_to_socket[req.userid].leave(req.id)
        io.to(req.body.id).emit('user-left', {userid: req.userid, groupid: req.body.id})
      }
      else {
        try {
          const storageRef = ref(storage, `group/${req.body.id}.jpeg`)
          await getDownloadURL(storageRef)
          deleteObject(storageRef)
        }catch (err) {}
      }

      const new_message = await Message.create({message: '', author: req.userid, type: 'leave', group: req.body.id}) 
      io.to(req.body.id).emit('new-message', {details: {author: req.userid, message: '', type: new_message.type, messageid: new_message.id}, groupid: req.body.id})

      res.status(200).send({message: 'User left the group successfully.'})
      
    }
    catch (err) {
      res.status(500).send({message: 'Server error while leaving group.'})
    }
  }
}

module.exports = {create_group, get_group_data, edit_group, add_user, remove_user, delete_group, default_image, leave_group, get_member_data}
