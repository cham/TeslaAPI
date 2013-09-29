/*
 * Tesla ODM layer
 * mongoose / mongodb
 */
var mongoose = require('mongoose'),
    UserSchema = require('./schema/User'),
    CommentSchema = require('./schema/Comment'),
    ThreadSchema = require('./schema/Thread'),
    // models
    userModel = mongoose.model('User', UserSchema),
    commentModel = mongoose.model('Comment', CommentSchema),
    threadModel = mongoose.model('Thread', ThreadSchema);
    
mongoose.connect('mongodb://localhost/tesladb');

module.exports = {
    user: userModel,
    comment: commentModel,
    thread: threadModel
};