/*
 * Tesla ODM layer
 * mongoose / mongodb
 */
var mongoose = require('mongoose'),
    UserSchema = require('./schema/User'),
    CommentSchema = require('./schema/Comment'),
    ThreadSchema = require('./schema/Thread'),
    ThreadRangeSchema = require('./schema/ThreadRange'),
    // models
    userModel = mongoose.model('User', UserSchema),
    commentModel = mongoose.model('Comment', CommentSchema),
    threadModel = mongoose.model('Thread', ThreadSchema),
    threadRangeModel = mongoose.model('ThreadRange', ThreadRangeSchema);
    
mongoose.connect('mongodb://localhost/tesladb');

module.exports = {
    user: userModel,
    comment: commentModel,
    thread: threadModel,
    threadRange: threadRangeModel
};