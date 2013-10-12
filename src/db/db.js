/*
 * Tesla ODM layer
 * mongoose / mongodb
 */
var mongoose = require('mongoose'),
    UserSchema = require('./schema/User'),
    CommentSchema = require('./schema/Comment'),
    ThreadSchema = require('./schema/Thread'),
    ThreadRangeSchema = require('./schema/ThreadRange'),
    MessageSchema = require('./schema/Message'),
    // models
    userModel = mongoose.model('User', UserSchema),
    commentModel = mongoose.model('Comment', CommentSchema),
    threadRangeModel = mongoose.model('ThreadRange', ThreadRangeSchema),
    threadModel = mongoose.model('Thread', ThreadSchema),
    messageModel = mongoose.model('Message', MessageSchema);
    
mongoose.connect('mongodb://localhost/tesladb');

module.exports = {
    user: userModel,
    comment: commentModel,
    threadRange: threadRangeModel
    thread: threadModel,
    message: messageModel
};
